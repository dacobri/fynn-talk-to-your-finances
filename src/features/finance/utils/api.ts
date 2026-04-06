import {
  mockTransactions,
  mockSummary,
  mockCategoryBreakdown,
  mockMonthlySpending,
  type Transaction,
  type Summary,
  type CategoryBreakdown,
  type MonthlySpending,
  type BankAccount,
  type InvestmentsResponse,
  type InvestmentHistoryPoint,
} from "./mock-data";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchSummary(dateRange?: { start: string; end: string }): Promise<Summary> {
  try {
    const params = new URLSearchParams();
    if (dateRange?.start) params.append("start", dateRange.start);
    if (dateRange?.end) params.append("end", dateRange.end);
    const qs = params.toString();
    const response = await fetch(`${API_BASE}/api/summary${qs ? `?${qs}` : ""}`);
    if (!response.ok) throw new Error("Failed to fetch summary");
    return await response.json();
  } catch (error) {
    // Fallback to mock data
    return mockSummary;
  }
}

export async function fetchTransactions(params?: {
  page?: number;
  limit?: number;
  search?: string;
  filter?: "all" | "expense" | "income";
  category?: string;
  source?: string;
  start?: string;
  end?: string;
  sort?: string;
}): Promise<{ transactions: Transaction[]; total: number }> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.filter) queryParams.append("filter", params.filter);
    if (params?.category) queryParams.append("category", params.category);
    if (params?.start) queryParams.append("start", params.start);
    if (params?.end) queryParams.append("end", params.end);
    if (params?.sort) queryParams.append("sort", params.sort);
    if (params?.source) queryParams.append("source", params.source);

    const response = await fetch(
      `${API_BASE}/api/transactions?${queryParams}`
    );
    if (!response.ok) throw new Error("Failed to fetch transactions");
    return await response.json();
  } catch (error) {
    // Fallback to mock data

    let filtered = [...mockTransactions];

    if (params?.filter === "income") {
      filtered = filtered.filter((t) => t.category === "Income");
    } else if (params?.filter === "expense") {
      filtered = filtered.filter((t) => t.category !== "Income");
    }

    if (params?.category) {
      filtered = filtered.filter((t) => t.category === params.category);
    }

    if (params?.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.merchant_name.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search)
      );
    }

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      transactions: filtered.slice(start, end),
      total: filtered.length,
    };
  }
}

export async function fetchCategoryBreakdown(dateRange?: { start: string; end: string }): Promise<CategoryBreakdown[]> {
  try {
    const params = new URLSearchParams();
    if (dateRange?.start) params.append("start", dateRange.start);
    if (dateRange?.end) params.append("end", dateRange.end);
    const qs = params.toString();
    const response = await fetch(`${API_BASE}/api/categories${qs ? `?${qs}` : ""}`);
    if (!response.ok) throw new Error("Failed to fetch category breakdown");
    const data = await response.json();
    // Backend returns { categories: [...] }
    return data.categories ?? data;
  } catch (error) {
    // Fallback to mock data
    return mockCategoryBreakdown;
  }
}

export async function fetchMonthlySpending(dateRange?: { start: string; end: string }): Promise<MonthlySpending[]> {
  try {
    const params = new URLSearchParams();
    if (dateRange?.start) params.append("start", dateRange.start);
    if (dateRange?.end) params.append("end", dateRange.end);
    const qs = params.toString();
    const response = await fetch(`${API_BASE}/api/monthly-spending${qs ? `?${qs}` : ""}`);
    if (!response.ok) throw new Error("Failed to fetch monthly spending");
    const data = await response.json();
    // Backend returns { data: [...] }
    return data.data ?? data;
  } catch (error) {
    // Fallback to mock data
    return mockMonthlySpending;
  }
}

export interface UserContext {
  user_name?: string;
  language?: string;
  monthly_budget?: number;
  alert_threshold?: number;
}

