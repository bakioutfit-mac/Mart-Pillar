import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileSpreadsheet,
  Send,
  CheckCircle2,
  FileCheck,
  TrendingUp,
  AlertTriangle,
  Clock,
  Printer,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';

export const SupervisorReportView = () => {
  const { 
    currentUser, 
    orders, 
    inbounds, 
    opnameLogs, 
    supervisorReports, 
    submitSupervisorReport, 
    verifyReportByOwner 
  } = useApp();

  const [notes, setNotes] = useState('');
  const [successNotice, setSuccessNotice] = useState(false);
  const [ownerFeedback, setOwnerFeedback] = useState('');
  const [selectedReportToView, setSelectedReportToView] = useState(null);

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const todayStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  // Real-time calculations for draft report
  const todayInboundTotal = inbounds.reduce((acc, curr) => acc + curr.totalBuy, 0);
  const todayOutboundTotal = orders.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const todayMarginTotal = orders.reduce((acc, curr) => acc + (curr.marginProfit || 0), 0);

  const paidOrders = orders.filter(o => o.paymentStatus.includes('Lunas'));
  const unpaidOrders = orders.filter(o => !o.paymentStatus.includes('Lunas'));
  const unpaidTotalAmount = unpaidOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);

  const opnameLossTotal = opnameLogs
    .filter(o => o.difference < 0)
    .reduce((acc, curr) => acc + Math.abs(curr.financialImpact), 0);

  const handleSubmitReport = (e) => {
    e.preventDefault();
    submitSupervisorReport(notes);
    setNotes('');
    setSuccessNotice(true);
    setTimeout(() => setSuccessNotice(false), 5000);
  };

  const isOwner = currentUser.role === 'owner';

  return (
    <div className="content-body">
      <div className="page-header">
        <div>
          <div className="page-title">
            {isOwner ? 'Laporan' : 'Mode Atasan: Pembuat Laporan Resmi ke Owner'}
          </div>
          <div className="page-desc">
            {isOwner 
              ? 'Ringkasan kompilasi otomatis performa operasional: Belanja Supplier, Penjualan Outlet, Akumulasi Margin 2.5%, dan Rekap Penagihan Malam.'
              : 'Kompilasi otomatis performa operasional: Belanja Supplier, Penjualan Outlet, Akumulasi Margin 2.5%, dan Rekap Penagihan Malam.'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
            <Printer size={16} />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {successNotice && (
        <div style={{
          background: '#fff7ed',
          border: '1px solid #fed7aa',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <CheckCircle2 size={24} color="var(--primary-600)" />
          <div>
            <div style={{ fontWeight: 800, color: 'var(--primary-700)' }}>
              Laporan Operasional Berhasil Dikirimkan ke Owner!
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Owner dapat langsung meninjau metrik laba margin 2.5% dan status pelunasan malam di dashboard eksekutif.
            </div>
          </div>
        </div>
      )}

      {/* Draft Summary Card to Submit (For Supervisor) */}
      {!isOwner && (
        <div className="card" style={{ marginBottom: '28px', border: '1px solid var(--primary-500)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>Draft Laporan Penutupan Hari Ini</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Tanggal: {todayStr} | Pelapor: {currentUser.name}</div>
              </div>
            </div>
            <span className="badge badge-warning">Siap Dilaporkan</span>
          </div>

          <form onSubmit={handleSubmitReport}>
            {/* Live Metrics Grid */}
            <div className="grid-4" style={{ marginBottom: '20px' }}>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Pembelian Supplier (Inbound)
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                  {formatRupiah(todayInboundTotal)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{inbounds.length} Faktur Masuk</div>
              </div>

              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Distribusi Outlet (Outbound)
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-700)', marginTop: '4px' }}>
                  {formatRupiah(todayOutboundTotal)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{orders.length} Nota Penjualan</div>
              </div>

              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.72rem', color: '#059669', textTransform: 'uppercase', fontWeight: 700 }}>
                  Akumulasi Margin 2.5%
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                  {formatRupiah(todayMarginTotal)}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#047857' }}>Laba kotor hari ini</div>
              </div>

              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.72rem', color: '#d97706', textTransform: 'uppercase', fontWeight: 600 }}>
                  Piutang Malam Ini
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
                  {formatRupiah(unpaidTotalAmount)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{unpaidOrders.length} Outlet belum transfer</div>
              </div>
            </div>

            {/* Opname Shrinkage Info */}
            <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.82rem' }}>
                <strong style={{ color: '#be123c' }}>Catatan Selisih Stok Opname (Susut & Rusak):</strong>
                <span style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>Total kerugian fisik tercatat</span>
              </div>
              <strong style={{ color: '#be123c' }}>- {formatRupiah(opnameLossTotal)}</strong>
            </div>

            {/* Notes to Owner */}
            <div className="form-group">
              <label className="form-label">Catatan & Penjelasan Supervisor untuk Owner:</label>
              <textarea
                className="form-textarea"
                required
                placeholder="Tuliskan evaluasi harian: misal distribusi berjalan tepat waktu pukul 06:00, ayam susut karena es, outlet mana saja yang menunda pembayaran..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ minHeight: '80px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary btn-lg">
                <Send size={18} />
                <span>Kirim Laporan Resmi ke Owner</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Archives of Reports Submitted to Owner */}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '16px' }}>
          {isOwner ? 'Daftar Arsip Laporan Operasional' : 'Daftar Arsip Laporan Harian ke Owner'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {supervisorReports.map(rep => (
            <div
              key={rep.id}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>{rep.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Dikirim oleh: <strong>{rep.supervisorName}</strong> pada {rep.submittedAt}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge ${rep.ownerVerified ? 'badge-success' : 'badge-purple'}`}>
                    {rep.status}
                  </span>
                </div>
              </div>

              {/* Metrics line */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', background: '#f8fafc', border: '1px solid var(--border-subtle)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '12px', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Beli Supplier:</span>
                  <div style={{ fontWeight: 700 }}>{formatRupiah(rep.inboundTotal)}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Jual Outlet:</span>
                  <div style={{ fontWeight: 700 }}>{formatRupiah(rep.outboundTotal)}</div>
                </div>
                <div>
                  <span style={{ color: '#059669' }}>Margin 2.5%:</span>
                  <div style={{ fontWeight: 800, color: '#059669' }}>+{formatRupiah(rep.marginProfitTotal)}</div>
                </div>
                <div>
                  <span style={{ color: '#dc2626' }}>Susut Opname:</span>
                  <div style={{ fontWeight: 700, color: '#dc2626' }}>-{formatRupiah(rep.opnameLossTotal)}</div>
                </div>
                <div>
                  <span style={{ color: '#d97706' }}>Piutang Malam:</span>
                  <div style={{ fontWeight: 700, color: '#d97706' }}>{formatRupiah(rep.unpaidTotalAmount)}</div>
                </div>
              </div>

              {/* Supervisor Notes */}
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '12px 14px', borderRadius: 'var(--radius-md)', marginBottom: '14px', fontSize: '0.84rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Catatan Supervisi:
                </div>
                <p style={{ fontStyle: 'italic', color: 'var(--text-main)' }}>"{rep.supervisorNotes}"</p>
              </div>

              {/* Owner Verification Feedback Section */}
              {rep.ownerVerified ? (
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '12px 16px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={18} color="var(--primary-600)" />
                  <div style={{ fontSize: '0.82rem' }}>
                    <strong style={{ color: 'var(--primary-700)' }}>Telah Diverifikasi Owner.</strong>
                    {rep.ownerFeedback && (
                      <span style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>
                        Tanggapan Owner: "{rep.ownerFeedback}"
                      </span>
                    )}
                  </div>
                </div>
              ) : isOwner ? (
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--primary-700)', marginBottom: '8px' }}>
                    Verifikasi Sebagai Owner:
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Tuliskan arahan / instruksi untuk kepala gudang..."
                      className="form-input"
                      style={{ flex: 1, minWidth: '220px' }}
                      value={ownerFeedback}
                      onChange={(e) => setOwnerFeedback(e.target.value)}
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        verifyReportByOwner(rep.id, ownerFeedback || 'Laporan disetujui tanpa catatan.');
                        setOwnerFeedback('');
                      }}
                    >
                      <ShieldCheck size={16} />
                      <span>Setujui & Verifikasi</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  *Menunggu tinjauan & persetujuan dari Owner.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
