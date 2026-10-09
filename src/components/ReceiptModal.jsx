import React, { useState } from 'react';
import { Printer, X, CheckCircle, Clock, MapPin, Phone, Building } from 'lucide-react';

export const ReceiptModal = ({ order, onClose }) => {
  const [printType, setPrintType] = useState('thermal'); // 'thermal' (80mm) or 'formal' (A4 Nota Resmi)

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  return (
    <div className="modal-overlay print-active">
      <div className="modal-content" style={{ maxWidth: printType === 'thermal' ? '460px' : '700px' }}>
        <div className="modal-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="modal-title">Cetak Nota Penjualan</span>
            <span className={`badge ${order.paymentStatus.includes('Lunas') ? 'badge-success' : 'badge-warning'}`}>
              {order.paymentStatus}
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Format Selector (Thermal vs Formal) */}
        <div className="no-print" style={{ padding: '12px 24px', background: 'rgba(0,0,0,0.15)', display: 'flex', gap: '10px' }}>
          <button
            className={`btn btn-sm ${printType === 'thermal' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setPrintType('thermal')}
          >
            Struk Thermal (80mm)
          </button>
          <button
            className={`btn btn-sm ${printType === 'formal' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setPrintType('formal')}
          >
            Faktur Nota Resmi (A4)
          </button>
        </div>

        <div className="modal-body">
          {printType === 'thermal' ? (
            /* THERMAL RECEIPT PREVIEW (80mm) */
            <div className="thermal-receipt print-area" id="printable-receipt">
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <div style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '0.05em' }}>MART PILLAR</div>
                <div style={{ fontSize: '11px', color: '#475569' }}>Central Hub & Supply Chain</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Distribusi Sayur, Ayam & Kemasan</div>
              </div>

              <div className="dashed-line"></div>

              <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>No. Nota:</span>
                  <strong>{order.invoiceNumber}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>No. Ref PO:</span>
                  <span>{order.poNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Waktu:</span>
                  <span>{order.date} {order.time}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Shift:</span>
                  <span>{order.shift}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tujuan Outlet:</span>
                  <strong>{order.outletName}</strong>
                </div>
              </div>

              <div className="dashed-line"></div>

              {/* Items List */}
              <div style={{ margin: '8px 0' }}>
                {order.items.map((item, idx) => (
                  <div key={idx} style={{ marginBottom: '6px' }}>
                    <div style={{ fontWeight: 600 }}>{item.productName}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                      <span>
                        {item.qty} {item.unit} x {formatRupiah(item.price)}
                      </span>
                      <span style={{ fontWeight: 600 }}>{formatRupiah(item.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="dashed-line"></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, margin: '4px 0' }}>
                <span>TOTAL TAGIHAN:</span>
                <span>{formatRupiah(order.totalAmount)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569' }}>
                <span>Status Pembayaran:</span>
                <strong style={{ color: order.paymentStatus.includes('Lunas') ? '#059669' : '#d97706' }}>
                  {order.paymentStatus}
                </strong>
              </div>

              {order.paidAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
                  <span>Waktu Bayar:</span>
                  <span>{order.paidAt} ({order.paymentMethod || 'Tunai'})</span>
                </div>
              )}

              <div className="dashed-line"></div>

              <div style={{ fontSize: '10px', textAlign: 'center', color: '#64748b', marginTop: '10px' }}>
                <p>Jadwal: Distribusi Pagi - Pembayaran Malam</p>
                <p style={{ marginTop: '3px' }}>Terima kasih atas kerja samanya!</p>
              </div>
            </div>
          ) : (
            /* FORMAL INVOICE / NOTA RESMI */
            <div className="card print-area" style={{ background: '#fff', color: '#111827', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #ea580c', paddingBottom: '14px', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ea580c' }}>MART PILLAR INDONESIA</h2>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>Gudang Pengadaan & Distribusi Bahan Baku</p>
                  <p style={{ fontSize: '11px', color: '#64748b' }}>Telp: 0812-7788-9900 | Email: admin@martpillar.id</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700 }}>FAKTUR NOTA PENJUALAN</h3>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>{order.invoiceNumber}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Ref PO: {order.poNumber}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '12px', marginBottom: '20px' }}>
                <div>
                  <div style={{ color: '#64748b', fontWeight: 600 }}>Ditujukan Kepada:</div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{order.outletName}</div>
                  <div style={{ color: '#475569' }}>Waktu Distribusi: {order.date} (Shift: {order.shift})</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#64748b', fontWeight: 600 }}>Ketentuan Pembayaran:</div>
                  <div style={{ fontWeight: 700, color: order.paymentStatus.includes('Lunas') ? '#059669' : '#d97706' }}>
                    {order.paymentStatus} (Jatuh Tempo: Malam Hari)
                  </div>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>No</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>Item Barang</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>Qty</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>Harga Satuan</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>{idx + 1}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>{it.productName}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>{it.qty} {it.unit}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>{formatRupiah(it.price)}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 600 }}>{formatRupiah(it.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, fontSize: '13px' }}>Total Tagihan:</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 800, fontSize: '14px', color: '#059669' }}>
                      {formatRupiah(order.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', marginTop: '30px', fontSize: '11px' }}>
                <div>
                  <p>Diterima Outlet,</p>
                  <div style={{ height: '50px' }}></div>
                  <p>( .................................... )</p>
                </div>
                <div>
                  <p>Pengirim / Driver Pagi,</p>
                  <div style={{ height: '50px' }}></div>
                  <p>( .................................... )</p>
                </div>
                <div>
                  <p>Admin / Gudang Mart Pillar,</p>
                  <div style={{ height: '50px' }}></div>
                  <p>( .................................... )</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer no-print">
          <button className="btn btn-secondary" onClick={onClose}>
            Tutup
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} />
            <span>Cetak Sekarang (Print)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
