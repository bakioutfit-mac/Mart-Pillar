import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  KeyRound,
  Phone,
  Store,
  UserCheck,
  CheckCircle2,
  X,
  Search,
  Tag
} from 'lucide-react';

export const RoleManagementView = () => {
  const { 
    currentUser, 
    users, 
    outlets, 
    customRoles, 
    addCustomRole, 
    addUser, 
    updateUser, 
    deleteUser 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // Modal State for Add / Edit User
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    phone: '',
    pin: '',
    roleLabel: 'Admin Gudang',
    outletId: outlets[0]?.id || ''
  });

  // State for Add Custom Role Input
  const [newRoleInput, setNewRoleInput] = useState('');
  const [isAddingCustomRole, setIsAddingCustomRole] = useState(false);

  // Only owner can view this page
  if (currentUser.role !== 'owner') {
    return (
      <div className="content-body">
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <ShieldCheck size={48} color="#dc2626" style={{ marginBottom: '14px' }} />
          <h2 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>Akses Khusus Owner</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Pengaturan akun pengguna & role hak akses hanya dapat dikelola oleh Owner Mart Pillar.</p>
        </div>
      </div>
    );
  }

  // Filter users
  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchSearch = u.name.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q)) ||
      (u.title && u.title.toLowerCase().includes(q)) ||
      (u.roleLabel && u.roleLabel.toLowerCase().includes(q));

    const matchRole = filterRole === 'all' || 
      (filterRole === 'owner' && u.role === 'owner') ||
      (filterRole === 'finance' && u.role === 'finance') ||
      (filterRole === 'supervisor' && u.role === 'supervisor') ||
      (filterRole === 'outlet' && u.role === 'outlet');

    return matchSearch && matchRole;
  });

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserFormData({
      name: '',
      phone: '',
      pin: '123456',
      roleLabel: 'Admin Gudang',
      outletId: outlets[0]?.id || ''
    });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u) => {
    setEditingUser(u);
    setUserFormData({
      name: u.name,
      phone: u.phone,
      pin: u.pin || '123456',
      roleLabel: u.roleLabel || (u.role === 'supervisor' ? 'Admin Gudang' : u.role === 'outlet' ? 'Login Outlet' : 'Owner'),
      outletId: u.outletId || outlets[0]?.id || ''
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!userFormData.name || !userFormData.phone || !userFormData.pin) {
      alert('Nama, No. HP/WhatsApp, dan PIN 6 digit wajib diisi.');
      return;
    }

    if (userFormData.pin.length !== 6 || !/^\d{6}$/.test(userFormData.pin)) {
      alert('PIN harus berupa 6 digit angka.');
      return;
    }

    const payload = {
      ...userFormData,
      phone: userFormData.phone.replace(/[^0-9]/g, '')
    };

    if (editingUser) {
      updateUser(editingUser.id, payload);
    } else {
      addUser(payload);
    }

    setIsUserModalOpen(false);
  };

  const handleDeleteUser = (u) => {
    if (u.id === currentUser.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif login.');
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus akun "${u.name}" (${u.roleLabel || u.role})?`)) {
      const res = deleteUser(u.id);
      if (res && !res.success) {
        alert(res.message);
      }
    }
  };

  const handleAddRoleSubmit = (e) => {
    e.preventDefault();
    const trimmed = newRoleInput.trim();
    if (!trimmed) return;
    addCustomRole(trimmed);
    setUserFormData(prev => ({ ...prev, roleLabel: trimmed }));
    setNewRoleInput('');
    setIsAddingCustomRole(false);
  };

  const getRoleBadge = (user) => {
    if (user.role === 'owner') {
      return <span className="badge badge-warning" style={{ fontWeight: 800 }}>👑 Owner</span>;
    }
    if (user.role === 'finance' || user.roleLabel === 'Finance Pusat') {
      return <span className="badge badge-success" style={{ fontWeight: 800 }}>💳 Finance Pusat</span>;
    }
    if (user.role === 'supervisor' || user.roleLabel === 'Admin Gudang') {
      return <span className="badge badge-primary" style={{ fontWeight: 800 }}>📦 Admin Gudang</span>;
    }
    if (user.role === 'outlet' || user.roleLabel === 'Login Outlet') {
      return <span className="badge badge-info" style={{ fontWeight: 800 }}>🏪 Login Outlet</span>;
    }
    return <span className="badge badge-success" style={{ fontWeight: 800 }}>🏷️ {user.roleLabel || user.role}</span>;
  };

  return (
    <div className="content-body" style={{ paddingBottom: '90px' }}>
      {/* Header Halaman */}
      <div className="page-header">
        <div>
          <div className="page-title">Kelola Role & Pengguna (Khusus Owner)</div>
          <div className="page-desc">
            Kontrol penuh akun staff & cabang: Buat akun Admin Gudang, Login Outlet, dan atur penambahan Role kustom baru.
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAddUser}>
          <Plus size={16} />
          <span>+ Buat Akun Pengguna Baru</span>
        </button>
      </div>

      {/* Bar Daftar Role yang Tersedia */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px', background: '#fffaf5', border: '1.5px solid var(--primary-300)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary-800)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={18} color="var(--primary-600)" />
              <span>Daftar Role Aktif Sistem:</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Owner dapat menambahkan role baru kustom kapan saja sesuai struktur organisasi.
            </div>
          </div>

          {/* List Role Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="badge badge-warning" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>👑 Owner</span>
            <span className="badge badge-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>📦 Admin Gudang</span>
            <span className="badge badge-info" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>🏪 Login Outlet</span>
            
            {customRoles.filter(r => !['Admin Gudang', 'Login Outlet', 'Owner'].includes(r)).map((r, i) => (
              <span key={i} className="badge badge-success" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                🏷️ {r}
              </span>
            ))}

            {!isAddingCustomRole ? (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setIsAddingCustomRole(true)}
                style={{ fontSize: '0.78rem' }}
              >
                <Plus size={14} />
                <span>Tambah Role Baru</span>
              </button>
            ) : (
              <form onSubmit={handleAddRoleSubmit} style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Ketik nama role baru..."
                  className="form-input"
                  style={{ padding: '4px 8px', fontSize: '0.82rem', width: '180px' }}
                  value={newRoleInput}
                  onChange={(e) => setNewRoleInput(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '4px 10px' }}>
                  Simpan
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsAddingCustomRole(false)} style={{ padding: '4px 8px' }}>
                  <X size={14} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar Pengguna */}
      <div className="card" style={{ marginBottom: '20px', padding: '14px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Cari pengguna, nomor HP, atau role..."
              className="form-input"
              style={{ paddingLeft: '38px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className={`btn btn-sm ${filterRole === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterRole('all')}
            >
              Semua Akun ({users.length})
            </button>
            <button
              className={`btn btn-sm ${filterRole === 'finance' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterRole('finance')}
            >
              Finance Pusat
            </button>
            <button
              className={`btn btn-sm ${filterRole === 'supervisor' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterRole('supervisor')}
            >
              Admin Gudang
            </button>
            <button
              className={`btn btn-sm ${filterRole === 'outlet' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterRole('outlet')}
            >
              Login Outlet
            </button>
          </div>
        </div>
      </div>

      {/* Grid Kartu Pengguna */}
      <div className="grid-2">
        {filteredUsers.map(user => {
          const linkedOutlet = user.outletId ? outlets.find(o => o.id === user.outletId) : null;
          const isCurrentActive = user.id === currentUser.id;

          return (
            <div key={user.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: isCurrentActive ? '4px solid #ea580c' : '1px solid var(--border-medium)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: user.role === 'owner' ? '#ea580c' : user.role === 'supervisor' ? '#2563eb' : '#059669',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.05rem'
                    }}>
                      {user.avatar || user.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{user.name}</span>
                        {isCurrentActive && (
                          <span className="badge badge-warning" style={{ fontSize: '0.62rem' }}>Anda</span>
                        )}
                      </div>
                      <div style={{ marginTop: '2px' }}>
                        {getRoleBadge(user)}
                      </div>
                    </div>
                  </div>

                  {/* Tombol Aksi */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenEditUser(user)}
                      title="Edit Akun"
                    >
                      <Edit2 size={14} />
                    </button>
                    {!isCurrentActive && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDeleteUser(user)}
                        style={{ color: '#dc2626' }}
                        title="Hapus Akun"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Info Kredensial Login */}
                <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.86rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} color="var(--primary-600)" />
                      <span>No. HP Login:</span>
                    </span>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>{user.displayPhone || user.phone}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <KeyRound size={14} color="var(--primary-600)" />
                      <span>PIN Akses (6 Digit):</span>
                    </span>
                    <strong style={{ fontFamily: 'var(--font-mono)', letterSpacing: '2px', background: '#fff', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                      {user.pin || '••••••'}
                    </strong>
                  </div>

                  {user.role === 'outlet' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px dashed var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Store size={14} color="var(--primary-600)" />
                        <span>Cabang Terhubung:</span>
                      </span>
                      <strong style={{ color: 'var(--primary-700)' }}>
                        {linkedOutlet ? linkedOutlet.name : 'Belum Ditautkan'}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '14px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                ID Akun: {user.id} | {user.title || user.roleLabel}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Tambah / Edit Pengguna */}
      {isUserModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="var(--primary-600)" />
                <span className="modal-title">
                  {editingUser ? 'Edit Akun Pengguna' : 'Buat Akun Pengguna Baru'}
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setIsUserModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Lengkap Pengguna / Staff:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Hendra Wijaya"
                    className="form-input"
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">No. HP / WhatsApp (Untuk Login):</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 081220000002"
                      className="form-input"
                      value={userFormData.phone}
                      onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">PIN Akses (6 Digit Angka):</label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="6 Digit PIN"
                      className="form-input"
                      style={{ letterSpacing: '2px', fontWeight: 800 }}
                      value={userFormData.pin}
                      onChange={(e) => setUserFormData({ ...userFormData, pin: e.target.value.replace(/[^0-9]/g, '') })}
                    />
                  </div>
                </div>

                {/* Pilihan Role */}
                <div className="form-group">
                  <label className="form-label">Pilih Role Pengguna:</label>
                  <select
                    className="form-select"
                    value={userFormData.roleLabel}
                    onChange={(e) => setUserFormData({ ...userFormData, roleLabel: e.target.value })}
                  >
                    <option value="Admin Gudang">Admin Gudang (Kelola Stok & Transaksi)</option>
                    <option value="Login Outlet">Login Outlet (Pemesanan Cabang Outlet)</option>
                    <option value="Owner">Owner (Akses Penuh Seluruh Sistem)</option>
                    {customRoles
                      .filter(r => !['Admin Gudang', 'Login Outlet', 'Owner'].includes(r))
                      .map((r, i) => (
                        <option key={i} value={r}>{r} (Role Kustom)</option>
                      ))
                    }
                  </select>
                </div>

                {/* Jika role adalah Login Outlet, muncul pilihan Cabang Outlet */}
                {userFormData.roleLabel === 'Login Outlet' && (
                  <div className="form-group" style={{ background: '#fffaf5', border: '1px solid var(--primary-200)', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
                    <label className="form-label" style={{ color: 'var(--primary-800)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Store size={16} color="var(--primary-600)" />
                      <span>Hubungkan Akun ke Cabang Outlet:</span>
                    </label>
                    <select
                      className="form-select"
                      value={userFormData.outletId}
                      onChange={(e) => setUserFormData({ ...userFormData, outletId: e.target.value })}
                    >
                      {outlets.map(o => (
                        <option key={o.id} value={o.id}>
                          {o.name} ({o.code || o.id})
                        </option>
                      ))}
                    </select>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      *Pesanan yang dibuat oleh akun ini akan otomatis tercatat atas nama cabang ini.
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsUserModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle2 size={16} />
                  <span>{editingUser ? 'Simpan Perubahan' : 'Buat Akun'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
