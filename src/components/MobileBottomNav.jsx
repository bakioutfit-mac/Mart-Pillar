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
  Wallet,
  TrendingUp,
  MinusCircle
} from 'lucide-react';

export const MobileBottomNav = ({ activeTab, setActiveTab }) => {
  const { currentUser } = useApp();

  if (!currentUser) return null;

  const getMobileItems = () => {
    const role = currentUser.role;

    if (role === 'finance') {
      return [
        { id: 'revenue', label: 'Revenue', icon: TrendingUp },
        { id: 'outlet-expenses', label: 'Pengeluaran', icon: MinusCircle }
      ];
    }

    if (role === 'outlet') {
      return [
        { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
        { id: 'order', label: 'Transaksi', icon: ArrowLeftRight },
        { id: 'inventory', label: 'Katalog', icon: Package }
      ];
    }

    if (role === 'supervisor') {
      return [
        { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
        { id: 'order', label: 'Transaksi', icon: ArrowLeftRight },
        { id: 'invoices', label: 'Nota', icon: Receipt },
        { id: 'reports', label: 'Laporan', icon: FileSpreadsheet }
      ];
    }

    // Owner default (Bersih tanpa Transaksi, ditambah Revenue & Pengeluaran)
    return [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'revenue', label: 'Revenue', icon: TrendingUp },
      { id: 'outlet-expenses', label: 'Pengeluaran', icon: MinusCircle },
      { id: 'inventory', label: 'Stok', icon: Package },
      { id: 'invoices', label: 'Nota', icon: Receipt },
      { id: 'reports', label: 'Laporan', icon: FileSpreadsheet }
    ];
  };

  const mobileItems = getMobileItems();

  return (
    <nav className="mobile-bottom-nav no-print">
      {mobileItems.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
