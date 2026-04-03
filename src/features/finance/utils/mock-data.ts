export interface Transaction {
  id: string;
  account_id: string;
  source?: string;
  merchant_name: string;
  timestamp: string;
  description: string;
  category: string;
  amount: number;
  currency: string;
  predicted_category: string;
  confidence: number;
}

export interface BankAccount {
  name: string;
  transactionCount: number;
  firstTransaction: string;
  lastTransaction: string;
  status: string;
}

export interface Holding {
  ticker: string;
  companyName: string;
  assetType: string;
  quantity: number;
  avgPurchasePrice: number;
  purchaseCurrency: string;
  currentPrice: number;
  currentPriceCurrency: string;
  currentValueEur: number;
  totalCostEur: number;
  returnEur: number;
  returnPct: number;
  firstPurchase: string;
  lastPurchase: string;
  todayChangeEur?: number;
  todayChangePct?: number;
  orders?: { date: string; quantity: number; pricePerShare: number; totalCost: number; currency: string }[];
}

export interface InvestmentTotals {
  invested: number;
  currentValue: number;
  returnEur: number;
  returnPct: number;
}

export interface InvestmentsResponse {
  holdings: Holding[];
  totals: InvestmentTotals;
}

export interface InvestmentHistoryPoint {
  label: string;
  amount: number;
  date: string;
}

export interface Summary {
  totalIncome: number;
  totalSpent: number;
  netBalance: number;
  topCategory: {
    name: string;
    amount: number;
  };
  subscriptions: {
    count: number;
    monthlyTotal: number;
  };
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface MonthlySpending {
  month: string;
  amount: number;
}

export interface ColorSet {
  bg: string;
  text: string;
  chart: string;
}

export const CATEGORY_COLORS: Record<string, ColorSet> = {
  "Food & Dining": {
    bg: "#FFF0E6",
    text: "#C45800",
    chart: "#E8860C",
  },
  Transportation: {
    bg: "#E8EEF8",
    text: "#1A3A6B",
    chart: "#2E6BC6",
  },
  "Entertainment & Recreation": {
    bg: "#F3E8F8",
    text: "#5B1A6B",
    chart: "#9B59B6",
  },
  "Shopping & Retail": {
    bg: "#FFF8E1",
    text: "#8B5E1A",
    chart: "#D4A017",
  },
  "Financial Services": {
    bg: "#F0F0F0",
    text: "#444444",
    chart: "#7F8C8D",
  },
  "Healthcare & Medical": {
    bg: "#FBEAEA",
    text: "#B83232",
    chart: "#E74C3C",
  },
  "Utilities & Services": {
    bg: "#E8F5EF",
    text: "#1E6B4A",
    chart: "#27AE60",
  },
  Income: {
    bg: "#E8F5EF",
    text: "#1E6B4A",
    chart: "#2ECC71",
  },
  "Government & Legal": {
    bg: "#E8EEF8",
    text: "#1A3A6B",
    chart: "#34495E",
  },
  "Charity & Donations": {
    bg: "#FFF0E6",
    text: "#C45800",
    chart: "#E67E22",
  },
  Transfer: {
    bg: "#EDE9FE",
    text: "#6D28D9",
    chart: "#8B5CF6",
  },
  Investment: {
    bg: "#DBEAFE",
    text: "#1D4ED8",
    chart: "#3B82F6",
  },
};

export const CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Entertainment & Recreation",
  "Shopping & Retail",
  "Financial Services",
  "Healthcare & Medical",
  "Utilities & Services",
  "Income",
  "Government & Legal",
  "Charity & Donations",
  "Transfer",
  "Investment",
];

