import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Store, 
  UserCheck, 
  Sun, 
  Moon, 
  RotateCcw, 
  ChevronDown, 
  ShieldCheck, 
  User, 
  ShoppingBag, 
  Printer,
  Calendar,
  LogOut
} from 'lucide-react';

export const Navbar = ({ onOpenDailySummary }) => {
  const { 
    currentUser, 
    users, 
    switchUser, 
    logout,
    activeShift, 
    setActiveShift, 
    resetDemoData,
    orders
  } = useApp();

  if (!currentUser) return null;

  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const todayStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  const unpaidCount = orders.filter(o => !o.paymentStatus.includes('Lunas')).length;

  const getRoleBadge = (role) => {
    switch (role) {
      case 'owner': return { label: 'Owner / Pemilik', color: 'badge-purple' };
      case 'finance': return { label: 'Finance Pusat', color: 'badge-success' };
      case 'supervisor': return { label: 'Atasan / Kepala Gudang', color: 'badge-info' };
      case 'outlet': return { label: 'Outlet Mart', color: 'badge-warning' };
      default: return { label: role, color: 'badge-info' };
    }
  };

  const roleMeta = getRoleBadge(currentUser.role);

  return (
    <header className="topbar no-print">
      <div className="brand-wrapper">
        <div className="brand-icon">
          <Store size={22} />
        </div>
        <div className="brand-text">
          <h1>MART PILLAR</h1>
          <p>Supply Chain & Distribusi Outlet</p>
        </div>
      </div>

      <div className="topbar-actions">
        {/* Shift Badge Indicator */}
        <button
          className={`shift-badge ${activeShift === 'Distribusi Pagi' ? 'morning' : ''}`}
          onClick={() => setActiveShift(activeShift === 'Distribusi Pagi' ? 'Pembayaran Malam' : 'Distribusi Pagi')}
          title="Klik untuk simulasi shift kerja harian"
          style={{ cursor: 'pointer', border: '1px solid currentColor' }}
        >
          {activeShift === 'Distribusi Pagi' ? <Sun size={15} /> : <Moon size={15} />}
          <span>{activeShift}</span>
          {activeShift === 'Pembayaran Malam' && unpaidCount > 0 && (
            <span style={{ 
              background: '#ef4444', 
              color: 'white', 
              borderRadius: '99px', 
              padding: '1px 6px', 
              fontSize: '0.7rem' 
            }}>
              {unpaidCount} Tagihan
            </span>
          )}
        </button>

        {/* Date Display */}
        <div style={{ display: 'none', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }} className="hide-on-mobile">
          <Calendar size={14} />
          <span>{todayStr}</span>
        </div>

        {/* Quick Role Switcher (Crucial for pair testing) */}
        <div style={{ position: 'relative' }}>
          <button 
            className="role-switcher-btn"
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            title="Ganti akun untuk menguji fitur Owner, Atasan, atau Outlet"
          >
            <ShieldCheck size={16} color="var(--primary-400)" />
            <div style={{ textAlign: 'left', lineHeight: '1.2' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{currentUser.name}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{roleMeta.label}</div>
            </div>
            <ChevronDown size={14} />
          </button>

          {showRoleDropdown && (
            <div 
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: '260px',
                background: '#ffffff',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-lg)',
                padding: '8px',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 60
              }}
            >
              <div style={{ padding: '6px 10px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Simulasi Login Peran:
              </div>
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => {
                    switchUser(u.id);
                    setShowRoleDropdown(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 10px',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    background: u.id === currentUser.id ? '#fff7ed' : 'transparent',
                    color: u.id === currentUser.id ? 'var(--primary-600)' : 'var(--text-main)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.82rem'
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: u.id === currentUser.id ? 'var(--primary-gradient)' : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: u.id === currentUser.id ? 'white' : 'var(--text-secondary)'
                  }}>
                    {u.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{u.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{u.title}</div>
                  </div>
                </button>
              ))}

              {/* Logout Option in dropdown */}
              <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => {
                    setShowRoleDropdown(false);
                    if (window.confirm('Yakin ingin keluar dari akun?')) {
                      logout();
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 10px',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    color: '#dc2626',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 700
                  }}
                >
                  <LogOut size={15} />
                  <span>Keluar / Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Logout Button */}
        <button
          onClick={() => {
            if (window.confirm('Yakin ingin keluar dari akun?')) {
              logout();
            }
          }}
          className="btn btn-secondary btn-sm"
          title="Keluar / Logout"
          style={{ padding: '6px 10px', color: '#dc2626', borderColor: '#fecaca' }}
        >
          <LogOut size={14} />
          <span style={{ fontSize: '0.78rem' }}>Keluar</span>
        </button>

        {/* Reset Demo Data Button */}
        <button 
          onClick={() => {
            if (window.confirm('Reset data Mart Pillar ke kondisi contoh awal?')) {
              resetDemoData();
            }
          }}
          className="btn btn-secondary btn-sm"
          title="Reset semua data demo ke semula"
          style={{ padding: '6px 10px' }}
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </header>
  );
};
