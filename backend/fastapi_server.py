"""
FastAPI wrapper server for the financial assistant backend.

Provides REST API endpoints for chat, transactions, summaries, metrics,
CSV upload (multi-bank), and investment portfolio data.
"""

import sys
import os
import sqlite3
import io
import csv
import hashlib
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

from fastapi import FastAPI, Query, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
import asyncio
import concurrent.futures
from langchain_core.callbacks import BaseCallbackHandler
from dotenv import load_dotenv
load_dotenv()

# All backend code is now self-contained in this directory
_BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_BACKEND_DIR))

# Import the agent function
try:
    from agent import query_agent
    AGENT_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Could not import agent: {e}")
    AGENT_AVAILABLE = False

# Database path (relative to this file)
DB_PATH = _BACKEND_DIR / "data" / "transactions.db"

# ── Categories excluded from spending / income calculations ──────────────────
_EXCLUDED_CATEGORIES = ("Transfer", "Investment")
_EXCL_SQL = "predicted_category NOT IN ('Transfer', 'Investment')"


# ─────────────────────────────────────────────────────────────────────────────
# PYDANTIC MODELS
# ─────────────────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str
    text: str


class ChatRequest(BaseModel):
    message: str
    chat_history: Optional[List[ChatMessage]] = None
    user_name: Optional[str] = None
    language: Optional[str] = None
    monthly_budget: Optional[float] = None
    alert_threshold: Optional[float] = None


class ChatResponse(BaseModel):
    text: str
    chart: Optional[Dict[str, Any]] = None
    charts: List[Dict[str, Any]] = []
    table: Optional[Dict[str, Any]] = None
    suggestions: List[str]


class TransactionsResponse(BaseModel):
    transactions: List[Dict[str, Any]]
    total: int
    page: int
    limit: int


class SummaryResponse(BaseModel):
    totalIncome: float
    totalSpent: float
    netBalance: float
    topCategory: Dict[str, Any]
    subscriptions: Dict[str, Any]


class Category(BaseModel):
    category: str
    amount: float
    percentage: float
    transactionCount: int


class CategoriesResponse(BaseModel):
    categories: List[Category]


class SpendingDataPoint(BaseModel):
    label: str
    amount: float


class SpendingTrendResponse(BaseModel):
    data: List[SpendingDataPoint]
    granularity: str


class Subscription(BaseModel):
    merchant: str
    category: str
    monthlyCost: float
    lastCharge: str
    chargeCount: int
    active: bool


class SubscriptionsResponse(BaseModel):
    active: List[Subscription]
    inactive: List[Subscription]
    totalMonthly: float
    activeCount: int

class AddInvestmentRequest(BaseModel):
    ticker: str
    company_name: str
    asset_type: str
    quantity: float
    purchase_price: float
    purchase_date: str
    currency: str = "EUR"

# ─────────────────────────────────────────────────────────────────────────────
# FASTAPI APP
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Financial Assistant API",
    description="REST API for the Fynn financial assistant",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────────────────
# STARTUP
# ─────────────────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    if not DB_PATH.exists():
        print(f"Warning: Database not found at {DB_PATH}")
    else:
        print(f"Database found at {DB_PATH}")
    if not AGENT_AVAILABLE:
        print("Warning: Agent not available, chat endpoint will not work")


# ─────────────────────────────────────────────────────────────────────────────
# DATABASE HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def get_db_connection():
    if not DB_PATH.exists():
        raise HTTPException(status_code=503, detail=f"Database not found at {DB_PATH}")
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def dict_from_row(row):
    if row is None:
        return None
    return dict(row)


def _date_clauses(start: Optional[str], end: Optional[str]):
    clauses = []
    params = []
    if start:
        clauses.append("DATE(timestamp) >= ?")
        params.append(start)
    if end:
        clauses.append("DATE(timestamp) <= ?")
        params.append(end)
    return clauses, params


# ─────────────────────────────────────────────────────────────────────────────
# REVOLUT CSV KEYWORD CLASSIFIER
# ─────────────────────────────────────────────────────────────────────────────

_REVOLUT_CATEGORY_RULES: list[tuple[list[str], str]] = [
    # Transfers (must be first — highest priority)
    (["top-up by", "top up by", "transfer to caixabank", "transfer to bank"], "Transfer"),
    # Food & Dining
    (["glovo", "uber eats", "ubereats", "deliveroo", "just eat", "mcdonald",
      "burger king", "starbucks", "costa coffee", "pans", "faborit", "brunch",
      "restaurant", "bar ", "cafe", "tapas", "pizza", "sushi", "wok", "kebab",
      "mercadona", "lidl", "aldi", "carrefour", "caprabo", "consum", "bon preu",
      "supermercado", "supermercat"], "Food & Dining"),
    # Transportation
    (["ryanair", "vueling", "iberia", "easyjet", "cabify", "uber ", "bolt ",
      "freenow", "free now", "blablacar", "renfe", "tmb", "metro", "taxi",
      "parking", "gasolinera", "repsol", "cepsa", "shell", "bp "], "Transportation"),
    # Entertainment & Recreation
    (["netflix", "spotify", "hbo", "disney", "youtube", "apple tv", "prime video",
      "steam", "playstation", "xbox", "cinema", "cine", "ticketmaster", "eventbrite",
      "fnac"], "Entertainment & Recreation"),
    # Shopping & Retail
    (["amazon", "zara", "h&m", "pull&bear", "mango ", "uniqlo", "primark",
      "decathlon", "ikea", "mediamarkt", "el corte", "aliexpress", "asos",
      "apple store", "apple.com"], "Shopping & Retail"),
    # Healthcare & Medical
    (["farmacia", "pharmacy", "doctor", "dentist", "hospital", "clinica",
      "optica", "gym", "dir ", "holmes place", "basic-fit", "crossfit"], "Healthcare & Medical"),
    # Utilities & Services
    (["movistar", "vodafone", "orange", "o2 ", "yoigo", "endesa", "iberdrola",
      "naturgy", "aguas", "google storage", "icloud", "dropbox"], "Utilities & Services"),
    # Financial Services
    (["atm", "cajero", "bizum", "paypal", "wise", "n26", "insurance",
      "seguro", "allianz", "mapfre", "axa"], "Financial Services"),
    # Income patterns (photography side-income etc.)
    (["stripe transfer", "ingreso fotografia", "bizum fotografia"], "Income"),
]


