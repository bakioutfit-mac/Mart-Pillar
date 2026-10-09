// Perhitungan Harga Jual: Harga Beli + (Harga Beli * 2.5%) dibulatkan
export const calculateSellPrice = (buyPrice, marginPercent = 2.5, roundUpTo = 100) => {
  const numBuy = Number(buyPrice) || 0;
  const marginVal = numBuy * (marginPercent / 100);
  const rawSellPrice = numBuy + marginVal;
  if (!roundUpTo || roundUpTo <= 1) {
    return Math.round(rawSellPrice);
  }
  return Math.ceil(rawSellPrice / roundUpTo) * roundUpTo;
};

export const INITIAL_PRODUCTS = [
  {
    id: 'PRD-01',
    name: 'Ayam Karkas Broiler Segar (0.9 - 1.0 kg)',
    category: 'ayam',
    unit: 'ekor',
    buyPrice: 34000,
    marginPercent: 2.5,
    sellPrice: 34900,
    stock: 145,
    minStock: 30,
    supplierId: 'SUP-01',
    supplierName: 'PT Berkah Unggas Mandiri'
  },
  {
    id: 'PRD-02',
    name: 'Daging Dada Fillet Ayam Segar',
    category: 'ayam',
    unit: 'kg',
    buyPrice: 48000,
    marginPercent: 2.5,
    sellPrice: 49200,
    stock: 82.5,
    minStock: 20,
    supplierId: 'SUP-01',
    supplierName: 'PT Berkah Unggas Mandiri'
  },
  {
    id: 'PRD-03',
    name: 'Sayur Bayam Hijau Segar',
    category: 'sayur',
    unit: 'ikat',
    buyPrice: 3500,
    marginPercent: 2.5,
    sellPrice: 3600,
    stock: 220,
    minStock: 50,
    supplierId: 'SUP-02',
    supplierName: 'CV Tani Makmur Lembang'
  },
  {
    id: 'PRD-04',
    name: 'Sayur Kangkung Segar',
    category: 'sayur',
    unit: 'ikat',
    buyPrice: 3000,
    marginPercent: 2.5,
    sellPrice: 3100,
    stock: 240,
    minStock: 50,
    supplierId: 'SUP-02',
    supplierName: 'CV Tani Makmur Lembang'
  },
  {
    id: 'PRD-05',
    name: 'Wortel Manis Brastagi Super',
    category: 'sayur',
    unit: 'kg',
    buyPrice: 14000,
    marginPercent: 2.5,
    sellPrice: 14400,
    stock: 95,
    minStock: 25,
    supplierId: 'SUP-02',
    supplierName: 'CV Tani Makmur Lembang'
  },
  {
    id: 'PRD-06',
    name: 'Cabai Rawit Merah Segar',
    category: 'sayur',
    unit: 'kg',
    buyPrice: 52000,
    marginPercent: 2.5,
    sellPrice: 53300,
    stock: 38,
    minStock: 15,
    supplierId: 'SUP-02',
    supplierName: 'CV Tani Makmur Lembang'
  },
  {
    id: 'PRD-07',
    name: 'Cup Datar 16oz PP Tebal 7gr (Isi 50 pcs)',
    category: 'cup',
    unit: 'slop',
    buyPrice: 17500,
    marginPercent: 2.5,
    sellPrice: 18000,
    stock: 350,
    minStock: 60,
    supplierId: 'SUP-03',
    supplierName: 'PT Plastindo Pack Prima'
  },
  {
    id: 'PRD-08',
    name: 'Cup Oval 22oz PP Tebal 8.5gr (Isi 50 pcs)',
    category: 'cup',
    unit: 'slop',
    buyPrice: 22000,
    marginPercent: 2.5,
    sellPrice: 22600,
    stock: 280,
    minStock: 50,
    supplierId: 'SUP-03',
    supplierName: 'PT Plastindo Pack Prima'
  },
  {
    id: 'PRD-09',
    name: 'Tutup Dome / Cembung Cup 93mm (Isi 50 pcs)',
    category: 'cup',
    unit: 'slop',
    buyPrice: 7000,
    marginPercent: 2.5,
    sellPrice: 7200,
    stock: 310,
    minStock: 50,
    supplierId: 'SUP-03',
    supplierName: 'PT Plastindo Pack Prima'
  },
  {
    id: 'PRD-10',
    name: 'Sedotan Steril Runcing 12mm Boba (Pack 100 pcs)',
    category: 'cup',
    unit: 'pack',
    buyPrice: 11000,
    marginPercent: 2.5,
    sellPrice: 11300,
    stock: 190,
    minStock: 40,
    supplierId: 'SUP-03',
    supplierName: 'PT Plastindo Pack Prima'
  },
  {
    id: 'PRD-11',
    name: 'Minyak Goreng Jerigen 18 Liter',
    category: 'bumbu',
    unit: 'jerigen',
    buyPrice: 265000,
    marginPercent: 2.5,
    sellPrice: 271700,
    stock: 45,
    minStock: 10,
    supplierId: 'SUP-04',
    supplierName: 'UD Bumbu Rempah Sejahtera'
  },
  {
    id: 'PRD-12',
    name: 'Bawang Putih Kating Super',
    category: 'bumbu',
    unit: 'kg',
    buyPrice: 38000,
    marginPercent: 2.5,
    sellPrice: 39000,
    stock: 64,
    minStock: 20,
    supplierId: 'SUP-04',
    supplierName: 'UD Bumbu Rempah Sejahtera'
  }
];
