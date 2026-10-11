// Realistic sample sales data for PetPulse Analytics (all currency values in INR ₹)

export const KPI_DATA = {
  '7d': {
    revenue: {
      value: 298400,
      formatted: '₹2,98,400',
      change: '+14.2%',
      isPositive: true,
      sparkline: [38000, 41200, 39500, 44000, 42100, 46800, 46800],
      previousPeriod: '₹2,61,200',
      tooltip: 'Net revenue across all sales channels in the last 7 days.'
    },
    orders: {
      value: 894,
      formatted: '894',
      change: '+10.8%',
      isPositive: true,
      sparkline: [110, 125, 118, 134, 128, 142, 137],
      previousPeriod: '806',
      tooltip: 'Completed customer checkout orders in the last 7 days.'
    },
    unitsSold: {
      value: 1450,
      formatted: '1,450',
      change: '+8.4%',
      isPositive: true,
      sparkline: [180, 205, 192, 220, 210, 230, 213],
      previousPeriod: '1,337',
      tooltip: 'Total physical product quantities sold.'
    },
    avgOrderValue: {
      value: 334,
      formatted: '₹334',
      change: '+3.1%',
      isPositive: true,
      sparkline: [345, 330, 335, 328, 329, 330, 334],
      previousPeriod: '₹324',
      tooltip: 'Average transaction size (Total Revenue / Total Orders).'
    }
  },
  '30d': {
    revenue: {
      value: 1284500,
      formatted: '₹12,84,500',
      change: '+18.6%',
      isPositive: true,
      sparkline: [320000, 305000, 330000, 329500],
      previousPeriod: '₹10,83,000',
      tooltip: 'Net sales revenue generated over the last 30 calendar days.'
    },
    orders: {
      value: 3842,
      formatted: '3,842',
      change: '+12.4%',
      isPositive: true,
      sparkline: [920, 890, 990, 1042],
      previousPeriod: '3,418',
      tooltip: 'Total retail orders successfully fulfilled and delivered.'
    },
    unitsSold: {
      value: 6275,
      formatted: '6,275',
      change: '+15.1%',
      isPositive: true,
      sparkline: [1480, 1510, 1590, 1695],
      previousPeriod: '5,450',
      tooltip: 'Individual SKUs and units dispatched across retail inventory.'
    },
    avgOrderValue: {
      value: 334,
      formatted: '₹334',
      change: '+5.5%',
      isPositive: true,
      sparkline: [348, 342, 333, 334],
      previousPeriod: '₹317',
      tooltip: 'Average billing ticket size per order transaction.'
    }
  },
  '90d': {
    revenue: {
      value: 3740000,
      formatted: '₹37,40,000',
      change: '+22.3%',
      isPositive: true,
      sparkline: [1150000, 1220000, 1370000],
      previousPeriod: '₹30,58,000',
      tooltip: 'Consolidated quarterly sales performance across all segments.'
    },
    orders: {
      value: 11150,
      formatted: '11,150',
      change: '+16.5%',
      isPositive: true,
      sparkline: [3450, 3620, 4080],
      previousPeriod: '9,570',
      tooltip: 'Quarterly retail volume across pet care departments.'
    },
    unitsSold: {
      value: 18420,
      formatted: '18,420',
      change: '+19.2%',
      isPositive: true,
      sparkline: [5700, 6010, 6710],
      previousPeriod: '15,450',
      tooltip: 'Total product units sold in the 90-day retail cycle.'
    },
    avgOrderValue: {
      value: 335,
      formatted: '₹335',
      change: '+4.9%',
      isPositive: true,
      sparkline: [333, 337, 335],
      previousPeriod: '₹319',
      tooltip: 'Quarterly average customer spend per transaction.'
    }
  },
  '1y': {
    revenue: {
      value: 14650000,
      formatted: '₹1,46,50,000',
      change: '+28.4%',
      isPositive: true,
      sparkline: [3100000, 3450000, 3850000, 4250000],
      previousPeriod: '₹1,14,10,000',
      tooltip: 'Full annual gross retail turnover across all product lines.'
    },
    orders: {
      value: 43200,
      formatted: '43,200',
      change: '+21.0%',
      isPositive: true,
      sparkline: [9500, 10200, 11100, 12400],
      previousPeriod: '35,700',
      tooltip: 'Total annual volume of placed and fulfilled customer orders.'
    },
    unitsSold: {
      value: 71500,
      formatted: '71,500',
      change: '+24.6%',
      isPositive: true,
      sparkline: [15600, 16900, 18600, 20400],
      previousPeriod: '57,400',
      tooltip: 'Total annual inventory units sold across 5 pet divisions.'
    },
    avgOrderValue: {
      value: 339,
      formatted: '₹339',
      change: '+6.1%',
      isPositive: true,
      sparkline: [326, 338, 346, 339],
      previousPeriod: '₹320',
      tooltip: 'Rolling 12-month average customer transaction value.'
    }
  }
};