def classify_revolut_transaction(description: str, amount: float, tx_type: str) -> str:
    """Classify a Revolut transaction by keyword matching on description."""
    desc_lower = description.lower()

    # Top-ups from bank card are always transfers
    if tx_type == "TOPUP":
        return "Transfer"

    for keywords, category in _REVOLUT_CATEGORY_RULES:
        if any(kw in desc_lower for kw in keywords):
            return category

    # Fallback: positive amount with TRANSFER type → Income, else generic
    if tx_type == "TRANSFER" and amount > 0:
        return "Income"

    return "Shopping & Retail"  # safe default for card payments


# ─────────────────────────────────────────────────────────────────────────────
# INVESTMENT DATA — yfinance cache
# ─────────────────────────────────────────────────────────────────────────────

_yf_price_cache: Dict[str, Dict[str, Any]] = {}   # ticker → {price, currency, name, ...}
_yf_fx_cache: Dict[str, float] = {}                # "USDEUR" → rate
_yf_history_cache: Dict[str, Any] = {}             # hash → data


def _get_yf_current(ticker: str) -> Dict[str, Any]:
    """Get current price info for a ticker, cached in-memory."""
    if ticker in _yf_price_cache:
        return _yf_price_cache[ticker]
    try:
        import yfinance as yf
        t = yf.Ticker(ticker)
        info = t.info
        price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose", 0)
        currency = info.get("currency", "EUR")
        name = info.get("shortName") or info.get("longName") or ticker
        result = {"price": float(price), "currency": currency, "name": name, "previousClose": float(info.get("previousClose", price))}
        _yf_price_cache[ticker] = result
        return result
    except Exception as e:
        print(f"yfinance error for {ticker}: {e}")
        return {"price": 0, "currency": "EUR", "name": ticker, "previousClose": 0}


def _get_fx_rate(from_ccy: str, to_ccy: str = "EUR") -> float:
    """Get FX rate, cached in-memory. Returns 1.0 for EUR→EUR."""
    if from_ccy == to_ccy:
        return 1.0
    key = f"{from_ccy}{to_ccy}"
    if key in _yf_fx_cache:
        return _yf_fx_cache[key]
    try:
        import yfinance as yf
        pair = f"{from_ccy}{to_ccy}=X"
        t = yf.Ticker(pair)
        info = t.info
        rate = info.get("regularMarketPrice") or info.get("previousClose", 1.0)
        _yf_fx_cache[key] = float(rate)
        return float(rate)
    except Exception as e:
        print(f"FX rate error {from_ccy}→{to_ccy}: {e}")
        # Hardcoded fallbacks
        fallbacks = {"USDEUR": 0.92, "GBPEUR": 1.17}
        rate = fallbacks.get(key, 1.0)
        _yf_fx_cache[key] = rate
        return rate


