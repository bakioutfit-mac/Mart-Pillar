import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  ShoppingCart,
  ArrowLeftRight,
  Receipt,
  Truck,
  ClipboardCheck,
  FileSpreadsheet,
  Package,
  LogOut,
  Store,
  Clock,
  Users,
  Wallet,
  TrendingUp,
  MinusCircle
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, onOpenDailySummary }) => {
  const { currentUser, logout } = useApp();

  if (!currentUser) return null;

  const getNavItems = () => {
    const role = currentUser.role;

    const items = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        roles: ['owner', 'supervisor', 'outlet']
      },
      {
        id: 'revenue',
        label: 'Revenue Harian',
        icon: TrendingUp,
        roles: ['finance', 'owner']
      },
      {
        id: 'outlet-expenses',
        label: 'Pengeluaran Outlet',
        icon: MinusCircle,
        roles: ['finance', 'owner']
      },
      {
        id: 'order',
        label: 'Transaksi',
        icon: ArrowLeftRight,
        roles: ['outlet', 'supervisor']
      },
      {
        id: 'invoices',
        label: 'Nota & Pembayaran',
        icon: Receipt,
        roles: ['supervisor', 'owner']
      },
      {
        id: 'suppliers',
        label: 'Supplier',
        icon: Truck,
        roles: ['supervisor', 'owner']
      },
      {
        id: 'inventory',
        label: 'Stok',
        icon: Package,
        roles: ['owner', 'supervisor', 'outlet']
      },
      {
        id: 'reports',
        label: role === 'owner' ? 'Laporan' : 'Laporan ke Owner',
        icon: FileSpreadsheet,
        roles: ['supervisor', 'owner']
      },
      {
        id: 'outlets',
        label: 'Data Outlet',
        icon: Store,
        roles: ['owner']
      },
      {
        id: 'roles',
        label: 'Kelola Role',
        icon: Users,
        roles: ['owner']
      }
    ];

    return items.filter(item => item.roles.includes(role));
  };

  const navItems = getNavItems();

  return (
    <aside className="sidebar no-print">
      <div className="sidebar-header">
        <div className="brand-icon" style={{ width: '36px', height: '36px' }}>
          <Store size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em', color: 'var(--primary-700)' }}>
            MART PILLAR
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Gudang & Pengadaan
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div style={{ padding: '0 8px 6px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          Menu Navigasi
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Quick action for atasan/owner to open rekap harian */}
        {['supervisor', 'owner'].includes(currentUser.role) && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'flex-start', gap: '8px', fontSize: '0.78rem' }}
              onClick={onOpenDailySummary}
            >
              <Clock size={15} color="var(--accent-amber)" />
              <span>Cetak Rekap Penjualan Hari Ini</span>
            </button>
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card" style={{ marginBottom: '10px' }}>
          <div className="user-avatar">
            {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="user-info">
            <div className="user-name">{currentUser.name}</div>
            <div className="user-role-label">{currentUser.title}</div>
          </div>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', justifyContent: 'center', gap: '6px', color: '#dc2626', borderColor: '#fecaca' }}
          onClick={() => {
            if (window.confirm('Yakin ingin keluar dari akun?')) {
              logout();
            }
          }}
          title="Keluar dari sistem"
        >
          <LogOut size={14} />
          <span>Keluar / Logout</span>
        </button>
      </div>
    </aside>
  );
};
