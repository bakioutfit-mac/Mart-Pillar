import React, { useState, useMemo, useRef } from 'react';
import {
  Calendar,
  Store,
  Download,
  FileSpreadsheet,
  Printer,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  Sparkles,
  ArrowRight,
  Receipt,
  FileText,
  X
} from 'lucide-react';

export const WeeklyExpenseReport = ({
  outlets = [],
  outletExpenses = [],
  initialOutletId = 'OUT-08',
  onBackToList,
  onClose
}) => {
  // State Filter Laporan
  const [selectedOutletId, setSelectedOutletId] = useState(initialOutletId);
  const [startDateStr, setStartDateStr] = useState('2026-10-01');
  const [numDays, setNumDays] = useState(8); // Default 8 hari (1 - 8 Okt 2026) seperti di template gambar

  const reportRef = useRef(null);

  // Ambil data outlet terpilih
  const currentOutlet = useMemo(() => {
    return outlets.find(o => o.id === selectedOutletId) || {
      id: 'OUT-08',
      name: 'Beachfront Coffe & Eatry',
      address: 'Depok, Kec. Kandeman, Kabupaten Batang, Jawa Tengah 51261'
    };
  }, [outlets, selectedOutletId]);

  // Generate Array Tanggal (Menyamping)
  const dateList = useMemo(() => {
    const dates = [];
    const base = new Date(startDateStr);
    for (let i = 0; i < numDays; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      // Format hari/bulan/tahun misal 1/10/2026
      const label = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
      dates.push({ iso, label, dayName: d.toLocaleDateString('id-ID', { weekday: 'short' }) });
    }
    return dates;
  }, [startDateStr, numDays]);

  // Format Angka Rupiah Bersih (Titik ribuan, tanpa Rp untuk isi tabel agar persis gambar)
  const formatNumber = (val) => {
    if (!val || val === 0) return '0';
    return Number(val).toLocaleString('id-ID');
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Navigasi Tanggal Cepat
  const handleShiftDate = (days) => {
    const base = new Date(startDateStr);
    base.setDate(base.getDate() + days);
    setStartDateStr(base.toISOString().split('T')[0]);
  };

  // Ambil Data Pengeluaran untuk Outlet & Rentang Tanggal Terpilih
  const activeExpenses = useMemo(() => {
    const isoSet = new Set(dateList.map(d => d.iso));
    return outletExpenses.filter(exp => {
      return exp.outletId === selectedOutletId && isoSet.has(exp.date);
    });
  }, [outletExpenses, selectedOutletId, dateList]);

  // 1. Agregasi BIAYA PRODUKSI (Menyamping per item keterangan)
  const produksiData = useMemo(() => {
    const prodExpenses = activeExpenses.filter(e => e.category === 'Produksi');
    // Cari daftar nama item unik
    const itemMap = new Map();

    prodExpenses.forEach(exp => {
      const key = exp.description ? exp.description.trim() : 'Biaya Produksi';
      if (!itemMap.has(key)) {
        itemMap.set(key, {});
      }
      const dayValues = itemMap.get(key);
      dayValues[exp.date] = (dayValues[exp.date] || 0) + (Number(exp.amount) || 0);
    });

    const rows = Array.from(itemMap.entries()).map(([keterangan, dateValues]) => {
      let rowTotal = 0;
      const amounts = dateList.map(d => {
        const val = dateValues[d.iso] || 0;
        rowTotal += val;
        return val;
      });
      return { keterangan, amounts, rowTotal };
    });

    // Total Kolom Harian untuk Produksi
    const dailyTotals = dateList.map((d, colIdx) => {
      return rows.reduce((acc, row) => acc + (row.amounts[colIdx] || 0), 0);
    });
    const grandTotalProduksi = dailyTotals.reduce((a, b) => a + b, 0);

    return { rows, dailyTotals, grandTotalProduksi };
  }, [activeExpenses, dateList]);

  // 2. Agregasi BIAYA NON-PRODUKSI (Menyamping per item keterangan)
  const nonProduksiData = useMemo(() => {
    const nonProdExpenses = activeExpenses.filter(e => e.category === 'Non-Produksi');
    const itemMap = new Map();

    nonProdExpenses.forEach(exp => {
      const key = exp.description ? exp.description.trim() : 'Biaya Non-Produksi';
      if (!itemMap.has(key)) {
        itemMap.set(key, {});
      }
      const dayValues = itemMap.get(key);
      dayValues[exp.date] = (dayValues[exp.date] || 0) + (Number(exp.amount) || 0);
    });

    const rows = Array.from(itemMap.entries()).map(([keterangan, dateValues]) => {
      let rowTotal = 0;
      const amounts = dateList.map(d => {
        const val = dateValues[d.iso] || 0;
        rowTotal += val;
        return val;
      });
      return { keterangan, amounts, rowTotal };
    });

    // Total Kolom Harian untuk Non-Produksi
    const dailyTotals = dateList.map((d, colIdx) => {
      return rows.reduce((acc, row) => acc + (row.amounts[colIdx] || 0), 0);
    });
    const grandTotalNonProduksi = dailyTotals.reduce((a, b) => a + b, 0);

    return { rows, dailyTotals, grandTotalNonProduksi };
  }, [activeExpenses, dateList]);

  // 3. Grand Total Per Hari (Produksi + Non-Produksi)
  const grandDailyTotals = useMemo(() => {
    return dateList.map((d, idx) => {
      return (produksiData.dailyTotals[idx] || 0) + (nonProduksiData.dailyTotals[idx] || 0);
    });
  }, [dateList, produksiData, nonProduksiData]);

  const totalAllWeek = produksiData.grandTotalProduksi + nonProduksiData.grandTotalNonProduksi;

  // =========================================================================
  // FUNGSI 1: EXPORT KE CSV
  // =========================================================================
  const exportToCSV = () => {
    const delimiter = ';';
    const lines = [];

    lines.push(`"LAPORAN MINGGUAN PENGELUARAN OUTLET"`);
    lines.push(`"Outlet"${delimiter}"${currentOutlet.name}"`);
    lines.push(`"Alamat"${delimiter}"${currentOutlet.address || '-'}"`);
    lines.push(`"Periode"${delimiter}"${dateList[0].label} s/d ${dateList[dateList.length - 1].label}"`);
    lines.push('');

    // --- BIAYA PRODUKSI ---
    lines.push(`"BIAYA PRODUKSI"`);
    const prodHeader = [`"Keterangan"`, ...dateList.map(d => `"${d.label}"`), `"Total"`].join(delimiter);
    lines.push(prodHeader);

    produksiData.rows.forEach(r => {
      const row = [`"${r.keterangan}"`, ...r.amounts.map(a => a), r.rowTotal].join(delimiter);
      lines.push(row);
    });
    const prodFooter = [`"Total"`, ...produksiData.dailyTotals, produksiData.grandTotalProduksi].join(delimiter);
    lines.push(prodFooter);
    lines.push('');

    // --- BIAYA NON-PRODUKSI ---
    lines.push(`"BIAYA NON-PRODUKSI"`);
    const nonProdHeader = [`"Keterangan"`, ...dateList.map(d => `"${d.label}"`), `"Total"`].join(delimiter);
    lines.push(nonProdHeader);

    nonProduksiData.rows.forEach(r => {
      const row = [`"${r.keterangan}"`, ...r.amounts.map(a => a), r.rowTotal].join(delimiter);
      lines.push(row);
    });
    const nonProdFooter = [`"Total"`, ...nonProduksiData.dailyTotals, nonProduksiData.grandTotalNonProduksi].join(delimiter);
    lines.push(nonProdFooter);
    lines.push('');

    // --- GRAND TOTAL ---
    const grandRow = [`"GRAND TOTAL PENGELUARAN"`, ...grandDailyTotals, totalAllWeek].join(delimiter);
    lines.push(grandRow);

    // Buat Blob dan download
    const csvContent = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Mingguan_${currentOutlet.name.replace(/\s+/g, '_')}_${startDateStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // =========================================================================
  // FUNGSI 2: EXPORT KE EXCEL (.XLS / HTML TABLE FORMAT)
  // =========================================================================
  const exportToExcel = () => {
    let tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Laporan Mingguan</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <style>
          th.banner { background-color: #1ba3b6; color: #ffffff; font-weight: bold; text-align: center; height: 35px; font-size: 14px; }
          th.header-cell { background-color: #f8fafc; font-weight: bold; text-align: center; border: 1px solid #cbd5e1; }
          td.label-cell { font-weight: 500; text-align: left; border: 1px solid #e2e8f0; }
          td.num-cell { text-align: right; border: 1px solid #e2e8f0; mso-number-format:"\\#,##0"; }
          tr.total-row td { font-weight: bold; background-color: #ffffff; border: 1px solid #cbd5e1; }
          tr.grand-total td { font-weight: bold; background-color: #f1f5f9; color: #0f172a; border: 2px solid #0f172a; font-size: 13px; }
        </style>
      </head>
      <body>
        <h2>3 Pillar Management - Laporan Mingguan</h2>
        <p><strong>Outlet:</strong> ${currentOutlet.name}<br/>
        <strong>Alamat:</strong> ${currentOutlet.address || '-'}<br/>
        <strong>Periode:</strong> ${dateList[0].label} - ${dateList[dateList.length - 1].label}</p>
        
        <!-- Tabel Biaya Produksi -->
        <table border="1" cellpadding="6" cellspacing="0">
          <thead>
            <tr>
              <th colspan="${dateList.length + 2}" class="banner">Biaya Produksi</th>
            </tr>
            <tr>
              <th class="header-cell">Keterangan</th>
              ${dateList.map(d => `<th class="header-cell">${d.label}</th>`).join('')}
              <th class="header-cell">Total</th>
            </tr>
          </thead>
          <tbody>
            ${produksiData.rows.map(r => `
              <tr>
                <td class="label-cell">${r.keterangan}</td>
                ${r.amounts.map(a => `<td class="num-cell">${a}</td>`).join('')}
                <td class="num-cell" style="font-weight:bold;">${r.rowTotal}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td><strong>Total</strong></td>
              ${produksiData.dailyTotals.map(t => `<td class="num-cell"><strong>${t}</strong></td>`).join('')}
              <td class="num-cell"><strong>${produksiData.grandTotalProduksi}</strong></td>
            </tr>
          </tbody>
        </table>

        <br/><br/>

        <!-- Tabel Biaya Non-Produksi -->
        <table border="1" cellpadding="6" cellspacing="0">
          <thead>
            <tr>
              <th colspan="${dateList.length + 2}" class="banner">Biaya Non-Produksi</th>
            </tr>
            <tr>
              <th class="header-cell">Keterangan</th>
              ${dateList.map(d => `<th class="header-cell">${d.label}</th>`).join('')}
              <th class="header-cell">Total</th>
            </tr>
          </thead>
          <tbody>
            ${nonProduksiData.rows.map(r => `
              <tr>
                <td class="label-cell">${r.keterangan}</td>
                ${r.amounts.map(a => `<td class="num-cell">${a}</td>`).join('')}
                <td class="num-cell" style="font-weight:bold;">${r.rowTotal}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td><strong>Total</strong></td>
              ${nonProduksiData.dailyTotals.map(t => `<td class="num-cell"><strong>${t}</strong></td>`).join('')}
              <td class="num-cell"><strong>${nonProduksiData.grandTotalNonProduksi}</strong></td>
            </tr>
          </tbody>
        </table>

        <br/><br/>

        <!-- Tabel Grand Total -->
        <table border="2" cellpadding="8" cellspacing="0">
          <tr class="grand-total">
            <td style="width: 200px;">GRAND TOTAL PENGELUARAN</td>
            ${grandDailyTotals.map(gt => `<td class="num-cell">${gt}</td>`).join('')}
            <td class="num-cell">${totalAllWeek}</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Mingguan_${currentOutlet.name.replace(/\s+/g, '_')}_${startDateStr}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // =========================================================================
  // FUNGSI 3: CETAK / SIMPAN KE PDF (WINDOW.PRINT RESMI)
  // =========================================================================
  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div>
      {/* 1. Bar Navigasi & Filter Kontrol (Disembunyikan saat Print) */}
      <div className="no-print" style={{
        background: '#ffffff',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        marginBottom: '20px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          {/* Sisi Kiri: Tombol Kembali & Judul Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {onBackToList && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={onBackToList}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ChevronLeft size={16} />
                <span>Kembali ke Daftar</span>
              </button>
            )}
            {onClose && !onBackToList && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={onClose}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
              >
                <X size={15} />
                <span>Tutup Modal</span>
              </button>
            )}
            <div>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)', display: 'block' }}>
                Template Laporan Mingguan Menyamping
              </strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Format matriks resmi: Biaya Produksi vs Biaya Non-Produksi
              </span>
            </div>
          </div>

          {/* Sisi Kanan: Tombol Export (CSV, Excel, PDF) */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={exportToCSV}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
              title="Unduh file format CSV"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={exportToExcel}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#047857', borderColor: '#a7f3d0', background: '#ecfdf5' }}
              title="Unduh format spreadsheet Excel (.xls)"
            >
              <FileSpreadsheet size={15} color="#059669" />
              <span>Export Excel</span>
            </button>

            <button
              className="btn btn-primary btn-sm"
              onClick={handlePrintPdf}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1ba3b6 0%, #0d9488 100%)',
                borderColor: '#0d9488'
              }}
              title="Cetak langsung atau Simpan sebagai PDF"
            >
              <Printer size={15} />
              <span>Cetak / PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Baris Kedua: Outlet, Tanggal Mulai, dan Pilihan Hari */}
        <div style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginTop: '14px',
          paddingTop: '14px',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          {/* Pilih Outlet */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Outlet:</label>
            <select
              className="form-control form-control-sm"
              value={selectedOutletId}
              onChange={(e) => setSelectedOutletId(e.target.value)}
              style={{ minWidth: '220px', fontWeight: 600 }}
            >
              {outlets.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          {/* Tanggal Mulai */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Mulai Tgl:</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={startDateStr}
              onChange={(e) => setStartDateStr(e.target.value)}
              style={{ width: '140px' }}
            />
          </div>

          {/* Quick Date Presets */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleShiftDate(-7)}
              title="Mundur 1 Minggu"
              style={{ padding: '4px 8px' }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setStartDateStr('2026-10-01')}
              style={{ fontSize: '0.78rem', fontWeight: startDateStr === '2026-10-01' ? 800 : 500 }}
            >
              1 Okt 2026 (Template)
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleShiftDate(7)}
              title="Maju 1 Minggu"
              style={{ padding: '4px 8px' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Pilihan Jumlah Hari */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Rentang:</span>
            <button
              className={`btn btn-sm ${numDays === 8 ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setNumDays(8)}
              style={{ padding: '3px 10px', fontSize: '0.75rem' }}
            >
              8 Hari (Template)
            </button>
            <button
              className={`btn btn-sm ${numDays === 7 ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setNumDays(7)}
              style={{ padding: '3px 10px', fontSize: '0.75rem' }}
            >
              7 Hari (1 Minggu)
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. LEMBAR KERTAS LAPORAN MINGGUAN (PERSIS GAMBAR TEMPLATE PENGGUNA)   */}
      {/* ===================================================================== */}
      <div
        ref={reportRef}
        id="weekly-expense-sheet"
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: '1px solid var(--border-subtle)',
          padding: '36px 40px',
          maxWidth: '1280px',
          margin: '0 auto 40px',
          color: '#0f172a',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}
      >
        {/* KOP SURAT ATAS (PERSIS LOGO & ALAMAT 3 PILLAR MANAGEMENT) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '22px', marginBottom: '14px' }}>
          {/* Logo 3 Pillar Emas */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="68" height="64" viewBox="0 0 100 85" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* 3 Pillar Pillars in Gold Gradient */}
              <defs>
                <linearGradient id="goldPillar" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#b4833e" />
                  <stop offset="50%" stopColor="#d4af37" />
                  <stop offset="100%" stopColor="#996515" />
                </linearGradient>
              </defs>
              {/* Left Pillar */}
              <path d="M15 75 L15 35 L28 20 L38 35 L38 75 Z" fill="url(#goldPillar)" />
              {/* Middle Tall Pillar */}
              <path d="M42 75 L42 22 L52 8 L62 22 L62 75 Z" fill="url(#goldPillar)" />
              {/* Right Pillar */}
              <path d="M66 75 L66 35 L76 20 L86 35 L86 75 Z" fill="url(#goldPillar)" />
              {/* Base Line */}
              <rect x="8" y="77" width="84" height="4" rx="2" fill="url(#goldPillar)" />
            </svg>
            <span style={{ fontSize: '0.62rem', fontWeight: 900, letterSpacing: '0.12em', color: '#1e293b', marginTop: '2px', textAlign: 'center' }}>
              TIGA PILAR
            </span>
            <span style={{ fontSize: '0.45rem', fontWeight: 700, letterSpacing: '0.16em', color: '#64748b', textTransform: 'uppercase' }}>
              MANAGEMENT
            </span>
          </div>

          {/* Text Nama Perusahaan & Alamat */}
          <div>
            <h1 style={{
              fontSize: '1.45rem',
              fontWeight: 900,
              color: '#0f172a',
              margin: '0 0 4px',
              letterSpacing: '-0.02em',
              lineHeight: 1.1
            }}>
              3 Pillar Management
            </h1>
            <div style={{ fontSize: '0.98rem', fontWeight: 600, color: '#1e293b', margin: '0 0 3px' }}>
              {currentOutlet.name}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.4 }}>
              {currentOutlet.address || 'Depok, Kec. Kandeman, Kabupaten Batang, Jawa Tengah 51261'}
            </div>
          </div>
        </div>

        {/* Garis Tebal Pemisah Kop Surat */}
        <div style={{
          width: '100%',
          height: '3px',
          background: '#0f172a',
          margin: '12px 0 18px 0'
        }} />

        {/* Header Laporan Mingguan & Outlet */}
        <div style={{ marginBottom: '22px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
            Laporan Mingguan
          </h2>
          <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
            Outlet : <span style={{ fontWeight: 800, color: '#1ba3b6' }}>{currentOutlet.name}</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
            Periode: <strong>{dateList[0].label}</strong> s/d <strong>{dateList[dateList.length - 1].label}</strong> ({numDays} Hari)
          </div>
        </div>

        {/* ================================================================= */}
        {/* TABEL 1: BIAYA PRODUKSI (HEADER CYAN / TEAL PERSIS GAMBAR)       */}
        {/* ================================================================= */}
        <div style={{ marginBottom: '28px', overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.86rem',
            border: '1px solid #e2e8f0'
          }}>
            <thead>
              {/* Baris Banner Judul: Biaya Produksi */}
              <tr>
                <th
                  colSpan={dateList.length + 2}
                  style={{
                    background: '#1ba3b6',
                    color: '#ffffff',
                    fontWeight: 800,
                    textAlign: 'center',
                    padding: '10px 14px',
                    fontSize: '0.98rem',
                    letterSpacing: '0.02em',
                    border: '1px solid #1ba3b6'
                  }}
                >
                  Biaya Produksi
                </th>
              </tr>
              {/* Baris Header Tanggal (Dengan Badge Tanggal Rounded) */}
              <tr style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{
                  padding: '10px 14px',
                  textAlign: 'left',
                  fontWeight: 800,
                  color: '#0f172a',
                  width: '210px',
                  border: '1px solid #e2e8f0'
                }}>
                  Keterangan
                </th>
                {dateList.map((d, i) => (
                  <th key={d.iso} style={{
                    padding: '8px 8px',
                    textAlign: 'center',
                    border: '1px solid #e2e8f0',
                    minWidth: '100px'
                  }}>
                    <span style={{
                      display: 'inline-block',
                      background: '#f1f5f9',
                      color: '#1e293b',
                      padding: '4px 10px',
                      borderRadius: '99px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      border: '1px solid #e2e8f0'
                    }}>
                      {d.label}
                    </span>
                  </th>
                ))}
                <th style={{
                  padding: '10px 12px',
                  textAlign: 'right',
                  fontWeight: 800,
                  color: '#047857',
                  border: '1px solid #e2e8f0',
                  minWidth: '110px',
                  background: '#f0fdf4'
                }}>
                  Total Baris
                </th>
              </tr>
            </thead>
            <tbody>
              {produksiData.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={dateList.length + 2}
                    style={{ textAlign: 'center', padding: '22px', color: '#94a3b8', fontStyle: 'italic', border: '1px solid #e2e8f0' }}
                  >
                    Belum ada catatan pengeluaran kategori Produksi pada periode ini.
                  </td>
                </tr>
              ) : (
                produksiData.rows.map((row, rowIdx) => (
                  <tr
                    key={row.keterangan + rowIdx}
                    style={{
                      background: rowIdx % 2 === 0 ? '#ffffff' : '#fafbfc',
                      borderBottom: '1px solid #e2e8f0'
                    }}
                  >
                    <td style={{
                      padding: '10px 14px',
                      fontWeight: 600,
                      color: '#1e293b',
                      border: '1px solid #e2e8f0'
                    }}>
                      {row.keterangan}
                    </td>
                    {row.amounts.map((amt, colIdx) => (
                      <td
                        key={colIdx}
                        style={{
                          padding: '10px 10px',
                          textAlign: 'right',
                          fontWeight: amt > 0 ? 600 : 400,
                          color: amt > 0 ? '#0f172a' : '#94a3b8',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        {formatNumber(amt)}
                      </td>
                    ))}
                    <td style={{
                      padding: '10px 12px',
                      textAlign: 'right',
                      fontWeight: 700,
                      color: '#047857',
                      background: '#f0fdf4',
                      border: '1px solid #e2e8f0'
                    }}>
                      {formatNumber(row.rowTotal)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Baris Total Biaya Produksi */}
            <tfoot>
              <tr style={{ background: '#ffffff', fontWeight: 800, borderTop: '2px solid #cbd5e1' }}>
                <td style={{
                  padding: '12px 14px',
                  textAlign: 'left',
                  fontWeight: 900,
                  fontSize: '0.92rem',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1'
                }}>
                  Total
                </td>
                {produksiData.dailyTotals.map((tot, idx) => (
                  <td
                    key={idx}
                    style={{
                      padding: '12px 10px',
                      textAlign: 'right',
                      fontWeight: 900,
                      fontSize: '0.92rem',
                      color: '#0f172a',
                      border: '1px solid #cbd5e1'
                    }}
                  >
                    {formatNumber(tot)}
                  </td>
                ))}
                <td style={{
                  padding: '12px 12px',
                  textAlign: 'right',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  color: '#047857',
                  background: '#dcfce7',
                  border: '1px solid #86efac'
                }}>
                  {formatNumber(produksiData.grandTotalProduksi)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ================================================================= */}
        {/* TABEL 2: BIAYA NON-PRODUKSI (HEADER CYAN / TEAL PERSIS GAMBAR)   */}
        {/* ================================================================= */}
        <div style={{ marginBottom: '28px', overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.86rem',
            border: '1px solid #e2e8f0'
          }}>
            <thead>
              {/* Baris Banner Judul: Biaya Non-Produksi */}
              <tr>
                <th
                  colSpan={dateList.length + 2}
                  style={{
                    background: '#1ba3b6',
                    color: '#ffffff',
                    fontWeight: 800,
                    textAlign: 'center',
                    padding: '10px 14px',
                    fontSize: '0.98rem',
                    letterSpacing: '0.02em',
                    border: '1px solid #1ba3b6'
                  }}
                >
                  Biaya Non-Produksi
                </th>
              </tr>
              {/* Baris Header Tanggal */}
              <tr style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{
                  padding: '10px 14px',
                  textAlign: 'left',
                  fontWeight: 800,
                  color: '#0f172a',
                  width: '210px',
                  border: '1px solid #e2e8f0'
                }}>
                  Keterangan
                </th>
                {dateList.map((d, i) => (
                  <th key={d.iso} style={{
                    padding: '8px 8px',
                    textAlign: 'center',
                    border: '1px solid #e2e8f0',
                    minWidth: '100px'
                  }}>
                    <span style={{
                      display: 'inline-block',
                      background: '#f1f5f9',
                      color: '#1e293b',
                      padding: '4px 10px',
                      borderRadius: '99px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      border: '1px solid #e2e8f0'
                    }}>
                      {d.label}
                    </span>
                  </th>
                ))}
                <th style={{
                  padding: '10px 12px',
                  textAlign: 'right',
                  fontWeight: 800,
                  color: '#c2410c',
                  border: '1px solid #e2e8f0',
                  minWidth: '110px',
                  background: '#fff7ed'
                }}>
                  Total Baris
                </th>
              </tr>
            </thead>
            <tbody>
              {nonProduksiData.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={dateList.length + 2}
                    style={{ textAlign: 'center', padding: '22px', color: '#94a3b8', fontStyle: 'italic', border: '1px solid #e2e8f0' }}
                  >
                    Belum ada catatan pengeluaran kategori Non-Produksi pada periode ini.
                  </td>
                </tr>
              ) : (
                nonProduksiData.rows.map((row, rowIdx) => (
                  <tr
                    key={row.keterangan + rowIdx}
                    style={{
                      background: rowIdx % 2 === 0 ? '#ffffff' : '#fafbfc',
                      borderBottom: '1px solid #e2e8f0'
                    }}
                  >
                    <td style={{
                      padding: '10px 14px',
                      fontWeight: 600,
                      color: '#1e293b',
                      border: '1px solid #e2e8f0'
                    }}>
                      {row.keterangan}
                    </td>
                    {row.amounts.map((amt, colIdx) => (
                      <td
                        key={colIdx}
                        style={{
                          padding: '10px 10px',
                          textAlign: 'right',
                          fontWeight: amt > 0 ? 600 : 400,
                          color: amt > 0 ? '#0f172a' : '#94a3b8',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        {formatNumber(amt)}
                      </td>
                    ))}
                    <td style={{
                      padding: '10px 12px',
                      textAlign: 'right',
                      fontWeight: 700,
                      color: '#c2410c',
                      background: '#fff7ed',
                      border: '1px solid #e2e8f0'
                    }}>
                      {formatNumber(row.rowTotal)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Baris Total Biaya Non-Produksi */}
            <tfoot>
              <tr style={{ background: '#ffffff', fontWeight: 800, borderTop: '2px solid #cbd5e1' }}>
                <td style={{
                  padding: '12px 14px',
                  textAlign: 'left',
                  fontWeight: 900,
                  fontSize: '0.92rem',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1'
                }}>
                  Total
                </td>
                {nonProduksiData.dailyTotals.map((tot, idx) => (
                  <td
                    key={idx}
                    style={{
                      padding: '12px 10px',
                      textAlign: 'right',
                      fontWeight: 900,
                      fontSize: '0.92rem',
                      color: '#0f172a',
                      border: '1px solid #cbd5e1'
                    }}
                  >
                    {formatNumber(tot)}
                  </td>
                ))}
                <td style={{
                  padding: '12px 12px',
                  textAlign: 'right',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  color: '#c2410c',
                  background: '#ffedd5',
                  border: '1px solid #fed7aa'
                }}>
                  {formatNumber(nonProduksiData.grandTotalNonProduksi)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ================================================================= */}
        {/* TABEL 3: GRAND TOTAL PENGELUARAN (PRODUKSI + NON-PRODUKSI)       */}
        {/* ================================================================= */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.92rem',
            border: '2px solid #0f172a'
          }}>
            <tbody>
              <tr style={{ background: '#f8fafc' }}>
                <td style={{
                  padding: '14px 16px',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  color: '#0f172a',
                  width: '210px',
                  border: '1px solid #cbd5e1'
                }}>
                  GRAND TOTAL PENGELUARAN
                </td>
                {grandDailyTotals.map((grand, idx) => (
                  <td
                    key={idx}
                    style={{
                      padding: '14px 10px',
                      textAlign: 'right',
                      fontWeight: 900,
                      fontSize: '0.95rem',
                      color: '#0f172a',
                      border: '1px solid #cbd5e1',
                      minWidth: '100px'
                    }}
                  >
                    {formatNumber(grand)}
                  </td>
                ))}
                <td style={{
                  padding: '14px 14px',
                  textAlign: 'right',
                  fontWeight: 900,
                  fontSize: '1.05rem',
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  border: '1px solid #0f172a',
                  minWidth: '110px'
                }}>
                  {formatNumber(totalAllWeek)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Ringkasan Bawah & Tanda Tangan */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginTop: '36px',
          paddingTop: '20px',
          borderTop: '1px dashed #cbd5e1'
        }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Dokumen dicetak otomatis dari Sistem Mart Pillar Finansial &bull; {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
              Klasifikasi: Biaya Produksi (Manual Finance) &amp; Biaya Non-Produksi (Live Supabase Kasir)
            </div>
          </div>

          <div style={{ display: 'flex', gap: '48px', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '48px' }}>Dibuat Oleh (Finance),</div>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a', borderTop: '1px solid #cbd5e1', paddingTop: '4px' }}>
                Siti Rahmawati
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '48px' }}>Disetujui Oleh (Owner),</div>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a', borderTop: '1px solid #cbd5e1', paddingTop: '4px' }}>
                Budi Santoso
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
