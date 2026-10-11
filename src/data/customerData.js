// Diagnostic Analytics Data: Customer Demand Patterns & Buying Behavior

export const DAY_OF_WEEK_DEMAND = [
  { day: 'Mon', fullDay: 'Monday', orders: 480, revenue: 161200, avgBasket: 335, intensity: 65 },
  { day: 'Tue', fullDay: 'Tuesday', orders: 420, revenue: 139800, avgBasket: 332, intensity: 58 },
  { day: 'Wed', fullDay: 'Wednesday', orders: 510, revenue: 172400, avgBasket: 338, intensity: 72 },
  { day: 'Thu', fullDay: 'Thursday', orders: 460, revenue: 153600, avgBasket: 334, intensity: 62 },
  { day: 'Fri', fullDay: 'Friday', orders: 610, revenue: 206800, avgBasket: 339, intensity: 84 },
  { day: 'Sat', fullDay: 'Saturday', orders: 742, revenue: 254200, avgBasket: 342, intensity: 100 },
  { day: 'Sun', fullDay: 'Sunday', orders: 620, revenue: 196500, avgBasket: 317, intensity: 88 },
];

export const HOURLY_DEMAND_PATTERN = [
  { timeSlot: '06:00 - 09:00', label: 'Early Morning', orderShare: 8.5, primeCategory: 'Dog Nutrition' },
  { timeSlot: '09:00 - 13:00', label: 'Morning Peak', orderShare: 24.2, primeCategory: 'Health & Supplements' },
  { timeSlot: '13:00 - 17:00', label: 'Afternoon Lull', orderShare: 18.3, primeCategory: 'Grooming Essentials' },
  { timeSlot: '17:00 - 21:00', label: 'Evening Surge', orderShare: 36.8, primeCategory: 'Food & Treats' },
  { timeSlot: '21:00 - 00:00', label: 'Late Night Leisure', orderShare: 12.2, primeCategory: 'Toys & Accessories' }
];

export const PRODUCT_COMBINATIONS = [
  {
    primary: 'Dry Kibble Premium Formula',
    companion: 'Joint & Hip Chewable Supplements',
    categoryPair: 'Pet Food + Health & Hygiene',
    coPurchaseRate: 64,
    bundleRevenue: '₹3,42,800',
    affinityScore: 'Very High (4.8x baseline)',
    recommendedAction: 'Display "Frequently Bought Together" widget with 8% combo discount'
  },
  {
    primary: 'PurrSilk Herbal Shampoo',
    companion: 'Undercoat Grooming Brush & Towel',
    categoryPair: 'Grooming + Accessories',
    coPurchaseRate: 58,
    bundleRevenue: '₹1,98,400',
    affinityScore: 'High (3.9x baseline)',
    recommendedAction: 'Offer automated checkout add-on prompt at +₹199'
  },
  {
    primary: 'Feline Clumping Litter (10kg)',
    companion: 'Litter Deodorizer Spray (300ml)',
    categoryPair: 'Health & Hygiene Essentials',
    coPurchaseRate: 52,
    bundleRevenue: '₹1,44,200',
    affinityScore: 'High (3.5x baseline)',
    recommendedAction: 'Create recurring 30-day replenishment subscription'
  },
  {
    primary: 'ChewMaster Dental Bone',
    companion: 'Interactive Squeaky Ball',
    categoryPair: 'Toys & Accessories',
    coPurchaseRate: 46,
    bundleRevenue: '₹98,500',
    affinityScore: 'Moderate (2.8x baseline)',
    recommendedAction: 'Introduce Buy-1-Get-50%-Off second toy promotion'
  }
];

export const CUSTOMER_SEGMENTS = [
  { name: 'Champions (High Spend & High Frequency)', percentage: 22, count: 845, avgLTV: '₹8,450', color: '#7C3AED' },
  { name: 'Loyal Regulars (Consistent Monthly Buyers)', percentage: 36, count: 1383, avgLTV: '₹4,920', color: '#10B981' },
  { name: 'Potential Loyalists (Recent Multi-Orders)', percentage: 20, count: 768, avgLTV: '₹2,640', color: '#38BDF8' },
  { name: 'At Risk / Slipping (Inactive > 45 Days)', percentage: 14, count: 538, avgLTV: '₹1,850', color: '#F59E0B' },
  { name: 'First-Time Explorers (Single Purchase)', percentage: 8, count: 308, avgLTV: '₹420', color: '#EC4899' },
];

export const RETENTION_METRICS = {
  repeatPercentage: 68.4,
  firstTimePercentage: 31.6,
  repeatRevenueShare: '77.2%',
  avgRepurchaseCycleDays: 26,
  churnRiskIndex: 'Low (11.8%)'
};

// Diagnostic rule-based generator
export function getDiagnosticKeyInsights() {
  return [
    {
      id: 'insight-1',
      type: 'peak_demand',
      badge: 'Peak Demand Window',
      severity: 'positive',
      title: 'Saturday Evening accounts for 24.8% of weekly revenue',
      detail: 'Highest traffic and transaction volume occurs between 17:00 and 21:00 on Saturdays, driven primarily by weekend pet food refills and indulgence treat purchases.',
      metric: '₹2.54L / Sat',
      actionable: 'Schedule inventory replenishment pickups before Friday 14:00 to avoid weekend stock depletion.'
    },
    {
      id: 'insight-2',
      type: 'bundle_synergy',
      badge: 'Cross-Sell Synergy',
      severity: 'info',
      title: '64% of Premium Kibble buyers purchase Hip & Joint Vitamins',
      detail: 'Pet owners purchasing premium breed-specific food show a high propensity to invest in preventative canine wellness.',
      metric: '64% Co-buy rate',
      actionable: 'Pre-package "Complete Nutrition & Mobility Kits" to boost Average Order Value by 18%.'
    },
    {
      id: 'insight-3',
      type: 'retention_health',
      badge: 'Customer Loyalty',
      severity: 'positive',
      title: '68.4% of total sales originate from repeat customers',
      detail: 'The 26-day average replenishment cycle indicates solid habituation for consumable pet food and hygiene products.',
      metric: '26 Day Repurchase Cycle',
      actionable: 'Automate WhatsApp / Email reminder notifications on Day 21 post-delivery.'
    },
    {
      id: 'insight-4',
      type: 'underperforming_slot',
      badge: 'Demand Lull',
      severity: 'warning',
      title: 'Tuesday Afternoons exhibit lowest transaction frequency',
      detail: 'Weekly checkout volume drops to 420 orders on Tuesday, leaving warehouse packing capacity underutilized by 32%.',
      metric: '-28% below peak',
      actionable: 'Launch "Twosome Tuesday" Flash Deals for accessories and grooming to balance fulfillment load.'
    }
  ];
}
