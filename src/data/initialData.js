/**
 * Mart Pillar - Central Initial Data Hub
 * 
 * Seluruh data telah diorganisir dan dipisahkan ke masing-masing file agar mudah di-maintenance:
 * 1. usersData.js         : Akun pengguna, no HP, PIN login, dan hak akses peran (Role)
 * 2. outletsData.js       : Daftar cabang outlet Mart Pillar & penanggung jawab (PIC)
 * 3. suppliersData.js     : Data vendor / supplier bahan baku & nomor rekening
 * 4. productsData.js      : Master produk, harga beli, rumus margin jual, dan stok gudang
 * 5. ordersData.js        : Transaksi PO & Nota pengiriman distribusi ke outlet
 * 6. inboundData.js       : Penerimaan barang masuk dari supplier & nota tagihan
 * 7. opnameData.js        : Riwayat audit stok opname gudang & penyesuaian fisik
 * 8. reportsData.js       : Laporan harian supervisor / kepala gudang ke owner
 * 9. outletStocksData.js  : Stok fisik barang di masing-masing cabang outlet
 * 10. dailyRevenuesData.js: Pencatatan revenue harian kasir outlet (QRIS & Cash)
 */

export * from './usersData';
export * from './outletsData';
export * from './suppliersData';
export * from './productsData';
export * from './ordersData';
export * from './inboundData';
export * from './opnameData';
export * from './reportsData';
export * from './outletStocksData';
export * from './dailyRevenuesData';
export * from './outletExpensesData';