def _get_yf_history(ticker: str, start: str, end: str):
    """Get historical prices for a ticker between dates."""
    cache_key = f"{ticker}_{start}_{end}"
    if cache_key in _yf_history_cache:
        return _yf_history_cache[cache_key]
    try:
        import yfinance as yf
        t = yf.Ticker(ticker)
        hist = t.history(start=start, end=end)
        if hist.empty:
            _yf_history_cache[cache_key] = []
            return []
        result = [
            {"date": idx.strftime("%Y-%m-%d"), "price": float(row["Close"])}
            for idx, row in hist.iterrows()
        ]
        _yf_history_cache[cache_key] = result
        return result
    except Exception as e:
        print(f"yfinance history error for {ticker}: {e}")
        _yf_history_cache[cache_key] = []
        return []


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS — HEALTH
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "agent_available": AGENT_AVAILABLE,
        "database_exists": DB_PATH.exists(),
    }


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS — CHAT
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not AGENT_AVAILABLE:
        raise HTTPException(status_code=503, detail="Agent is not available")
    try:
        chat_hist = None
        if request.chat_history:
            chat_hist = [{"role": msg.role, "text": msg.text} for msg in request.chat_history]

        user_context = {
            "user_name": request.user_name,
            "language": request.language,
            "monthly_budget": request.monthly_budget,
            "alert_threshold": request.alert_threshold,
        }
        result = query_agent(request.message, chat_hist, user_context=user_context)

        def fig_to_json(fig):
            try:
                return json.loads(fig.to_json())
            except Exception:
                return None

        charts_json = [j for fig in result.get("charts", []) if (j := fig_to_json(fig))]
        chart_json = charts_json[0] if charts_json else None

        return ChatResponse(
            text=result.get("text", ""),
            chart=chart_json,
            charts=charts_json,
            table=result.get("table"),
            suggestions=result.get("suggestions", []),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")


@app.post("/api/chat/stream")
async def chat_stream(request: ChatRequest):
    if not AGENT_AVAILABLE:
        raise HTTPException(status_code=503, detail="Agent not available")

    chat_hist = None
    if request.chat_history:
        chat_hist = [{"role": msg.role, "text": msg.text} for msg in request.chat_history]

    user_context = {
        "user_name": request.user_name,
        "language": request.language,
        "monthly_budget": request.monthly_budget,
        "alert_threshold": request.alert_threshold,
    }

    loop = asyncio.get_event_loop()
    queue: asyncio.Queue = asyncio.Queue()

    class StepCallback(BaseCallbackHandler):
        def _push(self, text: str):
            asyncio.run_coroutine_threadsafe(queue.put({"type": "step", "text": text}), loop)

        def on_llm_start(self, serialized, prompts, **kwargs):
            self._push("Analyzing your question...")

        def on_tool_start(self, serialized, input_str, **kwargs):
            tool_name = serialized.get("name", "")
            if tool_name == "run_sql":
                try:
                    parsed = json.loads(input_str) if isinstance(input_str, str) else input_str
                    query = parsed.get("query", str(input_str)) if isinstance(parsed, dict) else str(input_str)
                    first_line = query.strip().split("\n")[0][:70]
                    self._push(f"SQL → {first_line}")
                except Exception:
                    self._push("Querying database...")
            elif tool_name == "make_chart":
                self._push("Generating chart...")
            else:
                self._push(f"Using tool: {tool_name}")

        def on_tool_end(self, output, **kwargs):
            self._push("Processing results...")

    async def event_generator():
        callback = StepCallback()

        def run_agent():
            try:
                result = query_agent(request.message, chat_hist, callbacks=[callback], user_context=user_context)

                def fig_to_json(fig):
                    try:
                        return json.loads(fig.to_json())
                    except Exception:
                        return None

                charts_json = [j for fig in result.get("charts", []) if (j := fig_to_json(fig))]
                chart_json = charts_json[0] if charts_json else None

                asyncio.run_coroutine_threadsafe(
                    queue.put({
                        "type": "result",
                        "text": result.get("text", ""),
                        "chart": chart_json,
                        "charts": charts_json,
                        "suggestions": result.get("suggestions", []),
                    }),
                    loop,
                )
            except Exception as e:
                asyncio.run_coroutine_threadsafe(
                    queue.put({"type": "error", "text": str(e)}), loop
                )

        executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
        loop.run_in_executor(executor, run_agent)

        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=120.0)
            except asyncio.TimeoutError:
                yield "data: " + json.dumps({"type": "error", "text": "Timeout"}) + "\n\n"
                break
            yield "data: " + json.dumps(event) + "\n\n"
            if event["type"] in ("result", "error"):
                break

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS — TRANSACTIONS (with signed amounts + source)
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/transactions", response_model=TransactionsResponse)
async def get_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
    search: Optional[str] = None,
    filter: str = Query("all", pattern="^(all|expense|income)$"),
    category: Optional[str] = None,
    source: Optional[str] = None,
    sort: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
):
    """Get transactions with pagination, filtering, source (bank) filter, and date range."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        where_clauses: list[str] = []
        params: list = []

        dc, dp = _date_clauses(start, end)
        where_clauses.extend(dc)
        params.extend(dp)

        # Income/expense filter (uses sign: positive = income, negative = expense)
        if filter == "expense":
            where_clauses.append("amount < 0")
        elif filter == "income":
            where_clauses.append("amount > 0 AND predicted_category = 'Income'")

        if search:
            where_clauses.append("(LOWER(merchant_name) LIKE ? OR LOWER(transaction_description) LIKE ?)")
            search_term = f"%{search.lower()}%"
            params.extend([search_term, search_term])

        if category:
            where_clauses.append("predicted_category = ?")
            params.append(category)

        if source:
            where_clauses.append("source = ?")
            params.append(source)

        where_clause = " AND ".join(where_clauses) if where_clauses else "1=1"

        cursor.execute(f"SELECT COUNT(*) as count FROM transactions WHERE {where_clause}", params)
        total = cursor.fetchone()["count"]

        sort_by = "timestamp DESC"
        if sort:
            SORT_MAP = {
                "date-desc": "timestamp DESC",
                "date-asc": "timestamp ASC",
                "amount-desc": "amount DESC",
                "amount-asc": "amount ASC",
            }
            sort_by = SORT_MAP.get(sort, "timestamp DESC")

        offset = (page - 1) * limit
        query = f"""
            SELECT
                transaction_id as id, account_id, source,
                merchant_name, timestamp,
                transaction_description as description,
                category, amount, currency,
                predicted_category, confidence
            FROM transactions
            WHERE {where_clause}
            ORDER BY {sort_by}
            LIMIT ? OFFSET ?
        """
        params.extend([limit, offset])

        cursor.execute(query, params)
        rows = cursor.fetchall()
        transactions = [dict_from_row(row) for row in rows]

        conn.close()
        return TransactionsResponse(transactions=transactions, total=total, page=page, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS — SUMMARY (signed amounts, excludes Transfer + Investment)
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/summary", response_model=SummaryResponse)
async def get_summary(start: Optional[str] = None, end: Optional[str] = None):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        dc, dp = _date_clauses(start, end)
        date_where = (" AND " + " AND ".join(dc)) if dc else ""

        # Income: positive amounts where category is Income (excludes Transfer)
        cursor.execute(
            f"SELECT COALESCE(SUM(amount), 0) as total FROM transactions "
            f"WHERE predicted_category = 'Income'{date_where}",
            dp,
        )
        total_income = cursor.fetchone()["total"]

        # Spending: negative amounts, exclude Income/Transfer/Investment → use ABS
        cursor.execute(
            f"SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM transactions "
            f"WHERE amount < 0 AND {_EXCL_SQL}{date_where}",
            dp,
        )
        total_spent = cursor.fetchone()["total"]

        # Top spending category (by absolute amount)
        cursor.execute(
            f"""
            SELECT predicted_category, SUM(ABS(amount)) as total_amount
            FROM transactions
            WHERE amount < 0 AND {_EXCL_SQL}{date_where}
            GROUP BY predicted_category
            ORDER BY total_amount DESC
            LIMIT 1
            """,
            dp,
        )
        top_cat_row = cursor.fetchone()
        top_category = (
            {"name": top_cat_row["predicted_category"], "amount": round(top_cat_row["total_amount"], 2)}
            if top_cat_row
            else {"name": "N/A", "amount": 0}
        )

        # Subscriptions
        cached_subs = _load_subs_cache()
        if cached_subs:
            sub_count = cached_subs.get("activeCount", 0)
            sub_monthly = cached_subs.get("totalMonthly", 0.0)
        else:
            cursor.execute(f"""
                SELECT merchant_name, ROUND(AVG(ABS(amount)), 2) as avg_amount
                FROM transactions
                WHERE amount < 0 AND {_EXCL_SQL}
                GROUP BY merchant_name
                HAVING
                    COUNT(*) >= 3
                    AND AVG(ABS(amount)) <= 150
                    AND AVG(ABS(amount)) > 0
                    AND COUNT(DISTINCT (year * 100 + month)) >= 3
                    AND MAX(DATE(timestamp)) >= DATE((SELECT MAX(timestamp) FROM transactions), '-30 days')
            """)
            sub_rows = cursor.fetchall()
            sub_count = len(sub_rows)
            sub_monthly = round(sum(r["avg_amount"] for r in sub_rows), 2)

        subscriptions = {"count": sub_count, "monthlyTotal": sub_monthly}
        conn.close()

        return SummaryResponse(
            totalIncome=round(total_income, 2),
            totalSpent=round(total_spent, 2),
            netBalance=round(total_income - total_spent, 2),
            topCategory=top_category,
            subscriptions=subscriptions,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS — CATEGORIES (signed amounts, excludes Transfer + Investment)
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/categories", response_model=CategoriesResponse)
async def get_categories(start: Optional[str] = None, end: Optional[str] = None):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        dc, dp = _date_clauses(start, end)
        date_where = (" AND " + " AND ".join(dc)) if dc else ""

        cursor.execute(
            f"SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM transactions "
            f"WHERE amount < 0 AND {_EXCL_SQL}{date_where}",
            dp,
        )
        total_spending = cursor.fetchone()["total"]
        if total_spending == 0:
            return CategoriesResponse(categories=[])

        cursor.execute(
            f"""
            SELECT predicted_category as category, SUM(ABS(amount)) as amount, COUNT(*) as transactionCount
            FROM transactions
            WHERE amount < 0 AND {_EXCL_SQL}{date_where}
            GROUP BY predicted_category
            ORDER BY amount DESC
            """,
            dp,
        )
        rows = cursor.fetchall()
        categories = []
        for row in rows:
            amt = row["amount"]
            pct = round((amt / total_spending) * 100, 1) if total_spending > 0 else 0
            categories.append(Category(category=row["category"], amount=round(amt, 2), percentage=pct, transactionCount=row["transactionCount"]))

        conn.close()
        return CategoriesResponse(categories=categories)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS — SPENDING TREND (signed amounts, excludes Transfer + Investment)
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/monthly-spending", response_model=SpendingTrendResponse)
async def get_monthly_spending(
    start: Optional[str] = None, end: Optional[str] = None, year: Optional[int] = None
):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        month_names = {1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
                       7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"}

        if start and end:
            cursor.execute("SELECT JULIANDAY(?) - JULIANDAY(?) as span", (end, start))
            span_days = cursor.fetchone()["span"] or 31
        elif start or end:
            span_days = 31
        else:
            span_days = 365

        if span_days <= 31:
            granularity = "daily"
        elif span_days <= 93:
            granularity = "weekly"
        else:
            granularity = "monthly"

        dc, dp = _date_clauses(start, end)
        date_where = (" AND " + " AND ".join(dc)) if dc else ""

        # All spending queries use ABS(amount) for negative expenses, exclude Transfer/Investment
        base_filter = f"amount < 0 AND {_EXCL_SQL}"

        if granularity == "daily":
            cursor.execute(f"""
                SELECT DATE(timestamp) as day, SUM(ABS(amount)) as total
                FROM transactions WHERE {base_filter}{date_where}
                GROUP BY DATE(timestamp) ORDER BY day ASC
            """, dp)
            data = [SpendingDataPoint(label=r["day"][5:], amount=round(r["total"], 2)) for r in cursor.fetchall()]

        elif granularity == "weekly":
            cursor.execute(f"""
                SELECT MIN(DATE(timestamp)) as week_start, SUM(ABS(amount)) as total
                FROM transactions WHERE {base_filter}{date_where}
                GROUP BY strftime('%Y-%W', timestamp) ORDER BY week_start ASC
            """, dp)
            data = [SpendingDataPoint(label=r["week_start"][5:], amount=round(r["total"], 2)) for r in cursor.fetchall()]

        else:
            if not start and not end:
                use_year = year or 2024
                cursor.execute(f"""
                    SELECT month, SUM(ABS(amount)) as total
                    FROM transactions WHERE year = ? AND {base_filter}
                    GROUP BY month ORDER BY month ASC
                """, (use_year,))
                data = [SpendingDataPoint(label=month_names.get(r["month"], str(r["month"])), amount=round(r["total"], 2)) for r in cursor.fetchall()]
            else:
                cursor.execute(f"""
                    SELECT year, month, SUM(ABS(amount)) as total
                    FROM transactions WHERE {base_filter}{date_where}
                    GROUP BY year, month ORDER BY year ASC, month ASC
                """, dp)
                data = [SpendingDataPoint(label=f"{month_names.get(r['month'], str(r['month']))} {r['year']}", amount=round(r["total"], 2)) for r in cursor.fetchall()]

        conn.close()
        return SpendingTrendResponse(data=data, granularity=granularity)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS — SUBSCRIPTIONS (signed amounts, excludes Transfer + Investment)
# ─────────────────────────────────────────────────────────────────────────────

_SUBS_CACHE_PATH = _BACKEND_DIR / "data" / "subscriptions_cache.json"


def _load_subs_cache() -> Optional[dict]:
    if _SUBS_CACHE_PATH.exists():
        try:
            with open(_SUBS_CACHE_PATH) as f:
                return json.load(f)
        except Exception:
            return None
    return None


def _save_subs_cache(data: dict):
    with open(_SUBS_CACHE_PATH, "w") as f:
        json.dump(data, f, indent=2)


def _detect_subscriptions_with_llm() -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT MAX(timestamp) as max_ts FROM transactions")
    max_ts = cursor.fetchone()["max_ts"]

    cursor.execute(f"""
        SELECT merchant_name, predicted_category, year, month,
               COUNT(*) as txn_count,
               ROUND(AVG(ABS(amount)), 2) as avg_amount,
               GROUP_CONCAT(ROUND(ABS(amount), 2)) as amounts,
               MAX(timestamp) as last_charge
        FROM transactions
        WHERE amount < 0 AND {_EXCL_SQL}
          AND DATE(timestamp) >= DATE(?, '-62 days')
        GROUP BY merchant_name, year, month
        ORDER BY merchant_name, year DESC, month DESC
    """, (max_ts,))
    rows = cursor.fetchall()
    conn.close()

    merchant_months: Dict[str, list] = {}
    for row in rows:
        name = row["merchant_name"]
        if name not in merchant_months:
            merchant_months[name] = []
        merchant_months[name].append({
            "month": f"{row['year']}-{row['month']:02d}",
            "count": row["txn_count"],
            "avg": row["avg_amount"],
            "amounts": row["amounts"],
            "category": row["predicted_category"],
            "last_charge": row["last_charge"],
        })

    summary_lines = []
    for merchant, months in merchant_months.items():
        month_strs = [f"  {m['month']}: {m['count']} charge(s), amounts=[{m['amounts']}]" for m in months]
        summary_lines.append(f"- {merchant} ({months[0]['category']}):\n" + "\n".join(month_strs))
    merchant_summary = "\n".join(summary_lines)

    try:
        api_key = os.getenv("ANTHROPIC_API_KEY", "")
        if not api_key:
            raise ValueError("No API key")

        from langchain_anthropic import ChatAnthropic
        from langchain_core.messages import HumanMessage as HM

        llm = ChatAnthropic(model="claude-haiku-4-5-20251001", anthropic_api_key=api_key, temperature=0, max_tokens=2048)

        prompt = f"""Analyse these merchant transaction patterns from the last 2 months and identify ONLY optional lifestyle/entertainment subscriptions — services the user actively chose to subscribe to.

