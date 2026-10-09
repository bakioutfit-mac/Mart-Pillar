import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Receipt,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  DollarSign,
  Sun,
  Moon,
  X,
  Truck,
  Store,
  RefreshCw,
  CreditCard
} from 'lucide-react';

export const InvoicesView = ({ onOpenReceipt, onOpenDailySummary }) => {
  const { 
    orders, 
    supplierOrders,
    updateSupplierOrderStatus,
    updateOrderPaymentStatus,
    settleOrderPayment 
  } = useApp();

  const [activeTabType, setActiveTabType] = useState('all'); // 'all', 'outlet', 'supplier'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'unpaid', 'paid'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal Ubah Status Bayar
  const [editingTarget, setEditingTarget] = useState(null);
  const [targetStatus, setTargetStatus] = useState('Lunas');
  const [targetPaymentMethod, setTargetPaymentMethod] = useState('Transfer BCA');
  const [targetSupplierAmount, setTargetSupplierAmount] = useState('');

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  // Gabungkan riwayat Nota Outlet dan Nota Pembelian Supplier
  const allInvoices = [
    ...orders.map(o => ({
      ...o,
      type: 'outlet',
      partyLabel: o.outletName,
      partyType: 'Outlet Mart'
    })),
    ...(supplierOrders || []).map(so => ({
      ...so,
      type: 'supplier',
      partyLabel: so.supplierName,
      partyType: 'Supplier Bahan Baku'
    }))
  ].sort((a, b) => (b.id > a.id ? 1 : -1));

  const filteredInvoices = allInvoices.filter(inv => {
    // Filter Type (Outlet vs Supplier)
    if (activeTabType === 'outlet' && inv.type !== 'outlet') return false;
    if (activeTabType === 'supplier' && inv.type !== 'supplier') return false;

    // Filter Status (Lunas vs Belum Bayar)
    const isPaid = inv.paymentStatus.includes('Lunas');
    if (filterStatus === 'unpaid' && isPaid) return false;
    if (filterStatus === 'paid' && !isPaid) return false;

    // Search Query
    const matchSearch = (inv.partyLabel || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.invoiceNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.orderNumber || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchSearch;
  });

  // Statistik Ringkasan
  const totalOmsetOutlet = orders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalPaidOutlet = orders.filter(o => o.paymentStatus.includes('Lunas')).reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalUnpaidOutlet = orders.filter(o => !o.paymentStatus.includes('Lunas')).reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const unpaidSupplierCount = (supplierOrders || []).filter(s => !s.paymentStatus.includes('Lunas')).length;

  const handleOpenStatusModal = (inv) => {
    setEditingTarget(inv);
    const isPaid = inv.paymentStatus.includes('Lunas');
    setTargetStatus(isPaid ? 'Belum Bayar' : 'Lunas');
    setTargetPaymentMethod(inv.paymentMethod || 'Transfer BCA');
    setTargetSupplierAmount(inv.totalAmount && inv.totalAmount > 0 ? inv.totalAmount.toString() : '');
  };

  const handleSaveStatus = (e) => {
    e.preventDefault();
    if (!editingTarget) return;

    if (editingTarget.type === 'supplier') {
      const parsedAmount = targetSupplierAmount !== '' ? parseFloat(targetSupplierAmount) : editingTarget.totalAmount;
      updateSupplierOrderStatus(editingTarget.id, targetStatus, parsedAmount);
    } else {
      updateOrderPaymentStatus(editingTarget.id, targetStatus === 'Lunas' ? 'Lunas (Malam)' : 'Belum Bayar');
    }

    setEditingTarget(null);
  };

  return (
    <div className="content-body">
      <div className="page-header">
        <div>
          <div className="page-title">Nota & Pembayaran</div>
          <div className="page-desc">
            Pusat riwayat transaksi: Nota Penjualan ke Outlet dan Tagihan Pembelian ke Mitra Supplier.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-warning" onClick={onOpenDailySummary}>
            <Printer size={16} />
            <span>Cetak Rekap Penjualan Hari Ini</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Total Omset Distribusi Outlet</span>
            <span className="stat-value">{formatRupiah(totalOmsetOutlet)}</span>
            <span className="stat-sub">{orders.length} Nota Penjualan Terbit</span>
          </div>
          <div className="stat-icon">
            <DollarSign size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Pelunasan Outlet Diterima</span>
            <span className="stat-value" style={{ color: 'var(--primary-600)' }}>{formatRupiah(totalPaidOutlet)}</span>
            <span className="stat-sub">
              {orders.filter(o => o.paymentStatus.includes('Lunas')).length} Nota Telah Lunas
            </span>
          </div>
          <div className="stat-icon">
            <CheckCircle2 size={22} color="var(--primary-600)" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Tagihan Belum Lunas</span>
            <span className="stat-value" style={{ color: '#ea580c' }}>{formatRupiah(totalUnpaidOutlet)}</span>
            <span className="stat-sub">
              {orders.filter(o => !o.paymentStatus.includes('Lunas')).length} Outlet & {unpaidSupplierCount} Supplier Tertunda
            </span>
          </div>
          <div className="stat-icon">
            <Clock size={22} color="#ea580c" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 18px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Top Row: Type Pills (Semua, Penjualan Outlet, Pembelian Supplier) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                className={`btn btn-sm ${activeTabType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTabType('all')}
              >
                <span>Semua Transaksi ({allInvoices.length})</span>
              </button>
              <button
                className={`btn btn-sm ${activeTabType === 'outlet' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTabType('outlet')}
              >
                <Store size={14} />
                <span>Penjualan Outlet ({orders.length})</span>
              </button>
              <button
                className={`btn btn-sm ${activeTabType === 'supplier' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTabType('supplier')}
              >
                <Truck size={14} />
                <span>Pembelian Supplier ({supplierOrders?.length || 0})</span>
              </button>
            </div>

            {/* Status Filter (Semua, Belum Bayar, Lunas) */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className={`btn btn-sm ${filterStatus === 'all' ? 'btn-secondary' : ''}`}
                style={{ background: filterStatus === 'all' ? 'var(--primary-100)' : 'transparent', border: '1px solid var(--border-medium)' }}
                onClick={() => setFilterStatus('all')}
              >
                Semua Status
              </button>
              <button
                className={`btn btn-sm ${filterStatus === 'unpaid' ? 'btn-warning' : 'btn-secondary'}`}
                onClick={() => setFilterStatus('unpaid')}
              >
                Belum Bayar
              </button>
              <button
                className={`btn btn-sm ${filterStatus === 'paid' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterStatus('paid')}
              >
                Lunas
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Cari No. Nota / PO, nama Outlet, atau nama Mitra Supplier..."
              className="form-input"
              style={{ paddingLeft: '36px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>No. Dokumen / Nota</th>
                <th>Tipe Transaksi</th>
                <th>Pihak Mitra (Outlet / Supplier)</th>
                <th>Waktu & Tanggal</th>
                <th>Jumlah Barang</th>
                <th>Total Nominal</th>
                <th>Status Pembayaran</th>
                <th style={{ textAlign: 'right' }}>Aksi Kelola</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                    Tidak ada nota atau riwayat transaksi yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(item => {
                  const isPaid = item.paymentStatus.includes('Lunas');
                  const isSupplier = item.type === 'supplier';

                  return (
                    <tr key={item.id}>
                      {/* 1. No Dokumen */}
                      <td>
                        <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                          {item.invoiceNumber || item.orderNumber}
                        </div>
                        {item.poNumber && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            Ref: {item.poNumber}
                          </div>
                        )}
                      </td>

                      {/* 2. Tipe Transaksi */}
                      <td>
                        {isSupplier ? (
                          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Truck size={12} />
                            <span>Beli Supplier</span>
                          </span>
                        ) : (
                          <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Store size={12} />
                            <span>Jual Outlet</span>
                          </span>
                        )}
                      </td>

                      {/* 3. Pihak Mitra */}
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.partyLabel}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {item.notes || (isSupplier ? 'Order Pembelian' : 'Distribusi Pagi')}
                        </div>
                      </td>

                      {/* 4. Waktu */}
                      <td>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{item.date}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          Pukul {item.time || 'Pagi'}
                        </div>
                      </td>

                      {/* 5. Jumlah Barang */}
                      <td>
                        <span className="badge badge-info">
                          {item.items ? item.items.reduce((a, c) => a + (Number(c.qty) || 0), 0) : item.totalQty || 0} Satuan
                        </span>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {item.items?.length || 0} Jenis Produk
                        </div>
                      </td>

                      {/* 6. Total Nominal */}
                      <td>
                        {isSupplier && (!item.totalAmount || item.totalAmount === 0) ? (
                          <div>
                            <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}>
                              Menunggu Tagihan
                            </span>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Dari Supplier
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontWeight: 800, fontSize: '0.96rem', color: isSupplier ? 'var(--text-main)' : 'var(--primary-700)' }}>
                            {formatRupiah(item.totalAmount)}
                          </div>
                        )}
                      </td>

                      {/* 7. Status Pembayaran */}
                      <td>
                        <span className={`badge ${isPaid ? 'badge-success' : 'badge-danger'}`} style={{ fontWeight: 800 }}>
                          {isPaid ? 'Lunas' : 'Belum Bayar'}
                        </span>
                        {item.paidAt && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {item.paymentMethod || 'Tercatat'}
                          </div>
                        )}
                      </td>

                      {/* 8. Tombol Aksi */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          {/* Tombol Merubah Status Sesuai Permintaan User */}
                          <button
                            className={`btn btn-sm ${isPaid ? 'btn-secondary' : 'btn-warning'}`}
                            onClick={() => handleOpenStatusModal(item)}
                            title="Klik untuk merubah status Lunas / Belum Bayar"
                          >
                            <RefreshCw size={13} />
                            <span>Ubah Status</span>
                          </button>

                          {!isSupplier && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => onOpenReceipt(item)}
                              title="Cetak Nota Penjualan"
                            >
                              <Printer size={13} />
                              <span>Cetak</span>
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

      {/* Modal Merubah Status Pembayaran (Untuk Outlet & Supplier) */}
      {editingTarget && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <span className="modal-title">Ubah Status Pembayaran</span>
              <button className="modal-close-btn" onClick={() => setEditingTarget(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveStatus}>
              <div className="modal-body">
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '14px 16px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {editingTarget.type === 'supplier' ? 'Mitra Supplier:' : 'Outlet Tujuan:'}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '6px' }}>
                    {editingTarget.partyLabel}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                    <span>No. Dokumen:</span>
                    <strong>{editingTarget.invoiceNumber || editingTarget.orderNumber}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginTop: '4px' }}>
                    <span>Status Saat Ini:</span>
                    <strong style={{ color: editingTarget.paymentStatus.includes('Lunas') ? '#059669' : '#dc2626' }}>
                      {editingTarget.paymentStatus.includes('Lunas') ? 'Lunas' : 'Belum Bayar'}
                    </strong>
                  </div>
                </div>

                {/* Pilihan Status Baru */}
                <div className="form-group">
                  <label className="form-label">Tentukan Status Pembayaran:</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      className={`btn ${targetStatus === 'Lunas' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ justifyContent: 'center', borderColor: targetStatus === 'Lunas' ? 'var(--primary-600)' : 'var(--border-medium)' }}
                      onClick={() => setTargetStatus('Lunas')}
                    >
                      <CheckCircle2 size={16} />
                      <span>Lunas</span>
                    </button>
                    <button
                      type="button"
                      className={`btn ${targetStatus === 'Belum Bayar' ? 'btn-warning' : 'btn-secondary'}`}
                      style={{ justifyContent: 'center', borderColor: targetStatus === 'Belum Bayar' ? '#ea580c' : 'var(--border-medium)' }}
                      onClick={() => setTargetStatus('Belum Bayar')}
                    >
                      <Clock size={16} />
                      <span>Belum Bayar</span>
                    </button>
                  </div>
                </div>

                {/* Jika Order Supplier: Kotak Input Nominal Tagihan (Jika Baru Ditagihkan) */}
                {editingTarget.type === 'supplier' && (
                  <div className="form-group">
                    <label className="form-label">Nominal Tagihan Supplier (Rp):</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Masukkan nominal tagihan jika sudah ada"
                      className="form-input"
                      value={targetSupplierAmount}
                      onChange={(e) => setTargetSupplierAmount(e.target.value)}
                    />
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      *Isi nominal sesuai invoice/tagihan yang diberikan oleh Supplier.
                    </div>
                  </div>
                )}

                {/* Metode Pembayaran (Jika status Lunas) */}
                {targetStatus === 'Lunas' && (
                  <div className="form-group">
                    <label className="form-label">Metode Pembayaran:</label>
                    <select
                      className="form-select"
                      value={targetPaymentMethod}
                      onChange={(e) => setTargetPaymentMethod(e.target.value)}
                    >
                      <option value="Transfer BCA">Transfer Bank BCA</option>
                      <option value="Transfer Mandiri">Transfer Bank Mandiri</option>
                      <option value="Transfer BRI">Transfer Bank BRI</option>
                      <option value="QRIS Mart Pillar">QRIS / E-Wallet</option>
                      <option value="Tunai / Cash">Tunai / Cash</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingTarget(null)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle2 size={16} />
                  <span>Simpan Perubahan Status</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
