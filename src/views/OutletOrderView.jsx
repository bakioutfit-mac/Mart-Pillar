import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  FileCheck2,
  Receipt,
  Package
} from 'lucide-react';

export const OutletOrderView = ({ onOrderCreated }) => {
  const { 
    currentUser, 
    outlets, 
    products, 
    createOrderFromPO 
  } = useApp();

  const [selectedOutletId, setSelectedOutletId] = useState(
    currentUser.outletId || (outlets.length > 0 ? outlets[0].id : '')
  );
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  // Filter products by category and search
  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Cart operations
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id ? { ...item, qty: item.qty + 1 } : item
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

  const updateCartQty = (productId, delta) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.productId === productId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const setCartItemExactQty = (productId, val) => {
    const num = Math.max(1, Number(val) || 1);
    setCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          return { ...item, qty: num };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const cartTotalAmount = cart.reduce((acc, curr) => acc + curr.price * curr.qty, 0);

  const handleSubmitPO = (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Pilih minimal 1 barang pesanan terlebih dahulu.');
      return;
    }

    const createdOrder = createOrderFromPO({
      outletId: selectedOutletId,
      items: cart,
      notes: orderNotes,
      shift: 'Distribusi Pagi'
    });

    setSuccessOrder(createdOrder);
    setCart([]);
    setOrderNotes('');

    if (onOrderCreated) {
      onOrderCreated(createdOrder);
    }
  };

  return (
    <div className="content-body">
      <div className="page-header">
        <div>
          <div className="page-title">Form Pemesanan Bahan Baku Outlet (PO)</div>
          <div className="page-desc">
            Pilih kebutuhan barang dan jumlah kuantitas (Qty) untuk jadwal <strong>Distribusi Pagi</strong>.
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successOrder && (
        <div style={{
          background: '#fff7ed',
          border: '1px solid #fdba74',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 24px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <FileCheck2 size={32} color="var(--primary-600)" />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary-700)' }}>
                Pesanan Berhasil Dikirim & Nota Terbit Otomatis!
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                No. Nota: <strong>{successOrder.invoiceNumber}</strong> | Ref PO: <strong>{successOrder.poNumber}</strong>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Jadwal: Distribusi Pagi — Pelunasan dilakukan pada sesi malam hari.
              </div>
            </div>
          </div>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => onOrderCreated(successOrder)}
          >
            <Receipt size={16} />
            <span>Lihat / Cetak Nota</span>
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        {/* Outlet Selector (hidden/disabled if already logged in as outlet) */}
        {currentUser.role !== 'outlet' && (
          <div className="card">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Pilih Outlet Tujuan:</label>
              <select
                className="form-select"
                value={selectedOutletId}
                onChange={(e) => setSelectedOutletId(e.target.value)}
              >
                {outlets.map(out => (
                  <option key={out.id} value={out.id}>
                    {out.name} ({out.code}) - {out.address}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }} className="grid-order-split">
          {/* Catalog: ONLY Product, Price, Unit, Qty (NO STOCK SHOWN) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Search & Category Filter */}
            <div className="card" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                  <input
                    type="text"
                    placeholder="Cari sayur, ayam, kemasan cup, bumbu..."
                    className="form-input"
                    style={{ paddingLeft: '36px' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  <button
                    className={`btn btn-sm ${selectedCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSelectedCategory('all')}
                  >
                    Semua
                  </button>
                  <button
                    className={`btn btn-sm ${selectedCategory === 'sayur' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSelectedCategory('sayur')}
                  >
                    Sayuran
                  </button>
                  <button
                    className={`btn btn-sm ${selectedCategory === 'ayam' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSelectedCategory('ayam')}
                  >
                    Ayam & Daging
                  </button>
                  <button
                    className={`btn btn-sm ${selectedCategory === 'cup' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSelectedCategory('cup')}
                  >
                    Cup & Kemasan
                  </button>
                  <button
                    className={`btn btn-sm ${selectedCategory === 'bumbu' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSelectedCategory('bumbu')}
                  >
                    Bumbu Dapur
                  </button>
                </div>
              </div>
            </div>

            {/* Product Grid: Clean card with NO stock count */}
            <div className="grid-3">
              {filteredProducts.map(product => {
                const inCartItem = cart.find(i => i.productId === product.id);

                return (
                  <div key={product.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '3px solid var(--primary-500)' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}>
                          {product.category.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Satuan: {product.unit}
                        </span>
                      </div>

                      <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-main)', marginBottom: '8px', lineHeight: '1.3' }}>
                        {product.name}
                      </div>
                    </div>

                    <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Harga:</span>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-600)' }}>
                          {formatRupiah(product.sellPrice)}
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}> /{product.unit}</span>
                        </span>
                      </div>

                      {inCartItem ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--primary-50)', border: '1px solid var(--primary-200)', borderRadius: 'var(--radius-md)', padding: '4px 8px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => updateCartQty(product.id, -1)}
                            style={{ padding: '4px 8px', height: '30px' }}
                          >
                            <Minus size={14} />
                          </button>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="number"
                              min="1"
                              value={inCartItem.qty}
                              onChange={(e) => setCartItemExactQty(product.id, e.target.value)}
                              style={{
                                width: '55px',
                                textAlign: 'center',
                                fontWeight: 800,
                                fontSize: '0.92rem',
                                border: '1px solid var(--border-medium)',
                                borderRadius: '4px',
                                padding: '2px 4px'
                              }}
                            />
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                              {product.unit}
                            </span>
                          </div>

                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => updateCartQty(product.id, 1)}
                            style={{ padding: '4px 8px', height: '30px' }}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ width: '100%', fontSize: '0.85rem' }}
                          onClick={() => addToCart(product)}
                        >
                          <Plus size={16} />
                          <span>Pilih Barang</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart & PO Order Confirmation */}
          <div className="card" style={{ height: 'fit-content', borderTop: '4px solid var(--primary-600)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                <ShoppingCart size={20} color="var(--primary-600)" />
                <span>Rincian Pesanan PO</span>
              </div>
              <span className="badge badge-warning">{cart.length} Jenis Barang</span>
            </div>

            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-secondary)' }}>
                <Package size={42} style={{ opacity: 0.35, color: 'var(--primary-500)', marginBottom: '10px' }} />
                <p style={{ fontSize: '0.92rem', fontWeight: 600 }}>Keranjang Masih Kosong</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Silakan pilih barang dan tentukan jumlah yang dipesan di katalog samping.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitPO}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto', marginBottom: '16px', paddingRight: '4px' }}>
                  {cart.map(item => (
                    <div key={item.productId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#fafafa', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.productName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {item.qty} {item.unit} x {formatRupiah(item.price)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--primary-700)' }}>
                          {formatRupiah(item.price * item.qty)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId)}
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
                  <label className="form-label">Catatan Tambahan untuk Pengiriman Pagi:</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Contoh: Kirim jam 06:30 pagi, ayam tolong dipotong bersih..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    style={{ minHeight: '65px' }}
                  />
                </div>

                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Estimasi:</span>
                    <strong style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-600)' }}>
                      {formatRupiah(cartTotalAmount)}
                    </strong>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    *Otomatis terbit Nota Penjualan untuk Distribusi Pagi. Pembayaran malam hari.
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
                >
                  <FileCheck2 size={18} />
                  <span>Kirim PO Pesanan Sekarang</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