YES — include these as subscriptions:
- Streaming services: Netflix, Spotify, Disney+, HBO, YouTube Premium, Apple TV+
- Software / cloud: iCloud, Amazon Prime, Dropbox, Adobe, Microsoft 365
- Gym / fitness memberships: DiR, Holmes Place, Basic-Fit
- Other optional services: meal kits, news subscriptions, VPNs, dating apps

NO — do NOT include any of the following, even if they recur monthly at a fixed amount:
- Rent / housing: landlord, property management, mortgage payments
- Utility bills: electricity, water, gas, heating
- Telecom / internet / phone plans: Vodafone, Movistar, Orange, O2, Yoigo
- Insurance payments: health, home, car, life insurance
- Government / tax: council tax, municipal fees
- Loan repayments, bank fees, ATM withdrawals
- Restaurants, bars, grocery stores, clothing shops, retail stores, parking, taxi/rideshare

Key signals for a real subscription:
- Nearly identical amount each month (within €1 variance)
- Exactly 1 charge per month (not 5-10 visits like a grocery store)
- The merchant name sounds like a streaming/software/gym service, not a landlord, utility company, or telecom provider

Here are the merchants and their charges in the last 2 months:

{merchant_summary}

Return a JSON array of subscription objects. Each object must have:
- "merchant": exact merchant name as shown above
- "category": the category shown above
- "monthlyCost": the typical monthly charge amount
- "isSubscription": true

