/**
 * Layanan Integrasi Live Supabase - Web App Presensi PWA
 * Mengambil data laporan harian kasir (QRIS, Cash, Pengeluaran) secara langsung dari database Supabase.
 */

export const PWA_CONFIG = {
  SUPABASE_URL: 'https://kfcjbcdknerflqwofrer.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_2y9zbWTmh-UFDqOgYJhTCw_X6dKLQCl',
  TABLE_NAME: 'outlet_cash_reports'
};

/**
 * Mencocokkan nama cabang dari PWA (LazyBloom, Sea Cafe, Deru Ombak, dll) ke Outlet di Mart Pillar
 */
export const matchOutletFromBranch = (branchName = '', outlets = []) => {
  const b = String(branchName).toLowerCase().trim();

  // 1. Cek spesifik nama cabang umum PWA
  if (b.includes('lazy')) {
    const found = outlets.find(o => o.id === 'OUT-05' || o.name.toLowerCase().includes('lazy'));
    if (found) return found;
  }
  if (b.includes('sea')) {
    const found = outlets.find(o => o.id === 'OUT-06' || o.name.toLowerCase().includes('sea'));
    if (found) return found;
  }
  if (b.includes('ombak') || b.includes('deru')) {
    const found = outlets.find(o => o.id === 'OUT-07' || o.name.toLowerCase().includes('ombak'));
    if (found) return found;
  }
  if (b.includes('sudirman')) {
    const found = outlets.find(o => o.id === 'OUT-01' || o.name.toLowerCase().includes('sudirman'));
    if (found) return found;
  }
  if (b.includes('senopati')) {
    const found = outlets.find(o => o.id === 'OUT-02' || o.name.toLowerCase().includes('senopati'));
    if (found) return found;
  }
  if (b.includes('geprek') || b.includes('ayam')) {
    const found = outlets.find(o => o.id === 'OUT-03' || o.name.toLowerCase().includes('geprek'));
    if (found) return found;
  }

  // 2. Pencocokan fleksibel
  const match = outlets.find(o => 
    o.name.toLowerCase().includes(b) || b.includes(o.name.toLowerCase())
  );
  if (match) return match;

  // 3. Fallback jika nama cabang baru belum ada di master
  return {
    id: `OUT-${b.toUpperCase().replace(/\s+/g, '-').slice(0, 6)}`,
    name: branchName ? `Outlet ${branchName}` : 'Outlet Cabang'
  };
};

/**
 * Konversi baris data Supabase PWA ke format dailyRevenues Mart Pillar
 */
export const mapPwaReportToDailyRevenue = (report, outlets = []) => {
  const matchedOutlet = matchOutletFromBranch(report.branch, outlets);
  
  // Format jam dari created_at
  let timeStr = '22:00';
  if (report.created_at) {
    try {
      const dt = new Date(report.created_at);
      timeStr = dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      timeStr = '22:00';
    }
  }

  const qris = Number(report.income_qris) || 0;
  const cash = Number(report.income_cash) || 0;
  const total = Number(report.total_income) || (qris + cash);

  return {
    id: `pwa_${report.id}`,
    pwaReportId: report.id,
    date: report.report_date,
    time: timeStr,
    outletId: matchedOutlet.id,
    outletName: matchedOutlet.name,
    rawBranch: report.branch,
    revenueQris: qris,
    revenueCash: cash,
    totalRevenue: total,
    source: 'Web App Presensi PWA (Live Supabase)',
    syncedAt: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
    cashierName: report.cashier_name || 'Staf Kasir',
    shiftName: report.shift_name || 'Shift Pagi',
    expenseAmount: Number(report.expense_amount) || 0,
    expenseNotes: report.expense_notes || '',
    startingCash: Number(report.starting_cash) || 0,
    actualCashCounted: Number(report.actual_cash_counted) || 0,
    cashDifference: Number(report.cash_difference) || 0,
    notes: report.notes ? `[${report.shift_name || 'Kasir'}] ${report.notes}` : `[${report.shift_name || 'Kasir'}] Laporan closing shift`
  };
};

/**
 * Konversi pengeluaran kas kecil kasir Supabase PWA ke format pengeluaran Non-Produksi
 * Sesuai aturan bisnis: Seluruh biaya kas kecil kasir outlet masuk ke kategori Non-Produksi
 */