export const mockTransactions: Transaction[] = [
  {
    id: "txn_001",
    account_id: "acc_001",
    merchant_name: "Employer",
    timestamp: "2024-12-31T10:00:00Z",
    description: "Salary deposit",
    category: "Income",
    amount: 5000,
    currency: "EUR",
    predicted_category: "Income",
    confidence: 0.99,
  },
  {
    id: "txn_002",
    account_id: "acc_001",
    merchant_name: "Mercadona",
    timestamp: "2024-12-30T15:45:00Z",
    description: "Grocery shopping",
    category: "Food & Dining",
    amount: 42.53,
    currency: "EUR",
    predicted_category: "Food & Dining",
    confidence: 0.92,
  },
  {
    id: "txn_003",
    account_id: "acc_001",
    merchant_name: "Netflix",
    timestamp: "2024-12-30T08:00:00Z",
    description: "Monthly subscription",
    category: "Entertainment & Recreation",
    amount: 15.99,
    currency: "EUR",
    predicted_category: "Entertainment & Recreation",
    confidence: 0.98,
  },
  {
    id: "txn_004",
    account_id: "acc_001",
    merchant_name: "Spotify",
    timestamp: "2024-12-30T08:01:00Z",
    description: "Premium subscription",
    category: "Entertainment & Recreation",
    amount: 11.99,
    currency: "EUR",
    predicted_category: "Entertainment & Recreation",
    confidence: 0.98,
  },
  {
    id: "txn_005",
    account_id: "acc_001",
    merchant_name: "Zara",
    timestamp: "2024-12-29T18:30:00Z",
    description: "Clothing purchase",
    category: "Shopping & Retail",
    amount: 87.45,
    currency: "EUR",
    predicted_category: "Shopping & Retail",
    confidence: 0.95,
  },
  {
    id: "txn_006",
    account_id: "acc_001",
    merchant_name: "CaixaBank ATM",
    timestamp: "2024-12-29T12:00:00Z",
    description: "Cash withdrawal",
    category: "Financial Services",
    amount: 200,
    currency: "EUR",
    predicted_category: "Financial Services",
    confidence: 0.99,
  },
  {
    id: "txn_007",
    account_id: "acc_001",
    merchant_name: "El Born Bar",
    timestamp: "2024-12-29T21:15:00Z",
    description: "Dinner and drinks",
    category: "Food & Dining",
    amount: 52.80,
    currency: "EUR",
    predicted_category: "Food & Dining",
    confidence: 0.87,
  },
  {
    id: "txn_008",
    account_id: "acc_001",
    merchant_name: "SABA Parking",
    timestamp: "2024-12-29T08:30:00Z",
    description: "Monthly parking",
    category: "Transportation",
    amount: 65.00,
    currency: "EUR",
    predicted_category: "Transportation",
    confidence: 0.96,
  },
  {
    id: "txn_009",
    account_id: "acc_001",
    merchant_name: "Repsol",
    timestamp: "2024-12-28T14:20:00Z",
    description: "Fuel",
    category: "Transportation",
    amount: 58.40,
    currency: "EUR",
    predicted_category: "Transportation",
    confidence: 0.98,
  },
  {
    id: "txn_010",
    account_id: "acc_001",
    merchant_name: "DiR Gym",
    timestamp: "2024-12-28T07:00:00Z",
    description: "Monthly membership",
    category: "Healthcare & Medical",
    amount: 49.99,
    currency: "EUR",
    predicted_category: "Healthcare & Medical",
    confidence: 0.94,
  },
  {
    id: "txn_011",
    account_id: "acc_001",
    merchant_name: "Caprabo",
    timestamp: "2024-12-27T17:30:00Z",
    description: "Groceries",
    category: "Food & Dining",
    amount: 38.92,
    currency: "EUR",
    predicted_category: "Food & Dining",
    confidence: 0.93,
  },
  {
    id: "txn_012",
    account_id: "acc_001",
    merchant_name: "Mango",
    timestamp: "2024-12-27T15:00:00Z",
    description: "Clothing",
    category: "Shopping & Retail",
    amount: 125.50,
    currency: "EUR",
    predicted_category: "Shopping & Retail",
    confidence: 0.96,
  },
  {
    id: "txn_013",
    account_id: "acc_001",
    merchant_name: "Cinesa",
    timestamp: "2024-12-27T19:45:00Z",
    description: "Movie tickets",
    category: "Entertainment & Recreation",
    amount: 28.00,
    currency: "EUR",
    predicted_category: "Entertainment & Recreation",
    confidence: 0.97,
  },
  {
    id: "txn_014",
    account_id: "acc_001",
    merchant_name: "Landlord",
    timestamp: "2024-12-26T09:00:00Z",
    description: "Rent payment",
    category: "Financial Services",
    amount: 1200.00,
    currency: "EUR",
    predicted_category: "Financial Services",
    confidence: 0.99,
  },
  {
    id: "txn_015",
    account_id: "acc_001",
    merchant_name: "Primark",
    timestamp: "2024-12-26T16:20:00Z",
    description: "Accessories",
    category: "Shopping & Retail",
    amount: 31.45,
    currency: "EUR",
    predicted_category: "Shopping & Retail",
    confidence: 0.92,
  },
  {
    id: "txn_016",
    account_id: "acc_001",
    merchant_name: "Cepsa",
    timestamp: "2024-12-26T13:10:00Z",
    description: "Fuel",
    category: "Transportation",
    amount: 52.75,
    currency: "EUR",
    predicted_category: "Transportation",
    confidence: 0.98,
  },
  {
    id: "txn_017",
    account_id: "acc_001",
    merchant_name: "Mercadona",
    timestamp: "2024-12-25T18:00:00Z",
    description: "Holiday groceries",
    category: "Food & Dining",
    amount: 68.30,
    currency: "EUR",
    predicted_category: "Food & Dining",
    confidence: 0.91,
  },
  {
    id: "txn_018",
    account_id: "acc_001",
    merchant_name: "El Born Bar",
    timestamp: "2024-12-24T22:00:00Z",
    description: "Christmas dinner",
    category: "Food & Dining",
    amount: 95.50,
    currency: "EUR",
    predicted_category: "Food & Dining",
    confidence: 0.88,
  },
  {
    id: "txn_019",
    account_id: "acc_001",
    merchant_name: "Zara",
    timestamp: "2024-12-23T14:30:00Z",
    description: "Holiday clothes",
    category: "Shopping & Retail",
    amount: 156.99,
    currency: "EUR",
    predicted_category: "Shopping & Retail",
    confidence: 0.96,
  },
  {
    id: "txn_020",
    account_id: "acc_001",
    merchant_name: "Hospital Clinic",
    timestamp: "2024-12-22T11:00:00Z",
    description: "Medical consultation",
    category: "Healthcare & Medical",
    amount: 150.00,
    currency: "EUR",
    predicted_category: "Healthcare & Medical",
    confidence: 0.99,
  },
  {
    id: "txn_021",
    account_id: "acc_001",
    merchant_name: "Barcelona Water",
    timestamp: "2024-12-20T10:00:00Z",
    description: "Water bill",
    category: "Utilities & Services",
    amount: 28.50,
    currency: "EUR",
    predicted_category: "Utilities & Services",
    confidence: 0.97,
  },
  {
    id: "txn_022",
    account_id: "acc_001",
    merchant_name: "Telefonica",
    timestamp: "2024-12-20T10:00:00Z",
    description: "Internet and phone",
    category: "Utilities & Services",
    amount: 52.99,
    currency: "EUR",
    predicted_category: "Utilities & Services",
    confidence: 0.98,
  },
  {
    id: "txn_023",
    account_id: "acc_001",
    merchant_name: "Endesa",
    timestamp: "2024-12-20T10:00:00Z",
    description: "Electricity bill",
    category: "Utilities & Services",
    amount: 115.75,
    currency: "EUR",
    predicted_category: "Utilities & Services",
    confidence: 0.98,
  },
  {
    id: "txn_024",
    account_id: "acc_001",
    merchant_name: "Caprabo",
    timestamp: "2024-12-19T18:15:00Z",
    description: "Groceries",
    category: "Food & Dining",
    amount: 45.60,
    currency: "EUR",
    predicted_category: "Food & Dining",
    confidence: 0.92,
  },
  {
    id: "txn_025",
    account_id: "acc_001",
    merchant_name: "Spotify",
    timestamp: "2024-12-19T08:00:00Z",
    description: "Premium subscription",
    category: "Entertainment & Recreation",
    amount: 11.99,
    currency: "EUR",
    predicted_category: "Entertainment & Recreation",
    confidence: 0.98,
  },
  {
    id: "txn_026",
    account_id: "acc_001",
    merchant_name: "Netflix",
    timestamp: "2024-12-19T08:01:00Z",
    description: "Monthly subscription",
    category: "Entertainment & Recreation",
    amount: 15.99,
    currency: "EUR",
    predicted_category: "Entertainment & Recreation",
    confidence: 0.98,
  },
  {
    id: "txn_027",
    account_id: "acc_001",
    merchant_name: "Mercadona",
    timestamp: "2024-12-18T16:45:00Z",
    description: "Grocery shopping",
    category: "Food & Dining",
    amount: 51.20,
    currency: "EUR",
    predicted_category: "Food & Dining",
    confidence: 0.92,
  },
  {
    id: "txn_028",
    account_id: "acc_001",
    merchant_name: "SABA Parking",
    timestamp: "2024-12-17T08:30:00Z",
    description: "Monthly parking",
    category: "Transportation",
    amount: 65.00,
    currency: "EUR",
    predicted_category: "Transportation",
    confidence: 0.96,
  },
  {
    id: "txn_029",
    account_id: "acc_001",
    merchant_name: "Repsol",
    timestamp: "2024-12-17T13:00:00Z",
    description: "Fuel",
    category: "Transportation",
    amount: 54.20,
    currency: "EUR",
    predicted_category: "Transportation",
    confidence: 0.98,
  },
  {
    id: "txn_030",
    account_id: "acc_001",
    merchant_name: "DiR Gym",
    timestamp: "2024-12-16T07:15:00Z",
    description: "Monthly membership",
    category: "Healthcare & Medical",
    amount: 49.99,
    currency: "EUR",
    predicted_category: "Healthcare & Medical",
    confidence: 0.94,
  },
  {
    id: "txn_031",
    account_id: "acc_001",
    merchant_name: "Primark",
    timestamp: "2024-12-15T15:30:00Z",
    description: "Clothing",
    category: "Shopping & Retail",
    amount: 42.75,
    currency: "EUR",
    predicted_category: "Shopping & Retail",
    confidence: 0.93,
  },
  {
    id: "txn_032",
    account_id: "acc_001",
    merchant_name: "Cinesa",
    timestamp: "2024-12-14T20:00:00Z",
    description: "Movie tickets",
    category: "Entertainment & Recreation",
    amount: 32.00,
    currency: "EUR",
    predicted_category: "Entertainment & Recreation",
    confidence: 0.97,
  },
  {
    id: "txn_033",
    account_id: "acc_001",
    merchant_name: "El Born Bar",
    timestamp: "2024-12-14T21:45:00Z",
    description: "Dinner",
    category: "Food & Dining",
    amount: 48.90,
    currency: "EUR",
    predicted_category: "Food & Dining",
    confidence: 0.87,
  },
  {
    id: "txn_034",
    account_id: "acc_001",
    merchant_name: "Mango",
    timestamp: "2024-12-13T14:00:00Z",
    description: "Clothing",
    category: "Shopping & Retail",
    amount: 98.50,
    currency: "EUR",
    predicted_category: "Shopping & Retail",
    confidence: 0.95,
  },
  {
    id: "txn_035",
    account_id: "acc_001",
    merchant_name: "CaixaBank ATM",
    timestamp: "2024-12-13T12:00:00Z",
    description: "Cash withdrawal",
    category: "Financial Services",
    amount: 100,
    currency: "EUR",
    predicted_category: "Financial Services",
    confidence: 0.99,
  },
  {
    id: "txn_036",
    account_id: "acc_001",
    merchant_name: "Employer",
    timestamp: "2024-12-13T10:00:00Z",
    description: "Salary deposit",
    category: "Income",
    amount: 5000,
    currency: "EUR",
    predicted_category: "Income",
    confidence: 0.99,
  },
  {
    id: "txn_037",
    account_id: "acc_001",
    merchant_name: "Caprabo",
    timestamp: "2024-12-12T18:00:00Z",
    description: "Groceries",
    category: "Food & Dining",
    amount: 39.85,
    currency: "EUR",
    predicted_category: "Food & Dining",
    confidence: 0.92,
  },
  {
    id: "txn_038",
    account_id: "acc_001",
    merchant_name: "Cepsa",
    timestamp: "2024-12-11T14:20:00Z",
    description: "Fuel",
    category: "Transportation",
    amount: 56.30,
    currency: "EUR",
    predicted_category: "Transportation",
    confidence: 0.98,
  },
  {
    id: "txn_039",
    account_id: "acc_001",
    merchant_name: "Red Cross Donation",
    timestamp: "2024-12-10T10:00:00Z",
    description: "Charity donation",
    category: "Charity & Donations",
    amount: 25.00,
    currency: "EUR",
    predicted_category: "Charity & Donations",
    confidence: 0.96,
  },
  {
    id: "txn_040",
    account_id: "acc_001",
    merchant_name: "Pharmacy BCN",
    timestamp: "2024-12-09T16:30:00Z",
    description: "Medications",
    category: "Healthcare & Medical",
    amount: 34.50,
    currency: "EUR",
    predicted_category: "Healthcare & Medical",
    confidence: 0.95,
  },
  {
    id: "txn_041",
    account_id: "acc_001",
    merchant_name: "Zara",
    timestamp: "2024-12-08T17:00:00Z",
    description: "Clothing",
    category: "Shopping & Retail",
    amount: 79.99,
    currency: "EUR",
    predicted_category: "Shopping & Retail",
    confidence: 0.95,
  },
  {
    id: "txn_042",
    account_id: "acc_001",
    merchant_name: "Netflix",
    timestamp: "2024-12-08T08:00:00Z",
    description: "Monthly subscription",
    category: "Entertainment & Recreation",
    amount: 15.99,
    currency: "EUR",
    predicted_category: "Entertainment & Recreation",
    confidence: 0.98,
  },
  {
    id: "txn_043",
    account_id: "acc_001",
    merchant_name: "Spotify",
    timestamp: "2024-12-08T08:01:00Z",
    description: "Premium subscription",
    category: "Entertainment & Recreation",
    amount: 11.99,
    currency: "EUR",
    predicted_category: "Entertainment & Recreation",
    confidence: 0.98,
  },
  {
    id: "txn_044",
    account_id: "acc_001",
    merchant_name: "Mercadona",
    timestamp: "2024-12-07T17:30:00Z",
    description: "Grocery shopping",
    category: "Food & Dining",
    amount: 47.15,
    currency: "EUR",
    predicted_category: "Food & Dining",
    confidence: 0.92,
  },
  {
    id: "txn_045",
    account_id: "acc_001",
    merchant_name: "Landlord",
    timestamp: "2024-12-05T09:00:00Z",
    description: "Rent payment",
    category: "Financial Services",
    amount: 1200.00,
    currency: "EUR",
    predicted_category: "Financial Services",
    confidence: 0.99,
  },
  {
    id: "txn_046",
    account_id: "acc_001",
    merchant_name: "Barcelona Metro",
    timestamp: "2024-12-05T08:15:00Z",
    description: "Monthly metro card",
    category: "Transportation",
    amount: 54.00,
    currency: "EUR",
    predicted_category: "Transportation",
    confidence: 0.97,
  },
  {
    id: "txn_047",
    account_id: "acc_001",
    merchant_name: "DiR Gym",
    timestamp: "2024-12-05T07:00:00Z",
    description: "Monthly membership",
    category: "Healthcare & Medical",
    amount: 49.99,
    currency: "EUR",
    predicted_category: "Healthcare & Medical",
    confidence: 0.94,
  },
  {
    id: "txn_048",
    account_id: "acc_001",
    merchant_name: "El Born Bar",
    timestamp: "2024-12-04T20:30:00Z",
    description: "Dinner and drinks",
    category: "Food & Dining",
    amount: 61.40,
    currency: "EUR",
    predicted_category: "Food & Dining",
    confidence: 0.87,
  },
  {
    id: "txn_049",
    account_id: "acc_001",
    merchant_name: "Caprabo",
    timestamp: "2024-12-03T18:20:00Z",
    description: "Groceries",
    category: "Food & Dining",
    amount: 52.70,
    currency: "EUR",
    predicted_category: "Food & Dining",
    confidence: 0.92,
  },
  {
    id: "txn_050",
    account_id: "acc_001",
    merchant_name: "Cinesa",
    timestamp: "2024-12-02T19:00:00Z",
    description: "Movie tickets",
    category: "Entertainment & Recreation",
    amount: 28.00,
    currency: "EUR",
    predicted_category: "Entertainment & Recreation",
    confidence: 0.97,
  },
];

