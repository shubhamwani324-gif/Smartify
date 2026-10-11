// Predictive Analytics Data: Future Sales Forecast & Projections (Demo Estimates)

export const FORECAST_HORIZONS = {
  '7': {
    days: 7,
    label: 'Next 7 Days',
    predictedRevenue: 324600,
    formattedRevenue: '₹3,24,600',
    growthRate: '+8.7%',
    isGrowth: true,
    predictedOrders: 945,
    confidenceInterval: '94.2%',
    marginOfError: '± 4.5%',
    highDemandCategories: ['Canine Wet Food', 'Dental Treats', 'Cat Litter Refills'],
    summaryText: 'Short-term projection indicates consistent weekend surge with +8.7% growth compared to the preceding week.'
  },
  '30': {
    days: 30,
    label: 'Next 30 Days',
    predictedRevenue: 1420800,
    formattedRevenue: '₹14,20,800',
    growthRate: '+10.6%',
    isGrowth: true,
    predictedOrders: 4210,
    confidenceInterval: '91.8%',
    marginOfError: '± 6.2%',
    highDemandCategories: ['Specialty Diet Kibble', 'Winter Flea & Tick Care', 'Pet Orthopedic Beds'],
    summaryText: 'Monthly projection estimates solid +10.6% acceleration driven by festive adoption spikes and cold-weather pet wellness needs.'
  },
  '90': {
    days: 90,
    label: 'Next 90 Days (Quarterly)',
    predictedRevenue: 4385000,
    formattedRevenue: '₹43,85,000',
    growthRate: '+17.2%',
    isGrowth: true,
    predictedOrders: 13100,
    confidenceInterval: '87.5%',
    marginOfError: '± 9.8%',
    highDemandCategories: ['Grooming Bundles', 'Allergy Relief Supplements', 'Bird Aviary Nutrition'],
    summaryText: 'Quarterly macro forecast models compound seasonal growth of +17.2%, surpassing last quarter by ₹6,45,000.'
  }
};

// Generates continuous timeline data with actuals and projected points with upper/lower bounds
export function getForecastTimeline(horizon = '30') {
  // Common 6 historical anchor periods (Past Weeks/Months)
  const historical = [
    { period: 'Wk -5', actual: 278000, forecast: null, upper: null, lower: null, isForecast: false, note: 'Regular baseline' },
    { period: 'Wk -4', actual: 295000, forecast: null, upper: null, lower: null, isForecast: false, note: 'Normal trading' },
    { period: 'Wk -3', actual: 312000, forecast: null, upper: null, lower: null, isForecast: false, note: 'Campaign launch' },
    { period: 'Wk -2', actual: 304000, forecast: null, upper: null, lower: null, isForecast: false, note: 'Stockout in cat wet food' },
    { period: 'Wk -1', actual: 326000, forecast: null, upper: null, lower: null, isForecast: false, note: 'Replenishment rebound' },
    { period: 'Current', actual: 334500, forecast: 334500, upper: 334500, lower: 334500, isForecast: false, note: 'Current live week' },
  ];

  if (horizon === '7') {
    const days = [
      { period: 'Day +1', actual: null, forecast: 46200, upper: 48500, lower: 43900, isForecast: true, note: 'Monday estimate' },
      { period: 'Day +2', actual: null, forecast: 43800, upper: 46300, lower: 41300, isForecast: true, note: 'Midweek cadence' },
      { period: 'Day +3', actual: null, forecast: 47100, upper: 50100, lower: 44100, isForecast: true, note: 'Replenishment order push' },
      { period: 'Day +4', actual: null, forecast: 45900, upper: 48900, lower: 42900, isForecast: true, note: 'Standard flow' },
      { period: 'Day +5', actual: null, forecast: 51200, upper: 54600, lower: 47800, isForecast: true, note: 'Friday prep' },
      { period: 'Day +6', actual: null, forecast: 56400, upper: 60500, lower: 52300, isForecast: true, note: 'Weekend peak spike' },
      { period: 'Day +7', actual: null, forecast: 49000, upper: 53200, lower: 44800, isForecast: true, note: 'Sunday wrap-up' }
    ];
    // Return last 3 historical + 7 days
    return [
      { period: 'Thu (Past)', actual: 44000, forecast: null, upper: null, lower: null, isForecast: false },
      { period: 'Fri (Past)', actual: 47800, forecast: null, upper: null, lower: null, isForecast: false },
      { period: 'Sat (Past)', actual: 54200, forecast: null, upper: null, lower: null, isForecast: false },
      { period: 'Today', actual: 49500, forecast: 49500, upper: 49500, lower: 49500, isForecast: false },
      ...days
    ];
  }

  if (horizon === '90') {
    const quarters = [
      { period: 'Month +1', actual: null, forecast: 1380000, upper: 1470000, lower: 1290000, isForecast: true, note: 'Festive pet adoption surge' },
      { period: 'Month +2', actual: null, forecast: 1465000, upper: 1590000, lower: 1340000, isForecast: true, note: 'Diet change seasonal transition' },
      { period: 'Month +3', actual: null, forecast: 1540000, upper: 1710000, lower: 1370000, isForecast: true, note: 'Spring grooming and tick surge' },
    ];
    return [
      { period: 'Month -3', actual: 1160000, forecast: null, upper: null, lower: null, isForecast: false },
      { period: 'Month -2', actual: 1220000, forecast: null, upper: null, lower: null, isForecast: false },
      { period: 'Month -1', actual: 1265000, forecast: null, upper: null, lower: null, isForecast: false },
      { period: 'Current Month', actual: 1284500, forecast: 1284500, upper: 1284500, lower: 1284500, isForecast: false },
      ...quarters
    ];
  }

  // Default: 30 days projection in 4 weekly buckets
  const projected30 = [
    { period: 'Wk +1 (Proj)', actual: null, forecast: 342000, upper: 362000, lower: 322000, isForecast: true, note: 'Weekend flash promotion impact' },
    { period: 'Wk +2 (Proj)', actual: null, forecast: 351000, upper: 374000, lower: 328000, isForecast: true, note: 'Canine joint supplement restock' },
    { period: 'Wk +3 (Proj)', actual: null, forecast: 359000, upper: 385000, lower: 333000, isForecast: true, note: 'End-of-month food replenishment' },
    { period: 'Wk +4 (Proj)', actual: null, forecast: 368800, upper: 398000, lower: 339600, isForecast: true, note: 'Monthly auto-shipment orders' },
  ];

  return [...historical, ...projected30];
}