export async function sendChatMessageStreaming(
  message: string,
  chatHistory: Array<{ role: string; text: string }>,
  onStep: (step: string) => void,
  userContext?: UserContext,
): Promise<{ text: string; chart: any | null; charts: any[]; suggestions: string[] }> {
  const response = await fetch(`${API_BASE}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      chat_history: chatHistory,
      ...userContext,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error("Stream request failed");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.type === "step") {
          onStep(data.text);
        } else if (data.type === "result") {
          return { text: data.text, chart: data.chart ?? null, charts: data.charts ?? [], suggestions: data.suggestions ?? [] };
        } else if (data.type === "error") {
          throw new Error(data.text);
        }
      } catch {
        // ignore parse errors on individual lines
      }
    }
  }

  throw new Error("Stream ended without result");
}

export async function sendChatMessage(
  message: string,
  chatHistory: Array<{ role: string; text: string }>,
  userContext?: UserContext,
): Promise<{
  text: string;
  chart: any | null;
  table: any | null;
  suggestions: string[];
}> {
  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        chat_history: chatHistory,
        ...userContext,
      }),
    });

    if (!response.ok) throw new Error("Failed to send chat message");
    return await response.json();
  } catch (error) {
    // Fallback to mock data

    const mockResponses: Record<string, any> = {
      default: {
        text: "I can help you analyze your finances. Try asking me about your spending trends, top expenses, or budget recommendations.",
        chart: null,
        table: null,
        suggestions: [
          "Show my spending by category",
          "What are my top expenses?",
          "How much did I spend this month?",
        ],
      },
      spending: {
        text: "Your total spending in December was €8,050.66. Your top expense category was Financial Services (mainly rent at €2,400), followed by Shopping & Retail at €802.63.",
        chart: {
          type: "pie",
          data: mockCategoryBreakdown,
        },
        table: null,
        suggestions: [
          "Show monthly trends",
          "Compare to previous months",
          "What about my income?",
        ],
      },
      income: {
        text: "Your total income this month was €10,000 from your regular salary deposits. This covers your expenses with a positive balance of €1,949.34.",
        chart: null,
        table: null,
        suggestions: [
          "Show my spending breakdown",
          "What are my subscriptions?",
          "Analyze my expenses",
        ],
      },
    };

    const lowerMessage = message.toLowerCase();
    let response_type = "default";

    if (
      lowerMessage.includes("spend") ||
      lowerMessage.includes("category") ||
      lowerMessage.includes("expense")
    ) {
      response_type = "spending";
    } else if (
      lowerMessage.includes("income") ||
      lowerMessage.includes("salary") ||
      lowerMessage.includes("earn")
    ) {
      response_type = "income";
    }

    return mockResponses[response_type];
  }
}

export async function fetchStats(): Promise<{ transactionCount: number }> {
  try {
    const response = await fetch(`${API_BASE}/api/stats`);
    if (!response.ok) throw new Error("Failed to fetch stats");
    return await response.json();
  } catch (error) {
    // Fallback to mock data
    return { transactionCount: 3494 };
  }
}

export interface Subscription {
  merchant: string;
  category: string;
  monthlyCost: number;
  lastCharge: string;
  chargeCount: number;
  active: boolean;
}

export interface SubscriptionsResponse {
  active: Subscription[];
  inactive: Subscription[];
  totalMonthly: number;
  activeCount: number;
}

export async function fetchAccounts(): Promise<{ accounts: BankAccount[] }> {
  try {
    const response = await fetch(`${API_BASE}/api/accounts`);
    if (!response.ok) throw new Error("Failed to fetch accounts");
    return await response.json();
  } catch (error) {
    // Fallback to mock data
    return {
      accounts: [
        { name: "CaixaBank", transactionCount: 2280, firstTransaction: "2020-01-01", lastTransaction: "2024-12-27", status: "connected" },
      ],
    };
  }
}

export async function uploadCSV(bankName: string, file: File): Promise<{ inserted: number; source: string }> {
  const formData = new FormData();
  formData.append("bank_name", bankName);
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/api/upload-csv`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || "Upload failed");
  }
  return await response.json();
}

export async function fetchInvestments(includeOrders?: boolean): Promise<InvestmentsResponse> {
  try {
    const params = new URLSearchParams();
    if (includeOrders) params.append("include_orders", "true");
    const qs = params.toString();
    const response = await fetch(`${API_BASE}/api/investments${qs ? `?${qs}` : ""}`);
    if (!response.ok) throw new Error("Failed to fetch investments");
    return await response.json();
  } catch (error) {
    // Fallback to mock data
    return { holdings: [], totals: { invested: 0, currentValue: 0, returnEur: 0, returnPct: 0 } };
  }
}

export async function fetchInvestmentHistory(dateRange?: { start: string; end: string }): Promise<{ data: InvestmentHistoryPoint[]; granularity: string }> {
  try {
    const params = new URLSearchParams();
    if (dateRange?.start) params.append("start", dateRange.start);
    if (dateRange?.end) params.append("end", dateRange.end);
    const qs = params.toString();
    const response = await fetch(`${API_BASE}/api/investments/history${qs ? `?${qs}` : ""}`);
    if (!response.ok) throw new Error("Failed to fetch investment history");
    return await response.json();
  } catch (error) {
    // Fallback to mock data
    return { data: [], granularity: "daily" };
  }
}

export async function fetchSubscriptions(): Promise<SubscriptionsResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/subscriptions`);
    if (!response.ok) throw new Error("Failed to fetch subscriptions");
    return await response.json();
  } catch (error) {
    // Fallback to mock data
    return {
      active: [
        { merchant: 'Netflix', category: 'Entertainment', monthlyCost: 17.99, lastCharge: '2024-12-20', chargeCount: 12, active: true },
        { merchant: 'Spotify', category: 'Entertainment', monthlyCost: 9.99, lastCharge: '2024-12-15', chargeCount: 12, active: true },
        { merchant: 'Vodafone', category: 'Utilities', monthlyCost: 26.95, lastCharge: '2024-12-05', chargeCount: 12, active: true },
      ],
      inactive: [],
      totalMonthly: 54.93,
      activeCount: 3,
    };
  }
}