export const mapPwaReportToNonProductionExpenses = (report, outlets = []) => {
  const matchedOutlet = matchOutletFromBranch(report.branch, outlets);
  const totalExpense = Number(report.expense_amount) || 0;
  const notesText = (report.expense_notes || '').trim();

  if (totalExpense <= 0 && !notesText) {
    return [];
  }

  const cashierName = report.cashier_name || 'Kasir Outlet';
  const shiftName = report.shift_name || 'Shift Pagi';

  // Parse baris individual jika kasir mencatat beberapa rincian item (misal: "1. nasi karyawan: Rp 180.000\n2. token: Rp 50.000")
  const lines = notesText.split('\n').map(l => l.trim()).filter(Boolean);
  const parsedItems = [];

  for (const line of lines) {
    // Regex mencocokkan: 1. Nama Item: Rp 180.000 / Nama Item: 180000
    const match = line.match(/^(?:\d+[\.\)]\s*)?([^:]+):\s*(?:rp\.?|idr)?\s*([\d\.,]+)/i);
    if (match) {
      const desc = match[1].trim();
      const numStr = match[2].replace(/[\.,]/g, '');
      const amt = Number(numStr) || 0;
      if (amt > 0) {
        parsedItems.push({ desc, amt });
      }
    }
  }

  // Jika berhasil mem-parse rincian item kasir
  if (parsedItems.length > 0) {
    return parsedItems.map((item, idx) => {
      const dLower = item.desc.toLowerCase();
      let subCategory = 'Operasional Toko & Transport';
      if (dLower.includes('nasi') || dLower.includes('makan') || dLower.includes('konsumsi')) {
        subCategory = 'Konsumsi Karyawan';
      } else if (dLower.includes('token') || dLower.includes('listrik') || dLower.includes('pln') || dLower.includes('air')) {
        subCategory = 'Utilitas & Listrik';
      } else if (dLower.includes('gaji') || dLower.includes('upah') || dLower.includes('lembur') || dLower.includes('parttime')) {
        subCategory = 'Gaji & Upah Harian';
      } else if (dLower.includes('bensin') || dLower.includes('parkir') || dLower.includes('ojek')) {
        subCategory = 'Operasional Toko & Transport';
      } else if (dLower.includes('sabun') || dLower.includes('soklin') || dLower.includes('plastik') || dLower.includes('kebersihan')) {
        subCategory = 'Kebersihan & Sanitasi';
      }

      return {
        id: `pwa_exp_${report.id}_${idx + 1}`,
        pwaReportId: report.id,
        date: report.report_date,
        outletId: matchedOutlet.id,
        outletName: matchedOutlet.name,
        category: 'Non-Produksi', // Seluruh pengeluaran kasir Supabase otomatis Non-Produksi
        subCategory,
        description: item.desc,
        amount: item.amt,
        paymentMethod: 'Kas Kecil Kasir',
        recordedBy: `${cashierName} (${shiftName})`,
        source: 'Web App Presensi PWA (Live Supabase)',
        isFromSupabase: true,
        notes: `Tercatat otomatis dari closing kasir ${matchedOutlet.name}`
      };
    });
  }

  // Fallback: 1 catatan pengeluaran jika tidak dalam bentuk per-baris
  return [{
    id: `pwa_exp_${report.id}`,
    pwaReportId: report.id,
    date: report.report_date,
    outletId: matchedOutlet.id,
    outletName: matchedOutlet.name,
    category: 'Non-Produksi', // Seluruh pengeluaran kasir Supabase otomatis Non-Produksi
    subCategory: 'Operasional Toko & Transport',
    description: notesText || `Kas kecil operasional kasir (${shiftName})`,
    amount: totalExpense,
    paymentMethod: 'Kas Kecil Kasir',
    recordedBy: `${cashierName} (${shiftName})`,
    source: 'Web App Presensi PWA (Live Supabase)',
    isFromSupabase: true,
    notes: `Tercatat otomatis dari closing kasir ${matchedOutlet.name}`
  }];
};

/**
 * Tarik data live laporan kasir dari database Supabase Web App Presensi PWA
 */
export const fetchLivePwaCashierReports = async ({
  supabaseUrl = PWA_CONFIG.SUPABASE_URL,
  apiKey = PWA_CONFIG.SUPABASE_ANON_KEY,
  limit = 50
} = {}) => {
  try {
    const endpoint = `${supabaseUrl}/rest/v1/${PWA_CONFIG.TABLE_NAME}?select=*&order=report_date.desc,created_at.desc&limit=${limit}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Gagal menghubungi Supabase: Status ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: Array.isArray(data) ? data : []
    };
  } catch (error) {
    console.error('Error fetching live PWA cashier reports:', error);
    return {
      success: false,
      error: error.message || 'Gagal mengambil data dari database PWA Kasir'
    };
  }
};

/**
 * Kirim laporan closing kasir baru ke database Supabase Web App Presensi PWA
 */
export const submitLivePwaCashierReport = async (payload, {
  supabaseUrl = PWA_CONFIG.SUPABASE_URL,
  apiKey = PWA_CONFIG.SUPABASE_ANON_KEY
} = {}) => {
  try {
    const endpoint = `${supabaseUrl}/rest/v1/${PWA_CONFIG.TABLE_NAME}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Supabase cashier report POST warning:', errText);
      return { success: false, error: errText };
    }

    const data = await response.json();
    return { success: true, data: Array.isArray(data) ? data[0] : data };
  } catch (err) {
    console.warn('Error submitting cashier report to Supabase:', err);
    return { success: false, error: err.message };
  }
};

