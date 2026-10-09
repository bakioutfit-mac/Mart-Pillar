import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  Store,
  RefreshCw,
  Plus,
  Search,
  CheckCircle2,
  QrCode,
  Banknote,
  TrendingUp,
  Link,
  Settings,
  Trash2,
  Edit2,
  X,
  ExternalLink,
  AlertCircle,
  FileText,
  Clock,
  Calculator,
  PlusCircle,
  MinusCircle,
  Sparkles,
  Receipt,
  Eye,
  Layers,
  FileSpreadsheet,
  Building2,
  Coins
} from 'lucide-react';

export const FinanceView = () => {
  const {
    outlets,
    dailyRevenues,
    cashierApiSettings,
    addDailyRevenue,
    updateDailyRevenue,
    deleteDailyRevenue,
    syncCashierWebsite
  } = useApp();

  // Filter & Search
  const [selectedOutlet, setSelectedOutlet] = useState('all');
  const [searchDate, setSearchDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null);

  // Modal: Detail Slip Laporan Kasir
  const [selectedSlipDetail, setSelectedSlipDetail] = useState(null);

  // Modal: Pengaturan Status Integrasi PWA
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  // Modal: Input / Edit Laporan Kasir (Format Identik dengan Sumber Data PWA Kasir)
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [editingRevenueId, setEditingRevenueId] = useState(null);

  // Form State Laporan Kasir
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [shiftName, setShiftName] = useState('Shift Pagi');
  const [selectedOutletId, setSelectedOutletId] = useState(outlets[0]?.id || 'OUT-05');
  const [cashierName, setCashierName] = useState('');
  const [startingCash, setStartingCash] = useState('');
  const [incomeCash, setIncomeCash] = useState('');
  const [incomeQris, setIncomeQris] = useState('');
  const [expenseItems, setExpenseItems] = useState([
    { id: 1, note: '', amount: '' }
  ]);
  const [actualCashCounted, setActualCashCounted] = useState('');
  const [notes, setNotes] = useState('');
  const [pushToSupabase, setPushToSupabase] = useState(true);

  // Helper Format Rupiah
  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Kalkulasi Live di Formulir Input Kasir (Sama seperti rumus di PWA Kasir)
  const totalIncome = (Number(incomeCash) || 0) + (Number(incomeQris) || 0);
  const totalExpense = expenseItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const expectedCash = (Number(startingCash) || 0) + (Number(incomeCash) || 0) - totalExpense;
  const cashDifference = actualCashCounted === '' ? 0 : (Number(actualCashCounted) || 0) - expectedCash;

  // Filtered List
  const filteredRevenues = useMemo(() => {
    return dailyRevenues.filter(rev => {
      const matchOutlet = selectedOutlet === 'all' || rev.outletId === selectedOutlet;
      const matchDate = !searchDate || rev.date === searchDate;
      const q = searchQuery.toLowerCase();
      const matchQuery = !q ||
        rev.outletName.toLowerCase().includes(q) ||
        (rev.cashierName && rev.cashierName.toLowerCase().includes(q)) ||
        (rev.notes && rev.notes.toLowerCase().includes(q)) ||
        (rev.shiftName && rev.shiftName.toLowerCase().includes(q));
      return matchOutlet && matchDate && matchQuery;
    }).sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));
  }, [dailyRevenues, selectedOutlet, searchDate, searchQuery]);

  // Aggregate Totals
  const totals = useMemo(() => {
    return filteredRevenues.reduce((acc, rev) => {
      acc.totalQris += Number(rev.revenueQris) || 0;
      acc.totalCash += Number(rev.revenueCash) || 0;
      acc.grandTotal += Number(rev.totalRevenue) || 0;
      acc.totalStartingCash += Number(rev.startingCash) || 0;
      acc.totalExpense += Number(rev.expenseAmount) || 0;
      return acc;
    }, {
      totalQris: 0,
      totalCash: 0,
      grandTotal: 0,
      totalStartingCash: 0,
      totalExpense: 0
    });
  }, [filteredRevenues]);

  // Trigger sync from PWA cashier website
  const handleSyncWebsite = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);

    const targetOutletId = selectedOutlet === 'all' ? null : selectedOutlet;
    const res = await syncCashierWebsite({
      outletId: targetOutletId
    });

    setIsSyncing(false);
    if (res.success) {
      setSyncFeedback({
        type: 'success',
        text: res.message || 'Laporan closing live dari Web App Presensi PWA berhasil ditarik!'
      });
    } else {
      setSyncFeedback({
        type: 'error',
        text: res.message || 'Gagal menarik data dari Web App Presensi PWA'
      });
    }
  };

  // Buka Modal Tambah Laporan Kasir Baru
  const handleOpenAddRevenue = () => {
    setEditingRevenueId(null);
    setReportDate(new Date().toISOString().split('T')[0]);
    setShiftName('Shift Pagi');
    setSelectedOutletId(outlets[0]?.id || 'OUT-05');
    setCashierName('');
    setStartingCash(1000000); // Default modal awal lazim: Rp 1.000.000
    setIncomeCash('');
    setIncomeQris('');
    setExpenseItems([{ id: Date.now(), note: '', amount: '' }]);
    setActualCashCounted('');
    setNotes('');
    setIsRevenueModalOpen(true);
  };

  // Buka Modal Edit Laporan Kasir
  const handleOpenEditRevenue = (rev) => {
    setEditingRevenueId(rev.id);
    setReportDate(rev.date);
    setShiftName(rev.shiftName || 'Shift Pagi');
    setSelectedOutletId(rev.outletId);
    setCashierName(rev.cashierName || '');
    setStartingCash(rev.startingCash || 0);
    setIncomeCash(rev.revenueCash || '');
    setIncomeQris(rev.revenueQris || '');
    
    // Parse rincian pengeluaran jika ada
    if (rev.expenseNotes) {
      const lines = rev.expenseNotes.split('\n').filter(Boolean);
      const parsedItems = lines.map((line, idx) => {
        const parts = line.replace(/^[0-9]+\.\s*/, '').split(':');
        const note = parts[0]?.trim() || 'Pengeluaran';
        const numPart = parts[1]?.replace(/[^0-9]/g, '') || '0';
        return { id: idx + 1, note, amount: Number(numPart) || '' };
      });
      setExpenseItems(parsedItems.length > 0 ? parsedItems : [{ id: 1, note: 'Pengeluaran', amount: rev.expenseAmount || 0 }]);
    } else if (rev.expenseAmount) {
      setExpenseItems([{ id: 1, note: 'Kas Kecil Operasional', amount: rev.expenseAmount }]);
    } else {
      setExpenseItems([{ id: 1, note: '', amount: '' }]);
    }

    setActualCashCounted(rev.actualCashCounted !== undefined ? rev.actualCashCounted : (rev.revenueCash || ''));
    setNotes(rev.notes || '');
    setIsRevenueModalOpen(true);
  };

  // Kelola Item Pengeluaran Dinamis
  const handleAddExpenseItem = () => {
    setExpenseItems([...expenseItems, { id: Date.now(), note: '', amount: '' }]);
  };

  const handleRemoveExpenseItem = (id) => {
    if (expenseItems.length === 1) {
      setExpenseItems([{ id: Date.now(), note: '', amount: '' }]);
      return;
    }
    setExpenseItems(expenseItems.filter(item => item.id !== id));
  };

  const handleUpdateExpenseItem = (id, field, value) => {
    setExpenseItems(expenseItems.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleAddPresetExpense = (presetName) => {
    const last = expenseItems[expenseItems.length - 1];
    if (last && !last.note) {
      setExpenseItems(expenseItems.map((item, idx) => 
        idx === expenseItems.length - 1 ? { ...item, note: presetName } : item
      ));
    } else {
      setExpenseItems([...expenseItems, { id: Date.now(), note: presetName, amount: '' }]);
    }
  };

  // Simpan Form Laporan Kasir
  const handleSaveRevenue = async (e) => {
    e.preventDefault();
    if (!incomeCash && !incomeQris) {
      alert('Harap isi nominal Pemasukan Tunai atau QRIS!');
      return;
    }

    const formattedExpenseNotes = expenseItems
      .filter(item => item.note?.trim() || Number(item.amount) > 0)
      .map((item, idx) => `${idx + 1}. ${item.note?.trim() || 'Pengeluaran'}: ${formatRupiah(item.amount)}`)
      .join('\n');

    if (editingRevenueId) {
      updateDailyRevenue(editingRevenueId, {
        date: reportDate,
        outletId: selectedOutletId,
        outletName: outlets.find(o => o.id === selectedOutletId)?.name || 'Outlet',
        shiftName,
        cashierName,
        startingCash: Number(startingCash) || 0,
        revenueCash: Number(incomeCash) || 0,
        revenueQris: Number(incomeQris) || 0,
        expenseAmount: totalExpense,
        expenseNotes: formattedExpenseNotes,
        actualCashCounted: Number(actualCashCounted) || 0,
        notes
      });
      setSyncFeedback({
        type: 'success',
        text: `Laporan Kasir ${outlets.find(o => o.id === selectedOutletId)?.name} berhasil diperbarui!`
      });
    } else {
      await addDailyRevenue({
        date: reportDate,
        outletId: selectedOutletId,
        shiftName,
        cashierName: cashierName || 'Kasir Staf Finance',
        startingCash: Number(startingCash) || 0,
        revenueCash: Number(incomeCash) || 0,
        revenueQris: Number(incomeQris) || 0,
        expenseAmount: totalExpense,
        expenseNotes: formattedExpenseNotes,
        actualCashCounted: Number(actualCashCounted) || 0,
        notes,
        source: 'Input Manual Finance',
        pushToSupabase
      });
      setSyncFeedback({
        type: 'success',
        text: `Laporan Kasir baru berhasil disimpan ${pushToSupabase ? 'dan disinkronkan ke Supabase PWA!' : 'secara lokal!'}`
      });
    }

    setIsRevenueModalOpen(false);
  };

  return (
    <div className="content-body" style={{ padding: '24px 28px', maxWidth: '1350px', margin: '0 auto' }}>
      {/* 1. Header */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 12px',
                borderRadius: '9999px',
                background: '#ecfdf5',
                color: '#059669',
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                border: '1px solid #a7f3d0'
              }}>
                Revenue Harian
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: '9999px',
                background: '#eff6ff',
                color: '#2563eb',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: '1px solid #bfdbfe'
              }}>
                <Link size={12} />
                Live Supabase PWA Connected
              </span>
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
              Revenue Harian Kasir
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>
              Pencatatan &amp; penarikan hasil closing harian kasir cabang (Pemisahan pendapatan QRIS &amp; Cash).
            </p>
          </div>

          {/* Action Buttons Utama */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              onClick={handleSyncWebsite}
              disabled={isSyncing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                fontWeight: 700,
                color: '#047857',
                borderColor: '#a7f3d0',
                background: '#f0fdf4'
              }}
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Mengambil Data PWA...' : 'Tarik Data dari App Presensi PWA'}</span>
            </button>

            <button
              className="btn btn-primary"
              onClick={handleOpenAddRevenue}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                borderColor: '#047857',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
              }}
            >
              <Plus size={18} />
              <span>+ Input Laporan Kasir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync Feedback Message */}
      {syncFeedback && (
        <div style={{
          background: syncFeedback.type === 'error' ? '#fef2f2' : '#ecfdf5',
          border: syncFeedback.type === 'error' ? '1px solid #fca5a5' : '1px solid #6ee7b7',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: syncFeedback.type === 'error' ? '#991b1b' : '#065f46',
          fontSize: '0.85rem',
          fontWeight: 600
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {syncFeedback.type === 'error' ? (
              <AlertCircle size={18} color="#dc2626" />
            ) : (
              <CheckCircle2 size={18} color="#059669" />
            )}
            <span>{syncFeedback.text}</span>
          </div>
          <button
            onClick={() => setSyncFeedback(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: syncFeedback.type === 'error' ? '#991b1b' : '#065f46' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 2. Banner Koneksi Database Web App Presensi PWA */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 18px',
            marginBottom: '20px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ExternalLink size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>Terhubung ke Database Web App Presensi PWA</strong>
                  <span className="badge badge-success" style={{ fontSize: '0.62rem' }}>Live Supabase Active</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Tabel: <code style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', color: '#0f172a' }}>outlet_cash_reports</code> &bull; Cabang: <strong>LazyBloom, Sea Cafe, Deru Ombak</strong>
                </div>
              </div>
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsApiModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
            >
              <Settings size={14} />
              <span>Detail Koneksi Database</span>
            </button>
          </div>

          {/* 3. Ringkasan Metrik Finansial Sesuai Sumber Data */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginBottom: '22px' }}>
            {/* Modal Awal Laci */}
            <div className="card" style={{ padding: '16px 18px', borderLeft: '4px solid #64748b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Modal Awal Laci
                </span>
                <Coins size={16} color="#64748b" />
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#334155' }}>
                {formatRupiah(totals.totalStartingCash)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Uang kembalian awal kasir
              </div>
            </div>

            {/* Pemasukan Tunai (Cash) */}
            <div className="card" style={{ padding: '16px 18px', borderLeft: '4px solid #ea580c' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Pemasukan Tunai (Cash)
                </span>
                <Banknote size={16} color="#ea580c" />
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ea580c' }}>
                {formatRupiah(totals.totalCash)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Uang fisik masuk laci
              </div>
            </div>

            {/* Pemasukan QRIS / Non-Tunai */}
            <div className="card" style={{ padding: '16px 18px', borderLeft: '4px solid #2563eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Pemasukan QRIS / EDC
                </span>
                <QrCode size={16} color="#2563eb" />
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#2563eb' }}>
                {formatRupiah(totals.totalQris)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Masuk rekening langsung
              </div>
            </div>

            {/* Kas Kecil Operasional */}
            <div className="card" style={{ padding: '16px 18px', borderLeft: '4px solid #e11d48' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Kas Kecil Kasir (Expense)
                </span>
                <MinusCircle size={16} color="#e11d48" />
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#e11d48' }}>
                {formatRupiah(totals.totalExpense)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Es batu, galon, belanja toko
              </div>
            </div>

            {/* Grand Total Omzet Penjualan */}
            <div className="card" style={{ padding: '16px 18px', borderLeft: '4px solid #059669', background: '#f0fdf4' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: '#065f46', fontWeight: 700, textTransform: 'uppercase' }}>
                  Total Omzet Penjualan
                </span>
                <TrendingUp size={16} color="#059669" />
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#047857' }}>
                {formatRupiah(totals.grandTotal)}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#065f46', marginTop: '4px', fontWeight: 600 }}>
                Akumulasi Tunai + QRIS
              </div>
            </div>
          </div>

          {/* 4. Filter & Search Bar */}
          <div className="card" style={{ marginBottom: '18px', padding: '14px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* Filter Outlet */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Store size={15} color="var(--text-secondary)" />
                  <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Outlet:</label>
                  <select
                    className="form-select"
                    style={{ width: 'auto', minWidth: '190px', padding: '6px 12px', fontSize: '0.82rem' }}
                    value={selectedOutlet}
                    onChange={(e) => setSelectedOutlet(e.target.value)}
                  >
                    <option value="all">Semua Outlet Cabang ({outlets.length})</option>
                    {outlets.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>

                {/* Filter Date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={15} color="var(--text-secondary)" />
                  <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Tanggal:</label>
                  <input
                    type="date"
                    className="form-input"
                    style={{ width: 'auto', padding: '6px 10px', fontSize: '0.82rem' }}
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                  />
                  {searchDate && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSearchDate('')}
                      style={{ padding: '6px 8px', fontSize: '0.72rem' }}
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Search Box */}
              <div style={{ position: 'relative', minWidth: '230px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Cari kasir, cabang, catatan..."
                  className="form-input"
                  style={{ paddingLeft: '32px', fontSize: '0.82rem', padding: '6px 10px 6px 32px' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 5. Tabel Daftar Revenue Harian Kasir */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={17} color="#059669" />
                <span>Rekap Revenue Harian Kasir Outlet ({filteredRevenues.length} Laporan)</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Fitur 1: Data Sinkron dari App Presensi PWA
              </span>
            </div>

            <div className="table-responsive">
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Tanggal & Jam</th>
                    <th>Cabang & Shift</th>
                    <th>Kasir Bertugas</th>
                    <th>Sumber Data</th>
                    <th style={{ textAlign: 'right', color: '#64748b' }}>Modal Awal</th>
                    <th style={{ textAlign: 'right', color: '#ea580c' }}>Penjualan Tunai</th>
                    <th style={{ textAlign: 'right', color: '#2563eb' }}>QRIS / Non-Tunai</th>
                    <th style={{ textAlign: 'right', color: '#059669', background: '#f8fafc' }}>Total Omzet</th>
                    <th style={{ textAlign: 'right', color: '#e11d48' }}>Kas Kecil</th>
                    <th style={{ textAlign: 'center' }}>Fisik &amp; Selisih</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRevenues.length === 0 ? (
                    <tr>
                      <td colSpan="11" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                        <AlertCircle size={32} color="#94a3b8" style={{ margin: '0 auto 10px', display: 'block' }} />
                        Tidak ada data laporan revenue kasir yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRevenues.map(rev => {
                      const isPwa = rev.source?.includes('PWA') || rev.source?.includes('Supabase');
                      const diff = rev.cashDifference || 0;
                      return (
                        <tr key={rev.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td>
                            <strong style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>{rev.date}</strong>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{rev.time || '-'} WIB</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.84rem' }}>
                              {rev.rawBranch || rev.outletName}
                            </div>
                            <span style={{
                              display: 'inline-block',
                              fontSize: '0.68rem',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: '#f1f5f9',
                              color: '#475569',
                              fontWeight: 600,
                              marginTop: '2px'
                            }}>
                              {rev.shiftName || 'Shift Pagi'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.82rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{rev.cashierName || 'Staf Kasir'}</div>
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              background: isPwa ? '#ecfdf5' : '#eff6ff',
                              color: isPwa ? '#047857' : '#1d4ed8',
                              fontSize: '0.68rem',
                              fontWeight: 700
                            }}>
                              {isPwa ? <ExternalLink size={10} /> : <FileText size={10} />}
                              {isPwa ? 'Presensi PWA (Live)' : (rev.source || 'Input Manual')}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#64748b', fontSize: '0.85rem' }}>
                            {formatRupiah(rev.startingCash || 0)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#ea580c', fontSize: '0.88rem' }}>
                            {formatRupiah(rev.revenueCash)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#2563eb', fontSize: '0.88rem' }}>
                            {formatRupiah(rev.revenueQris)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#047857', fontSize: '0.95rem', background: '#f8fafc' }}>
                            {formatRupiah(rev.totalRevenue)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#e11d48', fontSize: '0.85rem' }}>
                            {formatRupiah(rev.expenseAmount || 0)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {diff === 0 ? (
                              <span style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: '4px', background: '#ecfdf5', color: '#047857', fontWeight: 700 }}>
                                Balance (Rp 0)
                              </span>
                            ) : diff < 0 ? (
                              <span style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: '4px', background: '#fef2f2', color: '#dc2626', fontWeight: 700 }}>
                                Kurang {formatRupiah(Math.abs(diff))}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: '4px', background: '#eff6ff', color: '#2563eb', fontWeight: 700 }}>
                                Lebih +{formatRupiah(diff)}
                              </span>
                            )}
                            {rev.actualCashCounted !== undefined && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                Fisik: {formatRupiah(rev.actualCashCounted)}
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setSelectedSlipDetail(rev)}
                                title="Lihat Slip Rincian Laporan Kasir"
                                style={{ padding: '4px 7px', color: '#059669' }}
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleOpenEditRevenue(rev)}
                                title="Edit Laporan"
                                style={{ padding: '4px 7px' }}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                  if (window.confirm(`Hapus catatan revenue ${rev.outletName} (${rev.date})?`)) {
                                    deleteDailyRevenue(rev.id);
                                  }
                                }}
                                title="Hapus"
                                style={{ color: '#dc2626', padding: '4px 7px' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {/* Table Footer Totals */}
                <tfoot>
                  <tr style={{ background: '#0f172a', color: '#ffffff', fontWeight: 800 }}>
                    <td colSpan="4" style={{ padding: '12px 16px' }}>
                      TOTAL KESELURUHAN:
                    </td>
                    <td style={{ textAlign: 'right', color: '#cbd5e1', fontSize: '0.88rem' }}>
                      {formatRupiah(totals.totalStartingCash)}
                    </td>
                    <td style={{ textAlign: 'right', color: '#fed7aa', fontSize: '0.92rem' }}>
                      {formatRupiah(totals.totalCash)}
                    </td>
                    <td style={{ textAlign: 'right', color: '#93c5fd', fontSize: '0.92rem' }}>
                      {formatRupiah(totals.totalQris)}
                    </td>
                    <td style={{ textAlign: 'right', color: '#6ee7b7', background: '#064e3b', fontSize: '1.05rem' }}>
                      {formatRupiah(totals.grandTotal)}
                    </td>
                    <td style={{ textAlign: 'right', color: '#fecdd3', fontSize: '0.88rem' }}>
                      {formatRupiah(totals.totalExpense)}
                    </td>
                    <td colSpan="2" style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
                      {filteredRevenues.length} Baris Laporan
                    </td>
                  </tr>
                </tfoot>
              </table>
          </div>
        </div>

      {/* ========================================================= */}
      {/* MODAL: INPUT / EDIT LAPORAN KASIR (PERSIS SUMBER DATA PWA)*/}
      {/* ========================================================= */}
      {isRevenueModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Header Modal */}
            <div className="modal-header" style={{
              background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #0f172a 100%)',
              color: '#ffffff',
              padding: '18px 22px',
              borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6ee7b7' }}>
                  <Receipt size={20} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ color: '#ffffff', margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                    {editingRevenueId ? 'Edit Laporan Kasir Harian' : 'Input Laporan Kasir Harian (Format PWA)'}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#a7f3d0', margin: '2px 0 0' }}>
                    Struktur formulir identik dengan sumber data Web App Presensi Kasir PWA
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsRevenueModalOpen(false)} style={{ color: '#ffffff' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveRevenue}>
              <div className="modal-body" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 1. Header Info Shift, Tanggal & Cabang */}
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Tanggal Laporan:</label>
                      <input
                        type="date"
                        className="form-input"
                        value={reportDate}
                        onChange={(e) => setReportDate(e.target.value)}
                        required
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Shift Kasir:</label>
                      <select
                        className="form-select"
                        value={shiftName}
                        onChange={(e) => setShiftName(e.target.value)}
                        style={{ fontSize: '0.85rem' }}
                      >
                        <option value="Shift Pagi">Shift Pagi</option>
                        <option value="Shift Siang">Shift Siang</option>
                        <option value="Shift Malam">Shift Malam</option>
                        <option value="Full Day">Full Day</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Cabang Outlet:</label>
                      <select
                        className="form-select"
                        value={selectedOutletId}
                        onChange={(e) => setSelectedOutletId(e.target.value)}
                        style={{ fontSize: '0.85rem' }}
                      >
                        {outlets.map(o => (
                          <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Nama Kasir Bertugas:</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="cth: Shakila / Rian"
                        value={cashierName}
                        onChange={(e) => setCashierName(e.target.value)}
                        required
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. SEKSI 1: PEMASUKAN PENJUALAN */}
                <div style={{ border: '1px solid #a7f3d0', background: '#f0fdf4', borderRadius: 'var(--radius-md)', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #bbf7d0', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#065f46', fontWeight: 800, fontSize: '0.88rem' }}>
                      <PlusCircle size={16} />
                      <span>1. Pemasukan Penjualan</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#047857', background: '#ffffff', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #86efac' }}>
                      Total: {formatRupiah(totalIncome)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Modal Awal */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, margin: 0 }}>Modal Awal Laci (Kas Kecil):</label>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Uang kembalian awal</span>
                      </div>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Rp 1.000.000"
                        value={startingCash}
                        onChange={(e) => setStartingCash(e.target.value)}
                        min="0"
                        style={{ fontSize: '0.88rem', fontWeight: 600 }}
                      />
                    </div>

                    {/* Pemasukan Tunai */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, margin: 0, color: '#9a3412' }}>Pemasukan Tunai (Cash di Laci):</label>
                        <span style={{ fontSize: '0.7rem', color: '#ea580c', fontWeight: 700 }}>Uang Fisik</span>
                      </div>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="cth: 1925000"
                        value={incomeCash}
                        onChange={(e) => setIncomeCash(e.target.value)}
                        min="0"
                        style={{ fontSize: '0.92rem', fontWeight: 800, color: '#c2410c', borderColor: '#fdba74' }}
                      />
                    </div>

                    {/* Pemasukan QRIS */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, margin: 0, color: '#1e40af' }}>Pemasukan QRIS / Non-Tunai / EDC:</label>
                        <span style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 700 }}>Masuk Rekening Langsung</span>
                      </div>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="cth: 792000"
                        value={incomeQris}
                        onChange={(e) => setIncomeQris(e.target.value)}
                        min="0"
                        style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1d4ed8', borderColor: '#93c5fd' }}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. SEKSI 2: PENGELUARAN OPERASIONAL KAS KECIL */}
                <div style={{ border: '1px solid #fecdd3', background: '#fff1f2', borderRadius: 'var(--radius-md)', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #fecdd3', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9f1239', fontWeight: 800, fontSize: '0.88rem' }}>
                      <MinusCircle size={16} />
                      <span>2. Pengeluaran Operasional Toko (Kas Kecil)</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#be123c', background: '#ffffff', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #fda4af' }}>
                      Total: {formatRupiah(totalExpense)}
                    </span>
                  </div>

                  {/* Template Cepat */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#881337', fontWeight: 700 }}>Template cepat:</span>
                    {['Es Batu Kristal', 'Galon Aqua', 'Gas Elpiji 3kg', 'Nasi Karyawan', 'Plastik Takeaway'].map(preset => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => handleAddPresetExpense(preset)}
                        style={{
                          fontSize: '0.68rem',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid #fecdd3',
                          background: '#ffffff',
                          color: '#9f1239',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>

                  {/* List Item Pengeluaran */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {expenseItems.map((item, idx) => (
                      <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 32px', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder={`Item #${idx + 1} (cth: Es batu 2 sak)`}
                          className="form-input"
                          value={item.note}
                          onChange={(e) => handleUpdateExpenseItem(item.id, 'note', e.target.value)}
                          style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                        />
                        <input
                          type="number"
                          placeholder="Nominal Rp"
                          className="form-input"
                          value={item.amount}
                          onChange={(e) => handleUpdateExpenseItem(item.id, 'amount', e.target.value)}
                          min="0"
                          style={{ fontSize: '0.82rem', fontWeight: 700, color: '#be123c', padding: '6px 10px' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExpenseItem(item.id)}
                          style={{
                            height: '34px',
                            background: '#ffffff',
                            border: '1px solid #fca5a5',
                            borderRadius: '6px',
                            color: '#e11d48',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                          title="Hapus baris"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddExpenseItem}
                    style={{
                      marginTop: '10px',
                      width: '100%',
                      padding: '8px',
                      background: '#ffffff',
                      border: '1px dashed #f43f5e',
                      borderRadius: '8px',
                      color: '#be123c',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Plus size={14} />
                    <span>Tambah Item Pengeluaran Lain</span>
                  </button>
                </div>

                {/* 4. SEKSI 3: REKONSILIASI KAS FISIK DI LACI */}
                <div style={{ border: '2px solid #86efac', background: '#f8fafc', borderRadius: 'var(--radius-md)', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: 800, fontSize: '0.88rem', marginBottom: '8px' }}>
                    <Calculator size={16} />
                    <span>3. Rekonsiliasi Kas Fisik di Laci</span>
                  </div>

                  {/* Kotak Rincian Ekspektasi */}
                  <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontSize: '0.78rem', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginBottom: '3px' }}>
                      <span>Modal Awal:</span>
                      <strong>{formatRupiah(startingCash)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', marginBottom: '3px' }}>
                      <span>+ Pemasukan Tunai:</span>
                      <strong>+{formatRupiah(incomeCash)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e11d48', marginBottom: '6px' }}>
                      <span>- Pengeluaran Kas:</span>
                      <strong>-{formatRupiah(totalExpense)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-subtle)', paddingTop: '6px', fontWeight: 800, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                      <span>Ekspektasi Uang di Laci:</span>
                      <span style={{ color: '#047857' }}>{formatRupiah(expectedCash)}</span>
                    </div>
                  </div>

                  {/* Input Hitung Fisik */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 800 }}>Hitung Fisik Uang di Laci Kasir (Rp):</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Masukkan total uang fisik di laci"
                      value={actualCashCounted}
                      onChange={(e) => setActualCashCounted(e.target.value)}
                      min="0"
                      style={{ fontSize: '1rem', fontWeight: 800, borderColor: '#22c55e', background: '#ffffff' }}
                    />
                  </div>

                  {/* Indikator Selisih Kas */}
                  {actualCashCounted !== '' && (
                    <div style={{
                      marginTop: '10px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      background: cashDifference === 0 ? '#ecfdf5' : cashDifference < 0 ? '#fef2f2' : '#eff6ff',
                      color: cashDifference === 0 ? '#047857' : cashDifference < 0 ? '#dc2626' : '#2563eb',
                      border: cashDifference === 0 ? '1px solid #6ee7b7' : cashDifference < 0 ? '1px solid #fca5a5' : '1px solid #93c5fd'
                    }}>
                      <span>Status Selisih Kas:</span>
                      <span>
                        {cashDifference === 0
                          ? 'Balance / Cocok Sempurna (Rp 0)'
                          : cashDifference < 0
                          ? `Selisih Kurang: ${formatRupiah(Math.abs(cashDifference))}`
                          : `Selisih Lebih: +${formatRupiah(cashDifference)}`
                        }
                      </span>
                    </div>
                  )}
                </div>

                {/* 5. Catatan Kasir */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Catatan Kasir / Serah Terima Shift:</label>
                  <textarea
                    rows={2}
                    className="form-input"
                    placeholder="cth: Laci aman, sisa modal Rp 1.000.000 diserahkan ke shift berikutnya"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>

                {/* Opsi Sinkronisasi ke Supabase PWA */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={pushToSupabase}
                    onChange={(e) => setPushToSupabase(e.target.checked)}
                  />
                  <span>Kirim dan simpan juga ke database Supabase Web App Presensi PWA</span>
                </label>
              </div>

              {/* Footer Modal Form */}
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsRevenueModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#059669', borderColor: '#059669' }}>
                  {editingRevenueId ? 'Perbarui Laporan' : 'Simpan Laporan Kasir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DETAIL SLIP LAPORAN KASIR (CLOSING SLIP VIEW)      */}
      {/* ========================================================= */}
      {selectedSlipDetail && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header" style={{ background: '#0f172a', color: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={18} color="#6ee7b7" />
                <div>
                  <h3 className="modal-title" style={{ color: '#ffffff', margin: 0, fontSize: '0.98rem' }}>
                    Slip Laporan Kasir ({selectedSlipDetail.rawBranch || selectedSlipDetail.outletName})
                  </h3>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0 }}>
                    {selectedSlipDetail.date} &bull; {selectedSlipDetail.time || '-'} WIB &bull; {selectedSlipDetail.shiftName || 'Shift Pagi'}
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedSlipDetail(null)} style={{ color: '#ffffff' }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.82rem' }}>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Petugas Kasir:</span>
                  <strong>{selectedSlipDetail.cashierName || 'Staf Kasir'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Sumber Data:</span>
                  <span style={{ fontWeight: 700, color: '#047857' }}>{selectedSlipDetail.source}</span>
                </div>
              </div>

              {/* Rincian Pemasukan */}
              <div style={{ border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px', background: '#f0fdf4' }}>
                <strong style={{ display: 'block', marginBottom: '8px', color: '#166534', fontSize: '0.85rem' }}>
                  Rincian Pemasukan Omzet
                </strong>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Modal Awal Laci:</span>
                  <span>{formatRupiah(selectedSlipDetail.startingCash || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#ea580c' }}>
                  <span>+ Penjualan Tunai (Cash):</span>
                  <strong>+{formatRupiah(selectedSlipDetail.revenueCash)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#2563eb' }}>
                  <span>+ Penjualan QRIS (Non-Tunai):</span>
                  <strong>+{formatRupiah(selectedSlipDetail.revenueQris)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #bbf7d0', paddingTop: '6px', fontWeight: 800, color: '#047857', fontSize: '0.92rem' }}>
                  <span>= Total Omzet Penjualan:</span>
                  <span>{formatRupiah(selectedSlipDetail.totalRevenue)}</span>
                </div>
              </div>

              {/* Rincian Kas Kecil */}
              {selectedSlipDetail.expenseAmount > 0 && (
                <div style={{ border: '1px solid #fecdd3', borderRadius: '8px', padding: '12px', background: '#fff1f2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong style={{ color: '#9f1239' }}>Pengeluaran Kas Kecil Toko:</strong>
                    <strong style={{ color: '#be123c' }}>-{formatRupiah(selectedSlipDetail.expenseAmount)}</strong>
                  </div>
                  {selectedSlipDetail.expenseNotes && (
                    <pre style={{ margin: 0, fontSize: '0.75rem', color: '#881337', whiteSpace: 'pre-wrap', fontFamily: 'inherit', background: '#ffffff', padding: '8px', borderRadius: '6px', border: '1px solid #fda4af' }}>
                      {selectedSlipDetail.expenseNotes}
                    </pre>
                  )}
                </div>
              )}

              {/* Rekonsiliasi Kas Fisik */}
              {selectedSlipDetail.actualCashCounted !== undefined && (
                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Ekspektasi Uang di Laci:</span>
                    <strong>{formatRupiah(selectedSlipDetail.expectedCash || 0)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Hitung Fisik Kasir:</span>
                    <strong>{formatRupiah(selectedSlipDetail.actualCashCounted)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-subtle)', paddingTop: '6px', fontWeight: 800 }}>
                    <span>Selisih Kas:</span>
                    <span style={{ color: selectedSlipDetail.cashDifference === 0 ? '#059669' : selectedSlipDetail.cashDifference < 0 ? '#dc2626' : '#2563eb' }}>
                      {selectedSlipDetail.cashDifference === 0
                        ? 'Rp 0 (Cocok)'
                        : selectedSlipDetail.cashDifference < 0
                        ? `- ${formatRupiah(Math.abs(selectedSlipDetail.cashDifference))}`
                        : `+ ${formatRupiah(selectedSlipDetail.cashDifference)}`
                      }
                    </span>
                  </div>
                </div>
              )}

              {/* Catatan Kasir */}
              {selectedSlipDetail.notes && (
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Catatan Closing:</span>
                  <p style={{ margin: '4px 0 0', background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', fontSize: '0.78rem' }}>
                    {selectedSlipDetail.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedSlipDetail(null)}>
                Tutup Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DETAIL KONEKSI SUPABASE PWA                        */}
      {/* ========================================================= */}
      {isApiModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Link size={18} />
                </div>
                <div>
                  <h3 className="modal-title">Status Integrasi Web App Presensi PWA</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Koneksi live Supabase tabel <code>outlet_cash_reports</code>
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsApiModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#ecfdf5', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid #6ee7b7' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#047857', fontWeight: 700, fontSize: '0.85rem' }}>
                  <CheckCircle2 size={16} />
                  <span>Koneksi Supabase Aktif &amp; Siap Sinkronisasi</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#065f46', marginTop: '4px', lineHeight: 1.4 }}>
                  Mart Pillar terhubung langsung ke database aplikasi presensi kasir PWA Anda tanpa perantara.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Database Endpoint Supabase:</label>
                <input
                  type="text"
                  className="form-input"
                  value="https://kfcjbcdknerflqwofrer.supabase.co"
                  readOnly
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', background: '#f8fafc', color: '#334155' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tabel Laporan Kasir:</label>
                <input
                  type="text"
                  className="form-input"
                  value="outlet_cash_reports (Row Level Security Active)"
                  readOnly
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', background: '#f8fafc', color: '#334155' }}
                />
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-main)' }}>Cabang yang Terdeteksi dari PWA:</strong>
                <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                  <li><strong>LazyBloom</strong> &rarr; Dipetakan ke <em>Outlet Lazybloom Coffee</em></li>
                  <li><strong>Sea Cafe</strong> &rarr; Dipetakan ke <em>Outlet Sea Cafe</em></li>
                  <li><strong>Deru Ombak</strong> &rarr; Dipetakan ke <em>Outlet Deru Ombak</em></li>
                </ul>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setIsApiModalOpen(false)}>
                Tutup
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setIsApiModalOpen(false);
                  handleSyncWebsite();
                }}
              >
                Tarik Data Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
