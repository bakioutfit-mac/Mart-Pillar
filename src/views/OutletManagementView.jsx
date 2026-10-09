import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Store,
  Plus,
  Edit2,
  Trash2,
  Search,
  Phone,
  MapPin,
  User,
  MessageCircle,
  FileText,
  Clock,
  CheckCircle2,
  X,
  Receipt,
  ShoppingCart,
  ChevronRight,
  Package,
  KeyRound
} from 'lucide-react';

export const OutletManagementView = ({ onOpenReceipt }) => {
  const { 
    currentUser, 
    users,
    outlets, 
    addOutlet, 
    updateOutlet, 
    deleteOutlet,
    orders,
    outletStocks
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('master'); // 'master' | 'history' | 'stocks'
  const [searchQuery, setSearchQuery] = useState('');
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockOutletFilter, setStockOutletFilter] = useState('all');
  
  // State for Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    pic: '',
    phone: '',
    address: '',
    pin: '123456'
  });

  // State for History Sub-Tab
  const [historyOutletFilter, setHistoryOutletFilter] = useState('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  // Only owner can view this page
  if (currentUser.role !== 'owner') {
    return (
      <div className="content-body">
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Store size={48} color="#dc2626" style={{ marginBottom: '14px' }} />
          <h2 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>Akses Terbatas Khusus Owner</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Halaman kelola data outlet hanya dapat diakses oleh akun Owner Mart Pillar.</p>
        </div>
      </div>
    );
  }

  // Filter Outlets
  const filteredOutlets = outlets.filter(o => {
    const q = searchQuery.toLowerCase();
    return (
      o.name.toLowerCase().includes(q) ||
      (o.code && o.code.toLowerCase().includes(q)) ||
      (o.pic && o.pic.toLowerCase().includes(q)) ||
      (o.address && o.address.toLowerCase().includes(q))
    );
  });

  // Filter Orders for History Sub-Tab
  const filteredOrders = (orders || []).filter(ord => {
    const matchOutlet = historyOutletFilter === 'all' || ord.outletId === historyOutletFilter;
    const isPaid = ord.paymentStatus.includes('Lunas');
    const matchStatus = historyStatusFilter === 'all' || 
      (historyStatusFilter === 'paid' && isPaid) ||
      (historyStatusFilter === 'unpaid' && !isPaid);
    return matchOutlet && matchStatus;
  });

  const handleOpenAdd = () => {
    setEditingOutlet(null);
    setFormData({
      name: '',
      code: `OPS-0${outlets.length + 1}`,
      pic: '',
      phone: '',
      address: '',
      pin: '123456'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (outlet) => {
    setEditingOutlet(outlet);
    const linkedUser = (users || []).find(u => u.outletId === outlet.id || (u.role === 'outlet' && u.name.toLowerCase() === outlet.name.toLowerCase()));
    setFormData({
      name: outlet.name,
      code: outlet.code || '',
      pic: outlet.pic || '',
      phone: outlet.phone || '',
      address: outlet.address || '',
      pin: linkedUser?.pin || '123456'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert('Nama Cabang Outlet dan No. WhatsApp wajib diisi.');
      return;
    }

    if (editingOutlet) {
      updateOutlet(editingOutlet.id, formData);
    } else {
      addOutlet(formData);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (outlet) => {
    if (confirm(`Apakah Anda yakin ingin menghapus "${outlet.name}"?\nData yang dihapus otomatis ter-sync dan tidak akan muncul di opsi pengiriman barang.`)) {
      deleteOutlet(outlet.id);
    }
  };

  return (
    <div className="content-body" style={{ paddingBottom: '90px' }}>
      {/* Header Halaman */}
      <div className="page-header">
        <div>
          <div className="page-title">Kelola Data Outlet (Khusus Owner)</div>
          <div className="page-desc">
            Manajemen master data cabang outlet & rekapitulasi riwayat order per cabang yang tersinkronisasi otomatis.
          </div>
        </div>

        {/* 3 Sub-Tab: Master Cabang, Riwayat Order, Monitoring Stok */}
        <div style={{ display: 'flex', gap: '8px', background: '#f8fafc', border: '1.5px solid var(--border-medium)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          <button
            className={`btn btn-sm ${activeSubTab === 'master' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('master')}
          >
            <Store size={15} />
            <span>1. Master Cabang ({outlets.length})</span>
          </button>
          <button
            className={`btn btn-sm ${activeSubTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('history')}
          >
            <Receipt size={15} />
            <span>2. Riwayat Order ({orders.length})</span>
          </button>
          <button
            className={`btn btn-sm ${activeSubTab === 'stocks' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('stocks')}
          >
            <Package size={15} />
            <span>3. Monitoring Stok Cabang</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SUB-TAB 1: MASTER DATA CABANG OUTLET                           */}
      {/* ============================================================== */}
      {activeSubTab === 'master' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Actions: Search + Tombol Tambah Outlet */}
          <div className="card" style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Cari cabang outlet, kode, PIC, atau alamat..."
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <button className="btn btn-primary" onClick={handleOpenAdd}>
                <Plus size={16} />
                <span>+ Tambah Outlet Baru</span>
              </button>
            </div>
          </div>

          {/* Grid Kartu Outlet */}
          <div className="grid-2">
            {filteredOutlets.map(out => {
              const cleanPhone = (out.phone || '').replace(/[^0-9]/g, '');
              const waTarget = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
              
              // Hitung statistik per outlet
              const outletOrderHistory = (orders || []).filter(o => o.outletId === out.id || o.outletName === out.name);
              const totalOrdersCount = outletOrderHistory.length;
              const totalSpent = outletOrderHistory.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
              const unpaidOrdersCount = outletOrderHistory.filter(o => !o.paymentStatus.includes('Lunas')).length;

              return (
                <div key={out.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid var(--primary-600)' }}>
                  <div>
                    {/* Header Kartu */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: 'var(--primary-100)', color: 'var(--primary-700)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                          <Store size={22} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                            {out.name}
                          </div>
                          <span className="badge badge-warning" style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                            Kode: {out.code || out.id}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(out)}
                          title="Edit Outlet"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDelete(out)}
                          style={{ color: '#dc2626' }}
                          title="Hapus Outlet"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Rincian PIC, HP, Alamat */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={15} color="var(--primary-600)" />
                        <span>Penanggung Jawab (PIC): <strong>{out.pic || '-'}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={15} color="var(--primary-600)" />
                        <span>No. WhatsApp: <strong>{out.phone}</strong></span>
                      </div>
                      {out.address && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <MapPin size={15} color="var(--primary-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{out.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Status Akun & Role Login Outlet Otomatis */}
                    {(() => {
                      const linkedUser = (users || []).find(u => u.outletId === out.id || (u.role === 'outlet' && u.name.toLowerCase() === out.name.toLowerCase()));
                      return (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: '#ecfdf5',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid #a7f3d0',
                          fontSize: '0.78rem',
                          marginBottom: '12px'
                        }}>
                          <span style={{ color: '#065f46', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <CheckCircle2 size={14} color="#059669" /> Role: {linkedUser?.roleLabel || 'Login Outlet'}
                          </span>
                          <span style={{ color: '#047857' }}>
                            PIN: <strong>{linkedUser?.pin || '123456'}</strong>
                          </span>
                        </div>
                      );
                    })()}

                    {/* Ringkasan Performa Order */}
                    <div style={{ background: '#fffaf5', border: '1px solid var(--primary-200)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Total Riwayat Order:</span>
                        <strong>{totalOrdersCount} Transaksi ({formatRupiah(totalSpent)})</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Status Tagihan:</span>
                        {unpaidOrdersCount > 0 ? (
                          <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                            {unpaidOrdersCount} Belum Bayar
                          </span>
                        ) : (
                          <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                            Semua Lunas
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tombol Kontak WA PIC */}
                  <a
                    href={`https://wa.me/${waTarget}?text=${encodeURIComponent('Halo ' + (out.pic ? out.pic + ' ' : '') + 'dari ' + out.name + ', ini dari Kantor Pusat Mart Pillar.')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ width: '100%', borderColor: '#10b981', color: '#047857', fontWeight: 800 }}
                  >
                    <MessageCircle size={16} color="#059669" />
                    <span>Hubungi PIC via WhatsApp</span>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 2: RIWAYAT ORDER SELURUH CABANG                        */}
      {/* ============================================================== */}
      {activeSubTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Filter Bar Riwayat Order */}
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Store size={16} color="var(--primary-600)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Filter Cabang:</span>
                </div>
                <select
                  className="form-select"
                  style={{ minWidth: '220px' }}
                  value={historyOutletFilter}
                  onChange={(e) => setHistoryOutletFilter(e.target.value)}
                >
                  <option value="all">Semua Cabang Outlet</option>
                  {outlets.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className={`btn btn-sm ${historyStatusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setHistoryStatusFilter('all')}
                >
                  Semua ({orders.length})
                </button>
                <button
                  className={`btn btn-sm ${historyStatusFilter === 'unpaid' ? 'btn-warning' : 'btn-secondary'}`}
                  onClick={() => setHistoryStatusFilter('unpaid')}
                >
                  Belum Bayar
                </button>
                <button
                  className={`btn btn-sm ${historyStatusFilter === 'paid' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setHistoryStatusFilter('paid')}
                >
                  Lunas
                </button>
              </div>
            </div>
          </div>

          {/* Tabel Riwayat Order Cabang */}
          <div className="card">
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>No. Nota / PO</th>
                    <th>Cabang Outlet</th>
                    <th>Waktu Order</th>
                    <th>Kuantitas Barang</th>
                    <th>Total Nominal</th>
                    <th>Status Pembayaran</th>
                    <th style={{ textAlign: 'right' }}>Rincian</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                        Belum ada riwayat order untuk cabang ini.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(ord => {
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
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{ord.outletName}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Shift: {ord.shift || 'Distribusi Pagi'}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.84rem' }}>{ord.date}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pukul {ord.time || '-'}</div>
                          </td>
                          <td>
                            <span className="badge badge-info">{totalQty} Item</span>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {ord.items?.length || 0} Jenis Produk
                            </div>
                          </td>
                          <td>
                            <strong style={{ color: 'var(--primary-700)', fontSize: '0.96rem' }}>
                              {formatRupiah(ord.totalAmount)}
                            </strong>
                          </td>
                          <td>
                            <span className={`badge ${isPaid ? 'badge-success' : 'badge-danger'}`} style={{ fontWeight: 800 }}>
                              {isPaid ? 'Lunas' : 'Belum Bayar'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setSelectedOrderDetail(ord)}
                                title="Lihat rincian item pesanan"
                              >
                                <span>Detail Item</span>
                              </button>
                              {onOpenReceipt && (
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => onOpenReceipt(ord)}
                                  title="Cetak Faktur Nota"
                                >
                                  <Receipt size={13} />
                                </button>
                              )}
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
      {/* SUB-TAB 3: MONITORING STOK CABANG (KHUSUS OWNER)               */}
      {/* ============================================================== */}
      {activeSubTab === 'stocks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Overview Info Banner */}
          <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--primary-500)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                  Monitoring Stok Fisik Seluruh Cabang Outlet (Milik Perusahaan)
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Pantau sisa bahan harian di setiap outlet cabang, cek kepatuhan input closing malam, dan cegah kekosongan stok bahan sebelum operasional esok hari.
                </div>
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="card" style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Cari nama bahan di cabang..."
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  value={stockSearchQuery}
                  onChange={(e) => setStockSearchQuery(e.target.value)}
                />
              </div>

              {/* Filter Cabang Buttons */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
                <button
                  className={`btn btn-sm ${stockOutletFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setStockOutletFilter('all')}
                >
                  Semua Cabang ({outlets.length})
                </button>
                {outlets.map(out => (
                  <button
                    key={out.id}
                    className={`btn btn-sm ${stockOutletFilter === out.id ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setStockOutletFilter(out.id)}
                  >
                    {out.name.replace('Outlet ', '')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* List Cabang & Stoknya */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {outlets
              .filter(o => stockOutletFilter === 'all' || o.id === stockOutletFilter)
              .map(out => {
                const branchStockList = (outletStocks[out.id] || []).filter(item =>
                  item.productName.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
                  item.productId.toLowerCase().includes(stockSearchQuery.toLowerCase())
                );

                const lowItemsCount = branchStockList.filter(i => i.stock <= i.minStock).length;
                const closingTime = outletStocks[out.id]?.[0]?.lastClosing || 'Belum ada catatan closing';

                return (
                  <div key={out.id} className="card" style={{ padding: '20px' }}>
                    {/* Header Outlet */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '14px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="badge badge-warning" style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                            {out.code || out.id}
                          </span>
                          <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
                            {out.name}
                          </strong>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          PIC: {out.pic || '-'} | Telp: {out.phone} | Alamat: {out.address || '-'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: 'var(--primary-700)', fontWeight: 600 }}>
                          <Clock size={14} />
                          Closing Terakhir: {closingTime}
                        </span>
                        {lowItemsCount > 0 ? (
                          <span className="badge badge-danger">
                            Perlu Pasokan ({lowItemsCount} item)
                          </span>
                        ) : (
                          <span className="badge badge-success">
                            Stok Aman
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
                            <th>Sisa Stok Toko</th>
                            <th>Satuan</th>
                            <th>Batas Min Toko</th>
                            <th>Status Stok</th>
                            <th>Rekomendasi Owner & Gudang</th>
                          </tr>
                        </thead>
                        <tbody>
                          {branchStockList.length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                                Tidak ada data bahan di cabang ini yang sesuai pencarian.
                              </td>
                            </tr>
                          ) : (
                            branchStockList.map(item => {
                              const isLow = item.stock <= item.minStock && item.stock > 0;
                              const isOut = item.stock <= 0;

                              return (
                                <tr key={item.productId} style={{ background: isOut ? '#fef2f2' : isLow ? '#fffbeb' : 'transparent' }}>
                                  <td>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.productName}</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>SKU: {item.productId}</div>
                                  </td>
                                  <td>
                                    <span style={{
                                      fontWeight: 800,
                                      fontSize: '1.1rem',
                                      color: isOut ? '#dc2626' : isLow ? '#d97706' : '#059669'
                                    }}>
                                      {item.stock}
                                    </span>
                                  </td>
                                  <td><span className="badge badge-info">{item.unit}</span></td>
                                  <td style={{ color: 'var(--text-secondary)' }}>{item.minStock} {item.unit}</td>
                                  <td>
                                    {isOut ? (
                                      <span className="badge badge-danger">Habis</span>
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
                                        Stok operasional aman
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

      {/* Modal Detail Item Order */}
      {selectedOrderDetail && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
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
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
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

              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>Daftar Bahan Baku Dipesan:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                {selectedOrderDetail.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fafafa', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{item.productName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
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

      {/* Modal Tambah / Edit Outlet */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Store size={20} color="var(--primary-600)" />
                <span className="modal-title">
                  {editingOutlet ? 'Edit Data Cabang Outlet' : 'Tambah Cabang Outlet Baru'}
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Cabang Outlet:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Outlet Kopi Pillar Senopati"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Kode Cabang:</label>
                    <input
                      type="text"
                      placeholder="Contoh: OPS-03"
                      className="form-input"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nama PIC / Penanggung Jawab:</label>
                    <input
                      type="text"
                      placeholder="Contoh: Dimas"
                      className="form-input"
                      value={formData.pic}
                      onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">No. WhatsApp / HP Cabang:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 081288880202"
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    *Digunakan sebagai Nomor Handphone login staf outlet dan komunikasi order.
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">PIN Login Outlet (6 Digit):</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    className="form-input"
                    style={{ letterSpacing: '2px', fontWeight: 700 }}
                    value={formData.pin || '123456'}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/[^0-9]/g, '') })}
                  />
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    *PIN default untuk staf cabang saat login ke sistem Mart Pillar.
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Alamat Lengkap Lokasi Outlet:</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Contoh: Jl. Senopati Raya No. 12, Kebayoran Baru, Jakarta Selatan..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    style={{ minHeight: '65px' }}
                  />
                </div>

                {/* Auto Role Creation Notice */}
                <div style={{
                  background: '#ecfdf5',
                  border: '1.5px solid #a7f3d0',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.82rem',
                  color: '#065f46',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Otomatis Sinkronisasi Role:</strong> Menyimpan outlet ini akan otomatis membuat role & akun pengguna <strong>Login Outlet</strong> yang tersinkronisasi ke menu <em>Kelola Role</em>.
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle2 size={16} />
                  <span>{editingOutlet ? 'Simpan Perubahan' : 'Tambah Outlet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
