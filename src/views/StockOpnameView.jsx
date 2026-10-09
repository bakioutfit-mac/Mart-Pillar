import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  RefreshCw,
  Search,
  Filter,
  Layers,
  History
} from 'lucide-react';

export const StockOpnameView = () => {
  const { 
    products, 
    opnameLogs, 
    recordStockOpname, 
    currentUser 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' or 'history'

  // Input states for opname per product
  const [physicalCounts, setPhysicalCounts] = useState({});
  const [reasons, setReasons] = useState({});
  const [successLogs, setSuccessLogs] = useState([]);

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

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
      product.category === 'ayam' ? 'Susut Penirisan Es (Alami)' :
      product.category === 'sayur' ? 'Daun Busuk/Kering (Waste)' :
      'Selisih Hitung Gudang'
    );

    const log = recordStockOpname({
      productId: product.id,
      physicalStock: physNum,
      reason: reasonText,
      auditor: currentUser.name
    });

    setSuccessLogs(prev => [log, ...prev]);
    // Clear input for this product
    setPhysicalCounts(prev => {
      const next = { ...prev };
      delete next[product.id];
      return next;
    });
  };

  return (
    <div className="content-body">
      <div className="page-header">
        <div>
          <div className="page-title">Sistem Stok Opname & Penyesuaian (Adjustment)</div>
          <div className="page-desc">
            Pencocokan stok fisik vs sistem — Kelola penyusutan alami ayam, sayuran busuk (waste), dan selisih kemasan cup.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn btn-sm ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('audit')}
          >
            <ClipboardCheck size={16} />
            <span>Form Hitung Opname</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('history')}
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
          marginBottom: '20px',
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

      {activeTab === 'audit' ? (
        <>
          {/* Filter Bar */}
          <div className="card" style={{ marginBottom: '20px', padding: '14px 18px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Cari nama barang opname..."
                  className="form-input"
                  style={{ paddingLeft: '36px' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                <button
                  className={`btn btn-sm ${selectedCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedCategory('all')}
                >
                  Semua
                </button>
                <button
                  className={`btn btn-sm ${selectedCategory === 'ayam' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedCategory('ayam')}
                >
                  Ayam & Daging
                </button>
                <button
                  className={`btn btn-sm ${selectedCategory === 'sayur' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedCategory('sayur')}
                >
                  Sayuran Segar
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
                  Bumbu & Pokok
                </button>
              </div>
            </div>
          </div>

          {/* Opname Table */}
          <div className="card">
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th>Kategori</th>
                    <th style={{ width: '130px' }}>Stok Sistem</th>
                    <th style={{ width: '150px' }}>Hasil Hitung Fisik</th>
                    <th style={{ width: '120px' }}>Selisih</th>
                    <th style={{ width: '220px' }}>Klasifikasi Alasan Selisih</th>
                    <th style={{ textAlign: 'right', width: '160px' }}>Aksi Penyesuaian</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(prod => {
                    const enteredCount = physicalCounts[prod.id];
                    const hasEntered = enteredCount !== undefined && enteredCount !== '';
                    const physNum = hasEntered ? Number(enteredCount) : prod.stock;
                    const diff = Number((physNum - prod.stock).toFixed(2));
                    const selectedReason = reasons[prod.id] || (
                      prod.category === 'ayam' ? 'Susut Penirisan Es (Alami)' :
                      prod.category === 'sayur' ? 'Daun Menguning/Busuk (Waste)' :
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
                              type="number"
                              step="any"
                              placeholder={prod.stock.toString()}
                              className="form-input"
                              style={{ width: '90px' }}
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
                              fontWeight: 700,
                              color: diff === 0 ? '#34d399' : diff < 0 ? '#fb7185' : '#60a5fa'
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
                            style={{ fontSize: '0.78rem', padding: '6px 8px' }}
                            value={selectedReason}
                            onChange={(e) => handleReasonChange(prod.id, e.target.value)}
                          >
                            <option value="Susut Penirisan Es (Alami)">Susut Penirisan Es (Alami)</option>
                            <option value="Daun Menguning/Busuk (Waste)">Sayur Busuk/Kuning (Waste)</option>
                            <option value="Kerusakan Kemasan/Pecah">Kemasan Rusak / Cacat</option>
                            <option value="Selisih Hitung Gudang">Selisih Hitung Fisik Gudang</option>
                            <option value="Kadaluwarsa / Expired">Barang Kadaluwarsa</option>
                            <option value="Pengecekan Rutin Normal">Pengecekan Rutin Normal</option>
                          </select>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={!hasEntered}
                            onClick={() => handleAdjustSingle(prod)}
                            title="Terapkan hasil hitung fisik ke sistem"
                          >
                            <RefreshCw size={13} />
                            <span>Terapkan</span>
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
        /* Opname Audit History */
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '14px' }}>
            Riwayat Log Penyesuaian Stok Opname
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>No. Audit</th>
                  <th>Tanggal & Jam</th>
                  <th>Auditor</th>
                  <th>Nama Barang</th>
                  <th>Stok Sistem</th>
                  <th>Stok Fisik</th>
                  <th>Selisih (Susut/Lebih)</th>
                  <th>Alasan Selisih</th>
                  <th style={{ textAlign: 'right' }}>Dampak Finansial (HPP)</th>
                </tr>
              </thead>
              <tbody>
                {opnameLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{log.id}</td>
                    <td>{log.date} ({log.time})</td>
                    <td>{log.auditor}</td>
                    <td style={{ fontWeight: 600 }}>{log.productName}</td>
                    <td>{log.systemStock} {log.unit}</td>
                    <td>{log.physicalStock} {log.unit}</td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: log.difference < 0 ? '#fb7185' : '#34d399'
                      }}>
                        {log.difference > 0 ? `+${log.difference}` : log.difference} {log.unit}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-warning">{log.reason}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: log.financialImpact < 0 ? '#fb7185' : '#34d399' }}>
                      {formatRupiah(log.financialImpact)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