// Monthly Revenue Trend (Last 12 Months)
export const MONTHLY_REVENUE_TREND = [
  { month: 'Nov', revenue: 940000, orders: 2850, food: 360000, accessories: 160000, health: 210000, grooming: 120000, bedding: 90000 },
  { month: 'Dec', revenue: 1080000, orders: 3200, food: 410000, accessories: 190000, health: 240000, grooming: 135000, bedding: 105000 },
  { month: 'Jan', revenue: 1020000, orders: 3050, food: 390000, accessories: 175000, health: 230000, grooming: 130000, bedding: 95000 },
  { month: 'Feb', revenue: 1110000, orders: 3320, food: 420000, accessories: 195000, health: 250000, grooming: 140000, bedding: 105000 },
  { month: 'Mar', revenue: 1160000, orders: 3490, food: 440000, accessories: 205000, health: 260000, grooming: 148000, bedding: 107000 },
  { month: 'Apr', revenue: 1190000, orders: 3580, food: 450000, accessories: 210000, health: 270000, grooming: 152000, bedding: 108000 },
  { month: 'May', revenue: 1210000, orders: 3620, food: 460000, accessories: 212000, health: 275000, grooming: 155000, bedding: 108000 },
  { month: 'Jun', revenue: 1235000, orders: 3710, food: 470000, accessories: 215000, health: 280000, grooming: 158000, bedding: 112000 },
  { month: 'Jul', revenue: 1250000, orders: 3750, food: 475000, accessories: 216000, health: 284000, grooming: 160000, bedding: 115000 },
  { month: 'Aug', revenue: 1270000, orders: 3810, food: 480000, accessories: 217000, health: 288000, grooming: 163000, bedding: 122000 },
  { month: 'Sep', revenue: 1265000, orders: 3790, food: 478000, accessories: 215000, health: 286000, grooming: 162000, bedding: 124000 },
  { month: 'Oct', revenue: 1284500, orders: 3842, food: 485000, accessories: 218000, health: 292000, grooming: 165000, bedding: 124500 },
];

// Category-wise Sales Data (in INR ₹)
export const CATEGORY_SALES = [
  { category: 'Pet Food', revenue: 485000, units: 2340, share: 37.8, color: '#7C3AED', growth: '+19.4%' },
  { category: 'Health & Hygiene', revenue: 292000, units: 1420, share: 22.7, color: '#10B981', growth: '+24.1%' },
  { category: 'Toys & Accessories', revenue: 218000, units: 1180, share: 17.0, color: '#38BDF8', growth: '+15.8%' },
  { category: 'Grooming Products', revenue: 165000, units: 815, share: 12.8, color: '#F59E0B', growth: '+11.2%' },
  { category: 'Bedding & Comfort', revenue: 124500, units: 520, share: 9.7, color: '#EC4899', growth: '+8.6%' },
];

