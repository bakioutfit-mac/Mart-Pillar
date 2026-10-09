import React from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  DollarSign,
  Package,
  ShoppingCart,
  ArrowLeftRight,
  Receipt,
  Truck,
  CheckCircle2,
  Clock,
  FileText
} from 'lucide-react';

export const DashboardView = ({ setActiveTab, onOpenReceipt, onOpenDailySummary }) => {
  const { 
    currentUser, 
    orders, 
    products, 
    inbounds, 
    supervisorReports, 
    activeShift,
    outlets
  } = useApp();

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const totalOmset = orders.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalMargin = orders.reduce((acc, curr) => acc + (curr.marginProfit || 0), 0);
  const totalInbound = inbounds.reduce((acc, curr) => acc + curr.totalBuy, 0);

  const unpaidOrders = orders.filter(o => !o.paymentStatus.includes('Lunas'));
  const unpaidAmount = unpaidOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const pendingReports = supervisorReports.filter(r => !r.ownerVerified);

  // If role is outlet, filter to that outlet's orders only
  const isOutletRole = currentUser.role === 'outlet';
  const outletOrders = isOutletRole 
    ? orders.filter(o => o.outletId === currentUser.outletId || o.outletName.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0]))
    : orders;
  const outletUnpaidAmount = outletOrders
    .filter(o => !o.paymentStatus.includes('Lunas'))
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  return (
    <div className="content-body">
      {/* Header Banner */}
      <div className="page-header">
        <div>
          <div className="page-title">
            Selamat Datang, {currentUser.name} 👋
          </div>
          <div className="page-desc">
            Sistem Distribusi Mart Pillar — Mode Aktif: <strong style={{ color: 'var(--primary-600)' }}>{currentUser.title}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {currentUser.role === 'outlet' && (
            <button className="btn btn-primary" onClick={() => setActiveTab('order')}>
              <ArrowLeftRight size={16} />
              <span>Transaksi Baru</span>
            </button>
          )}

          {['supervisor', 'owner'].includes(currentUser.role) && (
            <button className="btn btn-warning" onClick={onOpenDailySummary}>
              <Receipt size={16} />
              <span>Cetak Rekap Harian</span>
            </button>
          )}

          {currentUser.role === 'supervisor' && (
            <button className="btn btn-primary" onClick={() => setActiveTab('reports')}>
              <FileText size={16} />
              <span>Buat Laporan ke Owner</span>
            </button>
          )}
        </div>
      </div>

      {/* Special Notice for Owner if there's a Supervisor Report waiting */}
      {currentUser.role === 'owner' && pendingReports.length > 0 && (
        <div style={{
          background: '#fff7ed',
          border: '1px solid #fdba74',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <FileText size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary-700)' }}>
                Laporan Harian Atasan Menunggu Verifikasi Anda
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Kepala Gudang telah mengirimkan rekap operasional hari ini (Margin 2.5%, Inbound, Outbound, Susut Opname).
              </div>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('reports')}>
            Tinjau Laporan Sekarang
          </button>
        </div>
      )}

      {/* Metric Stat Cards */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        {/* Card 1: Omset / Penjualan Outlet */}
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">
              {isOutletRole ? 'Total Tagihan Anda' : 'Total Distribusi Outlet'}
            </span>
            <span className="stat-value" style={{ color: 'var(--primary-600)' }}>
              {formatRupiah(isOutletRole ? outletOrders.reduce((a, c) => a + c.totalAmount, 0) : totalOmset)}
            </span>
            <span className="stat-sub">
              {isOutletRole ? `${outletOrders.length} Pesanan PO` : `${orders.length} Nota Terbit Hari Ini`}
            </span>
          </div>
          <div className="stat-icon">
            <ShoppingCart size={22} />
          </div>
        </div>

        {/* Card 2: Margin 2.5% Mart Pillar (Hidden from Outlet) */}
        {!isOutletRole ? (
          <div className="stat-card">
            <div className="stat-content">
              <span className="stat-label">Laba Margin 2.5%</span>
              <span className="stat-value" style={{ color: 'var(--primary-600)' }}>
                {formatRupiah(totalMargin)}
              </span>
              <span className="stat-sub">Keuntungan pengadaan barang</span>
            </div>
            <div className="stat-icon">
              <TrendingUp size={22} />
            </div>
          </div>
        ) : (
          <div className="stat-card">
            <div className="stat-content">
              <span className="stat-label">Status Distribusi Pagi</span>
              <span className="stat-value" style={{ fontSize: '1.25rem', color: 'var(--primary-600)' }}>
                Terkirim Aman
              </span>
              <span className="stat-sub">Pengiriman pagi selesai</span>
            </div>
            <div className="stat-icon">
              <Truck size={22} />
            </div>
          </div>
        )}

        {/* Card 3: Tagihan Malam Ini */}
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">
              {isOutletRole ? 'Jatuh Tempo Malam Ini' : 'Pelunasan Malam Ini'}
            </span>
            <span className="stat-value" style={{ color: '#ea580c' }}>
              {formatRupiah(isOutletRole ? outletUnpaidAmount : unpaidAmount)}
            </span>
            <span className="stat-sub">
              {isOutletRole 
                ? (outletUnpaidAmount > 0 ? 'Menunggu Transfer Anda' : 'Semua Lunas')
                : `${unpaidOrders.length} Nota Menunggu Pelunasan`}
            </span>
          </div>
          <div className="stat-icon">
            <Clock size={22} />
          </div>
        </div>

        {/* Card 4: Inbound (Admin) or Katalog (Outlet) */}
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">
              {!isOutletRole ? 'Barang Masuk Supplier' : 'Katalog Mart Pillar'}
            </span>
            <span className="stat-value" style={{ fontSize: '1.3rem' }}>
              {!isOutletRole
                ? formatRupiah(totalInbound)
                : `${products.length} Komoditas`}
            </span>
            <span className="stat-sub">
              {!isOutletRole
                ? (lowStockProducts.length > 0 ? `${lowStockProducts.length} produk menipis` : 'Stok stabil')
                : 'Sayur, ayam, cup & bumbu'}
            </span>
          </div>
          <div className="stat-icon">
            <Package size={22} />
          </div>
        </div>
      </div>

      {/* Operational Highlights Section */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Workflow Info Box */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ fontWeight: 800, fontSize: '1.02rem', color: 'var(--text-main)' }}>
              Alur Distribusi Mart Pillar
            </div>
            <span className="badge badge-warning">Pagi - Malam</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-100)', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.82rem', flexShrink: 0 }}>
                1
              </div>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-main)' }}>Inbound Supplier (+2.5%):</strong> Harga beli supplier otomatis dihitung dengan mark-up 2.5% untuk menetapkan harga jual baru.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-100)', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.82rem', flexShrink: 0 }}>
                2
              </div>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-main)' }}>PO Outlet & Distribusi Pagi:</strong> Form PO outlet otomatis terpecah menjadi Nota Penjualan untuk pengiriman subuh/pagi.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-100)', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.82rem', flexShrink: 0 }}>
                3
              </div>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-main)' }}>Pelunasan Malam & Laporan:</strong> Pelunasan tagihan malam dicatat di sistem, cetak rekap harian, dan Atasan mengirim laporan harian ke Owner.
              </div>
            </div>
          </div>
        </div>

        {/* Quick Shortcut Box */}
        <div className="card">
          <div style={{ fontWeight: 800, fontSize: '1.02rem', marginBottom: '14px', color: 'var(--text-main)' }}>
            Aksi Cepat Menu
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '14px', height: 'auto' }}
              onClick={() => setActiveTab('order')}
            >
              <ArrowLeftRight size={20} color="var(--primary-600)" />
              <div style={{ textAlign: 'left', lineHeight: '1.2' }}>
                <div style={{ fontWeight: 700 }}>Transaksi</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Keluar (Outlet) & Masuk (Supplier)</div>
              </div>
            </button>

            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '14px', height: 'auto' }}
              onClick={() => setActiveTab('invoices')}
            >
              <Receipt size={20} color="var(--primary-600)" />
              <div style={{ textAlign: 'left', lineHeight: '1.2' }}>
                <div style={{ fontWeight: 700 }}>Nota & Tagihan</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Pelunasan malam hari</div>
              </div>
            </button>

            {['owner', 'supervisor'].includes(currentUser.role) && (
              <>
                <button
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', padding: '14px', height: 'auto' }}
                  onClick={() => setActiveTab('suppliers')}
                >
                  <Truck size={20} color="var(--primary-600)" />
                  <div style={{ textAlign: 'left', lineHeight: '1.2' }}>
                    <div style={{ fontWeight: 700 }}>Supplier</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Order WA & Data Master</div>
                  </div>
                </button>

                <button
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', padding: '14px', height: 'auto' }}
                  onClick={() => setActiveTab('opname')}
                >
                  <CheckCircle2 size={20} color="var(--primary-600)" />
                  <div style={{ textAlign: 'left', lineHeight: '1.2' }}>
                    <div style={{ fontWeight: 700 }}>Stok Opname</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Audit susut ayam & sayur</div>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders / Nota Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
              {isOutletRole ? 'Daftar Nota Pembelian Anda' : 'Aktivitas Nota & Pengiriman Hari Ini'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Alur distribusi pagi dan status pelunasan malam hari
            </div>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab(isOutletRole ? 'order' : 'invoices')}>
            Lihat Semua
          </button>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>No. Nota</th>
                <th>Outlet</th>
                <th>Shift / Jam</th>
                <th>Total Tagihan</th>
                {!isOutletRole && <th>Margin (2.5%)</th>}
                <th>Status Pembayaran</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {outletOrders.slice(0, 5).map(order => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {order.invoiceNumber}
                  </td>
                  <td>{order.outletName}</td>
                  <td>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {order.shift} ({order.time})
                    </span>
                  </td>
                  <td style={{ fontWeight: 800, color: 'var(--primary-600)' }}>
                    {formatRupiah(order.totalAmount)}
                  </td>
                  {!isOutletRole && (
                    <td style={{ color: 'var(--primary-700)', fontWeight: 700 }}>
                      +{formatRupiah(order.marginProfit)}
                    </td>
                  )}
                  <td>
                    <span className={`badge ${order.paymentStatus.includes('Lunas') ? 'badge-success' : 'badge-warning'}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onOpenReceipt(order)}
                    >
                      <Receipt size={14} />
                      <span>Nota</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
