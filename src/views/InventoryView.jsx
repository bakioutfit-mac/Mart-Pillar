import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Package,
  ClipboardCheck,
  Search,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Calculator,
  X,
  AlertTriangle,
  Layers,
  History,
  TrendingDown,
  Store,
  Truck,
  Clock,
  Moon,
  RefreshCw,
  Eye,
  Check,
  ArrowRight,
  ShieldAlert,
  Calendar
} from 'lucide-react';

export const InventoryView = ({ defaultSubTab = 'katalog' }) => {
  const { 
    products, 
    suppliers,
    addProduct, 
    updateProduct, 
    deleteProduct, 
    currentUser,
    calculateSellPrice,
    opnameLogs,
    recordStockOpname,
    outlets,
    orders,
    outletStocks,
    confirmReceiveOrder,
    updateOutletClosingStock
  } = useApp();

  // Role permissions
  const isOutlet = currentUser.role === 'outlet';
  const canManageStock = !isOutlet;

  // Active sub-tab
  // For outlet: 'cabang' | 'katalog'
  // For staff/owner: 'katalog' | 'opname' | 'outlet_stocks'
  const [inventorySubTab, setInventorySubTab] = useState(isOutlet ? 'cabang' : defaultSubTab);

  // ----------------------------------------------------------------
  // 1. DATA OUTLET KHUSUS CABANG
  // ----------------------------------------------------------------
  const currentOutletId = currentUser.outletId || outlets.find(o => o.name === currentUser.name)?.id || 'OUT-01';
  const currentOutlet = outlets.find(o => o.id === currentOutletId) || {
    id: currentOutletId,
    name: currentUser.name || 'Outlet Mart Pillar',
    code: 'OPS-01',
    address: 'Cabang Mitra Mart Pillar',
    pic: 'Staff Outlet'
  };

  const branchItems = outletStocks[currentOutletId] || [];

  // Pesanan masuk dari gudang pusat yang belum dikonfirmasi terima
  const pendingDeliveries = (orders || []).filter(o => 
    (o.outletId === currentOutletId || o.outletName === currentOutlet.name) && 
    o.deliveryStatus !== 'Diterima Cabang'
  );

  // State Cabang
  const [branchSearch, setBranchSearch] = useState('');
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [closingDraft, setClosingDraft] = useState({});
  const [isAddBranchItemModalOpen, setIsAddBranchItemModalOpen] = useState(false);
  const [newBranchItemProdId, setNewBranchItemProdId] = useState('');
  const [newBranchItemQty, setNewBranchItemQty] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState(null);

  // ----------------------------------------------------------------
  // 2. STATE KATALOG GUDANG
  // ----------------------------------------------------------------
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [newProd, setNewProd] = useState({
    name: '',
    category: '',
    unit: 'kg',
    stock: 20,
    minStock: 10,
    buyPrice: 15000,
    supplierId: suppliers[0]?.id || 'SUP-01'
  });

  // ----------------------------------------------------------------
  // 3. STATE STOCK OPNAME GUDANG
  // ----------------------------------------------------------------
  const [opnameSubView, setOpnameSubView] = useState('audit'); // 'audit' | 'history'
  const [opnameSearch, setOpnameSearch] = useState('');
  const [opnameCategory, setOpnameCategory] = useState('all');
  const [physicalCounts, setPhysicalCounts] = useState({});
  const [reasons, setReasons] = useState({});
  const [successLogs, setSuccessLogs] = useState([]);

  // ----------------------------------------------------------------
  // 4. STATE MONITORING STOK CABANG (OWNER & GUDANG)
  // ----------------------------------------------------------------
  const [monitoringOutletFilter, setMonitoringOutletFilter] = useState('all');
  const [monitoringSearch, setMonitoringSearch] = useState('');

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  // Filter branch items
  const filteredBranchItems = branchItems.filter(item => {
    return item.productName.toLowerCase().includes(branchSearch.toLowerCase()) ||
      item.productId.toLowerCase().includes(branchSearch.toLowerCase());
  });

  // Filter catalog products
  const filteredCatalogProducts = products.filter(p => {
    const matchCat = catalogCategory === 'all' || p.category.toLowerCase().includes(catalogCategory.toLowerCase());
    const matchSearch = p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      (p.supplierName && p.supplierName.toLowerCase().includes(catalogSearch.toLowerCase()));
    return matchCat && matchSearch;
  });

  // Filter opname products
  const filteredOpnameProducts = products.filter(p => {
    const matchCat = opnameCategory === 'all' || p.category.toLowerCase().includes(opnameCategory.toLowerCase());
    const matchSearch = p.name.toLowerCase().includes(opnameSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  // Unique category list
  const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  // ----------------------------------------------------------------
  // HANDLERS OUTLET CABANG
  // ----------------------------------------------------------------
  const handleOpenClosingModal = () => {
    const draft = {};
    branchItems.forEach(item => {
      draft[item.productId] = item.stock;
    });
    setClosingDraft(draft);
    setIsClosingModalOpen(true);
  };

  const handleSaveClosing = (e) => {
    e.preventDefault();
    const updated = branchItems.map(item => ({
      ...item,
      stock: closingDraft[item.productId] !== undefined ? parseFloat(closingDraft[item.productId]) || 0 : item.stock
    }));

    updateOutletClosingStock(currentOutletId, updated);
    setIsClosingModalOpen(false);
    setFeedbackNotice({
      type: 'success',
      text: `Sisa stok closing malam untuk ${currentOutlet.name} berhasil disimpan! Waktu closing tercatat & data live telah tersinkron ke Owner.`
    });
    setTimeout(() => setFeedbackNotice(null), 6000);
  };

  const handleConfirmReceive = (orderId) => {
    confirmReceiveOrder(orderId);
    setFeedbackNotice({
      type: 'success',
      text: `Kiriman Order #${orderId} berhasil dikonfirmasi diterima! Seluruh barang otomatis ditambahkan ke stok cabang Anda.`
    });
    setTimeout(() => setFeedbackNotice(null), 6000);
  };

  const handleAddBranchItem = (e) => {
    e.preventDefault();
    const prod = products.find(p => p.id === newBranchItemProdId);
    if (!prod) return;

    const exists = branchItems.some(b => b.productId === prod.id);
    if (exists) {
      alert('Bahan ini sudah ada dalam daftar stok cabang Anda.');
      return;
    }

    const updated = [
      ...branchItems,
      {
        productId: prod.id,
        productName: prod.name,
        unit: prod.unit,
        stock: parseFloat(newBranchItemQty) || 0,
        minStock: prod.minStock || 5,
        lastClosing: 'Hari ini (Baru Ditambah)'
      }
    ];

    updateOutletClosingStock(currentOutletId, updated);
    setIsAddBranchItemModalOpen(false);
    setNewBranchItemProdId('');
    setNewBranchItemQty('');
    setFeedbackNotice({
      type: 'success',
      text: `Berhasil menambahkan "${prod.name}" ke daftar stok cabang.`
    });
    setTimeout(() => setFeedbackNotice(null), 5000);
  };

  // ----------------------------------------------------------------
  // HANDLERS KATALOG
  // ----------------------------------------------------------------
  const handleAddSubmit = (e) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === newProd.supplierId);
    addProduct({
      ...newProd,
      category: (newProd.category || 'Umum').trim(),
      stock: parseFloat(newProd.stock) || 0,
      minStock: parseFloat(newProd.minStock) || 0,
      buyPrice: parseFloat(newProd.buyPrice) || 0,
      supplierName: sup ? sup.name : 'Supplier Mart Pillar'
    });
    setIsAddModalOpen(false);
    setNewProd({
      name: '',
      category: '',
      unit: 'kg',
      stock: 20,
      minStock: 10,
      buyPrice: 15000,
      supplierId: suppliers[0]?.id || 'SUP-01'
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    updateProduct(editingProduct.id, {
      name: editingProduct.name,
      category: (editingProduct.category || 'Umum').trim(),
      unit: editingProduct.unit,
      stock: parseFloat(editingProduct.stock) || 0,
      minStock: parseFloat(editingProduct.minStock) || 0,
      buyPrice: parseFloat(editingProduct.buyPrice) || 0
    });
    setEditingProduct(null);
  };

  const handleDeleteProduct = (prod) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus "${prod.name}" dari katalog & stok?`)) {
      deleteProduct(prod.id);
      if (editingProduct && editingProduct.id === prod.id) {
        setEditingProduct(null);
      }
    }
  };

  // ----------------------------------------------------------------
  // HANDLERS STOCK OPNAME
  // ----------------------------------------------------------------
  const handlePhysicalChange = (productId, val) => {
    setPhysicalCounts(prev => ({ ...prev, [productId]: val }));
  };

  const handleReasonChange = (productId, val) => {
    setReasons(prev => ({ ...prev, [productId]: val }));
  };

  const handleAdjustSingle = (product) => {
    const entered = physicalCounts[product.id];
    if (entered === undefined || entered === '') {
      alert('Masukkan jumlah stok fisik yang dihitung terlebih dahulu.');
      return;
    }

    const physNum = Number(entered);
    const reasonText = reasons[product.id] || (
      product.category.toLowerCase().includes('ayam') ? 'Susut Penirisan Es (Alami)' :
      product.category.toLowerCase().includes('sayur') ? 'Daun Menguning/Busuk (Waste)' :
      'Selisih Hitung Gudang'
    );

    const log = recordStockOpname({
      productId: product.id,
      physicalStock: physNum,
      reason: reasonText,
      auditor: currentUser.name
    });

    setSuccessLogs(prev => [log, ...prev]);
    setPhysicalCounts(prev => {
      const next = { ...prev };
      delete next[product.id];
      return next;
    });
  };

  // Stats Cabang Outlet
  const branchSafeCount = branchItems.filter(i => i.stock > i.minStock).length;
  const branchLowCount = branchItems.filter(i => i.stock > 0 && i.stock <= i.minStock).length;
  const branchEmptyCount = branchItems.filter(i => i.stock <= 0).length;
  const lastClosingTime = branchItems[0]?.lastClosing || 'Belum closing';

  return (
    <div className="content-body" style={{ paddingBottom: '90px' }}>
      {/* Header Halaman */}
      <div className="page-header">
        <div>
          <div className="page-title">
            {isOutlet 
              ? `Stok Bahan di ${currentOutlet.name}` 
              : 'Stok & Pergudangan Mart Pillar'}
          </div>
          <div className="page-desc">
            {isOutlet 
              ? 'Kelola sisa stok fisik harian di cabang Anda, terima pasokan gudang pusat, dan input sisa stok closing malam.'
              : 'Pusat inventaris gudang pusat Mart Pillar, audit Stock Opname fisik, serta monitoring live kondisi stok cabang outlet.'}
          </div>
        </div>

        {/* Tab Navigation */}
        {isOutlet ? (
          <div style={{ display: 'flex', gap: '8px', background: '#f8fafc', border: '1.5px solid var(--border-medium)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            <button
              className={`btn btn-sm ${inventorySubTab === 'cabang' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setInventorySubTab('cabang')}
            >
              <Store size={15} />
              <span>1. Stok di Cabang Saya ({branchItems.length})</span>
            </button>
            <button
              className={`btn btn-sm ${inventorySubTab === 'katalog' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setInventorySubTab('katalog')}
            >
              <Package size={15} />
              <span>2. Katalog Gudang Pusat ({products.length})</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', background: '#f8fafc', border: '1.5px solid var(--border-medium)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            <button
              className={`btn btn-sm ${inventorySubTab === 'katalog' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setInventorySubTab('katalog')}
            >
              <Package size={15} />
              <span>1. Katalog Gudang ({products.length})</span>
            </button>
            <button
              className={`btn btn-sm ${inventorySubTab === 'opname' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setInventorySubTab('opname')}
            >
              <ClipboardCheck size={15} />
              <span>2. Stock Opname Gudang</span>
            </button>
            <button
              className={`btn btn-sm ${inventorySubTab === 'outlet_stocks' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setInventorySubTab('outlet_stocks')}
            >
              <Store size={15} />
              <span>3. Monitoring Stok Cabang</span>
            </button>
          </div>
        )}
      </div>

      {/* Global Feedback Notice */}
      {feedbackNotice && (
        <div style={{
          background: '#ecfdf5',
          border: '1.5px solid #a7f3d0',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <CheckCircle2 size={22} color="#059669" />
          <div style={{ fontSize: '0.9rem', color: '#065f46', fontWeight: 600 }}>
            {feedbackNotice.text}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* KHUSUS OUTLET: SUB-TAB 1: STOK DI CABANG SAYA                  */}
      {/* ============================================================== */}
      {isOutlet && inventorySubTab === 'cabang' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card Info Cabang & Tombol Closing Malam */}
          <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--primary-500)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge badge-warning" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                    KODE: {currentOutlet.code || currentOutlet.id}
                  </span>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-main)' }}>
                    {currentOutlet.name}
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <span>📍 {currentOutlet.address || 'Jakarta'}</span>
                  <span>👤 PIC: <strong>{currentOutlet.pic || 'Staff Cabang'}</strong></span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary-700)', fontWeight: 600 }}>
                    <Clock size={14} />
                    Closing Terakhir: {lastClosingTime}
                  </span>
                </div>
              </div>

              {/* Action: Input Sisa Stok Closing Malam */}
              <button
                className="btn btn-primary"
                onClick={handleOpenClosingModal}
                style={{ padding: '10px 18px', fontWeight: 700, fontSize: '0.92rem' }}
              >
                <Moon size={18} />
                <span>Input Sisa Stok Closing Malam</span>
              </button>
            </div>
          </div>

          {/* Banner Kiriman Masuk dari Gudang Siap Diterima */}
          {pendingDeliveries.length > 0 && (
            <div style={{
              background: '#fffbeb',
              border: '2px solid #fde68a',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: '#f59e0b', color: 'white', padding: '8px', borderRadius: '8px', display: 'flex' }}>
                    <Truck size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#92400e' }}>
                      Ada Kiriman Bahan Baku dari Gudang Pusat Siap Diterima!
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#b45309' }}>
                      Konfirmasi penerimaan barang untuk otomatis menambahkan jumlah fisik barang ke stok cabang Anda.
                    </div>
                  </div>
                </div>
              </div>

              {pendingDeliveries.map(ord => (
                <div
                  key={ord.id}
                  style={{
                    background: 'white',
                    border: '1px solid #fef3c7',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '0.92rem' }}>Order #{ord.id}</strong>
                      <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>{ord.shift || 'Distribusi Pagi'}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{ord.date} {ord.time}</span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Isi Kiriman: {(ord.items || []).map(it => `${it.productName} (${it.qty} ${it.unit})`).join(', ')}
                    </div>
                  </div>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleConfirmReceive(ord.id)}
                    style={{ background: '#059669', borderColor: '#059669', fontWeight: 700 }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Konfirmasi Terima Barang (+ Tambah ke Stok)</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Quick Metrics Bar Cabang */}
          <div className="grid-4">
            <div className="metric-card">
              <div className="metric-label">Total Jenis Bahan Terdata</div>
              <div className="metric-val">{branchItems.length} Jenis</div>
              <div className="metric-desc">Bahan baku di dapur cabang</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Stok Aman</div>
              <div className="metric-val" style={{ color: '#059669' }}>{branchSafeCount} Bahan</div>
              <div className="metric-desc">Jumlah di atas batas minimum</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Stok Menipis</div>
              <div className="metric-val" style={{ color: '#d97706' }}>{branchLowCount} Bahan</div>
              <div className="metric-desc">Perlu segera diorder ke gudang</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Stok Habis (0)</div>
              <div className="metric-val" style={{ color: '#dc2626' }}>{branchEmptyCount} Bahan</div>
              <div className="metric-desc">Bahan kosong di cabang</div>
            </div>
          </div>

          {/* Search & Actions Bar Cabang */}
          <div className="card" style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Cari bahan baku di cabang..."
                  className="form-input"
                  style={{ paddingLeft: '36px' }}
                  value={branchSearch}
                  onChange={(e) => setBranchSearch(e.target.value)}
                />
              </div>

              <button
                className="btn btn-secondary"
                onClick={() => setIsAddBranchItemModalOpen(true)}
              >
                <Plus size={16} color="var(--primary-600)" />
                <span>+ Tambah Bahan Baru ke Cabang</span>
              </button>
            </div>
          </div>

          {/* Tabel Stok Cabang */}
          <div className="card">
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Nama Bahan Baku</th>
                    <th>Sisa Stok di Toko</th>
                    <th>Satuan</th>
                    <th>Batas Minimum</th>
                    <th>Status Stok</th>
                    <th>Closing / Update Terakhir</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBranchItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                        Belum ada bahan baku terdata di cabang ini atau tidak cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredBranchItems.map(item => {
                      const isLow = item.stock <= item.minStock && item.stock > 0;
                      const isOut = item.stock <= 0;

                      return (
                        <tr key={item.productId}>
                          <td>
                            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                              {item.productName}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                              SKU: {item.productId}
                            </div>
                          </td>
                          <td>
                            <span style={{
                              fontWeight: 800,
                              fontSize: '1.15rem',
                              color: isOut ? '#dc2626' : isLow ? '#d97706' : '#059669'
                            }}>
                              {item.stock}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-info">{item.unit}</span>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {item.minStock} {item.unit}
                          </td>
                          <td>
                            {isOut ? (
                              <span className="badge badge-danger">Habis (Segera Order)</span>
                            ) : isLow ? (
                              <span className="badge badge-warning">Menipis</span>
                            ) : (
                              <span className="badge badge-success">Aman</span>
                            )}
                          </td>
                          <td>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: 600 }}>
                              {item.lastClosing || '-'}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 1/2: KATALOG & HARGA GUDANG PUSAT                      */}
      {/* ============================================================== */}
      {inventorySubTab === 'katalog' && (
        <>
          {/* Action Header & Search */}
          <div className="card" style={{ marginBottom: '20px', padding: '14px 18px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Cari barang atau komoditas di katalog..."
                  className="form-input"
                  style={{ paddingLeft: '36px' }}
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                />
              </div>

              {canManageStock && (
                <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
                  <Plus size={16} />
                  <span>+ Tambah Barang & Stok Baru</span>
                </button>
              )}
            </div>

            {/* Filter Category Pills */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                className={`btn btn-sm ${catalogCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCatalogCategory('all')}
              >
                Semua Kategori ({products.length})
              </button>
              <button
                className={`btn btn-sm ${catalogCategory === 'sayur' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCatalogCategory('sayur')}
              >
                Sayuran
              </button>
              <button
                className={`btn btn-sm ${catalogCategory === 'ayam' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCatalogCategory('ayam')}
              >
                Ayam & Daging
              </button>
              <button
                className={`btn btn-sm ${catalogCategory === 'cup' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCatalogCategory('cup')}
              >
                Kemasan
              </button>
              <button
                className={`btn btn-sm ${catalogCategory === 'bumbu' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCatalogCategory('bumbu')}
              >
                Bumbu
              </button>
              {uniqueCategories
                .filter(c => !['sayur', 'ayam', 'cup', 'bumbu'].includes(c.toLowerCase()))
                .map((cat, idx) => (
                  <button
                    key={idx}
                    className={`btn btn-sm ${catalogCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setCatalogCategory(cat)}
                  >
                    {cat}
                  </button>
                ))
              }
            </div>
          </div>

          {/* Tabel Katalog */}
          <div className="card">
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Nama Komoditas & SKU</th>
                    <th>Kategori</th>
                    {!isOutlet && <th>Supplier</th>}
                    {!isOutlet && <th>Harga Beli</th>}
                    {!isOutlet && <th>Mark-up (+2.5%)</th>}
                    <th>Harga Jual ke Outlet</th>
                    {!isOutlet && <th>Sisa Stok Gudang</th>}
                    {!isOutlet && <th>Status Stok Gudang</th>}
                    {canManageStock && <th style={{ textAlign: 'right' }}>Kelola Stok</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredCatalogProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                        Tidak ada komoditas yang sesuai pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredCatalogProducts.map(prod => {
                      const isLow = prod.stock <= prod.minStock;
                      const isOut = prod.stock <= 0;
                      const marginAmount = prod.sellPrice - prod.buyPrice;

                      return (
                        <tr key={prod.id}>
                          <td>
                            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>{prod.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                              SKU: {prod.id} | Satuan: {prod.unit}
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-warning">{prod.category.toUpperCase()}</span>
                          </td>
                          {!isOutlet && (
                            <td>
                              <div style={{ fontSize: '0.82rem' }}>{prod.supplierName}</div>
                            </td>
                          )}
                          {!isOutlet && (
                            <td style={{ color: 'var(--text-secondary)' }}>
                              {formatRupiah(prod.buyPrice)}
                            </td>
                          )}
                          {!isOutlet && (
                            <td>
                              <span style={{ color: 'var(--primary-600)', fontWeight: 700, fontSize: '0.82rem' }}>
                                +{formatRupiah(marginAmount)}
                              </span>
                              <span className="badge badge-warning" style={{ marginLeft: '4px', fontSize: '0.62rem' }}>
                                +2.5%
                              </span>
                            </td>
                          )}
                          <td>
                            <div style={{ fontWeight: 800, color: 'var(--primary-600)', fontSize: '1rem' }}>
                              {formatRupiah(prod.sellPrice)}
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}> /{prod.unit}</span>
                            </div>
                          </td>
                          {!isOutlet && (
                            <td>
                              <span style={{ fontWeight: 800, fontSize: '1rem', color: isOut ? '#dc2626' : isLow ? '#ea580c' : 'var(--text-main)' }}>
                                {prod.stock} {prod.unit}
                              </span>
                            </td>
                          )}
                          {!isOutlet && (
                            <td>
                              {isOut ? (
                                <span className="badge badge-danger">Habis</span>
                              ) : isLow ? (
                                <span className="badge badge-warning">Menipis</span>
                              ) : (
                                <span className="badge badge-success">Aman</span>
                              )}
                            </td>
                          )}
                          {canManageStock && (
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => setEditingProduct(prod)}
                                  title="Edit stok fisik atau harga barang"
                                >
                                  <Edit3 size={13} color="var(--primary-600)" />
                                  <span>Edit Stok</span>
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleDeleteProduct(prod)}
                                  style={{ color: '#dc2626', borderColor: '#fecaca' }}
                                  title="Hapus barang dari katalog & stok"
                                >
                                  <Trash2 size={13} />
                                  <span>Hapus</span>
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* NON-OUTLET: SUB-TAB 2: STOCK OPNAME GUDANG PUSAT               */}
      {/* ============================================================== */}
      {inventorySubTab === 'opname' && !isOutlet && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                Audit Stok Fisik Gudang Mart Pillar
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Pencocokan fisik lapangan dengan stok sistem — Catat penyusutan es ayam, sayur busuk (waste), dan selisih kemasan.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className={`btn btn-sm ${opnameSubView === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setOpnameSubView('audit')}
              >
                <ClipboardCheck size={16} />
                <span>Form Hitung Opname</span>
              </button>
              <button
                className={`btn btn-sm ${opnameSubView === 'history' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setOpnameSubView('history')}
              >
                <History size={16} />
                <span>Riwayat Audit ({opnameLogs.length})</span>
              </button>
            </div>
          </div>

          {successLogs.length > 0 && (
            <div style={{
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <CheckCircle2 size={20} color="var(--primary-600)" />
              <div style={{ fontSize: '0.86rem', color: 'var(--text-main)' }}>
                Penyesuaian stok berhasil diterapkan untuk: <strong>{successLogs[0].productName}</strong>.
                Stok sistem kini selaras dengan fisik ({successLogs[0].physicalStock} {successLogs[0].unit}).
              </div>
            </div>
          )}

          {opnameSubView === 'audit' ? (
            <>
              <div className="card" style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                    <input
                      type="text"
                      placeholder="Cari nama barang yang ingin dihitung fisik..."
                      className="form-input"
                      style={{ paddingLeft: '36px' }}
                      value={opnameSearch}
                      onChange={(e) => setOpnameSearch(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                    <button
                      className={`btn btn-sm ${opnameCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setOpnameCategory('all')}
                    >
                      Semua
                    </button>
                    <button
                      className={`btn btn-sm ${opnameCategory === 'sayur' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setOpnameCategory('sayur')}
                    >
                      Sayuran
                    </button>
                    <button
                      className={`btn btn-sm ${opnameCategory === 'ayam' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setOpnameCategory('ayam')}
                    >
                      Ayam & Daging
                    </button>
                    <button
                      className={`btn btn-sm ${opnameCategory === 'cup' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setOpnameCategory('cup')}
                    >
                      Kemasan
                    </button>
                    <button
                      className={`btn btn-sm ${opnameCategory === 'bumbu' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setOpnameCategory('bumbu')}
                    >
                      Bumbu
                    </button>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Komoditas</th>
                        <th>Kategori</th>
                        <th style={{ width: '130px' }}>Stok Sistem</th>
                        <th style={{ width: '160px' }}>Hasil Hitung Fisik</th>
                        <th style={{ width: '130px' }}>Selisih</th>
                        <th style={{ width: '220px' }}>Alasan Penyesuaian</th>
                        <th style={{ textAlign: 'right', width: '160px' }}>Aksi Penyesuaian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOpnameProducts.map(prod => {
                        const enteredCount = physicalCounts[prod.id];
                        const hasEntered = enteredCount !== undefined && enteredCount !== '';
                        const physNum = hasEntered ? Number(enteredCount) : prod.stock;
                        const diff = Number((physNum - prod.stock).toFixed(2));
                        const selectedReason = reasons[prod.id] || (
                          prod.category.toLowerCase().includes('ayam') ? 'Susut Penirisan Es (Alami)' :
                          prod.category.toLowerCase().includes('sayur') ? 'Daun Menguning/Busuk (Waste)' :
                          'Selisih Hitung Gudang'
                        );

                        return (
                          <tr key={prod.id}>
                            <td>
                              <div style={{ fontWeight: 700 }}>{prod.name}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                ID: {prod.id} | Satuan: {prod.unit}
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-info">{prod.category.toUpperCase()}</span>
                            </td>
                            <td>
                              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                                {prod.stock} {prod.unit}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder={prod.stock.toString()}
                                  className="form-input"
                                  style={{ width: '85px', fontWeight: 800, textAlign: 'center' }}
                                  value={enteredCount !== undefined ? enteredCount : ''}
                                  onChange={(e) => handlePhysicalChange(prod.id, e.target.value)}
                                />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                  {prod.unit}
                                </span>
                              </div>
                            </td>
                            <td>
                              {hasEntered ? (
                                <span style={{
                                  fontWeight: 800,
                                  color: diff === 0 ? '#34d399' : diff < 0 ? '#dc2626' : '#2563eb'
                                }}>
                                  {diff > 0 ? `+${diff}` : diff} {prod.unit}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>0 (Sesuai)</span>
                              )}
                            </td>
                            <td>
                              <select
                                className="form-select"
                                style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                                value={selectedReason}
                                onChange={(e) => handleReasonChange(prod.id, e.target.value)}
                              >
                                <option value="Susut Penirisan Es (Alami)">Susut Es (Alami)</option>
                                <option value="Daun Menguning/Busuk (Waste)">Busuk / Rusak (Waste)</option>
                                <option value="Bocor / Kemasan Rusak">Kemasan Rusak / Bocor</option>
                                <option value="Selisih Hitung Gudang">Selisih Hitung Staff</option>
                                <option value="Bonus / Kelebihan Supplier">Bonus / Lebih dari Supplier</option>
                              </select>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="btn btn-warning btn-sm"
                                disabled={!hasEntered || diff === 0}
                                onClick={() => handleAdjustSingle(prod)}
                                style={{
                                  opacity: (!hasEntered || diff === 0) ? 0.45 : 1,
                                  cursor: (!hasEntered || diff === 0) ? 'not-allowed' : 'pointer'
                                }}
                              >
                                <span>Sesuaikan</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="card">
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Waktu & Tanggal</th>
                      <th>Nama Barang</th>
                      <th>Stok Sistem Awal</th>
                      <th>Fisik Riil Dihitung</th>
                      <th>Selisih (Adjustment)</th>
                      <th>Dampak Finansial (Rp)</th>
                      <th>Alasan Penyesuaian</th>
                      <th>Auditor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opnameLogs.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                          Belum ada catatan log stok opname.
                        </td>
                      </tr>
                    ) : (
                      opnameLogs.map(log => (
                        <tr key={log.id}>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{log.date}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{log.time}</div>
                          </td>
                          <td style={{ fontWeight: 700 }}>{log.productName}</td>
                          <td>{log.systemStock} {log.unit}</td>
                          <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>
                            {log.physicalStock} {log.unit}
                          </td>
                          <td>
                            <span style={{
                              fontWeight: 800,
                              color: log.difference < 0 ? '#dc2626' : log.difference > 0 ? '#2563eb' : 'var(--text-main)'
                            }}>
                              {log.difference > 0 ? `+${log.difference}` : log.difference} {log.unit}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              fontWeight: 700,
                              color: log.financialImpact < 0 ? '#dc2626' : '#059669'
                            }}>
                              {log.financialImpact < 0 ? `- ${formatRupiah(Math.abs(log.financialImpact))}` : `+ ${formatRupiah(log.financialImpact)}`}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                              {log.reason}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.82rem' }}>{log.auditor}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* NON-OUTLET: SUB-TAB 3: MONITORING STOK CABANG (OWNER & STAFF)   */}
      {/* ============================================================== */}
      {inventorySubTab === 'outlet_stocks' && !isOutlet && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Monitoring */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                Monitoring Live Stok Seluruh Cabang Outlet
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Pantau ketersediaan bahan baku di setiap toko, deteksi stok menipis sebelum habis, dan cek kepatuhan input closing malam cabang.
              </div>
            </div>
          </div>

          {/* Filter Bar Cabang & Search */}
          <div className="card" style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Cari nama bahan di cabang..."
                  className="form-input"
                  style={{ paddingLeft: '36px' }}
                  value={monitoringSearch}
                  onChange={(e) => setMonitoringSearch(e.target.value)}
                />
              </div>

              {/* Outlet Filter Buttons */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
                <button
                  className={`btn btn-sm ${monitoringOutletFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setMonitoringOutletFilter('all')}
                >
                  Semua Cabang ({outlets.length})
                </button>
                {outlets.map(out => (
                  <button
                    key={out.id}
                    className={`btn btn-sm ${monitoringOutletFilter === out.id ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setMonitoringOutletFilter(out.id)}
                  >
                    {out.name.replace('Outlet ', '')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid per Cabang */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {outlets
              .filter(o => monitoringOutletFilter === 'all' || o.id === monitoringOutletFilter)
              .map(outlet => {
                const oItems = (outletStocks[outlet.id] || []).filter(item => 
                  item.productName.toLowerCase().includes(monitoringSearch.toLowerCase()) ||
                  item.productId.toLowerCase().includes(monitoringSearch.toLowerCase())
                );

                const safeCount = oItems.filter(i => i.stock > i.minStock).length;
                const lowCount = oItems.filter(i => i.stock > 0 && i.stock <= i.minStock).length;
                const outCount = oItems.filter(i => i.stock <= 0).length;
                const closingTime = outletStocks[outlet.id]?.[0]?.lastClosing || 'Belum closing';

                return (
                  <div key={outlet.id} className="card" style={{ padding: '20px' }}>
                    {/* Header Outlet */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '14px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="badge badge-warning" style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                            {outlet.code || outlet.id}
                          </span>
                          <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
                            {outlet.name}
                          </strong>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          PIC: {outlet.pic || '-'} | Telp: {outlet.phone} | Alamat: {outlet.address || '-'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: 'var(--primary-700)', fontWeight: 600 }}>
                          <Clock size={14} />
                          Closing Terakhir: {closingTime}
                        </span>
                        {lowCount > 0 || outCount > 0 ? (
                          <span className="badge badge-danger">
                            Perlu Pasokan ({lowCount + outCount} item)
                          </span>
                        ) : (
                          <span className="badge badge-success">
                            Stok Lengkap & Aman
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Table of Items */}
                    <div className="table-responsive">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Bahan Baku</th>
                            <th>Stok Fisik Toko</th>
                            <th>Satuan</th>
                            <th>Batas Min Toko</th>
                            <th>Kondisi Live</th>
                            <th>Rekomendasi Tindakan Gudang</th>
                          </tr>
                        </thead>
                        <tbody>
                          {oItems.length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                                Belum ada data bahan di cabang ini.
                              </td>
                            </tr>
                          ) : (
                            oItems.map(it => {
                              const isLow = it.stock <= it.minStock && it.stock > 0;
                              const isOut = it.stock <= 0;

                              return (
                                <tr key={it.productId} style={{ background: isOut ? '#fef2f2' : isLow ? '#fffbeb' : 'transparent' }}>
                                  <td>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{it.productName}</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>ID: {it.productId}</div>
                                  </td>
                                  <td>
                                    <span style={{
                                      fontWeight: 800,
                                      fontSize: '1.1rem',
                                      color: isOut ? '#dc2626' : isLow ? '#d97706' : '#059669'
                                    }}>
                                      {it.stock}
                                    </span>
                                  </td>
                                  <td><span className="badge badge-info">{it.unit}</span></td>
                                  <td style={{ color: 'var(--text-secondary)' }}>{it.minStock} {it.unit}</td>
                                  <td>
                                    {isOut ? (
                                      <span className="badge badge-danger">Habis Total</span>
                                    ) : isLow ? (
                                      <span className="badge badge-warning">Menipis</span>
                                    ) : (
                                      <span className="badge badge-success">Aman</span>
                                    )}
                                  </td>
                                  <td>
                                    {isOut ? (
                                      <strong style={{ color: '#dc2626', fontSize: '0.8rem' }}>
                                        Kirim Segera pada Distribusi Pagi!
                                      </strong>
                                    ) : isLow ? (
                                      <span style={{ color: '#d97706', fontSize: '0.8rem', fontWeight: 600 }}>
                                        Siapkan pengiriman berikutnya
                                      </span>
                                    ) : (
                                      <span style={{ color: '#059669', fontSize: '0.8rem' }}>
                                        Cukup untuk operasional
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: INPUT SISA STOK CLOSING MALAM (OUTLET)                 */}
      {/* ============================================================== */}
      {isClosingModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Moon size={20} color="var(--primary-600)" />
                  <span className="modal-title">Input Sisa Stok Closing Malam</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {currentOutlet.name} — Masukkan sisa fisik riil bahan sebelum tutup toko.
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsClosingModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveClosing}>
              <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.82rem', color: '#9a3412' }}>
                  Petunjuk: Masukkan jumlah fisik sisa bahan yang ada di dapur/bar outlet malam ini. Nilai ini akan tersinkron otomatis ke dashboard Owner Mart Pillar.
                </div>

                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Nama Bahan Baku</th>
                        <th style={{ width: '150px' }}>Sisa Fisik Malam Ini</th>
                        <th>Satuan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchItems.map(item => (
                        <tr key={item.productId}>
                          <td>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{item.productName}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                              Tercatat Sebelumnya: {item.stock} {item.unit}
                            </div>
                          </td>
                          <td>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              required
                              className="form-input"
                              style={{ fontWeight: 800, textAlign: 'center', fontSize: '1rem', color: 'var(--primary-700)' }}
                              value={closingDraft[item.productId] !== undefined ? closingDraft[item.productId] : item.stock}
                              onChange={(e) => setClosingDraft({ ...closingDraft, [item.productId]: e.target.value })}
                            />
                          </td>
                          <td>
                            <span className="badge badge-info">{item.unit}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsClosingModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  <CheckCircle2 size={16} />
                  <span>Simpan Stok Closing & Lapor ke Owner</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: TAMBAH BAHAN DARI KATALOG KE CABANG                   */}
      {/* ============================================================== */}
      {isAddBranchItemModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <span className="modal-title">Tambah Bahan ke Stok Cabang</span>
              <button className="modal-close-btn" onClick={() => setIsAddBranchItemModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddBranchItem}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Pilih Bahan dari Katalog Mart Pillar:</label>
                  <select
                    className="form-select"
                    required
                    value={newBranchItemProdId}
                    onChange={(e) => setNewBranchItemProdId(e.target.value)}
                  >
                    <option value="">-- Pilih Bahan Baku --</option>
                    {products
                      .filter(p => !branchItems.some(b => b.productId === p.id))
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.unit}) - {formatRupiah(p.sellPrice)}
                        </option>
                      ))
                    }
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Jumlah Stok Awal di Cabang:</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    placeholder="Contoh: 10"
                    className="form-input"
                    value={newBranchItemQty}
                    onChange={(e) => setNewBranchItemQty(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddBranchItemModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} />
                  <span>Tambahkan ke Stok Cabang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: TAMBAH BARANG KE KATALOG GUDANG (STAFF/OWNER)         */}
      {/* ============================================================== */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <span className="modal-title">Input Barang & Stok Baru Gudang</span>
              <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Barang:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Sayur Brokoli Segar"
                    className="form-input"
                    value={newProd.name}
                    onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Kategori Komoditas (Input Bebas):</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Sayuran, Ayam, Bumbu, Kemasan..."
                      className="form-input"
                      value={newProd.category}
                      onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Satuan Barang:</label>
                    <select
                      className="form-select"
                      value={newProd.unit}
                      onChange={(e) => setNewProd({ ...newProd, unit: e.target.value })}
                    >
                      <option value="kg">kg (Kilogram)</option>
                      <option value="ekor">ekor</option>
                      <option value="ikat">ikat</option>
                      <option value="slop">slop (Isi 50 pcs)</option>
                      <option value="pack">pack</option>
                      <option value="dus">dus / karton</option>
                      <option value="jerigen">jerigen</option>
                      <option value="botol">botol</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Stok Awal Fisik Gudang:</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      className="form-input"
                      value={newProd.stock}
                      onChange={(e) => setNewProd({ ...newProd, stock: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Batas Minimum Stok (Peringatan):</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      className="form-input"
                      value={newProd.minStock}
                      onChange={(e) => setNewProd({ ...newProd, minStock: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Harga Beli Supplier (Rp):</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      className="form-input"
                      value={newProd.buyPrice}
                      onChange={(e) => setNewProd({ ...newProd, buyPrice: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pilih Mitra Supplier:</label>
                    <select
                      className="form-select"
                      value={newProd.supplierId}
                      onChange={(e) => setNewProd({ ...newProd, supplierId: e.target.value })}
                    >
                      {suppliers.map(sup => (
                        <option key={sup.id} value={sup.id}>{sup.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Otomatis Mark-up (+2.5%):</span>
                    <strong style={{ color: 'var(--primary-700)' }}>
                      +{formatRupiah(calculateSellPrice(newProd.buyPrice, 2.5, 100) - newProd.buyPrice)}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginTop: '4px' }}>
                    <span style={{ fontWeight: 700 }}>Harga Jual Resmi ke Outlet:</span>
                    <strong style={{ color: 'var(--primary-600)', fontSize: '1.15rem' }}>
                      {formatRupiah(calculateSellPrice(newProd.buyPrice, 2.5, 100))}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle2 size={16} />
                  <span>Simpan Barang & Stok</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: EDIT STOK & HARGA GUDANG (STAFF/OWNER)               */}
      {/* ============================================================== */}
      {editingProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div>
                <span className="modal-title">Edit Stok & Harga</span>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {editingProduct.name} ({editingProduct.unit})
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setEditingProduct(null)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Barang:</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Kategori Komoditas (Input Bebas):</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Sayuran, Ayam, Bumbu, Kemasan..."
                    className="form-input"
                    value={editingProduct.category || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Ubah Jumlah Stok Fisik Gudang:</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      className="form-input"
                      style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-700)' }}
                      value={editingProduct.stock}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                      placeholder="0"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Satuan:</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingProduct.unit}
                      onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Harga Beli Supplier (Rp):</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    className="form-input"
                    value={editingProduct.buyPrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, buyPrice: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Otomatis Mark-up (+2.5%):</span>
                    <strong style={{ color: 'var(--primary-700)' }}>
                      +{formatRupiah(calculateSellPrice(editingProduct.buyPrice, 2.5, 100) - editingProduct.buyPrice)}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginTop: '4px' }}>
                    <span style={{ fontWeight: 700 }}>Harga Jual Baru:</span>
                    <strong style={{ color: 'var(--primary-600)', fontSize: '1.15rem' }}>
                      {formatRupiah(calculateSellPrice(editingProduct.buyPrice, 2.5, 100))}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ color: '#dc2626', borderColor: '#fecaca' }}
                  onClick={() => handleDeleteProduct(editingProduct)}
                >
                  <Trash2 size={16} />
                  <span>Hapus Barang</span>
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingProduct(null)}>
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <CheckCircle2 size={16} />
                    <span>Perbarui Stok & Harga</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
