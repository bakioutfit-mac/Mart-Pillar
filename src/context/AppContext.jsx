import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_USERS,
  INITIAL_OUTLETS,
  INITIAL_SUPPLIERS,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_INBOUND,
  INITIAL_OPNAME,
  INITIAL_SUPERVISOR_REPORTS,
  INITIAL_OUTLET_STOCKS,
  INITIAL_DAILY_REVENUES,
  INITIAL_OUTLET_EXPENSES,
  calculateSellPrice
} from '../data/initialData';
import {
  fetchLivePwaCashierReports,
  mapPwaReportToDailyRevenue,
  mapPwaReportToNonProductionExpenses,
  submitLivePwaCashierReport,
  PWA_CONFIG
} from '../services/pwaCashierService';

const AppContext = createContext(null);

export const normalizePhone = (num) => {
  if (!num) return '';
  let cleaned = String(num).replace(/[^0-9]/g, '');
  if (cleaned.startsWith('62')) {
    cleaned = '0' + cleaned.slice(2);
  } else if (cleaned.startsWith('8')) {
    cleaned = '0' + cleaned;
  }
  return cleaned;
};

export const AppProvider = ({ children }) => {
  // One-time data version migration: Bersihkan data dummy lama dari browser localStorage
  const DATA_VERSION = 'mart_pillar_clean_business_v1';
  if (typeof window !== 'undefined') {
    try {
      const activeVer = localStorage.getItem('mart_pillar_data_version');
      if (activeVer !== DATA_VERSION) {
        // Hapus seluruh transaksi operasional dummy
        localStorage.removeItem('mart_pillar_orders');
        localStorage.removeItem('mart_pillar_inbounds');
        localStorage.removeItem('mart_pillar_supplierOrders');
        localStorage.removeItem('mart_pillar_opnameLogs');
        localStorage.removeItem('mart_pillar_reports');
        localStorage.removeItem('mart_pillar_outletStocks');
        localStorage.removeItem('mart_pillar_dailyRevenues');
        localStorage.removeItem('mart_pillar_outletExpenses');
        // Reset daftar outlet & users ke outlet resmi
        localStorage.removeItem('mart_pillar_outlets');
        localStorage.removeItem('mart_pillar_users');
        localStorage.removeItem('mart_pillar_currentUser');
        localStorage.setItem('mart_pillar_data_version', DATA_VERSION);
      }
    } catch (e) {
      console.warn('Migration error', e);
    }
  }

  // Persistence with localStorage
  const getStorage = (key, fallback) => {
    try {
      const saved = localStorage.getItem(`mart_pillar_${key}`);
      if (!saved) return fallback;
      const parsed = JSON.parse(saved);

      if (key === 'currentUser' && parsed) {
        const valid = INITIAL_USERS.find(u => u.id === parsed.id);
        if (valid) return { ...parsed, ...valid };
        return fallback;
      }

      return parsed;
    } catch (e) {
      console.error('Error loading localStorage', e);
      return fallback;
    }
  };

  const [users, setUsers] = useState(() => getStorage('users', INITIAL_USERS));
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = getStorage('currentUser', INITIAL_USERS[0]);
    if (saved && saved.id) {
      const fresh = INITIAL_USERS.find(u => u.id === saved.id);
      if (fresh) {
        return { ...saved, phone: fresh.phone, displayPhone: fresh.displayPhone, pin: fresh.pin };
      }
    }
    return saved;
  });
  const [outlets, setOutlets] = useState(() => getStorage('outlets', INITIAL_OUTLETS));
  const [suppliers, setSuppliers] = useState(() => getStorage('suppliers', INITIAL_SUPPLIERS));
  const [products, setProducts] = useState(() => getStorage('products', INITIAL_PRODUCTS));
  const [orders, setOrders] = useState(() => getStorage('orders', INITIAL_ORDERS));
  const [inbounds, setInbounds] = useState(() => getStorage('inbounds', INITIAL_INBOUND));
  const [supplierOrders, setSupplierOrders] = useState(() => getStorage('supplierOrders', []));
  const [opnameLogs, setOpnameLogs] = useState(() => getStorage('opnameLogs', INITIAL_OPNAME));
  const [supervisorReports, setSupervisorReports] = useState(() => getStorage('reports', INITIAL_SUPERVISOR_REPORTS));
  const [customRoles, setCustomRoles] = useState(() => getStorage('customRoles', [
    'Admin Gudang',
    'Login Outlet',
    'Staff Distribusi Lapangan'
  ]));
  const [outletStocks, setOutletStocks] = useState(() => getStorage('outletStocks', INITIAL_OUTLET_STOCKS));
  const [dailyRevenues, setDailyRevenues] = useState(() => getStorage('dailyRevenues', INITIAL_DAILY_REVENUES));
  const [outletExpenses, setOutletExpenses] = useState(() => getStorage('outletExpenses', INITIAL_OUTLET_EXPENSES));
  const [cashierApiSettings, setCashierApiSettings] = useState(() => getStorage('cashierApiSettings', {
    autoSyncOnLoad: true,
    supabaseUrl: PWA_CONFIG.SUPABASE_URL,
    supabaseKey: PWA_CONFIG.SUPABASE_ANON_KEY,
    tableName: PWA_CONFIG.TABLE_NAME,
    'OUT-05': 'LazyBloom',
    'OUT-06': 'Sea Cafe',
    'OUT-07': 'Deru Ombak',
    'OUT-08': 'Beachfront'
  }));
  
  // Active shift simulation (Distribusi Pagi vs Pembayaran Malam)
  const [activeShift, setActiveShift] = useState(() => getStorage('activeShift', 'Pembayaran Malam'));

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('mart_pillar_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('mart_pillar_currentUser', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('mart_pillar_outlets', JSON.stringify(outlets));
  }, [outlets]);

  useEffect(() => {
    localStorage.setItem('mart_pillar_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('mart_pillar_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('mart_pillar_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('mart_pillar_supplierOrders', JSON.stringify(supplierOrders));
  }, [supplierOrders]);

  useEffect(() => {
    localStorage.setItem('mart_pillar_inbounds', JSON.stringify(inbounds));
  }, [inbounds]);

  useEffect(() => {
    localStorage.setItem('mart_pillar_opnameLogs', JSON.stringify(opnameLogs));
  }, [opnameLogs]);

  useEffect(() => {
    localStorage.setItem('mart_pillar_reports', JSON.stringify(supervisorReports));
  }, [supervisorReports]);

  useEffect(() => {
    localStorage.setItem('mart_pillar_customRoles', JSON.stringify(customRoles));
  }, [customRoles]);

  useEffect(() => {
    localStorage.setItem('mart_pillar_outletStocks', JSON.stringify(outletStocks));
  }, [outletStocks]);

  useEffect(() => {
    localStorage.setItem('mart_pillar_dailyRevenues', JSON.stringify(dailyRevenues));
  }, [dailyRevenues]);

  useEffect(() => {
    localStorage.setItem('mart_pillar_outletExpenses', JSON.stringify(outletExpenses));
  }, [outletExpenses]);

  useEffect(() => {
    localStorage.setItem('mart_pillar_cashierApiSettings', JSON.stringify(cashierApiSettings));
  }, [cashierApiSettings]);

  useEffect(() => {
    localStorage.setItem('mart_pillar_activeShift', JSON.stringify(activeShift));
  }, [activeShift]);

  // Auto-sync: Pastikan setiap outlet selalu memiliki role / akun login pengguna
  useEffect(() => {
    let hasChanges = false;
    let updatedUsers = [...users];

    outlets.forEach(outlet => {
      const exists = updatedUsers.some(u => 
        (u.outletId && u.outletId === outlet.id) || 
        (u.role === 'outlet' && u.name.toLowerCase() === outlet.name.toLowerCase())
      );

      if (!exists) {
        hasChanges = true;
        const cleanPhone = (outlet.phone || '').replace(/[^0-9]/g, '');
        const words = (outlet.name || 'Outlet').trim().split(' ');
        const initials = words.length > 1 
          ? (words[0][0] + words[1][0]).toUpperCase() 
          : words[0].substring(0, 2).toUpperCase();

        updatedUsers.push({
          id: `USR-${outlet.id}`,
          name: outlet.name,
          role: 'outlet',
          roleLabel: 'Login Outlet',
          title: outlet.pic ? `Outlet Cabang (PIC: ${outlet.pic})` : 'Outlet Cabang',
          outletId: outlet.id,
          phone: cleanPhone || '081200000000',
          displayPhone: outlet.phone || '0812-0000-0000',
          pin: '123456',
          avatar: initials
        });
      }
    });

    if (hasChanges) {
      setUsers(updatedUsers);
    }
  }, [outlets]);

  // Auth & Switch User
  const switchUser = (userId) => {
    const found = users.find(u => u.id === userId);
    if (found) {
      setCurrentUser(found);
    }
  };

  const loginWithCredentials = ({ role, phone, pin }) => {
    const cleanInputPhone = normalizePhone(phone);
    const cleanPin = (pin || '').trim();

    if (!role) {
      return { success: false, message: 'Silakan pilih peran (Role) terlebih dahulu.' };
    }
    if (!cleanInputPhone) {
      return { success: false, message: 'Silakan masukkan Nomor Handphone.' };
    }
    if (cleanPin.length !== 6) {
      return { success: false, message: 'PIN keamanan harus tepat 6 digit angka.' };
    }

    const matchedUser = users.find(u => {
      const uPhone = normalizePhone(u.phone);
      const matchRole = u.role === role;
      const matchPhone = uPhone === cleanInputPhone;
      const matchPin = u.pin === cleanPin;
      return matchRole && matchPhone && matchPin;
    });

    if (matchedUser) {
      setCurrentUser(matchedUser);
      return { success: true, user: matchedUser };
    }

    // Specific error feedback
    const userWithPhone = users.find(u => normalizePhone(u.phone) === cleanInputPhone);

    if (!userWithPhone) {
      return { success: false, message: `Nomor HP (${phone}) tidak terdaftar pada sistem Mart Pillar.` };
    }
    if (userWithPhone.role !== role) {
      return { success: false, message: `Nomor HP ini terdaftar dengan peran "${userWithPhone.title}". Harap pilih peran yang sesuai.` };
    }
    return { success: false, message: 'PIN 6 digit tidak cocok. Silakan periksa kembali.' };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('mart_pillar_currentUser');
  };

  // 0. Manajemen Produk & Stok (Akses Atasan & Owner)
  const addProduct = (newProdData) => {
    const buyPrice = Number(newProdData.buyPrice) || 0;
    const sellPrice = Number(newProdData.sellPrice) || calculateSellPrice(buyPrice, 2.5, 100);
    const newProduct = {
      id: `PRD-${Date.now().toString().slice(-4)}`,
      name: newProdData.name,
      category: newProdData.category || 'sayur',
      unit: newProdData.unit || 'kg',
      buyPrice,
      marginPercent: 2.5,
      sellPrice,
      stock: Number(newProdData.stock) || 0,
      minStock: Number(newProdData.minStock) || 10,
      supplierId: newProdData.supplierId || 'SUP-01',
      supplierName: newProdData.supplierName || 'Supplier Mart Pillar'
    };

    setProducts(prev => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = (id, updatedFields) => {
    setProducts(prev => {
      return prev.map(p => {
        if (p.id === id) {
          const buyPrice = updatedFields.buyPrice !== undefined ? Number(updatedFields.buyPrice) : p.buyPrice;
          const sellPrice = updatedFields.sellPrice !== undefined
            ? Number(updatedFields.sellPrice)
            : calculateSellPrice(buyPrice, 2.5, 100);

          return {
            ...p,
            ...updatedFields,
            stock: updatedFields.stock !== undefined ? Number(updatedFields.stock) : p.stock,
            buyPrice,
            sellPrice
          };
        }
        return p;
      });
    });
  };

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // 1. Input Penerimaan Barang Supplier (Inbound) + Dynamic Mark-up (%)
  const addInbound = ({ supplierId, invoiceSupplier, items, receivedBy, markupPercent = 2.5 }) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    let totalBuy = 0;
    const defaultMarkup = parseFloat(markupPercent) || 2.5;
    const processedItems = items.map(item => {
      const buyPrice = Number(item.buyPrice);
      const qty = Number(item.qty);
      const itemMarkup = item.marginPercent !== undefined ? (parseFloat(item.marginPercent) || defaultMarkup) : defaultMarkup;
      const sellPrice = calculateSellPrice(buyPrice, itemMarkup, 100);
      const subtotal = buyPrice * qty;
      totalBuy += subtotal;

      return {
        ...item,
        buyPrice,
        qty,
        marginPercent: itemMarkup,
        sellPrice,
        subtotal
      };
    });

    const newInbound = {
      id: `INB-${Date.now()}`,
      supplierId,
      supplierName: supplier ? supplier.name : 'Supplier Mart',
      date: dateStr,
      time: timeStr,
      invoiceSupplier: invoiceSupplier || `INV-SUP/${Date.now().toString().slice(-4)}`,
      items: processedItems,
      totalBuy,
      markupPercent: defaultMarkup,
      receivedBy: receivedBy || currentUser.name
    };

    // Update product stock and selling prices automatically
    setProducts(prevProducts => {
      return prevProducts.map(prod => {
        const itemReceived = processedItems.find(it => it.productId === prod.id);
        if (itemReceived) {
          return {
            ...prod,
            stock: Number((prod.stock + itemReceived.qty).toFixed(2)),
            buyPrice: itemReceived.buyPrice,
            sellPrice: itemReceived.sellPrice,
            marginPercent: itemReceived.marginPercent
          };
        }
        return prod;
      });
    });

    setInbounds(prev => [newInbound, ...prev]);
    return newInbound;
  };

  // 2. Pembuatan Order dari PO Outlet -> Otomatis Pecah Nota Penjualan Pagi
  const createOrderFromPO = ({ outletId, items, notes, shift = 'Distribusi Pagi' }) => {
    const outlet = outlets.find(o => o.id === outletId);
    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const orderSeq = (orders.length + 1).toString().padStart(3, '0');
    const invoiceNumber = `NOTA-${dateStr.replace(/-/g, '')}-${orderSeq}`;
    const poNumber = `PO-${outlet ? outlet.code : 'OUT'}-${Date.now().toString().slice(-4)}`;

    let totalAmount = 0;
    let totalCost = 0;

    const processedItems = items.map(it => {
      const prod = products.find(p => p.id === it.productId);
      const price = prod ? prod.sellPrice : Number(it.price);
      const buyPrice = prod ? prod.buyPrice : price;
      const qty = Number(it.qty);
      const subtotal = price * qty;
      const costSubtotal = buyPrice * qty;

      totalAmount += subtotal;
      totalCost += costSubtotal;

      return {
        productId: it.productId,
        productName: prod ? prod.name : it.productName,
        unit: prod ? prod.unit : 'pcs',
        qty,
        price,
        buyPrice,
        subtotal
      };
    });

    const marginProfit = totalAmount - totalCost;

    const newOrder = {
      id: `ORD-${Date.now()}`,
      poNumber,
      invoiceNumber,
      outletId,
      outletName: outlet ? outlet.name : 'Outlet Mart Pillar',
      date: dateStr,
      time: timeStr,
      shift,
      status: 'Terkirim (Belum Bayar)',
      paymentStatus: 'Belum Bayar',
      paidAt: null,
      paymentMethod: null,
      items: processedItems,
      totalAmount,
      totalCost,
      marginProfit,
      notes: notes || 'Otomatis dipecah dari Form PO Outlet untuk Distribusi Pagi.'
    };

    // Deduct stock
    setProducts(prevProducts => {
      return prevProducts.map(prod => {
        const orderedItem = processedItems.find(it => it.productId === prod.id);
        if (orderedItem) {
          const newStock = Math.max(0, Number((prod.stock - orderedItem.qty).toFixed(2)));
          return {
            ...prod,
            stock: newStock
          };
        }
        return prod;
      });
    });

    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  };

  // 3. Update Pembayaran Harian (Malam Hari)
  const settleOrderPayment = (orderId, paymentMethod = 'Transfer BCA') => {
    const timeStr = `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    setOrders(prev => {
      return prev.map(ord => {
        if (ord.id === orderId) {
          return {
            ...ord,
            status: 'Lunas (Malam)',
            paymentStatus: 'Lunas (Malam)',
            paidAt: timeStr,
            paymentMethod
          };
        }
        return ord;
      });
    });
  };

  // Toggle/Ubah Status Bayar Outlet
  const updateOrderPaymentStatus = (orderId, newStatus) => {
    const timeStr = `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    setOrders(prev => {
      return prev.map(ord => {
        if (ord.id === orderId) {
          return {
            ...ord,
            status: newStatus,
            paymentStatus: newStatus,
            paidAt: newStatus.includes('Lunas') ? timeStr : null
          };
        }
        return ord;
      });
    });
  };

  // 3b. Order Pembelian ke Supplier
  const createSupplierOrder = ({ supplierId, items, notes }) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const orderSeq = (supplierOrders.length + 1).toString().padStart(3, '0');
    const orderNumber = `PO-SUP-${dateStr.replace(/-/g, '')}-${orderSeq}`;

    const newSupplierOrder = {
      id: `SUPORD-${Date.now()}`,
      orderNumber,
      invoiceNumber: orderNumber,
      type: 'supplier',
      supplierId,
      supplierName: supplier ? supplier.name : 'Supplier Mart',
      supplierPhone: supplier ? (supplier.phone || supplier.displayPhone || '') : '',
      items, // array of { productId, productName, unit, qty }
      totalQty: items.reduce((acc, c) => acc + (Number(c.qty) || 0), 0),
      totalAmount: 0, // Ditentukan oleh supplier nanti
      paymentStatus: 'Belum Bayar',
      date: dateStr,
      time: timeStr,
      notes: notes || 'Pemesanan bahan baku untuk jadwal distribusi pagi',
      orderedBy: currentUser.name
    };

    setSupplierOrders(prev => [newSupplierOrder, ...prev]);
    return newSupplierOrder;
  };

  const updateSupplierOrderStatus = (orderId, newStatus, newAmount) => {
    const timeStr = `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    setSupplierOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          paymentStatus: newStatus,
          totalAmount: newAmount !== undefined && newAmount !== null && newAmount !== '' ? Number(newAmount) : o.totalAmount,
          paidAt: newStatus.includes('Lunas') ? timeStr : null
        };
      }
      return o;
    }));
  };

  // Master Supplier CRUD
  const addSupplier = (newSup) => {
    const id = `SUP-${(suppliers.length + 1).toString().padStart(2, '0')}`;
    const supToAdd = { ...newSup, id };
    setSuppliers(prev => [...prev, supToAdd]);
    return supToAdd;
  };

  const updateSupplier = (id, updatedFields) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updatedFields } : s));
  };

  const deleteSupplier = (id) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  // 4. Stok Opname & Adjustment (Penyusutan, Sayur/Ayam Busuk, dll)
  const recordStockOpname = ({ productId, physicalStock, reason }) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const sysStock = Number(prod.stock);
    const physStock = Number(physicalStock);
    const diff = Number((physStock - sysStock).toFixed(2));
    const financialImpact = diff * prod.buyPrice;
    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const newLog = {
      id: `OPN-${Date.now()}`,
      date: dateStr,
      time: timeStr,
      auditor: currentUser.name,
      productId: prod.id,
      productName: prod.name,
      systemStock: sysStock,
      physicalStock: physStock,
      difference: diff,
      unit: prod.unit,
      reason: reason || 'Pengecekan Rutin',
      financialImpact,
      status: 'Adjusted'
    };

    // Update product stock to match physical stock
    setProducts(prev => {
      return prev.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            stock: physStock
          };
        }
        return p;
      });
    });

    setOpnameLogs(prev => [newLog, ...prev]);
    return newLog;
  };

  // 5. Pembuatan Laporan Atasan ke Owner
  const submitSupervisorReport = (supervisorNotes) => {
    const dateStr = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => o.date === dateStr || true); // for demo include active
    const todayInbound = inbounds.filter(i => i.date === dateStr || true);
    const todayOpname = opnameLogs.filter(op => op.date === dateStr || true);

    const inboundTotal = todayInbound.reduce((acc, curr) => acc + curr.totalBuy, 0);
    const outboundTotal = todayOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const marginProfitTotal = todayOrders.reduce((acc, curr) => acc + curr.marginProfit, 0);

    const paidOrders = todayOrders.filter(o => o.paymentStatus.includes('Lunas'));
    const unpaidOrders = todayOrders.filter(o => !o.paymentStatus.includes('Lunas'));
    const unpaidTotalAmount = unpaidOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);

    const opnameLossTotal = todayOpname
      .filter(o => o.difference < 0)
      .reduce((acc, curr) => acc + Math.abs(curr.financialImpact), 0);

    const newReport = {
      id: `REP-${Date.now()}`,
      date: dateStr,
      submittedAt: `${dateStr} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
      supervisorName: currentUser.name,
      title: `Laporan Operasional & Penjualan Harian - ${dateStr}`,
      inboundTotal,
      outboundTotal,
      marginProfitTotal,
      paidOrdersCount: paidOrders.length,
      unpaidOrdersCount: unpaidOrders.length,
      unpaidTotalAmount,
      opnameLossTotal,
      supervisorNotes: supervisorNotes || 'Seluruh distribusi pagi telah selesai. Sesi penagihan malam terlampir.',
      status: 'Terkirim ke Owner',
      ownerVerified: false,
      ownerFeedback: null
    };

    setSupervisorReports(prev => [newReport, ...prev]);
    return newReport;
  };

  // 6. Verifikasi Laporan oleh Owner
  const verifyReportByOwner = (reportId, feedback = '') => {
    setSupervisorReports(prev => {
      return prev.map(rep => {
        if (rep.id === reportId) {
          return {
            ...rep,
            ownerVerified: true,
            status: 'Diverifikasi Owner',
            ownerFeedback: feedback
          };
        }
        return rep;
      });
    });
  };

  // 7. Kelola Master Data Outlet (Sync ke Transaksi, Order, dan Role Akun Pengguna)
  const addOutlet = (outletData) => {
    const newId = `OUT-${String(Date.now()).slice(-4)}`;
    const newOutlet = {
      id: newId,
      code: outletData.code || `OPS-${outlets.length + 1}`,
      name: outletData.name,
      address: outletData.address || '',
      phone: outletData.phone || '',
      pic: outletData.pic || '-'
    };
    
    // 1. Simpan data outlet
    setOutlets(prev => [...prev, newOutlet]);

    // 2. Otomatis buat Role & Akun Pengguna untuk Outlet ini
    const cleanPhone = (outletData.phone || '').replace(/[^0-9]/g, '');
    const words = (outletData.name || 'Outlet').trim().split(' ');
    const initials = words.length > 1 
      ? (words[0][0] + words[1][0]).toUpperCase() 
      : words[0].substring(0, 2).toUpperCase();

    const newOutletUser = {
      id: `USR-${newId}`,
      name: outletData.name,
      role: 'outlet',
      roleLabel: 'Login Outlet',
      title: outletData.pic ? `Outlet Cabang (PIC: ${outletData.pic})` : 'Outlet Cabang',
      outletId: newId,
      phone: cleanPhone || '081200000000',
      displayPhone: outletData.phone || '0812-0000-0000',
      pin: outletData.pin || '123456',
      avatar: initials
    };

    setUsers(prev => {
      const exists = prev.some(u => u.outletId === newId || (u.role === 'outlet' && u.name.toLowerCase() === outletData.name.toLowerCase()));
      if (exists) return prev;
      return [...prev, newOutletUser];
    });

    // 3. Otomatis inisialisasi slot stok cabang agar langsung siap dimonitor
    setOutletStocks(prev => ({
      ...prev,
      [newId]: prev[newId] || []
    }));

    // 4. Pastikan 'Login Outlet' terdaftar di daftar role
    setCustomRoles(prev => {
      if (!prev.includes('Login Outlet')) {
        return [...prev, 'Login Outlet'];
      }
      return prev;
    });

    return newOutlet;
  };

  const updateOutlet = (id, outletData) => {
    setOutlets(prev => prev.map(o => o.id === id ? { ...o, ...outletData } : o));

    // Sinkronkan akun pengguna outlet
    setUsers(prev => prev.map(u => {
      if (u.outletId === id) {
        const cleanPhone = (outletData.phone || u.phone).replace(/[^0-9]/g, '');
        const words = (outletData.name || u.name).trim().split(' ');
        const initials = words.length > 1 
          ? (words[0][0] + words[1][0]).toUpperCase() 
          : words[0].substring(0, 2).toUpperCase();

        return {
          ...u,
          name: outletData.name || u.name,
          phone: cleanPhone,
          displayPhone: outletData.phone || u.displayPhone,
          pin: outletData.pin || u.pin || '123456',
          title: outletData.pic ? `Outlet Cabang (PIC: ${outletData.pic})` : u.title,
          avatar: initials
        };
      }
      return u;
    }));
  };

  const deleteOutlet = (id) => {
    setOutlets(prev => prev.filter(o => o.id !== id));
    // Hapus akun user outlet terkait jika bukan user yang sedang aktif login
    setUsers(prev => prev.filter(u => u.outletId !== id || u.id === currentUser?.id));
    setOutletStocks(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  // 8. Kelola Role & Pengguna (User Management)
  const addCustomRole = (roleTitle) => {
    const trimmed = (roleTitle || '').trim();
    if (!trimmed) return;
    if (!customRoles.includes(trimmed)) {
      setCustomRoles(prev => [...prev, trimmed]);
    }
  };

  const addUser = (userData) => {
    const newId = `USR-${String(Date.now()).slice(-4)}`;
    const words = (userData.name || 'User').trim().split(' ');
    const initials = words.length > 1 
      ? (words[0][0] + words[1][0]).toUpperCase() 
      : words[0].substring(0, 2).toUpperCase();

    let systemRole = 'supervisor';
    const labelLower = (userData.roleLabel || '').toLowerCase();
    if (labelLower.includes('outlet') || userData.roleType === 'outlet') {
      systemRole = 'outlet';
    } else if (labelLower.includes('owner') || userData.roleType === 'owner') {
      systemRole = 'owner';
    }

    const newUser = {
      id: newId,
      name: userData.name,
      role: systemRole,
      roleLabel: userData.roleLabel || 'Admin Gudang',
      title: userData.title || userData.roleLabel || 'Staff Mart Pillar',
      outletId: systemRole === 'outlet' ? userData.outletId : null,
      phone: userData.phone,
      displayPhone: userData.displayPhone || userData.phone,
      pin: userData.pin || '123456',
      avatar: initials
    };
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateUser = (id, userData) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const words = (userData.name || u.name).trim().split(' ');
        const initials = words.length > 1 
          ? (words[0][0] + words[1][0]).toUpperCase() 
          : words[0].substring(0, 2).toUpperCase();

        let systemRole = u.role;
        if (userData.roleLabel) {
          const labelLower = userData.roleLabel.toLowerCase();
          if (labelLower.includes('outlet')) {
            systemRole = 'outlet';
          } else if (labelLower.includes('owner')) {
            systemRole = 'owner';
          } else {
            systemRole = 'supervisor';
          }
        }

        return {
          ...u,
          ...userData,
          role: systemRole,
          avatar: initials
        };
      }
      return u;
    }));

    if (currentUser?.id === id) {
      setCurrentUser(prev => ({ ...prev, ...userData }));
    }
  };

  const deleteUser = (id) => {
    if (currentUser?.id === id) {
      return { success: false, message: 'Tidak dapat menghapus akun yang sedang Anda gunakan saat ini.' };
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    return { success: true };
  };

  // 9. Kelola Stok Cabang Outlet (Closing Malam & Terima Barang)
  const confirmReceiveOrder = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.outletId) return;

    const nowStr = `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;

    setOutletStocks(prev => {
      const currentList = prev[order.outletId] || [];
      let updatedList = [...currentList];

      (order.items || []).forEach(item => {
        const existingIdx = updatedList.findIndex(p => p.productId === item.productId);
        if (existingIdx >= 0) {
          updatedList[existingIdx] = {
            ...updatedList[existingIdx],
            stock: Number((updatedList[existingIdx].stock + Number(item.qty)).toFixed(2)),
            lastReceived: nowStr
          };
        } else {
          updatedList.push({
            productId: item.productId,
            productName: item.productName,
            unit: item.unit,
            stock: Number(item.qty),
            minStock: 5,
            lastReceived: nowStr,
            lastClosing: nowStr
          });
        }
      });

      return {
        ...prev,
        [order.outletId]: updatedList
      };
    });

    // Tandai status pengiriman order menjadi 'Diterima Cabang'
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, deliveryStatus: 'Diterima Cabang', receivedAt: nowStr } : o));
  };

  const updateOutletClosingStock = (outletId, updatedItems) => {
    const nowStr = `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;

    setOutletStocks(prev => {
      const currentList = prev[outletId] || [];
      const merged = currentList.map(item => {
        const found = updatedItems.find(u => u.productId === item.productId);
        if (found) {
          return {
            ...item,
            stock: parseFloat(found.stock) || 0,
            minStock: found.minStock !== undefined ? parseFloat(found.minStock) : item.minStock,
            lastClosing: nowStr
          };
        }
        return item;
      });

      updatedItems.forEach(u => {
        if (!merged.some(m => m.productId === u.productId)) {
          merged.push({
            productId: u.productId,
            productName: u.productName,
            unit: u.unit,
            stock: parseFloat(u.stock) || 0,
            minStock: parseFloat(u.minStock) || 5,
            lastClosing: nowStr
          });
        }
      });

      return {
        ...prev,
        [outletId]: merged
      };
    });
  };

  // 10. Fitur 1 Finance: Tarik & Input Revenue Harian Kasir (Pemisahan QRIS & Cash, Kas Kecil, Rekonsiliasi Fisik)
  const addDailyRevenue = async ({
    date,
    time,
    outletId,
    revenueQris,
    revenueCash,
    startingCash = 0,
    actualCashCounted = 0,
    shiftName = 'Shift Pagi',
    expenseAmount = 0,
    expenseNotes = '',
    notes = '',
    source = 'Input Manual Finance',
    cashierName = '',
    pushToSupabase = true
  }) => {
    const qrisNum = Number(revenueQris) || 0;
    const cashNum = Number(revenueCash) || 0;
    const startNum = Number(startingCash) || 0;
    const expNum = Number(expenseAmount) || 0;
    const actualNum = Number(actualCashCounted) || 0;
    const totalRev = qrisNum + cashNum;
    const expectedCash = startNum + cashNum - expNum;
    const cashDiff = actualNum - expectedCash;

    const outlet = outlets.find(o => o.id === outletId);
    const outletName = outlet ? outlet.name : 'Outlet Mart Pillar';
    const dateStr = date || new Date().toISOString().split('T')[0];
    const timeStr = time || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    let rawBranch = outlet ? outlet.name.replace('Outlet ', '') : 'LazyBloom';
    if (outletId === 'OUT-05') rawBranch = 'LazyBloom';
    if (outletId === 'OUT-06') rawBranch = 'Sea Cafe';
    if (outletId === 'OUT-07') rawBranch = 'Deru Ombak';

    const newRev = {
      id: `REV-${dateStr.replace(/-/g, '')}-${outletId.replace('OUT-', '')}-${Date.now().toString().slice(-4)}`,
      date: dateStr,
      time: timeStr,
      outletId,
      outletName,
      rawBranch,
      shiftName,
      startingCash: startNum,
      revenueQris: qrisNum,
      revenueCash: cashNum,
      totalRevenue: totalRev,
      expenseAmount: expNum,
      expenseNotes: expenseNotes || '',
      expectedCash,
      actualCashCounted: actualNum,
      cashDifference: cashDiff,
      source: source || 'Input Manual Finance',
      syncedAt: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
      cashierName: cashierName || 'Staf Kasir',
      notes: notes || ''
    };

    // Opsional: Kirim ke database Supabase jika diinginkan
    if (pushToSupabase) {
      try {
        const pwaPayload = {
          branch: rawBranch,
          report_date: dateStr,
          shift_name: shiftName,
          cashier_name: cashierName || 'Staf Kasir Finance',
          starting_cash: startNum,
          income_cash: cashNum,
          income_qris: qrisNum,
          total_income: totalRev,
          expense_amount: expNum,
          expense_notes: expenseNotes,
          actual_cash_counted: actualNum,
          expected_cash: expectedCash,
          cash_difference: cashDiff,
          notes: notes,
          status: 'Terkirim'
        };
        const pwaRes = await submitLivePwaCashierReport(pwaPayload, {
          supabaseUrl: cashierApiSettings.supabaseUrl || PWA_CONFIG.SUPABASE_URL,
          apiKey: cashierApiSettings.supabaseKey || PWA_CONFIG.SUPABASE_ANON_KEY
        });
        if (pwaRes.success && pwaRes.data?.id) {
          newRev.pwaReportId = pwaRes.data.id;
        }
      } catch (err) {
        console.warn('Gagal sinkronisasi data baru ke Supabase:', err);
      }
    }

    setDailyRevenues(prev => [newRev, ...prev]);
    return newRev;
  };

  const updateDailyRevenue = (id, updatedFields) => {
    setDailyRevenues(prev => prev.map(rev => {
      if (rev.id === id) {
        const qris = updatedFields.revenueQris !== undefined ? Number(updatedFields.revenueQris) : rev.revenueQris;
        const cash = updatedFields.revenueCash !== undefined ? Number(updatedFields.revenueCash) : rev.revenueCash;
        const start = updatedFields.startingCash !== undefined ? Number(updatedFields.startingCash) : (rev.startingCash || 0);
        const exp = updatedFields.expenseAmount !== undefined ? Number(updatedFields.expenseAmount) : (rev.expenseAmount || 0);
        const actual = updatedFields.actualCashCounted !== undefined ? Number(updatedFields.actualCashCounted) : (rev.actualCashCounted || 0);
        const expected = start + cash - exp;
        const diff = actual - expected;

        return {
          ...rev,
          ...updatedFields,
          startingCash: start,
          revenueQris: qris,
          revenueCash: cash,
          totalRevenue: qris + cash,
          expenseAmount: exp,
          expectedCash: expected,
          actualCashCounted: actual,
          cashDifference: diff
        };
      }
      return rev;
    }));
  };

  const deleteDailyRevenue = (id) => {
    setDailyRevenues(prev => prev.filter(r => r.id !== id));
  };

  const syncCashierWebsite = async ({ outletId } = {}) => {
    try {
      const result = await fetchLivePwaCashierReports({
        supabaseUrl: cashierApiSettings.supabaseUrl || PWA_CONFIG.SUPABASE_URL,
        apiKey: cashierApiSettings.supabaseKey || PWA_CONFIG.SUPABASE_ANON_KEY
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      const pwaRows = result.data;
      if (!pwaRows || pwaRows.length === 0) {
        return {
          success: true,
          count: 0,
          message: 'Koneksi ke Supabase PWA aktif, namun belum ada laporan kasir yang tercatat.'
        };
      }

      // Map rows from PWA Supabase format to Mart Pillar daily revenue format
      const mapped = pwaRows.map(row => mapPwaReportToDailyRevenue(row, outlets));

      // Filter by outletId if specified (and not 'all')
      const targetRows = (outletId && outletId !== 'all')
        ? mapped.filter(r => r.outletId === outletId)
        : mapped;

      if (targetRows.length === 0) {
        return {
          success: true,
          count: 0,
          message: `Tidak ada laporan kasir untuk outlet terpilih di database Supabase PWA.`
        };
      }

      // Merge into dailyRevenues state without duplicates
      setDailyRevenues(prev => {
        const newIds = new Set(targetRows.map(r => r.id));
        const filteredPrev = prev.filter(r => !newIds.has(r.id));
        return [...targetRows, ...filteredPrev];
      });

      // Otomatis tarik dan konversi pengeluaran kasir Supabase menjadi kategori Non-Produksi
      const cashierNonProdExpenses = [];
      targetRows.forEach(row => {
        const pwaOrigin = pwaRows.find(pr => pr.id === row.pwaReportId);
        if (pwaOrigin) {
          const items = mapPwaReportToNonProductionExpenses(pwaOrigin, outlets);
          cashierNonProdExpenses.push(...items);
        }
      });

      if (cashierNonProdExpenses.length > 0) {
        setOutletExpenses(prev => {
          const newExpIds = new Set(cashierNonProdExpenses.map(e => e.id));
          const filteredPrev = prev.filter(e => !newExpIds.has(e.id));
          return [...cashierNonProdExpenses, ...filteredPrev];
        });
      }

      const firstRow = targetRows[0];
      return {
        success: true,
        count: targetRows.length,
        expenseCount: cashierNonProdExpenses.length,
        message: `Berhasil menarik ${targetRows.length} laporan closing live & ${cashierNonProdExpenses.length} pengeluaran Non-Produksi dari Web App Presensi PWA (${firstRow.rawBranch || firstRow.outletName})!`,
        data: firstRow
      };
    } catch (err) {
      console.error('syncCashierWebsite error:', err);
      return {
        success: false,
        error: err.message,
        message: `Gagal menarik data dari Supabase PWA: ${err.message}`
      };
    }
  };

  // Tarik khusus pengeluaran kas kecil kasir (Non-Produksi) dari Supabase
  const syncCashierExpenses = async (outletId) => {
    try {
      const result = await fetchLivePwaCashierReports({
        supabaseUrl: cashierApiSettings.supabaseUrl || PWA_CONFIG.SUPABASE_URL,
        apiKey: cashierApiSettings.supabaseKey || PWA_CONFIG.SUPABASE_ANON_KEY
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      const pwaRows = result.data || [];
      const extractedExpenses = [];
      pwaRows.forEach(row => {
        const items = mapPwaReportToNonProductionExpenses(row, outlets);
        extractedExpenses.push(...items);
      });

      const targetExpenses = (outletId && outletId !== 'all')
        ? extractedExpenses.filter(e => e.outletId === outletId)
        : extractedExpenses;

      if (targetExpenses.length === 0) {
        return {
          success: true,
          count: 0,
          message: 'Koneksi ke Supabase aktif, namun tidak ditemukan pengeluaran kas kecil kasir.'
        };
      }

      setOutletExpenses(prev => {
        const newIds = new Set(targetExpenses.map(e => e.id));
        const filteredPrev = prev.filter(e => !newIds.has(e.id));
        return [...targetExpenses, ...filteredPrev];
      });

      return {
        success: true,
        count: targetExpenses.length,
        message: `Berhasil menarik ${targetExpenses.length} rincian pengeluaran Non-Produksi langsung dari Supabase kasir outlet!`
      };
    } catch (err) {
      console.error('syncCashierExpenses error:', err);
      return {
        success: false,
        error: err.message,
        message: `Gagal menarik data pengeluaran kasir dari Supabase: ${err.message}`
      };
    }
  };

  const updateCashierApiUrl = (outletId, url) => {
    setCashierApiSettings(prev => ({
      ...prev,
      [outletId]: url
    }));
  };

  const addOutletExpense = (expenseData) => {
    const newExpense = {
      ...expenseData,
      id: expenseData.id || `EXP-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString()
    };
    setOutletExpenses(prev => [newExpense, ...prev]);
    return newExpense;
  };

  const updateOutletExpense = (id, updatedData) => {
    setOutletExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, ...updatedData, updatedAt: new Date().toISOString() } : exp));
  };

  const deleteOutletExpense = (id) => {
    setOutletExpenses(prev => prev.filter(exp => exp.id !== id));
  };

  // 11. Reset Data ke Default
  const resetDemoData = () => {
    localStorage.clear();
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setOutlets(INITIAL_OUTLETS);
    setSuppliers(INITIAL_SUPPLIERS);
    setProducts(INITIAL_PRODUCTS);
    setOrders(INITIAL_ORDERS);
    setInbounds(INITIAL_INBOUND);
    setOpnameLogs(INITIAL_OPNAME);
    setSupervisorReports(INITIAL_SUPERVISOR_REPORTS);
    setOutletStocks(INITIAL_OUTLET_STOCKS);
    setDailyRevenues(INITIAL_DAILY_REVENUES);
    setOutletExpenses(INITIAL_OUTLET_EXPENSES);
    setActiveShift('Pembayaran Malam');
  };

  const value = {
    users,
    currentUser,
    switchUser,
    loginWithCredentials,
    logout,
    outlets,
    addOutlet,
    updateOutlet,
    deleteOutlet,
    outletStocks,
    confirmReceiveOrder,
    updateOutletClosingStock,
    dailyRevenues,
    setDailyRevenues,
    outletExpenses,
    setOutletExpenses,
    addOutletExpense,
    updateOutletExpense,
    deleteOutletExpense,
    cashierApiSettings,
    addDailyRevenue,
    updateDailyRevenue,
    deleteDailyRevenue,
    syncCashierWebsite,
    syncCashierExpenses,
    updateCashierApiUrl,
    customRoles,
    addCustomRole,
    addUser,
    updateUser,
    deleteUser,
    suppliers,
    products,
    setProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    orders,
    supplierOrders,
    createSupplierOrder,
    updateSupplierOrderStatus,
    updateOrderPaymentStatus,
    inbounds,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    opnameLogs,
    supervisorReports,
    activeShift,
    setActiveShift,
    addInbound,
    createOrderFromPO,
    settleOrderPayment,
    recordStockOpname,
    submitSupervisorReport,
    verifyReportByOwner,
    resetDemoData,
    calculateSellPrice
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