// Sales Distribution by Pet Type (Donut)
export const PET_TYPE_DISTRIBUTION = [
  { name: 'Dog', value: 590870, percentage: 46.0, color: '#7C3AED', icon: 'Dog' },
  { name: 'Cat', value: 398195, percentage: 31.0, color: '#10B981', icon: 'Cat' },
  { name: 'Bird', value: 141295, percentage: 11.0, color: '#38BDF8', icon: 'Feather' },
  { name: 'Fish', value: 89915, percentage: 7.0, color: '#F59E0B', icon: 'Fish' },
  { name: 'Small Animals', value: 64225, percentage: 5.0, color: '#EC4899', icon: 'Rabbit' },
];

// Best-Selling Products Dataset
export const BEST_SELLING_PRODUCTS = [
  {
    id: 'SKU-001',
    name: 'Royal Paws Salmon & Brown Rice Formula (3kg)',
    petType: 'Dog',
    category: 'Pet Food',
    price: 1850,
    unitsSold: 420,
    revenue: 777000,
    margin: '38%',
    growth: '+28.5%',
    rating: 4.9,
    stock: 84
  },
  {
    id: 'SKU-002',
    name: 'PurrSilk Herbal Detangling Shampoo (500ml)',
    petType: 'Cat',
    category: 'Grooming Products',
    price: 499,
    unitsSold: 385,
    revenue: 192115,
    margin: '52%',
    growth: '+19.2%',
    rating: 4.8,
    stock: 12
  },
  {
    id: 'SKU-003',
    name: 'ChewMaster Dental Bone & Ball Duo',
    petType: 'Dog',
    category: 'Toys & Accessories',
    price: 349,
    unitsSold: 512,
    revenue: 178688,
    margin: '46%',
    growth: '+22.4%',
    rating: 4.7,
    stock: 140
  },
  {
    id: 'SKU-004',
    name: 'VitalityPlus Joint & Hip Multivitamin Chewables',
    petType: 'Dog',
    category: 'Health & Hygiene',
    price: 899,
    unitsSold: 310,
    revenue: 278690,
    margin: '44%',
    growth: '+31.0%',
    rating: 4.9,
    stock: 22
  },
  {
    id: 'SKU-005',
    name: 'CloudNap Orthopedic Memory Foam Bed (Large)',
    petType: 'Dog',
    category: 'Bedding & Comfort',
    price: 2499,
    unitsSold: 145,
    revenue: 362355,
    margin: '35%',
    growth: '+14.6%',
    rating: 4.8,
    stock: 18
  },
  {
    id: 'SKU-006',
    name: 'SkyChirp Premium Seed & Nut Blend (1kg)',
    petType: 'Bird',
    category: 'Pet Food',
    price: 299,
    unitsSold: 410,
    revenue: 122590,
    margin: '41%',
    growth: '+16.8%',
    rating: 4.6,
    stock: 95
  },
  {
    id: 'SKU-007',
    name: 'AquaGlow Tropical Flake Nutrition (200g)',
    petType: 'Fish',
    category: 'Pet Food',
    price: 249,
    unitsSold: 320,
    revenue: 79680,
    margin: '48%',
    growth: '+10.5%',
    rating: 4.5,
    stock: 65
  },
  {
    id: 'SKU-008',
    name: 'FelineFresh Antibacterial Clumping Litter (10kg)',
    petType: 'Cat',
    category: 'Health & Hygiene',
    price: 649,
    unitsSold: 460,
    revenue: 298540,
    margin: '33%',
    growth: '+24.0%',
    rating: 4.7,
    stock: 28
  },
  {
    id: 'SKU-009',
    name: 'LaserPaws Interactive Smart Chaser Toy',
    petType: 'Cat',
    category: 'Toys & Accessories',
    price: 599,
    unitsSold: 280,
    revenue: 167720,
    margin: '55%',
    growth: '+18.3%',
    rating: 4.6,
    stock: 54
  },
  {
    id: 'SKU-010',
    name: 'MeadowCrisp Timothy Hay & Herbal Forage (1.5kg)',
    petType: 'Small Animals',
    category: 'Pet Food',
    price: 420,
    unitsSold: 195,
    revenue: 81900,
    margin: '40%',
    growth: '+12.1%',
    rating: 4.7,
    stock: 36
  }
];
