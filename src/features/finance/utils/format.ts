import { CATEGORY_COLORS, type ColorSet } from "./mock-data";

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

export function formatFullDate(timestamp: string): string {
  const date = new Date(timestamp);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function getCategoryColor(category: string): ColorSet {
  return (
    CATEGORY_COLORS[category] || {
      bg: "#F5F5F5",
      text: "#333333",
      chart: "#999999",
    }
  );
}

export function classifyTransaction(
  description: string,
  _amount: number
): string {
  const text = description.toLowerCase();

  const classifiers: Record<string, string[]> = {
    Income: [
      "salary",
      "deposit",
      "transfer from",
      "payroll",
      "employer",
      "income",
    ],
    "Food & Dining": [
      "mercadona",
      "caprabo",
      "restaurant",
      "bar",
      "cafe",
      "pizza",
      "burger",
      "food",
      "grocery",
      "supermarket",
      "el born",
      "restaurant",
      "dining",
      "lunch",
      "dinner",
      "breakfast",
      "food delivery",
    ],
    Transportation: [
      "repsol",
      "cepsa",
      "fuel",
      "gas",
      "parking",
      "saba",
      "metro",
      "uber",
      "taxi",
      "bus",
      "train",
      "transport",
      "car",
      "petrol",
      "benzin",
      "barcelona metro",
    ],
    "Entertainment & Recreation": [
      "netflix",
      "spotify",
      "cinema",
      "cinesa",
      "movie",
      "game",
      "entertainment",
      "music",
      "streaming",
      "theater",
      "concert",
      "ticket",
    ],
    "Shopping & Retail": [
      "zara",
      "mango",
      "primark",
      "shopping",
      "store",
      "shop",
      "retail",
      "amazon",
      "ebay",
      "mall",
      "clothes",
      "fashion",
      "clothing",
    ],
    "Healthcare & Medical": [
      "gym",
      "dir gym",
      "doctor",
      "hospital",
      "pharmacy",
      "medical",
      "health",
      "fitness",
      "wellness",
      "clinic",
      "dentist",
      "medical center",
    ],
    "Financial Services": [
      "caixabank",
      "atm",
      "bank",
      "transfer",
      "payment",
      "landlord",
      "rent",
      "fee",
      "commission",
      "insurance",
      "financial",
    ],
    "Utilities & Services": [
      "telefonica",
      "endesa",
      "water",
      "electricity",
      "internet",
      "phone",
      "utility",
      "utilities",
      "bill",
      "gas company",
    ],
    "Charity & Donations": [
      "donation",
      "charity",
      "red cross",
      "ngo",
      "nonprofit",
      "donate",
      "contribution",
    ],
    "Government & Legal": [
      "government",
      "legal",
      "tax",
      "court",
      "police",
      "official",
    ],
  };

  for (const [category, keywords] of Object.entries(classifiers)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return category;
    }
  }

  return "Shopping & Retail";
}
