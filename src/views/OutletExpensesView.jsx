import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  MinusCircle,
  Plus,
  Search,
  Filter,
  Calendar,
  Store,
  Layers,
  Sparkles,
  PieChart,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  TrendingDown,
  ShoppingBag,
  Zap,
  Coffee,
  Users,
  Wrench,
  Receipt,
  Download,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { WeeklyExpenseReport } from '../components/WeeklyExpenseReport';

export const OutletExpensesView = () => {
  const {
    outlets,
    outletExpenses,
    addOutletExpense,
    updateOutletExpense,
    deleteOutletExpense,
    dailyRevenues,
    syncCashierExpenses,
    currentUser
  } = useApp();

  // Modal Export Laporan Mingguan Format 3 Pillar (CSV / Excel / PDF)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Sync state dari Supabase
  const [isSyncing, setIsSyncing] = useState(false);

  // Filter & Search State
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'Produksi' | 'Non-Produksi'
  const [outletFilter, setOutletFilter] = useState('all');
  const [searchDate, setSearchDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Input / Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    outletId: outlets[0]?.id || 'OUT-05',
    category: 'Produksi', // 'Produksi' | 'Non-Produksi'
    subCategory: 'Bahan Baku & Minuman',
    description: '',
    amount: '',
    paymentMethod: 'Kas Kecil Kasir',
    recordedBy: currentUser?.name ? `${currentUser.name} (${currentUser.role})` : 'Siti Rahmawati (Finance)',
    notes: ''
  });

  // Modal Import dari Kasir
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedCashierReport, setSelectedCashierReport] = useState(null);

  // Feedback Alert
  const [alertFeedback, setAlertFeedback] = useState(null);

  // Helper Format Rupiah
  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Sub-kategori options based on category
  const subCategoryPresets = {
    Produksi: [
      'Bahan Baku & Minuman',
      'Bahan Baku Makanan',
      'Es & Pendingin',
      'Packaging & Kemasan',
      'Topping & Saus',
      'Bahan Dapur Lainnya'
    ],
    'Non-Produksi': [
      'Konsumsi Karyawan',
      'Utilitas & Listrik',
      'Gaji & Upah Harian',
      'Operasional Toko & Transport',
      'Kebersihan & Sanitasi',
      'Maintenance & Servis Alat',
      'Perlengkapan Kasir / ATK',
      'Biaya Lain-lain'
    ]
  };

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return outletExpenses.filter(item => {
      const matchCat = categoryFilter === 'all' || item.category === categoryFilter;
      const matchOutlet = outletFilter === 'all' || item.outletId === outletFilter;
      const matchDate = !searchDate || item.date === searchDate;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.subCategory && item.subCategory.toLowerCase().includes(q)) ||
        (item.outletName && item.outletName.toLowerCase().includes(q)) ||
        (item.recordedBy && item.recordedBy.toLowerCase().includes(q));

      return matchCat && matchOutlet && matchDate && matchQuery;
    });
  }, [outletExpenses, categoryFilter, outletFilter, searchDate, searchQuery]);

  // Totals & Analytics
  const metrics = useMemo(() => {
    let totalAll = 0;
    let totalProduksi = 0;
    let totalNonProduksi = 0;

    // Hitung berdasarkan filter outlet dan tanggal saat ini
    outletExpenses.forEach(exp => {
      const matchOutlet = outletFilter === 'all' || exp.outletId === outletFilter;
      const matchDate = !searchDate || exp.date === searchDate;

      if (matchOutlet && matchDate) {
        const val = Number(exp.amount) || 0;
        totalAll += val;
        if (exp.category === 'Produksi') {
          totalProduksi += val;
        } else if (exp.category === 'Non-Produksi') {
          totalNonProduksi += val;
        }
      }
    });

    const pctProduksi = totalAll > 0 ? ((totalProduksi / totalAll) * 100).toFixed(1) : 0;
    const pctNonProduksi = totalAll > 0 ? ((totalNonProduksi / totalAll) * 100).toFixed(1) : 0;

    return {
      totalAll,
      totalProduksi,
      totalNonProduksi,
      pctProduksi,
      pctNonProduksi,
      countProduksi: outletExpenses.filter(e => e.category === 'Produksi').length,
      countNonProduksi: outletExpenses.filter(e => e.category === 'Non-Produksi').length
    };
  }, [outletExpenses, outletFilter, searchDate]);

  // Tarik data pengeluaran Non-Produksi langsung dari Supabase Kasir PWA
  const handleSyncCashierExpenses = async () => {
    setIsSyncing(true);
    setAlertFeedback(null);
    try {
      const res = await syncCashierExpenses(outletFilter);
      setAlertFeedback({
        type: res.success ? 'success' : 'error',
        text: res.message
      });
    } catch (err) {
      setAlertFeedback({
        type: 'error',
        text: `Gagal menarik data pengeluaran kasir: ${err.message}`
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Open Add Modal (Default ke kategori Produksi untuk di-input manual oleh Finance)
  const handleOpenAdd = (defaultCategory = 'Produksi') => {
    setEditingExpenseId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      outletId: outletFilter !== 'all' ? outletFilter : (outlets[0]?.id || 'OUT-05'),
      category: defaultCategory,
      subCategory: defaultCategory === 'Produksi' ? 'Bahan Baku & Minuman' : 'Konsumsi Karyawan',
      description: '',
      amount: '',
      paymentMethod: defaultCategory === 'Produksi' ? 'Transfer Finance' : 'Kas Kecil Kasir',
      recordedBy: currentUser?.name ? `${currentUser.name} (Finance)` : 'Siti Rahmawati (Finance)',
      notes: ''
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingExpenseId(item.id);
    setFormData({
      date: item.date,
      outletId: item.outletId,
      category: item.category,
      subCategory: item.subCategory || 'Bahan Baku & Minuman',
      description: item.description,
      amount: item.amount,
      paymentMethod: item.paymentMethod || 'Kas Kecil Kasir',
      recordedBy: item.recordedBy || 'Finance',
      notes: item.notes || ''
    });
    setIsModalOpen(true);
  };

  // Save Modal
  const handleSaveExpense = (e) => {
    e.preventDefault();

    if (!formData.description || !formData.amount) {
      alert('Keterangan pengeluaran dan nominal harus diisi!');
      return;
    }

    const matchedOutlet = outlets.find(o => o.id === formData.outletId);
    const payload = {
      date: formData.date,
      outletId: formData.outletId,
      outletName: matchedOutlet ? matchedOutlet.name : 'Outlet',
      category: formData.category,
      subCategory: formData.subCategory,
      description: formData.description,
      amount: Number(formData.amount) || 0,
      paymentMethod: formData.paymentMethod,
      recordedBy: formData.recordedBy,
      notes: formData.notes,
      source: editingExpenseId ? 'Diedit Finance' : 'Input Manual Finance'
    };

    if (editingExpenseId) {
      updateOutletExpense(editingExpenseId, payload);
      setAlertFeedback({
        type: 'success',
        text: `Pengeluaran [${payload.category}] "${payload.description}" berhasil diperbarui!`
      });
    } else {
      addOutletExpense(payload);
      setAlertFeedback({
        type: 'success',
        text: `Pengeluaran baru [${payload.category}] "${payload.description}" berhasil dicatat!`
      });
    }

    setIsModalOpen(false);
  };

  // Delete Expense
  const handleDelete = (id, desc) => {
    if (window.confirm(`Yakin ingin menghapus catatan pengeluaran "${desc}"?`)) {
      deleteOutletExpense(id);
      setAlertFeedback({
        type: 'success',
        text: `Catatan pengeluaran "${desc}" berhasil dihapus.`
      });
    }
  };

  return (
    <div className="content-body" style={{ padding: '24px 28px', maxWidth: '1350px', margin: '0 auto' }}>
      {/* 1. Header Halaman */}
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
                background: '#fff7ed',
                color: '#c2410c',
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                border: '1px solid #fed7aa'
              }}>
                <MinusCircle size={13} />
                Pengeluaran Outlet
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: '9999px',
                background: '#ecfdf5',
                color: '#047857',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: '1px solid #a7f3d0'
              }}>
                2 Kategori: Produksi vs Non-Produksi
              </span>
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
              Pengeluaran Outlet Cabang
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>
              Manajemen dan klasifikasi pengeluaran harian seluruh outlet menjadi kategori <strong>Produksi</strong> (bahan baku, es, kemasan) &amp; <strong>Non-Produksi</strong> (operasional, gaji, utilitas).
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              onClick={handleSyncCashierExpenses}
              disabled={isSyncing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                fontWeight: 700,
                color: '#c2410c',
                borderColor: '#fed7aa',
                background: '#fff7ed'
              }}
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Mengambil Data Kasir...' : 'Tarik Non-Produksi dari Supabase Kasir'}</span>
            </button>

            {/* Tombol Export Laporan Mingguan Sesuai Aturan Main */}
            <button
              className="btn btn-secondary"
              onClick={() => setIsReportModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                fontWeight: 700,
                color: '#0d9488',
                borderColor: '#99f6e4',
                background: '#f0fdfa'
              }}
            >
              <FileSpreadsheet size={16} color="#0d9488" />
              <span>Export Laporan Mingguan</span>
            </button>

            <button
              className="btn btn-primary"
              onClick={() => handleOpenAdd('Produksi')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                borderColor: '#047857',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)'
              }}
            >
              <Plus size={18} />
              <span>+ Input Pengeluaran Produksi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alert Feedback */}
      {alertFeedback && (
        <div style={{
          background: alertFeedback.type === 'error' ? '#fef2f2' : '#ecfdf5',
          border: alertFeedback.type === 'error' ? '1px solid #fca5a5' : '1px solid #6ee7b7',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: alertFeedback.type === 'error' ? '#991b1b' : '#065f46',
          fontSize: '0.85rem',
          fontWeight: 600
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {alertFeedback.type === 'error' ? (
              <AlertCircle size={18} color="#dc2626" />
            ) : (
              <CheckCircle2 size={18} color="#059669" />
            )}
            <span>{alertFeedback.text}</span>
          </div>
          <button
            onClick={() => setAlertFeedback(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: alertFeedback.type === 'error' ? '#991b1b' : '#065f46' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 1. Banner Alur Arsitektur Biaya: Non-Produksi (Supabase Kasir) vs Produksi (Manual Finance) */}
      <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 18px',
            marginBottom: '20px',
            boxShadow: 'var(--shadow-sm)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '14px'
          }}>
        {/* Sisi Kiri: Non-Produksi */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong style={{ fontSize: '0.86rem', color: '#c2410c' }}>Non-Produksi &bull; Otomatis dari Supabase Kasir</strong>
              <span className="badge badge-warning" style={{ fontSize: '0.62rem' }}>Live Supabase PWA</span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.45 }}>
              Kas kecil kasir outlet (nasi karyawan, token PLN, upah harian, bensin, kebersihan) tersinkronisasi otomatis dari database <code>outlet_cash_reports</code>.
            </div>
          </div>
        </div>

        {/* Sisi Kanan: Produksi */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '14px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Coffee size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong style={{ fontSize: '0.86rem', color: '#047857' }}>Produksi &bull; Di-Input Manual oleh Finance</strong>
              <span className="badge badge-success" style={{ fontSize: '0.62rem' }}>Input Manual Finance</span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.45 }}>
              Biaya produksi inti (biji kopi, susu fresh milk, sirup, es batu, kemasan, cup take away) dikelola &amp; dicatat langsung oleh Tim Finance.
            </div>
          </div>
        </div>
      </div>

      {/* 2. Kartu Metrik Ringkasan: PRODUKSI vs NON-PRODUKSI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Card 1: Total Pengeluaran */}
        <div className="card" style={{ padding: '20px', borderLeft: '5px solid #0f172a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Seluruh Pengeluaran
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f1f5f9', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {formatRupiah(metrics.totalAll)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {filteredExpenses.length} transaksi pengeluaran tercatat
          </div>
        </div>

        {/* Card 2: Kategori PRODUKSI */}
        <div className="card" style={{ padding: '20px', borderLeft: '5px solid #059669', background: '#f0fdf4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Kategori Produksi (Manual Finance)
              </span>
              <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                {metrics.pctProduksi}%
              </span>
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dcfce7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Coffee size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#047857' }}>
            {formatRupiah(metrics.totalProduksi)}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#065f46', marginTop: '4px' }}>
            Bahan baku, susu, sirup, es, kemasan cup &bull; <strong>Di-input manual oleh Finance</strong>
          </div>
        </div>

        {/* Card 3: Kategori NON-PRODUKSI */}
        <div className="card" style={{ padding: '20px', borderLeft: '5px solid #ea580c', background: '#fff7ed' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: '#9a3412', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Kategori Non-Produksi (Supabase Kasir)
              </span>
              <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '1px 6px', background: '#ffedd5', color: '#c2410c' }}>
                {metrics.pctNonProduksi}%
              </span>
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#c2410c' }}>
            {formatRupiah(metrics.totalNonProduksi)}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#9a3412', marginTop: '4px' }}>
            Utilitas PLN, nasi karyawan, gaji harian &bull; <strong>Ditarik otomatis dari Supabase kasir</strong>
          </div>
        </div>
      </div>

      {/* Progress Bar Rasio Komparasi */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Rasio Komposisi Biaya: Produksi vs Non-Produksi
          </span>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', fontWeight: 600 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#047857' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#059669', display: 'inline-block' }}></span>
              Produksi ({metrics.pctProduksi}%)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#c2410c' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#ea580c', display: 'inline-block' }}></span>
              Non-Produksi ({metrics.pctNonProduksi}%)
            </span>
          </div>
        </div>
        <div style={{ width: '100%', height: '12px', borderRadius: '99px', background: '#f1f5f9', overflow: 'hidden', display: 'flex' }}>
          <div
            style={{
              width: `${metrics.pctProduksi}%`,
              background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
              transition: 'width 0.4s ease'
            }}
            title={`Produksi: ${metrics.pctProduksi}%`}
          />
          <div
            style={{
              width: `${metrics.pctNonProduksi}%`,
              background: 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)',
              transition: 'width 0.4s ease'
            }}
            title={`Non-Produksi: ${metrics.pctNonProduksi}%`}
          />
        </div>
      </div>

      {/* 3. Filter Bar & Pencarian */}
      <div className="card" style={{ padding: '18px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Toggle Filter Kategori (Pills) */}
          <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
            <button
              onClick={() => setCategoryFilter('all')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: categoryFilter === 'all' ? '#ffffff' : 'transparent',
                color: categoryFilter === 'all' ? 'var(--text-main)' : 'var(--text-secondary)',
                fontWeight: categoryFilter === 'all' ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: categoryFilter === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              Semua Kategori ({outletExpenses.length})
            </button>
            <button
              onClick={() => setCategoryFilter('Produksi')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: categoryFilter === 'Produksi' ? '#059669' : 'transparent',
                color: categoryFilter === 'Produksi' ? '#ffffff' : '#047857',
                fontWeight: categoryFilter === 'Produksi' ? 700 : 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: categoryFilter === 'Produksi' ? '0 2px 4px rgba(5, 150, 105, 0.25)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              📦 Produksi ({metrics.countProduksi})
            </button>
            <button
              onClick={() => setCategoryFilter('Non-Produksi')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: categoryFilter === 'Non-Produksi' ? '#ea580c' : 'transparent',
                color: categoryFilter === 'Non-Produksi' ? '#ffffff' : '#c2410c',
                fontWeight: categoryFilter === 'Non-Produksi' ? 700 : 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: categoryFilter === 'Non-Produksi' ? '0 2px 4px rgba(234, 88, 12, 0.25)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              🏢 Non-Produksi ({metrics.countNonProduksi})
            </button>
          </div>

          {/* Filter Dropdown & Search Bar */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Filter Outlet */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Store size={15} color="var(--text-secondary)" />
              <select
                className="form-control form-control-sm"
                value={outletFilter}
                onChange={(e) => setOutletFilter(e.target.value)}
                style={{ width: '180px', fontSize: '0.82rem' }}
              >
                <option value="all">Semua Outlet</option>
                {outlets.map(out => (
                  <option key={out.id} value={out.id}>{out.name}</option>
                ))}
              </select>
            </div>

            {/* Filter Tanggal */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={15} color="var(--text-secondary)" />
              <input
                type="date"
                className="form-control form-control-sm"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                style={{ width: '145px', fontSize: '0.82rem' }}
              />
              {searchDate && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSearchDate('')}
                  title="Reset Filter Tanggal"
                  style={{ padding: '4px 8px' }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Cari keterangan / item..."
                className="form-control form-control-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '30px', width: '200px', fontSize: '0.82rem' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Tombol Export Laporan Cepat */}
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsReportModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontWeight: 700,
                color: '#0d9488',
                borderColor: '#99f6e4',
                background: '#f0fdfa',
                cursor: 'pointer'
              }}
              title="Buka template laporan mingguan resmi (Export CSV, Excel, Cetak PDF)"
            >
              <Download size={14} />
              <span>Export Laporan</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Tabel Daftar Pengeluaran Outlet */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafbfc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>
              Daftar Catatan Pengeluaran Outlet
            </span>
            <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
              {filteredExpenses.length} Baris
            </span>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Total Terfilter: <strong style={{ color: 'var(--text-main)' }}>{formatRupiah(filteredExpenses.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0))}</strong>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ width: '105px' }}>Tanggal</th>
                <th style={{ width: '170px' }}>Outlet / Cabang</th>
                <th style={{ width: '135px' }}>Kategori</th>
                <th style={{ width: '160px' }}>Sub-Kategori</th>
                <th>Keterangan Pengeluaran</th>
                <th style={{ textAlign: 'right', width: '140px' }}>Nominal (Rp)</th>
                <th style={{ width: '130px' }}>Metode Bayar</th>
                <th style={{ width: '150px' }}>Dicatat Oleh</th>
                <th style={{ textAlign: 'center', width: '90px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-secondary)' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#f1f5f9', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                      <MinusCircle size={24} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                      Tidak Ada Data Pengeluaran
                    </div>
                    <div style={{ fontSize: '0.82rem', maxWidth: '420px', margin: '0 auto 16px' }}>
                      Tidak ada catatan pengeluaran yang sesuai dengan filter kategori, outlet, atau tanggal yang dipilih.
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
                      <Plus size={14} style={{ marginRight: '4px' }} />
                      Input Pengeluaran Baru
                    </button>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const isProduksi = exp.category === 'Produksi';

                  return (
                    <tr key={exp.id} style={{ transition: 'background 0.15s' }}>
                      {/* Tanggal */}
                      <td style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {exp.date}
                      </td>

                      {/* Outlet */}
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                          {exp.outletName}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          {exp.outletId}
                        </div>
                      </td>

                      {/* Kategori (PRODUKSI vs NON-PRODUKSI) */}
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.02em',
                          background: isProduksi ? '#ecfdf5' : '#fff7ed',
                          color: isProduksi ? '#047857' : '#c2410c',
                          border: isProduksi ? '1px solid #a7f3d0' : '1px solid #fed7aa'
                        }}>
                          {isProduksi ? '📦 PRODUKSI' : '🏢 NON-PRODUKSI'}
                        </span>
                      </td>

                      {/* Sub-Kategori */}
                      <td>
                        <span style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-secondary)',
                          background: '#f8fafc',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          display: 'inline-block'
                        }}>
                          {exp.subCategory || '-'}
                        </span>
                      </td>

                      {/* Keterangan */}
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-main)' }}>
                          {exp.description}
                        </div>
                        {exp.notes && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Catatan: {exp.notes}
                          </div>
                        )}
                      </td>

                      {/* Nominal (Rp) */}
                      <td style={{ textAlign: 'right' }}>
                        <strong style={{
                          fontSize: '0.92rem',
                          fontWeight: 800,
                          color: isProduksi ? '#047857' : '#c2410c'
                        }}>
                          {formatRupiah(exp.amount)}
                        </strong>
                      </td>

                      {/* Metode Bayar */}
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: '#f1f5f9',
                          fontWeight: 600
                        }}>
                          {exp.paymentMethod || 'Kasir'}
                        </span>
                      </td>

                      {/* Dicatat Oleh & Sumber */}
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{exp.recordedBy || 'Finance'}</div>
                        <div style={{ marginTop: '3px' }}>
                          {exp.isFromSupabase || exp.category === 'Non-Produksi' ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontSize: '0.67rem',
                              fontWeight: 700,
                              background: '#fff7ed',
                              color: '#c2410c',
                              border: '1px solid #fed7aa'
                            }}>
                              ⚡ Supabase Kasir PWA
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontSize: '0.67rem',
                              fontWeight: 700,
                              background: '#ecfdf5',
                              color: '#047857',
                              border: '1px solid #a7f3d0'
                            }}>
                              👤 Manual Finance
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Aksi */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEdit(exp)}
                            title="Edit Catatan"
                            style={{ padding: '4px 6px', color: '#2563eb' }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleDelete(exp.id, exp.description)}
                            title="Hapus Catatan"
                            style={{ padding: '4px 6px', color: '#dc2626' }}
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
            {filteredExpenses.length > 0 && (
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                  <td colSpan="5" style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    SUBTOTAL TERFILTER:
                  </td>
                  <td style={{ textAlign: 'right', fontSize: '1rem', color: '#0f172a' }}>
                    {formatRupiah(filteredExpenses.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0))}
                  </td>
                  <td colSpan="3" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {filteredExpenses.length} Transaksi
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: INPUT / EDIT PENGELUARAN (PRODUKSI VS NON-PRODUKSI)*/}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Header Modal */}
            <div className="modal-header" style={{
              background: formData.category === 'Produksi'
                ? 'linear-gradient(135deg, #064e3b 0%, #047857 100%)'
                : 'linear-gradient(135deg, #7c2d12 0%, #c2410c 100%)',
              color: '#ffffff',
              padding: '18px 22px'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                  {editingExpenseId ? 'Edit Catatan Pengeluaran Outlet' : 'Input Pengeluaran Outlet Baru'}
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#e2e8f0' }}>
                  Pilih kategori dengan tegas: Produksi (bahan/kemasan) atau Non-Produksi (overhead)
                </p>
              </div>
              <button
                className="btn-close"
                onClick={() => setIsModalOpen(false)}
                style={{ color: '#ffffff', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {/* Body Form */}
            <form onSubmit={handleSaveExpense} style={{ padding: '22px' }}>
              {/* PILIHAN KATEGORI UTAMA (KARTU BESAR 2 PILIHAN) */}
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>
                  1. Pilih Kategori Pengeluaran: <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Pilihan 1: Produksi */}
                  <div
                    onClick={() => {
                      setFormData({
                        ...formData,
                        category: 'Produksi',
                        subCategory: 'Bahan Baku & Minuman'
                      });
                    }}
                    style={{
                      border: formData.category === 'Produksi' ? '2px solid #059669' : '1px solid var(--border-subtle)',
                      background: formData.category === 'Produksi' ? '#ecfdf5' : '#ffffff',
                      borderRadius: '12px',
                      padding: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.88rem', color: formData.category === 'Produksi' ? '#047857' : 'var(--text-main)' }}>
                        📦 PRODUKSI (Manual Finance)
                      </span>
                      {formData.category === 'Produksi' && (
                        <CheckCircle2 size={16} color="#059669" />
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Bahan baku makanan/minuman, susu, sirup, es batu, kemasan, cup take away. Di-input manual oleh Finance.
                    </div>
                  </div>

                  {/* Pilihan 2: Non-Produksi */}
                  <div
                    onClick={() => {
                      setFormData({
                        ...formData,
                        category: 'Non-Produksi',
                        subCategory: 'Konsumsi Karyawan',
                        paymentMethod: 'Kas Kecil Kasir'
                      });
                    }}
                    style={{
                      border: formData.category === 'Non-Produksi' ? '2px solid #ea580c' : '1px solid var(--border-subtle)',
                      background: formData.category === 'Non-Produksi' ? '#fff7ed' : '#ffffff',
                      borderRadius: '12px',
                      padding: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.88rem', color: formData.category === 'Non-Produksi' ? '#c2410c' : 'var(--text-main)' }}>
                        🏢 NON-PRODUKSI
                      </span>
                      {formData.category === 'Non-Produksi' && (
                        <CheckCircle2 size={16} color="#ea580c" />
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Biaya operasional toko/kasir (Otomatis ditarik dari Supabase kasir, atau input manual jika ada biaya khusus).
                    </div>
                  </div>
                </div>
              </div>

              {/* Tanggal & Outlet */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label className="form-label">Tanggal Pengeluaran <span style={{ color: '#dc2626' }}>*</span></label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Outlet / Cabang <span style={{ color: '#dc2626' }}>*</span></label>
                  <select
                    className="form-control"
                    value={formData.outletId}
                    onChange={(e) => setFormData({ ...formData, outletId: e.target.value })}
                  >
                    {outlets.map(out => (
                      <option key={out.id} value={out.id}>{out.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sub-Kategori */}
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label">Sub-Kategori Pengeluaran</label>
                <select
                  className="form-control"
                  value={formData.subCategory}
                  onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                >
                  {(subCategoryPresets[formData.category] || []).map(preset => (
                    <option key={preset} value={preset}>{preset}</option>
                  ))}
                </select>
              </div>

              {/* Keterangan Pengeluaran */}
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label">Keterangan / Nama Item Pengeluaran <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={formData.category === 'Produksi' ? 'Contoh: Es batu kristal 8 sak, Tempe goreng, Beli Sprite' : 'Contoh: Nasi padang 4 porsi karyawan, Token listrik 50rb, Bensin'}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              {/* Nominal Biaya & Metode Bayar */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label className="form-label">Nominal Biaya (Rp) <span style={{ color: '#dc2626' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      Rp
                    </span>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      style={{ paddingLeft: '40px', fontWeight: 800, fontSize: '1rem', color: formData.category === 'Produksi' ? '#047857' : '#c2410c' }}
                      required
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Sumber Dana / Bayar</label>
                  <select
                    className="form-control"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  >
                    <option value="Kas Kecil Kasir">Kas Kecil Kasir</option>
                    <option value="Transfer Finance">Transfer Finance</option>
                    <option value="Kas Toko">Kas Toko</option>
                    <option value="Dana Talangan">Dana Talangan</option>
                  </select>
                </div>
              </div>

              {/* Penanggung Jawab & Catatan Tambahan */}
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label">Dicatat Oleh / PIC</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.recordedBy}
                  onChange={(e) => setFormData({ ...formData, recordedBy: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label className="form-label">Catatan Tambahan (Opsional)</label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Catatan struk, nomor faktur, atau keterangan lain..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              {/* Tombol Aksi Modal */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    background: formData.category === 'Produksi'
                      ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                      : 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                    borderColor: formData.category === 'Produksi' ? '#047857' : '#c2410c'
                  }}
                >
                  {editingExpenseId ? 'Simpan Perubahan' : 'Catat Pengeluaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EXPORT & CETAK LAPORAN MINGGUAN (FORMAT 3 PILLAR)   */}
      {/* ========================================================= */}
      {isReportModalOpen && (
        <div className="modal-overlay print-active" style={{ zIndex: 1200, padding: '16px' }}>
          <div
            className="modal-content"
            style={{
              maxWidth: '1420px',
              width: '96vw',
              maxHeight: '94vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
            }}
          >
            {/* Modal Header */}
            <div
              className="modal-header no-print"
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                padding: '16px 24px',
                borderBottom: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(27, 163, 182, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1ba3b6'
                  }}
                >
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                    Export &amp; Cetak Laporan Mingguan Outlet
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Template Matriks Menyamping Resmi 3 Pillar Management (Biaya Produksi vs Non-Produksi)
                  </div>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setIsReportModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#e2e8f0'
                }}
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div
              className="modal-body"
              style={{
                padding: '20px 24px',
                overflowY: 'auto',
                flex: 1,
                background: '#f8fafc'
              }}
            >
              <WeeklyExpenseReport
                outlets={outlets}
                outletExpenses={outletExpenses}
                initialOutletId={outletFilter !== 'all' ? outletFilter : 'OUT-08'}
                onClose={() => setIsReportModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
