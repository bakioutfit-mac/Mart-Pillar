import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Package,
  PackageMinus,
  PackagePlus,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  FileCheck2,
  Calculator,
  CheckCircle2,
  X,
  Store,
  Truck,
  Percent,
  ChevronRight,
  Receipt,
  Clock
} from 'lucide-react';

export const TransactionView = ({ onOrderCreated }) => {
  const { 
    currentUser, 
    outlets, 
    suppliers, 
    products, 
    orders,
    createOrderFromPO, 
    addInbound, 
    calculateSellPrice 
  } = useApp();

  const isOutlet = currentUser.role === 'outlet';
  const [activeTxTab, setActiveTxTab] = useState('outbound'); // 'outbound' (Barang Keluar) | 'inbound' (Barang Masuk)
  const [outletSubTab, setOutletSubTab] = useState('order'); // 'order' | 'history'
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);

  // ----------------------------------------------------------------
  // 1. STATE BARANG KELUAR (Permintaan Outlet)
  // ----------------------------------------------------------------
  const [selectedOutletId, setSelectedOutletId] = useState(
    currentUser.outletId || (outlets.length > 0 ? outlets[0].id : '')
  );
  const [outboundCategory, setOutboundCategory] = useState('all');
  const [outboundSearch, setOutboundSearch] = useState('');
  const [outboundCart, setOutboundCart] = useState([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);
  const [isMobileOutboundOpen, setIsMobileOutboundOpen] = useState(false);

  // ----------------------------------------------------------------
  // 2. STATE BARANG MASUK (Penerimaan Supplier - POS / Shopee Style)
  // ----------------------------------------------------------------
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || 'SUP-01');
  const [markupPercent, setMarkupPercent] = useState('2.5'); // Input Mark-up manual sesuai bisnis
  const [invoiceSupplier, setInvoiceSupplier] = useState('');
  const [inboundCategory, setInboundCategory] = useState('all');
  const [inboundSearch, setInboundSearch] = useState('');
  const [inboundCart, setInboundCart] = useState([]);
  const [successInbound, setSuccessInbound] = useState(null);
  const [isMobileInboundOpen, setIsMobileInboundOpen] = useState(false);

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  // Outlet Order History calculation
  const currentOutlet = outlets.find(o => o.id === selectedOutletId) || outlets[0];
  const myOrders = (orders || []).filter(o => 
    o.outletId === selectedOutletId || 
    (currentOutlet && o.outletName === currentOutlet.name)
  );

  // Helper kategori styling kartu POS
  const getCategoryMeta = (cat) => {
    const raw = String(cat || '').toLowerCase();
    if (raw.includes('sayur')) {
      return { label: 'Sayuran', badgeClass: 'badge-success', bgSoft: '#f0fdf4' };
    }
    if (raw.includes('ayam') || raw.includes('daging')) {
      return { label: 'Ayam & Daging', badgeClass: 'badge-warning', bgSoft: '#fff7ed' };
    }
    if (raw.includes('cup') || raw.includes('kemas')) {
      return { label: 'Kemasan Cup', badgeClass: 'badge-info', bgSoft: '#f0f9ff' };
    }
    if (raw.includes('bumbu') || raw.includes('rempah')) {
      return { label: 'Bumbu Dapur', badgeClass: 'badge-warning', bgSoft: '#fffbeb' };
    }
    return { label: cat || 'Bahan Baku', badgeClass: 'badge-info', bgSoft: '#fff7ed' };
  };

  // ----------------------------------------------------------------
  // LOGIKA BARANG KELUAR (OUTBOUND)
  // ----------------------------------------------------------------
  const filteredOutboundProducts = products.filter(p => {
    const matchCat = outboundCategory === 'all' || p.category === outboundCategory;
    const matchSearch = p.name.toLowerCase().includes(outboundSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToOutboundCart = (product) => {
    setOutboundCart(prev => {
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
          unit: product.unit,
          price: product.sellPrice,
          buyPrice: product.buyPrice,
          qty: 1
        }
      ];
    });
  };

  const updateOutboundQty = (productId, delta) => {
    setOutboundCart(prev => {
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

  const handleOutboundQtyChange = (productId, val) => {
    setOutboundCart(prev => {
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

  const handleOutboundQtyBlur = (productId, val) => {
    setOutboundCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const num = parseFloat(val);
          return { ...item, qty: isNaN(num) || num <= 0 ? 1 : num };
        }
        return item;
      });
    });
  };

  const removeFromOutboundCart = (productId) => {
    setOutboundCart(prev => prev.filter(item => item.productId !== productId));
  };

  const totalOutboundQty = outboundCart.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);
  const totalOutboundAmount = outboundCart.reduce((acc, curr) => acc + curr.price * (Number(curr.qty) || 0), 0);

  const handleSubmitOutbound = (e) => {
    e.preventDefault();
    if (outboundCart.length === 0) {
      alert('Keranjang barang keluar masih kosong. Pilih barang terlebih dahulu.');
      return;
    }

    const sanitizedCart = outboundCart.map(item => ({
      ...item,
      qty: Math.max(1, Number(item.qty) || 1)
    }));

    const createdOrder = createOrderFromPO({
      outletId: selectedOutletId,
      items: sanitizedCart,
      notes: orderNotes,
      shift: 'Distribusi Pagi'
    });

    setSuccessOrder(createdOrder);
    setOutboundCart([]);
    setOrderNotes('');
    setIsMobileOutboundOpen(false);

    if (onOrderCreated) {
      onOrderCreated(createdOrder);
    }
  };

  // ----------------------------------------------------------------
  // LOGIKA BARANG MASUK (INBOUND SUPPLIER) - POS / SHOPEE STYLE
  // ----------------------------------------------------------------
  const currentMarkupNum = parseFloat(markupPercent) || 2.5;

  const filteredInboundProducts = products.filter(p => {
    const matchCat = inboundCategory === 'all' || p.category === inboundCategory;
    const matchSearch = p.name.toLowerCase().includes(inboundSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToInboundCart = (product) => {
    setInboundCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id ? { ...item, qty: (Number(item.qty) || 0) + 5 } : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          category: product.category,
          unit: product.unit,
          buyPrice: product.buyPrice, // default buy price, user can freely edit
          qty: 10
        }
      ];
    });
  };

  const updateInboundCartQty = (productId, delta) => {
    setInboundCart(prev => {
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

  const handleInboundCartQtyChange = (productId, val) => {
    setInboundCart(prev => {
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

  const handleInboundCartQtyBlur = (productId, val) => {
    setInboundCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const num = parseFloat(val);
          return { ...item, qty: isNaN(num) || num <= 0 ? 1 : num };
        }
        return item;
      });
    });
  };

  const handleInboundCartPriceChange = (productId, val) => {
    setInboundCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          return { ...item, buyPrice: val }; // allow empty string on backspace
        }
        return item;
      });
    });
  };

  const handleInboundCartPriceBlur = (productId, val) => {
    setInboundCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const num = parseFloat(val);
          return { ...item, buyPrice: isNaN(num) || num < 0 ? 0 : num };
        }
        return item;
      });
    });
  };

  const removeFromInboundCart = (productId) => {
    setInboundCart(prev => prev.filter(item => item.productId !== productId));
  };

  const totalInboundItemsCount = inboundCart.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);
  const totalInboundBuyAmount = inboundCart.reduce((acc, curr) => {
    const bp = parseFloat(curr.buyPrice) || 0;
    const qt = parseFloat(curr.qty) || 0;
    return acc + (bp * qt);
  }, 0);

  const handleSubmitInbound = (e) => {
    e.preventDefault();
    if (inboundCart.length === 0) {
      alert('Pilih minimal 1 barang masuk dari supplier pada katalog di samping.');
      return;
    }

    const sanitizedItems = inboundCart.map(item => ({
      ...item,
      buyPrice: Math.max(0, parseFloat(item.buyPrice) || 0),
      qty: Math.max(0.1, parseFloat(item.qty) || 1)
    }));

    const newInbound = addInbound({
      supplierId,
      invoiceSupplier,
      items: sanitizedItems,
      receivedBy: currentUser.name,
      markupPercent: currentMarkupNum
    });

    setSuccessInbound(newInbound);
    setInvoiceSupplier('');
    setInboundCart([]);
    setIsMobileInboundOpen(false);
  };

  return (
    <div className="content-body" style={{ paddingBottom: '90px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="page-title">
            {isOutlet ? (outletSubTab === 'history' ? 'Riwayat Order Cabang' : 'Pemesanan Bahan Baku (PO)') : 'Transaksi Mart Pillar'}
          </div>
          <div className="page-desc">
            {isOutlet 
              ? (outletSubTab === 'history' ? `Daftar seluruh riwayat order bahan baku untuk ${currentOutlet?.name || 'Cabang'}.` : 'Menu pemesanan bahan baku untuk jadwal pengiriman Distribusi Pagi.')
              : 'Pusat Mutasi Stok: Barang Masuk dari Supplier (Stok +) dan Barang Keluar untuk Permintaan Outlet (Stok -).'}
          </div>
        </div>

        {/* Tab Switcher untuk Outlet: Order PO vs Riwayat Order */}
        {isOutlet && (
          <div style={{ display: 'flex', gap: '6px', background: '#f8fafc', border: '1.5px solid var(--border-medium)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            <button
              className={`btn btn-sm ${outletSubTab === 'order' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setOutletSubTab('order')}
            >
              <ShoppingCart size={15} />
              <span>1. Order Bahan Baku</span>
            </button>
            <button
              className={`btn btn-sm ${outletSubTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setOutletSubTab('history')}
            >
              <Receipt size={15} />
              <span>2. Riwayat Order Cabang ({myOrders.length})</span>
            </button>
          </div>
        )}

        {/* Tab Switcher: Barang Keluar vs Barang Masuk (Hidden for outlet) */}
        {!isOutlet && (
          <div style={{ display: 'flex', gap: '6px', background: '#f8fafc', border: '1.5px solid var(--border-medium)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            <button
              className={`btn btn-sm ${activeTxTab === 'outbound' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTxTab('outbound')}
            >
              <PackageMinus size={15} />
              <span>Barang Keluar (Outlet)</span>
            </button>
            <button
              className={`btn btn-sm ${activeTxTab === 'inbound' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTxTab('inbound')}
            >
              <PackagePlus size={15} />
              <span>Barang Masuk (Supplier)</span>
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 0. SUB-TAB RIWAYAT ORDER KHUSUS OUTLET                         */}
      {/* ============================================================== */}
      {isOutlet && outletSubTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Summary Stat Outlet */}
          <div className="grid-3">
            <div className="stat-card">
              <div className="stat-content">
                <span className="stat-label">Total Pesanan Cabang</span>
                <span className="stat-value">{myOrders.length} Order</span>
                <span className="stat-sub">{currentOutlet?.name}</span>
              </div>
              <div className="stat-icon">
                <Receipt size={22} color="var(--primary-600)" />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-content">
                <span className="stat-label">Total Belanja Dipesan</span>
                <span className="stat-value">{formatRupiah(myOrders.reduce((a, c) => a + (c.totalAmount || 0), 0))}</span>
                <span className="stat-sub">Distribusi Pagi</span>
              </div>
              <div className="stat-icon">
                <ShoppingCart size={22} color="var(--primary-600)" />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-content">
                <span className="stat-label">Tagihan Belum Lunas</span>
                <span className="stat-value" style={{ color: '#ea580c' }}>
                  {formatRupiah(myOrders.filter(o => !o.paymentStatus.includes('Lunas')).reduce((a, c) => a + (c.totalAmount || 0), 0))}
                </span>
                <span className="stat-sub">
                  {myOrders.filter(o => !o.paymentStatus.includes('Lunas')).length} Nota Menunggu Pelunasan
                </span>
              </div>
              <div className="stat-icon">
                <Clock size={22} color="#ea580c" />
              </div>
            </div>
          </div>

          {/* Table Riwayat Order */}
          <div className="card">
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>No. Nota / Ref PO</th>
                    <th>Waktu & Tanggal</th>
                    <th>Jumlah Barang</th>
                    <th>Total Tagihan</th>
                    <th>Status Pembayaran</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {myOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                        Belum ada riwayat pesanan untuk cabang ini.
                      </td>
                    </tr>
                  ) : (
                    myOrders.map(ord => {
                      const isPaid = ord.paymentStatus.includes('Lunas');
                      const totalQty = ord.items ? ord.items.reduce((a, c) => a + (Number(c.qty) || 0), 0) : ord.totalQty || 0;

                      return (
                        <tr key={ord.id}>
                          <td>
                            <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{ord.invoiceNumber}</div>
                            {ord.poNumber && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ref: {ord.poNumber}</div>
                            )}
                          </td>
                          <td>
                            <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>{ord.date}</div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Pukul {ord.time || '-'} ({ord.shift || 'Pagi'})</div>
                          </td>
                          <td>
                            <span className="badge badge-info">{totalQty} Item</span>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {ord.items?.length || 0} Jenis Produk
                            </div>
                          </td>
                          <td>
                            <strong style={{ color: 'var(--primary-700)', fontSize: '1rem' }}>
                              {formatRupiah(ord.totalAmount)}
                            </strong>
                          </td>
                          <td>
                            <span className={`badge ${isPaid ? 'badge-success' : 'badge-danger'}`} style={{ fontWeight: 800 }}>
                              {isPaid ? 'Lunas' : 'Belum Bayar'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setSelectedOrderDetail(ord)}
                              title="Lihat rincian item pesanan"
                            >
                              <span>Detail Item</span>
                            </button>
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
      {/* 1. TAB BARANG KELUAR (PERMINTAAN OUTLET / POS STYLE)           */}
      {/* ============================================================== */}
      {activeTxTab === 'outbound' && (!isOutlet || outletSubTab === 'order') && (
        <>
          {/* Success Notification Alert */}
          {successOrder && (
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
                <CheckCircle2 size={24} color="var(--primary-600)" />
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--primary-700)', fontSize: '0.98rem' }}>
                    Nota Berhasil Diterbitkan! ({successOrder.invoiceNumber})
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Total: {formatRupiah(successOrder.totalAmount)} | Tujuan: {successOrder.outletName} | Stok otomatis berkurang.
                  </div>
                </div>
              </div>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setSuccessOrder(null)}
              >
                Tutup
              </button>
            </div>
          )}

          {/* Supervisor / Owner: Outlet Destination Selector */}
          {!isOutlet && (
            <div className="card" style={{ marginBottom: '16px', padding: '14px 18px', background: '#fffaf5', border: '1.5px solid var(--primary-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-700)', fontWeight: 700, fontSize: '0.88rem' }}>
                  <Store size={18} />
                  <span>Pilih Outlet Tujuan Permintaan:</span>
                </div>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <select
                    className="form-select"
                    value={selectedOutletId}
                    onChange={(e) => setSelectedOutletId(e.target.value)}
                    style={{ fontWeight: 600 }}
                  >
                    {outlets.map(out => (
                      <option key={out.id} value={out.id}>
                        {out.name} ({out.code}) - {out.address}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Search Bar & Category Filter Pills */}
          <div className="card" style={{ marginBottom: '20px', padding: '14px 18px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Cari bahan baku (kangkung, ayam, kemasan, bumbu)..."
                  className="form-input"
                  style={{ paddingLeft: '40px', paddingRight: outboundSearch ? '40px' : '14px' }}
                  value={outboundSearch}
                  onChange={(e) => setOutboundSearch(e.target.value)}
                />
                {outboundSearch && (
                  <button
                    onClick={() => setOutboundSearch('')}
                    style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="pos-category-tabs">
                <button
                  type="button"
                  className={`pos-cat-pill ${outboundCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setOutboundCategory('all')}
                >
                  <span>Semua Kategori</span>
                </button>
                <button
                  type="button"
                  className={`pos-cat-pill ${outboundCategory === 'sayur' ? 'active' : ''}`}
                  onClick={() => setOutboundCategory('sayur')}
                >
                  <span>Sayuran</span>
                </button>
                <button
                  type="button"
                  className={`pos-cat-pill ${outboundCategory === 'ayam' ? 'active' : ''}`}
                  onClick={() => setOutboundCategory('ayam')}
                >
                  <span>Ayam & Daging</span>
                </button>
                <button
                  type="button"
                  className={`pos-cat-pill ${outboundCategory === 'cup' ? 'active' : ''}`}
                  onClick={() => setOutboundCategory('cup')}
                >
                  <span>Kemasan</span>
                </button>
                <button
                  type="button"
                  className={`pos-cat-pill ${outboundCategory === 'bumbu' ? 'active' : ''}`}
                  onClick={() => setOutboundCategory('bumbu')}
                >
                  <span>Bumbu Dapur</span>
                </button>
              </div>
            </div>
          </div>

          {/* POS Layout: Left = Product Grid, Right = Sticky Cart Drawer */}
          <div className="pos-layout">
            <div>
              {filteredOutboundProducts.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-secondary)' }}>
                  <p style={{ fontSize: '1rem', fontWeight: 600 }}>Tidak ada produk yang sesuai pencarian.</p>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ marginTop: '10px' }}
                    onClick={() => { setOutboundSearch(''); setOutboundCategory('all'); }}
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                <div className="pos-grid">
                  {filteredOutboundProducts.map(product => {
                    const inCartItem = outboundCart.find(i => i.productId === product.id);
                    const catMeta = getCategoryMeta(product.category);

                    return (
                      <div 
                        key={product.id} 
                        className={`pos-card ${inCartItem ? 'in-cart' : ''}`}
                      >
                        {inCartItem && inCartItem.qty > 0 && (
                          <div className="pos-card-badge-count" title="Jumlah di keranjang">
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
                              Per 1 {product.unit}
                            </span>
                            {!isOutlet && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                Stok: {product.stock} {product.unit}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed var(--border-subtle)' }}>
                          <div style={{ marginBottom: '10px' }}>
                            <div style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--primary-600)', letterSpacing: '-0.01em' }}>
                              {formatRupiah(product.sellPrice)}
                            </div>
                          </div>

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
                                onClick={(e) => { e.stopPropagation(); updateOutboundQty(product.id, -1); }}
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
                                title="Kurangi"
                              >
                                <Minus size={15} />
                              </button>

                              <div style={{ flex: 1, padding: '0 4px', textAlign: 'center' }}>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={inCartItem.qty}
                                  onChange={(e) => handleOutboundQtyChange(product.id, e.target.value)}
                                  onBlur={(e) => handleOutboundQtyBlur(product.id, e.target.value)}
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
                                onClick={(e) => { e.stopPropagation(); updateOutboundQty(product.id, 1); }}
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
                                title="Tambah"
                              >
                                <Plus size={15} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ width: '100%', padding: '9px 12px', fontSize: '0.86rem' }}
                              onClick={() => addToOutboundCart(product)}
                            >
                              <Plus size={16} />
                              <span>+ Tambah</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Outbound Cart Drawer / Checkout Panel */}
            <div className="card" style={{ position: 'sticky', top: '80px', borderTop: '4px solid var(--primary-600)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                  <ShoppingCart size={20} color="var(--primary-600)" />
                  <span>Daftar Pesanan Nota</span>
                </div>
                <span className="badge badge-warning">{outboundCart.length} Jenis</span>
              </div>

              {outboundCart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 14px', color: 'var(--text-secondary)' }}>
                  <PackageMinus size={46} style={{ opacity: 0.35, color: 'var(--primary-500)', marginBottom: '10px' }} />
                  <p style={{ fontSize: '0.94rem', fontWeight: 700 }}>Keranjang Masih Kosong</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Klik tombol <strong>+ Tambah</strong> pada kotak produk di samping untuk memasukkan pesanan.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitOutbound}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto', marginBottom: '16px', paddingRight: '4px' }}>
                    {outboundCart.map(item => (
                      <div key={item.productId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#fafafa', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.productName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {item.qty} {item.unit} x {formatRupiah(item.price)}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--primary-700)' }}>
                            {formatRupiah(item.price * (Number(item.qty) || 0))}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFromOutboundCart(item.productId)}
                            style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                            title="Hapus item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Catatan Pengiriman Pagi:</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Contoh: Kirim sebelum jam 07:00 pagi..."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      style={{ minHeight: '65px' }}
                    />
                  </div>

                  <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Nilai Pesanan:</span>
                      <strong style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-600)' }}>
                        {formatRupiah(totalOutboundAmount)}
                      </strong>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      *{totalOutboundQty} Total barang akan otomatis dipotong dari stok gudang.
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
                  >
                    <FileCheck2 size={18} />
                    <span>Keluarkan Barang & Cetak Nota</span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Floating Cart Bar di HP */}
          {outboundCart.length > 0 && (
            <div 
              className="pos-mobile-cart-bar"
              onClick={() => setIsMobileOutboundOpen(true)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.25)', padding: '6px', borderRadius: '50%', display: 'flex' }}>
                  <ShoppingCart size={20} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.98rem' }}>
                    {totalOutboundQty} Item ({outboundCart.length} Jenis)
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                    Total: {formatRupiah(totalOutboundAmount)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', color: 'var(--primary-600)', padding: '6px 14px', borderRadius: 'var(--radius-full)', fontWeight: 800, fontSize: '0.85rem' }}>
                <span>Lihat Pesanan</span>
                <ChevronRight size={16} />
              </div>
            </div>
          )}

          {/* Modal Checkout untuk HP */}
          {isMobileOutboundOpen && (
            <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: '480px' }}>
                <div className="modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShoppingCart size={20} color="var(--primary-600)" />
                    <span className="modal-title">Rincian Pesanan ({outboundCart.length} Jenis)</span>
                  </div>
                  <button className="modal-close-btn" onClick={() => setIsMobileOutboundOpen(false)}>
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmitOutbound}>
                  <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                      {outboundCart.map(item => (
                        <div key={item.productId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#fafafa', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                              {item.productName}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              {item.qty} {item.unit} x {formatRupiah(item.price)}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--primary-700)' }}>
                              {formatRupiah(item.price * (Number(item.qty) || 0))}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFromOutboundCart(item.productId)}
                              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Catatan Pengiriman Pagi:</label>
                      <textarea
                        className="form-textarea"
                        placeholder="Contoh: Kirim jam 06:30 pagi..."
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        style={{ minHeight: '65px' }}
                      />
                    </div>

                    <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Pembayaran:</span>
                        <strong style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-600)' }}>
                          {formatRupiah(totalOutboundAmount)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setIsMobileOutboundOpen(false)}>
                      Lanjut Belanja
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <FileCheck2 size={18} />
                      <span>Keluarkan & Terbitkan Nota</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* ============================================================== */}
      {/* 2. TAB BARANG MASUK (DARI SUPPLIER) - POS / SHOPEE STYLE       */}
      {/* Pilih Supplier berdampingan langsung dengan Input Mark-up (%)   */}
      {/* ============================================================== */}
      {activeTxTab === 'inbound' && !isOutlet && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Success Inbound Alert */}
          {successInbound && (
            <div style={{
              background: '#fff7ed',
              border: '1.5px solid #fed7aa',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle2 size={24} color="var(--primary-600)" />
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--primary-700)', fontSize: '0.98rem' }}>
                    Penerimaan Barang Supplier Berhasil Disimpan!
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Supplier: {successInbound.supplierName} | Mark-up Diterapkan: <strong>+{successInbound.markupPercent}%</strong> | Total Pembelian: {formatRupiah(successInbound.totalBuy)}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Stok fisik dan harga jual komoditas di Katalog telah otomatis ter-update.
                  </div>
                </div>
              </div>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setSuccessInbound(null)}
              >
                Tutup
              </button>
            </div>
          )}

          {/* BAR PENGATURAN SUPPLIER & MARK-UP (BERDAMPINGAN SESUAI PERMINTAAN USER) */}
          <div className="card" style={{ background: '#fffaf5', border: '1.5px solid var(--primary-300)', padding: '16px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'end' }}>
              {/* Field 1: Dropdown Pilih Supplier */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-800)' }}>
                  <Truck size={16} color="var(--primary-600)" />
                  <span>Pilih Supplier Pengirim:</span>
                </label>
                <select
                  className="form-select"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  style={{ fontWeight: 700, borderColor: 'var(--primary-300)' }}
                >
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} ({sup.category.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 2: Input Manual Mark-up (%) TEPAT DI SAMPING PILIH SUPPLIER */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-800)' }}>
                  <Percent size={16} color="var(--primary-600)" />
                  <span>Mark-up Keuntungan (%):</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Contoh: 2.5 atau 3"
                    className="form-input"
                    value={markupPercent}
                    onChange={(e) => setMarkupPercent(e.target.value)}
                    style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary-700)', paddingRight: '40px', borderColor: 'var(--primary-300)' }}
                  />
                  <span style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontWeight: 800,
                    color: 'var(--primary-600)',
                    fontSize: '0.95rem'
                  }}>
                    %
                  </span>
                </div>
              </div>

              {/* Field 3: No. Faktur Supplier */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <Receipt size={16} />
                  <span>No. Faktur Supplier:</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: INV-SUP-2026/10/891"
                  className="form-input"
                  value={invoiceSupplier}
                  onChange={(e) => setInvoiceSupplier(e.target.value)}
                />
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="badge badge-warning" style={{ fontSize: '0.66rem' }}>FORMULA LIVE</span>
              <span>Harga jual ke outlet otomatis dihitung: <strong>Harga Beli + {currentMarkupNum}%</strong> (pembulatan ke atas terdekat).</span>
            </div>
          </div>

          {/* Search Bar & Category Filter Pills untuk Barang Masuk (Shopee / POS Style) */}
          <div className="card" style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Cari barang yang masuk dari supplier..."
                  className="form-input"
                  style={{ paddingLeft: '40px', paddingRight: inboundSearch ? '40px' : '14px' }}
                  value={inboundSearch}
                  onChange={(e) => setInboundSearch(e.target.value)}
                />
                {inboundSearch && (
                  <button
                    onClick={() => setInboundSearch('')}
                    style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="pos-category-tabs">
                <button
                  type="button"
                  className={`pos-cat-pill ${inboundCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setInboundCategory('all')}
                >
                  <span>Semua Kategori</span>
                </button>
                <button
                  type="button"
                  className={`pos-cat-pill ${inboundCategory === 'sayur' ? 'active' : ''}`}
                  onClick={() => setInboundCategory('sayur')}
                >
                  <span>Sayuran</span>
                </button>
                <button
                  type="button"
                  className={`pos-cat-pill ${inboundCategory === 'ayam' ? 'active' : ''}`}
                  onClick={() => setInboundCategory('ayam')}
                >
                  <span>Ayam & Daging</span>
                </button>
                <button
                  type="button"
                  className={`pos-cat-pill ${inboundCategory === 'cup' ? 'active' : ''}`}
                  onClick={() => setInboundCategory('cup')}
                >
                  <span>Kemasan</span>
                </button>
                <button
                  type="button"
                  className={`pos-cat-pill ${inboundCategory === 'bumbu' ? 'active' : ''}`}
                  onClick={() => setInboundCategory('bumbu')}
                >
                  <span>Bumbu Dapur</span>
                </button>
              </div>
            </div>
          </div>

          {/* POS Layout Barang Masuk: Left = Product Grid, Right = Inbound Cart Drawer */}
          <div className="pos-layout">
            {/* 1. Left: Product Grid untuk Terima Barang Masuk */}
            <div>
              {filteredInboundProducts.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-secondary)' }}>
                  <p style={{ fontSize: '1rem', fontWeight: 600 }}>Tidak ada produk yang sesuai pencarian.</p>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ marginTop: '10px' }}
                    onClick={() => { setInboundSearch(''); setInboundCategory('all'); }}
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                <div className="pos-grid">
                  {filteredInboundProducts.map(product => {
                    const inCartItem = inboundCart.find(i => i.productId === product.id);
                    const catMeta = getCategoryMeta(product.category);
                    const effectiveBuyPrice = inCartItem ? (parseFloat(inCartItem.buyPrice) || 0) : product.buyPrice;
                    const calculatedNewSell = calculateSellPrice(effectiveBuyPrice, currentMarkupNum, 100);

                    return (
                      <div 
                        key={product.id} 
                        className={`pos-card ${inCartItem ? 'in-cart' : ''}`}
                      >
                        {inCartItem && inCartItem.qty > 0 && (
                          <div className="pos-card-badge-count" style={{ background: 'var(--primary-700)' }} title="Qty Masuk">
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

                        {/* Card Bottom: Harga Beli & Live Estimasi Jual Baru */}
                        <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed var(--border-subtle)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Harga Beli Saat Ini:</span>
                            <strong style={{ fontSize: '0.94rem', color: 'var(--text-main)' }}>
                              {formatRupiah(product.buyPrice)}
                            </strong>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px', background: '#fff7ed', padding: '4px 8px', borderRadius: '4px' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--primary-800)', fontWeight: 700 }}>
                              Jual Baru (+{currentMarkupNum}%):
                            </span>
                            <strong style={{ fontSize: '1.02rem', color: 'var(--primary-600)', fontWeight: 800 }}>
                              {formatRupiah(calculatedNewSell)}
                            </strong>
                          </div>

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
                                onClick={(e) => { e.stopPropagation(); updateInboundCartQty(product.id, -5); }}
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
                                title="Kurangi 5"
                              >
                                <Minus size={15} />
                              </button>

                              <div style={{ flex: 1, padding: '0 4px', textAlign: 'center' }}>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={inCartItem.qty}
                                  onChange={(e) => handleInboundCartQtyChange(product.id, e.target.value)}
                                  onBlur={(e) => handleInboundCartQtyBlur(product.id, e.target.value)}
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
                                onClick={(e) => { e.stopPropagation(); updateInboundCartQty(product.id, 5); }}
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
                                title="Tambah 5"
                              >
                                <Plus size={15} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ width: '100%', padding: '9px 12px', fontSize: '0.86rem' }}
                              onClick={() => addToInboundCart(product)}
                            >
                              <PackagePlus size={16} />
                              <span>+ Terima Barang</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Right: Inbound Drawer / Rincian Penerimaan Supplier */}
            <div className="card" style={{ position: 'sticky', top: '80px', borderTop: '4px solid var(--primary-600)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                  <PackagePlus size={20} color="var(--primary-600)" />
                  <span>Daftar Barang Masuk</span>
                </div>
                <span className="badge badge-warning">{inboundCart.length} Jenis</span>
              </div>

              {inboundCart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 14px', color: 'var(--text-secondary)' }}>
                  <Truck size={46} style={{ opacity: 0.35, color: 'var(--primary-500)', marginBottom: '10px' }} />
                  <p style={{ fontSize: '0.94rem', fontWeight: 700 }}>Belum Ada Barang yang Dipilih</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Klik tombol <strong>+ Terima Barang</strong> pada kartu produk di samping untuk mencatat stok yang datang.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitInbound}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto', marginBottom: '16px', paddingRight: '4px' }}>
                    {inboundCart.map(item => {
                      const numBuy = parseFloat(item.buyPrice) || 0;
                      const numQty = parseFloat(item.qty) || 0;
                      const sellPricePreview = calculateSellPrice(numBuy, currentMarkupNum, 100);

                      return (
                        <div key={item.productId} style={{ padding: '12px', background: '#fafafa', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div>
                              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                {item.productName}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                                Satuan: {item.unit}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFromInboundCart(item.productId)}
                              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '2px' }}
                              title="Hapus baris"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                            <div>
                              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                Qty Masuk:
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                className="form-input"
                                style={{ padding: '6px 8px', fontSize: '0.88rem', fontWeight: 700 }}
                                value={item.qty}
                                onChange={(e) => handleInboundCartQtyChange(item.productId, e.target.value)}
                                onBlur={(e) => handleInboundCartQtyBlur(item.productId, e.target.value)}
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                Harga Beli (Rp):
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                className="form-input"
                                style={{ padding: '6px 8px', fontSize: '0.88rem', fontWeight: 700 }}
                                value={item.buyPrice}
                                onChange={(e) => handleInboundCartPriceChange(item.productId, e.target.value)}
                                onBlur={(e) => handleInboundCartPriceBlur(item.productId, e.target.value)}
                                placeholder="0"
                              />
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', paddingTop: '6px', borderTop: '1px dashed var(--border-subtle)' }}>
                            <span style={{ color: 'var(--primary-700)', fontWeight: 600 }}>
                              Jual Baru (+{currentMarkupNum}%): <strong>{formatRupiah(sellPricePreview)}</strong>
                            </span>
                            <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                              Subtotal: {formatRupiah(numBuy * numQty)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Pembelian Supplier:</span>
                      <strong style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                        {formatRupiah(totalInboundBuyAmount)}
                      </strong>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      *{totalInboundItemsCount} total qty masuk akan otomatis menambah stok di Katalog & Stok.
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
                  >
                    <PackagePlus size={18} />
                    <span>Masukkan Barang ke Stok (+{currentMarkupNum}%)</span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Floating Cart Bar di HP untuk Barang Masuk */}
          {inboundCart.length > 0 && (
            <div 
              className="pos-mobile-cart-bar"
              onClick={() => setIsMobileInboundOpen(true)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.25)', padding: '6px', borderRadius: '50%', display: 'flex' }}>
                  <PackagePlus size={20} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.98rem' }}>
                    {totalInboundItemsCount} Qty Masuk ({inboundCart.length} Jenis)
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                    Total Beli: {formatRupiah(totalInboundBuyAmount)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', color: 'var(--primary-600)', padding: '6px 14px', borderRadius: 'var(--radius-full)', fontWeight: 800, fontSize: '0.85rem' }}>
                <span>Rincian Masuk</span>
                <ChevronRight size={16} />
              </div>
            </div>
          )}

          {/* Modal / Drawer Barang Masuk untuk HP */}
          {isMobileInboundOpen && (
            <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: '480px' }}>
                <div className="modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PackagePlus size={20} color="var(--primary-600)" />
                    <span className="modal-title">Rincian Barang Masuk ({inboundCart.length} Jenis)</span>
                  </div>
                  <button className="modal-close-btn" onClick={() => setIsMobileInboundOpen(false)}>
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmitInbound}>
                  <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                      {inboundCart.map(item => {
                        const numBuy = parseFloat(item.buyPrice) || 0;
                        const numQty = parseFloat(item.qty) || 0;
                        const sellPricePreview = calculateSellPrice(numBuy, currentMarkupNum, 100);

                        return (
                          <div key={item.productId} style={{ padding: '12px', background: '#fafafa', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                              <div>
                                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                  {item.productName}
                                </div>
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                                  Satuan: {item.unit}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFromInboundCart(item.productId)}
                                style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '2px' }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                              <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                  Qty Masuk:
                                </label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  className="form-input"
                                  style={{ padding: '6px 8px', fontSize: '0.88rem', fontWeight: 700 }}
                                  value={item.qty}
                                  onChange={(e) => handleInboundCartQtyChange(item.productId, e.target.value)}
                                  onBlur={(e) => handleInboundCartQtyBlur(item.productId, e.target.value)}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                  Harga Beli (Rp):
                                </label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  className="form-input"
                                  style={{ padding: '6px 8px', fontSize: '0.88rem', fontWeight: 700 }}
                                  value={item.buyPrice}
                                  onChange={(e) => handleInboundCartPriceChange(item.productId, e.target.value)}
                                  onBlur={(e) => handleInboundCartPriceBlur(item.productId, e.target.value)}
                                  placeholder="0"
                                />
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', paddingTop: '6px', borderTop: '1px dashed var(--border-subtle)' }}>
                              <span style={{ color: 'var(--primary-700)', fontWeight: 600 }}>
                                Jual Baru (+{currentMarkupNum}%): <strong>{formatRupiah(sellPricePreview)}</strong>
                              </span>
                              <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                                Subtotal: {formatRupiah(numBuy * numQty)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Pembelian:</span>
                        <strong style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                          {formatRupiah(totalInboundBuyAmount)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setIsMobileInboundOpen(false)}>
                      Lanjut Tambah
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <PackagePlus size={18} />
                      <span>Simpan & Masukkan ke Stok (+{currentMarkupNum}%)</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Detail Item Order untuk Outlet */}
      {selectedOrderDetail && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={20} color="var(--primary-600)" />
                <span className="modal-title">Rincian Order: {selectedOrderDetail.invoiceNumber}</span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedOrderDetail(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Cabang:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{selectedOrderDetail.outletName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Tanggal & Waktu:</span>
                  <span>{selectedOrderDetail.date} ({selectedOrderDetail.time || 'Pagi'})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Status Pembayaran:</span>
                  <span className={`badge ${selectedOrderDetail.paymentStatus.includes('Lunas') ? 'badge-success' : 'badge-danger'}`}>
                    {selectedOrderDetail.paymentStatus.includes('Lunas') ? 'Lunas' : 'Belum Bayar'}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>Daftar Bahan Baku:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
                {selectedOrderDetail.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fafafa', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{item.productName}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        {item.qty} {item.unit} x {formatRupiah(item.price)}
                      </div>
                    </div>
                    <strong style={{ color: 'var(--primary-700)', fontSize: '0.9rem' }}>
                      {formatRupiah((item.qty || 1) * (item.price || 0))}
                    </strong>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '2px solid var(--border-medium)' }}>
                <strong style={{ fontSize: '1rem' }}>Total Tagihan:</strong>
                <strong style={{ fontSize: '1.2rem', color: 'var(--primary-700)' }}>
                  {formatRupiah(selectedOrderDetail.totalAmount)}
                </strong>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedOrderDetail(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