export const mockSummary: Summary = {
  totalIncome: 10000,
  totalSpent: 8050.66,
  netBalance: 1949.34,
  topCategory: {
    name: "Financial Services",
    amount: 2800.00,
  },
  subscriptions: {
    count: 7,
    monthlyTotal: 54.93,
  },
};

export const mockCategoryBreakdown: CategoryBreakdown[] = [
  {
    category: "Food & Dining",
    amount: 1248.65,
    percentage: 15.5,
    transactionCount: 12,
  },
  {
    category: "Transportation",
    amount: 405.65,
    percentage: 5.0,
    transactionCount: 7,
  },
  {
    category: "Entertainment & Recreation",
    amount: 195.94,
    percentage: 2.4,
    transactionCount: 8,
  },
  {
    category: "Shopping & Retail",
    amount: 802.63,
    percentage: 9.9,
    transactionCount: 8,
  },
  {
    category: "Financial Services",
    amount: 2800.00,
    percentage: 34.7,
    transactionCount: 4,
  },
  {
    category: "Healthcare & Medical",
    amount: 384.48,
    percentage: 4.8,
    transactionCount: 4,
  },
  {
    category: "Utilities & Services",
    amount: 197.24,
    percentage: 2.4,
    transactionCount: 3,
  },
  {
    category: "Charity & Donations",
    amount: 25.00,
    percentage: 0.3,
    transactionCount: 1,
  },
  {
    category: "Government & Legal",
    amount: 0,
    percentage: 0,
    transactionCount: 0,
  },
];

export const mockMonthlySpending: MonthlySpending[] = [
  { month: "Jan", amount: 5680.74 },
  { month: "Feb", amount: 6125.30 },
  { month: "Mar", amount: 5890.15 },
  { month: "Apr", amount: 6340.50 },
  { month: "May", amount: 5720.25 },
  { month: "Jun", amount: 6450.80 },
  { month: "Jul", amount: 6890.45 },
  { month: "Aug", amount: 5340.90 },
  { month: "Sep", amount: 6210.65 },
  { month: "Oct", amount: 6780.35 },
  { month: "Nov", amount: 7120.75 },
  { month: "Dec", amount: 8050.66 },
];
