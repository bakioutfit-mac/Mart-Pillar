import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ReceiptModal } from './components/ReceiptModal';
import { DailySalesSummaryModal } from './components/DailySalesSummaryModal';
import { LoginModal } from './components/LoginModal';

import { DashboardView } from './views/DashboardView';
import { TransactionView } from './views/TransactionView';
import { InvoicesView } from './views/InvoicesView';
import { SupplierView } from './views/SupplierView';
import { StockOpnameView } from './views/StockOpnameView';
import { SupervisorReportView } from './views/SupervisorReportView';
import { InventoryView } from './views/InventoryView';
import { OutletManagementView } from './views/OutletManagementView';
import { RoleManagementView } from './views/RoleManagementView';
import { LoginView } from './views/LoginView';
import { RevenueView } from './views/RevenueView';
import { OutletExpensesView } from './views/OutletExpensesView';

const MainApp = () => {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState(() => {
    return currentUser?.role === 'finance' ? 'revenue' : 'dashboard';
  });
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);
  const [isDailySummaryOpen, setIsDailySummaryOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Automatically switch tab when logging in or switching to finance
  React.useEffect(() => {
    if (currentUser?.role === 'finance' && (activeTab === 'dashboard' || activeTab === 'order')) {
      setActiveTab('revenue');
    }
  }, [currentUser?.role]);

  // If user is not authenticated, show Login View
  if (!currentUser) {
    return <LoginView />;
  }

  // Render view depending on activeTab
  const renderView = () => {
    switch (activeTab) {
      case 'revenue':
      case 'finance':
        return <RevenueView />;
      case 'outlet-expenses':
      case 'expenses':
        return <OutletExpensesView />;
      case 'dashboard':
        return (
          <DashboardView
            setActiveTab={setActiveTab}
            onOpenReceipt={(order) => setSelectedReceiptOrder(order)}
            onOpenDailySummary={() => setIsDailySummaryOpen(true)}
          />
        );
      case 'order':
        return (
          <TransactionView
            onOrderCreated={(order) => setSelectedReceiptOrder(order)}
          />
        );
      case 'invoices':
        return (
          <InvoicesView
            onOpenReceipt={(order) => setSelectedReceiptOrder(order)}
            onOpenDailySummary={() => setIsDailySummaryOpen(true)}
          />
        );
      case 'suppliers':
      case 'inbound':
        return <SupplierView onNavigateToInvoices={() => setActiveTab('invoices')} />;
      case 'inventory':
      case 'stock':
        return <InventoryView />;
      case 'opname':
        return <InventoryView defaultSubTab="opname" />;
      case 'reports':
        return <SupervisorReportView />;
      case 'outlets':
        return <OutletManagementView onOpenReceipt={(order) => setSelectedReceiptOrder(order)} />;
      case 'roles':
        return <RoleManagementView />;
      default:
        return (
          <DashboardView
            setActiveTab={setActiveTab}
            onOpenReceipt={(order) => setSelectedReceiptOrder(order)}
            onOpenDailySummary={() => setIsDailySummaryOpen(true)}
          />
        );
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar for Desktop */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDailySummary={() => setIsDailySummaryOpen(true)}
      />

      <div className="main-content">
        {/* Sticky Topbar */}
        <Navbar
          onOpenDailySummary={() => setIsDailySummaryOpen(true)}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
        />

        {/* Dynamic View Body */}
        <main>{renderView()}</main>
      </div>

      {/* Mobile & Tablet Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Modal Dialogs */}
      {selectedReceiptOrder && (
        <ReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}

      {isDailySummaryOpen && (
        <DailySalesSummaryModal
          onClose={() => setIsDailySummaryOpen(false)}
        />
      )}

      {isLoginModalOpen && (
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
