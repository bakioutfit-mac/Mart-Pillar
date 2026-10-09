import React from 'react';
import { useApp } from '../context/AppContext';
import { Printer, X, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export const DailySalesSummaryModal = ({ onClose }) => {
  const { orders, currentUser } = useApp();

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const todayStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const totalOmset = orders.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalCost = orders.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
  const totalMargin = orders.reduce((acc, curr) => acc + (curr.marginProfit || 0), 0);

  const paidOrders = orders.filter(o => o.paymentStatus.includes('Lunas'));
  const unpaidOrders = orders.filter(o => !o.paymentStatus.includes('Lunas'));

  const paidAmount = paidOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const unpaidAmount = unpaidOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay print-active">
      <div className="modal-content" style={{ maxWidth: '680px' }}>
        <div className="modal-header no-print">
          <div>
            <div className="modal-title">Rekapitulasi Penjualan Harian</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Laporan Penutupan Harian (Shift Pagi & Malam)
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Print container */}
          <div className="card print-area" style={{ background: '#fff', color: '#0f172a', padding: '24px' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px dashed #94a3b8', paddingBottom: '16px', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ea580c' }}>MART PILLAR</h2>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>REKAP LAPORAN PENJUALAN HARIAN</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Tanggal: {todayStr}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Dicetak oleh: {currentUser.name} ({currentUser.title})</div>
            </div>

            {/* Quick KPI stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>TOTAL OMSET</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#ea580c' }}>{formatRupiah(totalOmset)}</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>{orders.length} Transaksi</div>
              </div>
              <div style={{ background: '#fff7ed', padding: '10px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                <div style={{ fontSize: '11px', color: '#c2410c', fontWeight: 600 }}>LUNAS MALAM INI</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#ea580c' }}>{formatRupiah(paidAmount)}</div>
                <div style={{ fontSize: '10px', color: '#ea580c' }}>{paidOrders.length} Nota Selesai</div>
              </div>
              <div style={{ background: '#fef2f2', padding: '10px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                <div style={{ fontSize: '11px', color: '#b91c1c', fontWeight: 600 }}>TAGIHAN BELUM BAYAR</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#dc2626' }}>{formatRupiah(unpaidAmount)}</div>
                <div style={{ fontSize: '10px', color: '#dc2626' }}>{unpaidOrders.length} Nota Tertunda</div>
              </div>
            </div>

            {/* Margin Info for Internal */}
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <div>
                <strong style={{ color: '#c2410c' }}>Estimasi Akumulasi Margin 2.5%:</strong>
                <span style={{ color: '#9a3412', marginLeft: '6px' }}>Keuntungan kotor distribusi hari ini</span>
              </div>
              <strong style={{ color: '#ea580c', fontSize: '13px' }}>{formatRupiah(totalMargin)}</strong>
            </div>

            {/* List of orders table */}
            <div style={{ fontSize: '11px' }}>
              <div style={{ fontWeight: 700, marginBottom: '8px', color: '#334155' }}>RINCIAN NOTA HARI INI:</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '6px 8px' }}>No. Nota</th>
                    <th style={{ padding: '6px 8px' }}>Outlet</th>
                    <th style={{ padding: '6px 8px' }}>Waktu / Shift</th>
                    <th style={{ padding: '6px 8px' }}>Status Bayar</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600 }}>{ord.invoiceNumber}</td>
                      <td style={{ padding: '6px 8px' }}>{ord.outletName}</td>
                      <td style={{ padding: '6px 8px', color: '#64748b' }}>{ord.shift}</td>
                      <td style={{ padding: '6px 8px' }}>
                        <span style={{
                          color: ord.paymentStatus.includes('Lunas') ? '#16a34a' : '#ea580c',
                          fontWeight: 700
                        }}>
                          {ord.paymentStatus}
                        </span>
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>
                        {formatRupiah(ord.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signatures */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center', marginTop: '30px', fontSize: '11px' }}>
              <div>
                <p>Petugas Administrasi / Gudang,</p>
                <div style={{ height: '40px' }}></div>
                <p><strong>{currentUser.name}</strong></p>
              </div>
              <div>
                <p>Mengetahui / Supervisor,</p>
                <div style={{ height: '40px' }}></div>
                <p><strong>( Kepala Gudang Mart )</strong></p>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer no-print">
          <button className="btn btn-secondary" onClick={onClose}>
            Tutup
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} />
            <span>Cetak Rekap Penjualan Harian</span>
          </button>
        </div>
      </div>
    </div>
  );
};