ONLY include merchants you are confident are real subscriptions.
Return ONLY the JSON array, no other text. If none found, return [].
"""
        response = llm.invoke([HM(content=prompt)])
        response_text = response.content if isinstance(response.content, str) else str(response.content)

        import re
        json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
        detected = json.loads(json_match.group()) if json_match else []

    except Exception as e:
        print(f"LLM subscription detection failed, using tight heuristic: {e}")
        detected = _fallback_heuristic_subscriptions(merchant_months)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DATE(?, '-30 days') as cutoff", (max_ts,))
    cutoff = cursor.fetchone()["cutoff"]

    active, inactive = [], []
    total_monthly = 0.0

    for sub_info in detected:
        merchant = sub_info.get("merchant", "")
        cursor.execute("SELECT COUNT(*) as cnt, MAX(timestamp) as last_charge FROM transactions WHERE merchant_name = ?", (merchant,))
        row = cursor.fetchone()
        if not row or row["cnt"] == 0:
            continue

        cost = float(sub_info.get("monthlyCost", 0))
        sub = Subscription(merchant=merchant, category=sub_info.get("category", ""), monthlyCost=round(cost, 2), lastCharge=row["last_charge"], chargeCount=row["cnt"], active=False)

        if row["last_charge"][:10] >= cutoff:
            sub.active = True
            active.append(sub)
            total_monthly += cost
        else:
            inactive.append(sub)

    conn.close()

    result = {
        "active": [s.model_dump() for s in active],
        "inactive": [s.model_dump() for s in inactive],
        "totalMonthly": round(total_monthly, 2),
        "activeCount": len(active),
    }
    _save_subs_cache(result)
    return result


def _fallback_heuristic_subscriptions(merchant_months: Dict[str, list]) -> list:
    detected = []
    for merchant, months in merchant_months.items():
        if len(months) < 2:
            continue
        recent_two = months[:2]
        if any(m["count"] != 1 for m in recent_two):
            continue
        amounts = [m["avg"] for m in recent_two]
        if abs(amounts[0] - amounts[1]) > 1.0:
            continue
        avg = sum(amounts) / len(amounts)
        if avg > 150 or avg <= 0:
            continue
        detected.append({"merchant": merchant, "category": recent_two[0]["category"], "monthlyCost": round(avg, 2), "isSubscription": True})
    return detected


@app.post("/api/subscriptions/detect")
async def detect_subscriptions():
    try:
        return _detect_subscriptions_with_llm()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection error: {str(e)}")


@app.get("/api/subscriptions", response_model=SubscriptionsResponse)
async def get_subscriptions():
    try:
        cached = _load_subs_cache()
        if cached:
            return SubscriptionsResponse(**cached)
        result = _detect_subscriptions_with_llm()
        return SubscriptionsResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Subscription error: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS — STATS
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/stats")
async def get_stats():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as total FROM transactions")
        total = cursor.fetchone()["total"]
        conn.close()
        return {"transactionCount": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS — ACCOUNTS (multi-bank)
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/accounts")
async def get_accounts():
    """Return connected bank accounts with transaction counts."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT source, COUNT(*) as transaction_count,
                   MIN(DATE(timestamp)) as first_transaction,
                   MAX(DATE(timestamp)) as last_transaction
            FROM transactions
            GROUP BY source
            ORDER BY transaction_count DESC
        """)
        rows = cursor.fetchall()
        conn.close()

        accounts = [
            {
                "name": row["source"],
                "transactionCount": row["transaction_count"],
                "firstTransaction": row["first_transaction"],
                "lastTransaction": row["last_transaction"],
                "status": "connected",
            }
            for row in rows
        ]
        return {"accounts": accounts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS — CSV UPLOAD (multi-bank)
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/upload-csv")
async def upload_csv(bank_name: str = Form(...), file: UploadFile = File(...)):
    """
    Upload a bank CSV, classify transactions, and insert into DB.
    Supports Revolut CSV format. Deletes subscription cache to force re-detection.
    """
    try:
        content = await file.read()
        text = content.decode("utf-8-sig")  # handle BOM
        reader = csv.DictReader(io.StringIO(text))
        rows_raw = list(reader)

        if not rows_raw:
            raise HTTPException(status_code=400, detail="CSV is empty")

        # Detect format by column names
        cols = set(rows_raw[0].keys())
        is_revolut = "Type" in cols and "Description" in cols and "Started Date" in cols

        conn = get_db_connection()
        cursor = conn.cursor()

        # Get next transaction_id sequence
        cursor.execute("SELECT COUNT(*) as cnt FROM transactions")
        next_id = cursor.fetchone()["cnt"]

        inserted = 0
        for row in rows_raw:
            if is_revolut:
                ts_str = row.get("Started Date", "")
                description = row.get("Description", "")
                amount = float(row.get("Amount", 0))
                currency = row.get("Currency", "EUR")
                tx_type = row.get("Type", "")
                state = row.get("State", "")
                if state != "COMPLETED":
                    continue

                category = classify_revolut_transaction(description, amount, tx_type)
            else:
                # Generic CSV: expect at minimum date, description, amount
                ts_str = row.get("date", row.get("Date", row.get("timestamp", "")))
                description = row.get("description", row.get("Description", ""))
                amount = float(row.get("amount", row.get("Amount", 0)))
                currency = row.get("currency", row.get("Currency", "EUR"))
                category = row.get("category", "Uncategorized")

            # Parse timestamp
            try:
                ts = datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                try:
                    ts = datetime.strptime(ts_str, "%Y-%m-%d")
                except ValueError:
                    continue  # skip unparseable rows

            tx_id = f"UP{next_id + inserted:05d}"
            cursor.execute(
                """INSERT INTO transactions
                   (transaction_id, account_id, source, merchant_name, merchant_id,
                    timestamp, transaction_description, category, amount, currency,
                    predicted_category, confidence, correct, year, month, day)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    tx_id,
                    f"ACC_{bank_name.upper()[:8]}_001",
                    bank_name,
                    description,   # merchant_name = description for uploaded CSV
                    "",
                    ts.strftime("%Y-%m-%d %H:%M:%S"),
                    description,
                    category,
                    amount,
                    currency,
                    category,      # predicted_category = classified category
                    0.9,
                    True,
                    ts.year,
                    ts.month,
                    ts.day,
                ),
            )
            inserted += 1

        conn.commit()
        conn.close()

        # Delete subscription cache to force re-detection with new data
        if _SUBS_CACHE_PATH.exists():
            _SUBS_CACHE_PATH.unlink()

        return {"inserted": inserted, "source": bank_name}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS — INVESTMENTS
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/investments")
async def get_investments(include_orders: bool = False):
    """
    Return all holdings with current prices from Yahoo Finance,
    gain/loss per position, and portfolio totals. All values in EUR.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT ticker, company_name, asset_type,
                   SUM(quantity) as total_qty,
                   SUM(total_cost) as total_cost,
                   currency,
                   MIN(purchase_date) as first_purchase,
                   MAX(purchase_date) as last_purchase
            FROM investments
            GROUP BY ticker
            ORDER BY total_cost DESC
        """)
        rows = cursor.fetchall()
        conn.close()

        orders_by_ticker = {}
        if include_orders:
            conn2 = get_db_connection()
            cursor2 = conn2.cursor()
            cursor2.execute("SELECT ticker, purchase_date, quantity, purchase_price, total_cost, currency FROM investments ORDER BY purchase_date ASC")
            for o in cursor2.fetchall():
                t = o["ticker"]
                if t not in orders_by_ticker:
                    orders_by_ticker[t] = []
                orders_by_ticker[t].append({
                    "date": o["purchase_date"],
                    "quantity": round(o["quantity"], 4),
                    "pricePerShare": round(o["purchase_price"], 2),
                    "totalCost": round(o["total_cost"], 2),
                    "currency": o["currency"],
                })
            conn2.close()

        holdings = []
        grand_invested = 0.0
        grand_current = 0.0

        for row in rows:
            ticker = row["ticker"]
            qty = row["total_qty"]
            cost = row["total_cost"]
            purchase_ccy = row["currency"]

            # Convert purchase cost to EUR
            cost_fx = _get_fx_rate(purchase_ccy, "EUR")
            cost_eur = cost * cost_fx

            # Get current price
            yf_data = _get_yf_current(ticker)
            current_price = yf_data["price"]
            price_ccy = yf_data["currency"]
            price_fx = _get_fx_rate(price_ccy, "EUR")
            current_value_eur = qty * current_price * price_fx

            # Today's return
            previous_close = yf_data.get("previousClose", current_price)
            today_change_eur = qty * (current_price - previous_close) * price_fx
            today_change_pct = ((current_price - previous_close) / previous_close * 100) if previous_close > 0 else 0

            avg_price = cost / qty if qty else 0
            return_eur = current_value_eur - cost_eur
            return_pct = (return_eur / cost_eur * 100) if cost_eur else 0

            holding_dict = {
                "ticker": ticker,
                "companyName": yf_data["name"] or row["company_name"],
                "assetType": row["asset_type"],
                "quantity": round(qty, 4),
                "avgPurchasePrice": round(avg_price, 2),
                "purchaseCurrency": purchase_ccy,
                "currentPrice": round(current_price, 2),
                "currentPriceCurrency": price_ccy,
                "currentValueEur": round(current_value_eur, 2),
                "totalCostEur": round(cost_eur, 2),
                "returnEur": round(return_eur, 2),
                "returnPct": round(return_pct, 2),
                "todayChangeEur": round(today_change_eur, 2),
                "todayChangePct": round(today_change_pct, 2),
                "firstPurchase": row["first_purchase"],
                "lastPurchase": row["last_purchase"],
            }
            if include_orders:
                holding_dict["orders"] = orders_by_ticker.get(ticker, [])
            holdings.append(holding_dict)

            grand_invested += cost_eur
            grand_current += current_value_eur

        grand_return = grand_current - grand_invested
        grand_return_pct = (grand_return / grand_invested * 100) if grand_invested else 0

        return {
            "holdings": holdings,
            "totals": {
                "invested": round(grand_invested, 2),
                "currentValue": round(grand_current, 2),
                "returnEur": round(grand_return, 2),
                "returnPct": round(grand_return_pct, 2),
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Investment error: {str(e)}")


@app.get("/api/investments/history")
async def get_investment_history(
    start: Optional[str] = None,
    end: Optional[str] = None,
):
    """
    Return portfolio total value over time for charting.
    Uses daily historical prices from Yahoo Finance.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get all holdings with purchase dates
        cursor.execute("""
            SELECT ticker, purchase_date, quantity, currency
            FROM investments ORDER BY purchase_date ASC
        """)
        purchases = [dict_from_row(r) for r in cursor.fetchall()]
        conn.close()

        if not purchases:
            return {"data": [], "granularity": "daily"}

        # Determine date range
        hist_start = start or purchases[0]["purchase_date"]
        hist_end = end or datetime.now().strftime("%Y-%m-%d")

        # Get unique tickers
        tickers = list(set(p["ticker"] for p in purchases))

        # Fetch history for each ticker
        ticker_histories: Dict[str, Dict[str, float]] = {}
        for ticker in tickers:
            history = _get_yf_history(ticker, hist_start, hist_end)
            ticker_histories[ticker] = {h["date"]: h["price"] for h in history}

        # Build cumulative holdings over time
        # Sort purchases by date
        purchases_sorted = sorted(purchases, key=lambda p: p["purchase_date"])

        # Get all unique dates from histories
        all_dates = sorted(set(d for th in ticker_histories.values() for d in th.keys()))
        if not all_dates:
            return {"data": [], "granularity": "daily"}

        # Filter to requested range
        all_dates = [d for d in all_dates if d >= hist_start and d <= hist_end]

        # Forward-fill prices: carry last known price through weekends/holidays
        for ticker in tickers:
            th = ticker_histories.get(ticker, {})
            last_price = None
            for date in all_dates:
                if date in th:
                    last_price = th[date]
                elif last_price is not None:
                    th[date] = last_price
            ticker_histories[ticker] = th

        # Build portfolio value per date
        data_points = []
        cumulative_holdings: Dict[str, float] = {}  # ticker → qty
        purchase_idx = 0

        for date in all_dates:
            # Add any purchases up to this date
            while purchase_idx < len(purchases_sorted) and purchases_sorted[purchase_idx]["purchase_date"] <= date:
                p = purchases_sorted[purchase_idx]
                cumulative_holdings[p["ticker"]] = cumulative_holdings.get(p["ticker"], 0) + p["quantity"]
                purchase_idx += 1

            # Calculate portfolio value
            total_value = 0.0
            for ticker, qty in cumulative_holdings.items():
                price = ticker_histories.get(ticker, {}).get(date)
                if price is None:
                    continue
                ccy = next((p["currency"] for p in purchases if p["ticker"] == ticker), "EUR")
                # Get the price currency from yfinance cache
                yf_info = _yf_price_cache.get(ticker, {})
                price_ccy = yf_info.get("currency", ccy)
                fx = _get_fx_rate(price_ccy, "EUR")
                total_value += qty * price * fx

            if total_value > 0:
                data_points.append({"label": date[5:], "amount": round(total_value, 2), "date": date})

        # Determine granularity
        span = len(data_points)
        if span > 200:
            # Downsample to weekly
            weekly = []
            for i in range(0, len(data_points), 5):
                weekly.append(data_points[i])
            data_points = weekly
            granularity = "weekly"
        elif span > 60:
            granularity = "daily"
        else:
            granularity = "daily"

        return {"data": data_points, "granularity": granularity}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Investment history error: {str(e)}")

@app.post("/api/investments/add")
async def add_investment(request: AddInvestmentRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        total_cost = request.quantity * request.purchase_price
        cursor.execute(
            """INSERT INTO investments
               (ticker, company_name, asset_type, quantity, purchase_price, total_cost, purchase_date, currency)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (request.ticker.upper(), request.company_name, request.asset_type,
             request.quantity, request.purchase_price, total_cost,
             request.purchase_date, request.currency),
        )
        conn.commit()
        conn.close()
        _yf_price_cache.pop(request.ticker.upper(), None)
        return {"success": True, "ticker": request.ticker.upper(), "quantity": request.quantity, "total_cost": total_cost}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add investment: {str(e)}")

class AddTransactionRequest(BaseModel):
    date: str
    description: str
    amount: float
    source: str
    category: str

@app.post("/api/transactions/add")
async def add_transaction(request: AddTransactionRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as cnt FROM transactions")
        next_id = cursor.fetchone()["cnt"]
        tx_id = f"MN{next_id:05d}"
        ts = datetime.strptime(request.date, "%Y-%m-%d")
        cursor.execute(
            """INSERT INTO transactions
               (transaction_id, account_id, source, merchant_name, merchant_id,
                timestamp, transaction_description, category, amount, currency,
                predicted_category, confidence, correct, year, month, day)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (tx_id, f"ACC_{request.source.upper()[:8]}_001", request.source,
             request.description, "", ts.strftime("%Y-%m-%d %H:%M:%S"),
             request.description, request.category, request.amount, "EUR",
             request.category, 0.9, True, ts.year, ts.month, ts.day),
        )
        conn.commit()
        conn.close()
        return {"success": True, "id": tx_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add transaction: {str(e)}")
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
