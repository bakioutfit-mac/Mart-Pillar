import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Truck,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  MessageCircle,
  Building,
  CheckCircle2,
  CreditCard,
  Edit2,
  X,
  Send,
  Package,
  PackagePlus,
  ChevronRight,
  Phone,
  MapPin
} from 'lucide-react';

export const SupplierView = ({ onNavigateToInvoices }) => {
  const { 
    suppliers, 
    products, 
    createSupplierOrder, 
    addSupplier, 
    updateSupplier, 
    deleteSupplier 
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('order'); // 'order' | 'master'

  // ----------------------------------------------------------------
  // 1. STATE SUB-TAB 1: ORDER SUPPLIER
  // ----------------------------------------------------------------
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [orderCategory, setOrderCategory] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderCart, setOrderCart] = useState([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [successOrderNotice, setSuccessOrderNotice] = useState(null);
  const [isMobileOrderCartOpen, setIsMobileOrderCartOpen] = useState(false);

  // ----------------------------------------------------------------
  // 2. STATE SUB-TAB 2: MASTER DATA SUPPLIER
  // ----------------------------------------------------------------
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    category: '',
    phone: '',
    displayPhone: '',
    address: '',
    bankName: 'BCA',
    bankAccount: '',
    bankHolder: ''
  });

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId) || suppliers[0];

  const getCategoryMeta = (cat) => {
    const raw = String(cat || '').toLowerCase();
    if (raw.includes('sayur')) {
      return { label: cat || 'Sayuran', badgeClass: 'badge-success', bgSoft: '#f0fdf4' };
    }
    if (raw.includes('ayam') || raw.includes('daging') || raw.includes('unggas')) {
      return { label: cat || 'Ayam & Daging', badgeClass: 'badge-warning', bgSoft: '#fff7ed' };
    }
    if (raw.includes('cup') || raw.includes('kemas') || raw.includes('pack')) {
      return { label: cat || 'Kemasan Cup', badgeClass: 'badge-info', bgSoft: '#f0f9ff' };
    }
    if (raw.includes('bumbu') || raw.includes('rempah')) {
      return { label: cat || 'Bumbu Dapur', badgeClass: 'badge-warning', bgSoft: '#fffbeb' };
    }
    if (raw.includes('telur')) {
      return { label: cat || 'Telur', badgeClass: 'badge-warning', bgSoft: '#fffbeb' };
    }
    if (raw.includes('beras') || raw.includes('sembako') || raw.includes('tepung')) {
      return { label: cat || 'Sembako', badgeClass: 'badge-info', bgSoft: '#f0fdf4' };
    }
    return { label: cat || 'Bahan Baku', badgeClass: 'badge-info', bgSoft: '#fff7ed' };
  };

  // ----------------------------------------------------------------
  // LOGIKA ORDER SUPPLIER (POS STYLE - HANYA NAMA BARANG & QTY)
  // ----------------------------------------------------------------
  const filteredProducts = products.filter(p => {
    const matchCat = orderCategory === 'all' || p.category === orderCategory;
    const matchSearch = p.name.toLowerCase().includes(orderSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToOrderCart = (product) => {
    setOrderCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id ? { ...item, qty: (Number(item.qty) || 0) + 1 } : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          category: product.category,
          unit: product.unit,
          qty: 1
        }
      ];
    });
  };

  const updateOrderCartQty = (productId, delta) => {
    setOrderCart(prev => {
      return prev
        .map(item => {
          if (item.productId === productId) {
            const currentQty = Number(item.qty) || 0;
            const newQty = currentQty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const handleOrderCartQtyChange = (productId, val) => {
    setOrderCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          if (val === '') return { ...item, qty: '' };
          const parsed = parseFloat(val);
          return { ...item, qty: isNaN(parsed) ? '' : parsed };
        }
        return item;
      });
    });
  };

  const handleOrderCartQtyBlur = (productId, val) => {
    setOrderCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const num = parseFloat(val);
          return { ...item, qty: isNaN(num) || num <= 0 ? 1 : num };
        }
        return item;
      });
    });
  };

  const removeFromOrderCart = (productId) => {
    setOrderCart(prev => prev.filter(item => item.productId !== productId));
  };

  const totalOrderQtyCount = orderCart.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);

  // Submit Order Supplier: Kirim WhatsApp + Catat ke Nota & Pembayaran
  const handleSendOrderViaWA = (e) => {
    e.preventDefault();
    if (orderCart.length === 0) {
      alert('Pilih minimal 1 barang pada katalog untuk di-order ke supplier.');
      return;
    }
    if (!selectedSupplier) {
      alert('Pilih supplier terlebih dahulu.');
      return;
    }

    const sanitizedItems = orderCart.map(item => ({
      ...item,
      qty: Math.max(1, Number(item.qty) || 1)
    }));

    // 1. Simpan order supplier ke state dan otomatis masuk ke Nota & Pembayaran
    const createdSupplierOrder = createSupplierOrder({
      supplierId: selectedSupplier.id,
      items: sanitizedItems,
      notes: orderNotes
    });

    // 2. Susun format pesan WhatsApp rapi
    const todayDate = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    let waMessage = `*ORDER BAHAN BAKU - MART PILLAR*\n`;
    waMessage += `Kepada: *${selectedSupplier.name}*\n`;
    waMessage += `No. PO: *${createdSupplierOrder.orderNumber}*\n`;
    waMessage += `Waktu: ${todayDate} (${nowTime} WIB)\n\n`;
    waMessage += `*Daftar Pesanan:*\n`;
    sanitizedItems.forEach((item, index) => {
      waMessage += `${index + 1}. ${item.productName}: *${item.qty} ${item.unit}*\n`;
    });

    if (orderNotes) {
      waMessage += `\n*Catatan Pengiriman:*\n${orderNotes}\n`;
    }

    waMessage += `\n_Mohon dikonfirmasi ketersediaan barang dan jadwal pengiriman. Untuk harga nanti akan kami catat sesuai tagihan/invoice dari Bapak/Ibu. Terima kasih!_`;

    const cleanPhone = (selectedSupplier.phone || '').replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(waMessage)}`;

    // Buka WhatsApp di tab baru
    window.open(waUrl, '_blank');

    setSuccessOrderNotice(createdSupplierOrder);
    setOrderCart([]);
    setOrderNotes('');
    setIsMobileOrderCartOpen(false);
  };

  // ----------------------------------------------------------------
  // LOGIKA MASTER DATA SUPPLIER
  // ----------------------------------------------------------------
  const handleOpenAddSupplier = () => {
    setEditingSupplier(null);
    setSupplierFormData({
      name: '',
      category: '',
      phone: '',
      displayPhone: '',
      address: '',
      bankName: 'BCA',
      bankAccount: '',
      bankHolder: ''
    });
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (sup) => {
    setEditingSupplier(sup);
    setSupplierFormData({
      name: sup.name,
      category: sup.categoryLabel || sup.category || '',
      phone: sup.phone,
      displayPhone: sup.displayPhone || sup.phone,
      address: sup.address || '',
      bankName: sup.bankName || 'BCA',
      bankAccount: sup.bankAccount || '',
      bankHolder: sup.bankHolder || ''
    });
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = (e) => {
    e.preventDefault();
    if (!supplierFormData.name || !supplierFormData.phone) {
      alert('Nama Supplier dan Nomor WhatsApp wajib diisi.');
      return;
    }

    const catValue = (supplierFormData.category || '').trim() || 'Umum';

    const payload = {
      ...supplierFormData,
      category: catValue,
      categoryLabel: catValue,
      displayPhone: supplierFormData.phone
    };

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, payload);
    } else {
      addSupplier(payload);
    }

    setIsSupplierModalOpen(false);
  };

  const handleDeleteSupplier = (id, name) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data supplier "${name}"?`)) {
      deleteSupplier(id);
    }
  };

  return (
    <div className="content-body" style={{ paddingBottom: '90px' }}>
      {/* Header Halaman */}
      <div className="page-header">
        <div>
          <div className="page-title">Supplier Mart Pillar</div>
          <div className="page-desc">
            Manajemen rantai pasok: Order bahan baku via WhatsApp dan kelola Master Data Supplier.
          </div>
        </div>

        {/* 2 Sub-Tab Utama (Order Supplier & Master Data Supplier) */}
        <div style={{ display: 'flex', gap: '8px', background: '#f8fafc', border: '1.5px solid var(--border-medium)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          <button
            className={`btn btn-sm ${activeSubTab === 'order' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('order')}
          >
            <ShoppingCart size={15} />
            <span>1. Order Supplier</span>
          </button>
          <button
            className={`btn btn-sm ${activeSubTab === 'master' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('master')}
          >
            <Building size={15} />
            <span>2. Master Data Supplier</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SUB-TAB 1: ORDER SUPPLIER (POS STYLE - HANYA NAMA & QTY)       */}
      {/* ============================================================== */}
      {activeSubTab === 'order' && (
        <>
          {/* Success Notice Alert */}
          {successOrderNotice && (
            <div style={{
              background: '#fff7ed',
              border: '1.5px solid #fed7aa',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle2 size={26} color="var(--primary-600)" />
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--primary-700)', fontSize: '1rem' }}>
                    Order Berhasil Dikirim via WhatsApp & Tercatat di Nota & Pembayaran!
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    No. PO: <strong>{successOrderNotice.orderNumber}</strong> | Supplier: <strong>{successOrderNotice.supplierName}</strong> | Status: <span className="badge badge-warning">Belum Bayar</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Harga tagihan nanti diinput saat konfirmasi/penerimaan barang di tab <strong>Nota & Pembayaran</strong>.
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {onNavigateToInvoices && (
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={onNavigateToInvoices}
                  >
                    Buka Nota & Pembayaran
                  </button>
                )}
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSuccessOrderNotice(null)}
                >
                  Tutup
                </button>
              </div>
            </div>
          )}

          {/* Header Bar: Dropdown Pilih Supplier (Tanpa Input Markup!) */}
          <div className="card" style={{ background: '#fffaf5', border: '1.5px solid var(--primary-300)', padding: '16px 20px', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', alignItems: 'center' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-800)' }}>
                  <Truck size={16} color="var(--primary-600)" />
                  <span>Pilih Mitra Supplier Tujuan Order:</span>
                </label>
                <select
                  className="form-select"
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  style={{ fontWeight: 700, fontSize: '0.95rem', borderColor: 'var(--primary-300)' }}
                >
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} ({sup.categoryLabel || sup.category.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Info Singkat Supplier yang Dipilih */}
              {selectedSupplier && (
                <div style={{ background: '#ffffff', border: '1px solid var(--primary-200)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{selectedSupplier.name}</strong>
                    <span className="badge badge-warning" style={{ fontSize: '0.66rem' }}>
                      {selectedSupplier.categoryLabel || selectedSupplier.category}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span>📱 WA: <strong>{selectedSupplier.displayPhone || selectedSupplier.phone}</strong></span>
                    <span>🏦 Bank: <strong>{selectedSupplier.bankName} - {selectedSupplier.bankAccount}</strong> ({selectedSupplier.bankHolder})</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Filter & Search Bar untuk Pemilihan Komoditas */}
          <div className="card" style={{ marginBottom: '20px', padding: '14px 18px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Cari komoditas yang ingin di-order ke supplier..."
                  className="form-input"
                  style={{ paddingLeft: '40px', paddingRight: orderSearch ? '40px' : '14px' }}
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
                {orderSearch && (
                  <button
                    onClick={() => setOrderSearch('')}
                    style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="pos-category-tabs">
                <button
                  type="button"
                  className={`pos-cat-pill ${orderCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setOrderCategory('all')}
                >
                  <span>Semua Kategori</span>
                </button>
                <button
                  type="button"
                  className={`pos-cat-pill ${orderCategory === 'sayur' ? 'active' : ''}`}
                  onClick={() => setOrderCategory('sayur')}
                >
                  <span>Sayuran</span>
                </button>
                <button
                  type="button"
                  className={`pos-cat-pill ${orderCategory === 'ayam' ? 'active' : ''}`}
                  onClick={() => setOrderCategory('ayam')}
                >
                  <span>Ayam & Daging</span>
                </button>
                <button
                  type="button"
                  className={`pos-cat-pill ${orderCategory === 'cup' ? 'active' : ''}`}
                  onClick={() => setOrderCategory('cup')}
                >
                  <span>Kemasan</span>
                </button>
                <button
                  type="button"
                  className={`pos-cat-pill ${orderCategory === 'bumbu' ? 'active' : ''}`}
                  onClick={() => setOrderCategory('bumbu')}
                >
                  <span>Bumbu Dapur</span>
                </button>
              </div>
            </div>
          </div>

          {/* POS Layout: Kiri = Grid Komoditas (Tanpa Harga), Kanan = Keranjang Order WA */}
          <div className="pos-layout">
            {/* 1. Grid Produk */}
            <div>
              {filteredProducts.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-secondary)' }}>
                  <p style={{ fontSize: '1rem', fontWeight: 600 }}>Tidak ada produk yang sesuai pencarian.</p>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ marginTop: '10px' }}
                    onClick={() => { setOrderSearch(''); setOrderCategory('all'); }}
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                <div className="pos-grid">
                  {filteredProducts.map(product => {
                    const inCartItem = orderCart.find(i => i.productId === product.id);
                    const catMeta = getCategoryMeta(product.category);

                    return (
                      <div 
                        key={product.id} 
                        className={`pos-card ${inCartItem ? 'in-cart' : ''}`}
                      >
                        {inCartItem && inCartItem.qty > 0 && (
                          <div className="pos-card-badge-count" style={{ background: 'var(--primary-700)' }} title="Qty Order">
                            {inCartItem.qty}
                          </div>
                        )}

                        <div>
                          <div style={{
                            background: catMeta.bgSoft,
                            borderRadius: 'var(--radius-md)',
                            padding: '8px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '10px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600 }}>
                              <Package size={14} color="var(--primary-600)" />
                              <span>Bahan Baku</span>
                            </div>
                            <span className={`badge ${catMeta.badgeClass}`} style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                              {catMeta.label}
                            </span>
                          </div>

                          <div style={{
                            fontWeight: 800,
                            fontSize: '0.98rem',
                            color: 'var(--text-main)',
                            lineHeight: '1.3',
                            minHeight: '2.6em',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {product.name}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                              Satuan: {product.unit}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              Stok Gudang: {product.stock} {product.unit}
                            </span>
                          </div>
                        </div>

                        {/* Card Bottom: Tombol Pilih Order & Stepper (Tanpa Harga!) */}
                        <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed var(--border-subtle)' }}>
                          {inCartItem ? (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: '#fff',
                              border: '1.5px solid var(--primary-500)',
                              borderRadius: 'var(--radius-md)',
                              padding: '2px 4px'
                            }}>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); updateOrderCartQty(product.id, -1); }}
                                style={{
                                  background: 'var(--primary-50)',
                                  border: 'none',
                                  color: 'var(--primary-700)',
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                                title="Kurangi 1"
                              >
                                <Minus size={15} />
                              </button>

                              <div style={{ flex: 1, padding: '0 4px', textAlign: 'center' }}>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={inCartItem.qty}
                                  onChange={(e) => handleOrderCartQtyChange(product.id, e.target.value)}
                                  onBlur={(e) => handleOrderCartQtyBlur(product.id, e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    width: '100%',
                                    textAlign: 'center',
                                    fontWeight: 800,
                                    fontSize: '0.98rem',
                                    color: 'var(--primary-700)',
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent'
                                  }}
                                />
                              </div>

                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); updateOrderCartQty(product.id, 1); }}
                                style={{
                                  background: 'var(--primary-gradient)',
                                  border: 'none',
                                  color: 'white',
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                                title="Tambah 1"
                              >
                                <Plus size={15} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ width: '100%', padding: '9px 12px', fontSize: '0.86rem' }}
                              onClick={() => addToOrderCart(product)}
                            >
                              <Plus size={16} />
                              <span>+ Pilih Order</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Panel Ringkasan Keranjang Order Supplier (Tanpa Estimasi Harga) */}
            <div className="card" style={{ position: 'sticky', top: '80px', borderTop: '4px solid var(--primary-600)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                  <ShoppingCart size={20} color="var(--primary-600)" />
                  <span>Daftar Order ke Supplier</span>
                </div>
                <span className="badge badge-warning">{orderCart.length} Jenis</span>
              </div>

              {orderCart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 14px', color: 'var(--text-secondary)' }}>
                  <Truck size={46} style={{ opacity: 0.35, color: 'var(--primary-500)', marginBottom: '10px' }} />
                  <p style={{ fontSize: '0.94rem', fontWeight: 700 }}>Belum Ada Barang yang Dipilih</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Klik tombol <strong>+ Pilih Order</strong> pada kartu produk di samping untuk memasukkan pesanan bahan baku.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendOrderViaWA}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto', marginBottom: '16px', paddingRight: '4px' }}>
                    {orderCart.map(item => (
                      <div key={item.productId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#fafafa', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {item.productName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Satuan: {item.unit}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="text"
                              inputMode="numeric"
                              className="form-input"
                              style={{ width: '60px', padding: '4px 6px', textAlign: 'center', fontWeight: 800, fontSize: '0.88rem' }}
                              value={item.qty}
                              onChange={(e) => handleOrderCartQtyChange(item.productId, e.target.value)}
                              onBlur={(e) => handleOrderCartQtyBlur(item.productId, e.target.value)}
                            />
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                              {item.unit}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromOrderCart(item.productId)}
                            style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '2px' }}
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Catatan Pengiriman untuk Supplier:</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Contoh: Kirim besok subuh jam 04:30 langsung ke gudang..."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      style={{ minHeight: '65px' }}
                    />
                  </div>

                  <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Pesanan:</span>
                      <strong style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                        {totalOrderQtyCount} Item ({orderCart.length} Jenis)
                      </strong>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      *Harga & tagihan ditentukan oleh supplier, dan akan dicatat pada tab <strong>Nota & Pembayaran</strong>.
                    </div>
                  </div>

                  {/* Tombol Utama Kirim WA Masuk ke Tab Nota & Pembayaran */}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '14px', fontSize: '0.95rem', background: '#059669', borderColor: '#059669' }}
                  >
                    <MessageCircle size={18} />
                    <span>Kirim Order via WhatsApp & Catat ke Nota</span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Floating Cart Bar di HP */}
          {orderCart.length > 0 && (
            <div 
              className="pos-mobile-cart-bar"
              onClick={() => setIsMobileOrderCartOpen(true)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.25)', padding: '6px', borderRadius: '50%', display: 'flex' }}>
                  <ShoppingCart size={20} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.98rem' }}>
                    {totalOrderQtyCount} Item Dipesan ({orderCart.length} Jenis)
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                    Mitra: {selectedSupplier?.name}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', color: 'var(--primary-600)', padding: '6px 14px', borderRadius: 'var(--radius-full)', fontWeight: 800, fontSize: '0.85rem' }}>
                <span>Kirim WA</span>
                <ChevronRight size={16} />
              </div>
            </div>
          )}

          {/* Modal Checkout Order untuk HP */}
          {isMobileOrderCartOpen && (
            <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: '480px' }}>
                <div className="modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShoppingCart size={20} color="var(--primary-600)" />
                    <span className="modal-title">Rincian Order ({orderCart.length} Jenis)</span>
                  </div>
                  <button className="modal-close-btn" onClick={() => setIsMobileOrderCartOpen(false)}>
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSendOrderViaWA}>
                  <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                      {orderCart.map(item => (
                        <div key={item.productId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#fafafa', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                          <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                              {item.productName}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              Satuan: {item.unit}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="text"
                              inputMode="numeric"
                              className="form-input"
                              style={{ width: '55px', padding: '4px 6px', textAlign: 'center', fontWeight: 800 }}
                              value={item.qty}
                              onChange={(e) => handleOrderCartQtyChange(item.productId, e.target.value)}
                              onBlur={(e) => handleOrderCartQtyBlur(item.productId, e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => removeFromOrderCart(item.productId)}
                              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Catatan Pengiriman:</label>
                      <textarea
                        className="form-textarea"
                        placeholder="Contoh: Kirim jam 04:30 subuh..."
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        style={{ minHeight: '65px' }}
                      />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setIsMobileOrderCartOpen(false)}>
                      Lanjut Pilih
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ background: '#059669', borderColor: '#059669' }}>
                      <MessageCircle size={18} />
                      <span>Kirim WA & Simpan Nota</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 2: MASTER DATA SUPPLIER (TANPA TERMIN PEMBAYARAN)      */}
      {/* ============================================================== */}
      {activeSubTab === 'master' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>
                Daftar Master Data Supplier ({suppliers.length} Mitra)
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Informasi kontak WhatsApp dan data rekening bank untuk pembayaran tagihan.
              </div>
            </div>

            <button className="btn btn-primary" onClick={handleOpenAddSupplier}>
              <Plus size={16} />
              <span>Tambah Supplier Baru</span>
            </button>
          </div>

          {/* Grid Kartu Master Supplier */}
          <div className="grid-2">
            {suppliers.map(sup => {
              const catMeta = getCategoryMeta(sup.category);
              const cleanPhone = (sup.phone || '').replace(/[^0-9]/g, '');
              const waTarget = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

              return (
                <div key={sup.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    {/* Header Kartu Supplier */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: 'var(--primary-100)', color: 'var(--primary-700)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                          <Building size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.02rem', color: 'var(--text-main)' }}>
                            {sup.name}
                          </div>
                          <span className={`badge ${catMeta.badgeClass}`} style={{ fontSize: '0.68rem', marginTop: '2px' }}>
                            {sup.categoryLabel || sup.category}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEditSupplier(sup)}
                          title="Edit Supplier"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDeleteSupplier(sup.id, sup.name)}
                          style={{ color: '#dc2626' }}
                          title="Hapus Supplier"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Rincian Kontak & Alamat */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={15} color="var(--primary-600)" />
                        <span>No. WhatsApp: <strong>{sup.displayPhone || sup.phone}</strong></span>
                      </div>
                      {sup.address && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <MapPin size={15} color="var(--primary-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{sup.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Data Rekening Bank */}
                    <div style={{ background: '#fffaf5', border: '1px solid var(--primary-200)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '14px' }}>
                      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--primary-800)', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Rekening Pembayaran:
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {sup.bankName} - {sup.bankAccount || '-'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        a.n. {sup.bankHolder || '-'}
                      </div>
                    </div>
                  </div>

                  {/* Tombol Hubungi WhatsApp */}
                  <a
                    href={`https://wa.me/${waTarget}?text=${encodeURIComponent('Halo ' + sup.name + ', kami dari Mart Pillar ingin bertanya mengenai ketersediaan pasokan.')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ width: '100%', borderColor: '#10b981', color: '#047857', fontWeight: 800 }}
                  >
                    <MessageCircle size={16} color="#059669" />
                    <span>Chat WhatsApp Supplier</span>
                  </a>
                </div>
              );
            })}
          </div>

          {/* Modal Tambah / Edit Supplier */}
          {isSupplierModalOpen && (
            <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: '520px' }}>
                <div className="modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building size={20} color="var(--primary-600)" />
                    <span className="modal-title">
                      {editingSupplier ? 'Edit Data Supplier' : 'Tambah Mitra Supplier Baru'}
                    </span>
                  </div>
                  <button className="modal-close-btn" onClick={() => setIsSupplierModalOpen(false)}>
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveSupplier}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label className="form-label">Nama Supplier / Perusahaan:</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: CV Tani Makmur Lembang"
                        className="form-input"
                        value={supplierFormData.name}
                        onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                      />
                    </div>

                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Kategori Komoditas:</label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Sayuran Segar, Ayam Potong, Kemasan..."
                          className="form-input"
                          value={supplierFormData.category}
                          onChange={(e) => setSupplierFormData({ ...supplierFormData, category: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">No. WhatsApp / HP:</label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: 081234567890"
                          className="form-input"
                          value={supplierFormData.phone}
                          onChange={(e) => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Alamat / Lokasi Asal Pengiriman:</label>
                      <textarea
                        className="form-textarea"
                        placeholder="Contoh: Desa Cikole, Lembang, Bandung Barat..."
                        value={supplierFormData.address}
                        onChange={(e) => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
                        style={{ minHeight: '60px' }}
                      />
                    </div>

                    {/* Informasi Rekening Bank (Tanpa Termin Pembayaran) */}
                    <div style={{ background: '#fffaf5', border: '1px solid var(--primary-200)', borderRadius: 'var(--radius-md)', padding: '14px', marginTop: '10px' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--primary-800)', marginBottom: '10px' }}>
                        Informasi Rekening Bank untuk Pembayaran:
                      </div>

                      <div className="grid-3" style={{ marginBottom: '10px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Nama Bank:</label>
                          <input
                            type="text"
                            placeholder="BCA / Mandiri / BRI"
                            className="form-input"
                            value={supplierFormData.bankName}
                            onChange={(e) => setSupplierFormData({ ...supplierFormData, bankName: e.target.value })}
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
                          <label className="form-label">Nomor Rekening:</label>
                          <input
                            type="text"
                            placeholder="Contoh: 8830192831"
                            className="form-input"
                            value={supplierFormData.bankAccount}
                            onChange={(e) => setSupplierFormData({ ...supplierFormData, bankAccount: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Atas Nama Rekening:</label>
                        <input
                          type="text"
                          placeholder="Nama pemilik rekening"
                          className="form-input"
                          value={supplierFormData.bankHolder}
                          onChange={(e) => setSupplierFormData({ ...supplierFormData, bankHolder: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setIsSupplierModalOpen(false)}>
                      Batal
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <CheckCircle2 size={16} />
                      <span>{editingSupplier ? 'Simpan Perubahan' : 'Tambah Supplier'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
