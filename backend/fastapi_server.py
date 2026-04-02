"""
FastAPI wrapper server for the financial assistant backend.

Imports and calls existing backend functions without modifying them.
Provides REST API endpoints for chat, transactions, summaries, and metrics.
"""

import sys
import os
import sqlite3
from pathlib import Path
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
import asyncio
import concurrent.futures
from langchain_core.callbacks import BaseCallbackHandler

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
    alert_threshold: Optional[float] = None  # percentage, e.g. 80 means 80%


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
    granularity: str  # "daily", "weekly", "monthly"


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


# ─────────────────────────────────────────────────────────────────────────────
# FASTAPI APP
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Financial Assistant API",
    description="REST API wrapper for the financial assistant backend",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────────────────
# STARTUP EVENT
# ─────────────────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    """Verify database exists on startup."""
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
    """Get a connection to the database."""
    if not DB_PATH.exists():
        raise HTTPException(
            status_code=503,
            detail=f"Database not found at {DB_PATH}"
        )
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def dict_from_row(row):
    """Convert sqlite3.Row to dict."""
    if row is None:
        return None
    return dict(row)


def _date_clauses(start: Optional[str], end: Optional[str]):
    """Build WHERE clauses and params for date filtering on the timestamp column."""
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
# ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "agent_available": AGENT_AVAILABLE,
        "database_exists": DB_PATH.exists()
    }


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat endpoint that calls the agent."""
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
            suggestions=result.get("suggestions", [])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")


@app.post("/api/chat/stream")
async def chat_stream(request: ChatRequest):
    """Streaming SSE endpoint that emits agent reasoning steps in real-time."""
    if not AGENT_AVAILABLE:
        raise HTTPException(status_code=503, detail="Agent not available")

    chat_hist = None
    if request.chat_history:
        chat_hist = [{"role": msg.role, "text": msg.text} for msg in request.chat_history]

    user_context = {
        "user_name": request.user_name,
        "language": request.language,
        "monthly_budget": request.monthly_budget,
    }

    loop = asyncio.get_event_loop()
    queue: asyncio.Queue = asyncio.Queue()

    class StepCallback(BaseCallbackHandler):
        def _push(self, text: str):
            asyncio.run_coroutine_threadsafe(
                queue.put({"type": "step", "text": text}), loop
            )

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
                    }), loop
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


@app.get("/api/transactions", response_model=TransactionsResponse)
async def get_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
    search: Optional[str] = None,
    filter: str = Query("all", pattern="^(all|expense|income)$"),
    category: Optional[str] = None,
    sort: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
):
    """Get transactions with pagination, filtering, and optional date range."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        where_clauses = []
        params = []

        # Date range
        dc, dp = _date_clauses(start, end)
        where_clauses.extend(dc)
        params.extend(dp)

        if filter == "expense":
            where_clauses.append("predicted_category != 'Income'")
        elif filter == "income":
            where_clauses.append("predicted_category = 'Income'")

        if search:
            where_clauses.append(
                "(LOWER(merchant_name) LIKE ? OR LOWER(transaction_description) LIKE ?)"
            )
            search_term = f"%{search.lower()}%"
            params.extend([search_term, search_term])

        if category:
            where_clauses.append("predicted_category = ?")
            params.append(category)

        where_clause = " AND ".join(where_clauses) if where_clauses else "1=1"

        count_query = f"SELECT COUNT(*) as count FROM transactions WHERE {where_clause}"
        cursor.execute(count_query, params)
        total = cursor.fetchone()["count"]

        sort_by = "timestamp DESC"
        if sort:
            allowed_sorts = ["amount", "timestamp", "merchant_name", "category"]
            if sort in allowed_sorts:
                sort_by = f"{sort} DESC"

        offset = (page - 1) * limit
        query = f"""
            SELECT
                transaction_id as id,
                account_id,
                merchant_name,
                timestamp,
                transaction_description as description,
                category,
                amount,
                currency,
                predicted_category,
                confidence
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

        return TransactionsResponse(
            transactions=transactions,
            total=total,
            page=page,
            limit=limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/summary", response_model=SummaryResponse)
async def get_summary(
    start: Optional[str] = None,
    end: Optional[str] = None,
):
    """Get aggregate financial metrics for a date range."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        dc, dp = _date_clauses(start, end)
        date_where = (" AND " + " AND ".join(dc)) if dc else ""

        # Get income
        cursor.execute(
            f"SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE predicted_category = 'Income'{date_where}",
            dp
        )
        total_income = cursor.fetchone()["total"]

        # Get spending
        cursor.execute(
            f"SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE predicted_category != 'Income'{date_where}",
            dp
        )
        total_spent = cursor.fetchone()["total"]

        # Get top category
        cursor.execute(f"""
            SELECT predicted_category, SUM(amount) as total_amount
            FROM transactions
            WHERE predicted_category != 'Income'{date_where}
            GROUP BY predicted_category
            ORDER BY total_amount DESC
            LIMIT 1
        """, dp)
        top_cat_row = cursor.fetchone()
        top_category = {
            "name": top_cat_row["predicted_category"],
            "amount": top_cat_row["total_amount"]
        } if top_cat_row else {"name": "N/A", "amount": 0}

        # Active subscriptions — use LLM-based cache when available
        cached_subs = _load_subs_cache()
        if cached_subs:
            sub_count = cached_subs.get("activeCount", 0)
            sub_monthly = cached_subs.get("totalMonthly", 0.0)
        else:
            # Fallback: quick heuristic count if no cache yet
            cursor.execute("""
                SELECT merchant_name, ROUND(AVG(amount), 2) as avg_amount
                FROM transactions
                WHERE predicted_category != 'Income'
                GROUP BY merchant_name
                HAVING
                    COUNT(*) >= 3
                    AND AVG(amount) <= 150
                    AND AVG(amount) > 0
                    AND COUNT(DISTINCT (year * 100 + month)) >= 3
                    AND MAX(DATE(timestamp)) >= DATE((SELECT MAX(timestamp) FROM transactions), '-30 days')
            """)
            sub_rows = cursor.fetchall()
            sub_count = len(sub_rows)
            sub_monthly = round(sum(r["avg_amount"] for r in sub_rows), 2)
        subscriptions = {
            "count": sub_count,
            "monthlyTotal": sub_monthly,
        }

        conn.close()

        return SummaryResponse(
            totalIncome=round(total_income, 2),
            totalSpent=round(total_spent, 2),
            netBalance=round(total_income - total_spent, 2),
            topCategory=top_category,
            subscriptions=subscriptions
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/categories", response_model=CategoriesResponse)
async def get_categories(
    start: Optional[str] = None,
    end: Optional[str] = None,
):
    """Get category breakdown with amounts and percentages for a date range."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        dc, dp = _date_clauses(start, end)
        date_where = (" AND " + " AND ".join(dc)) if dc else ""

        cursor.execute(
            f"SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE predicted_category != 'Income'{date_where}",
            dp
        )
        total_spending = cursor.fetchone()["total"]

        if total_spending == 0:
            return CategoriesResponse(categories=[])

        cursor.execute(f"""
            SELECT
                predicted_category as category,
                SUM(amount) as amount,
                COUNT(*) as transactionCount
            FROM transactions
            WHERE predicted_category != 'Income'{date_where}
            GROUP BY predicted_category
            ORDER BY amount DESC
        """, dp)

        rows = cursor.fetchall()
        categories = []
        for row in rows:
            amount = row["amount"]
            percentage = round((amount / total_spending) * 100, 1) if total_spending > 0 else 0
            categories.append(Category(
                category=row["category"],
                amount=round(amount, 2),
                percentage=percentage,
                transactionCount=row["transactionCount"]
            ))

        conn.close()

        return CategoriesResponse(categories=categories)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/monthly-spending", response_model=SpendingTrendResponse)
async def get_monthly_spending(
    start: Optional[str] = None,
    end: Optional[str] = None,
    year: Optional[int] = None,
):
    """
    Get spending trend data with adaptive granularity.
    Auto-detects granularity from date range:
      - <=31 days: daily
      - 32-90 days: weekly
      - >90 days: monthly
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        month_names = {
            1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
            7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"
        }

        # Determine date range span in days
        if start and end:
            cursor.execute("SELECT JULIANDAY(?) - JULIANDAY(?) as span", (end, start))
            span_days = cursor.fetchone()["span"] or 31
        elif start or end:
            span_days = 31  # default
        else:
            span_days = 365  # no range = full year

        # Auto-detect granularity
        if span_days <= 31:
            granularity = "daily"
        elif span_days <= 90:
            granularity = "weekly"
        else:
            granularity = "monthly"

        dc, dp = _date_clauses(start, end)
        date_where = (" AND " + " AND ".join(dc)) if dc else ""

        if granularity == "daily":
            cursor.execute(f"""
                SELECT DATE(timestamp) as day, SUM(amount) as total
                FROM transactions
                WHERE predicted_category != 'Income'{date_where}
                GROUP BY DATE(timestamp)
                ORDER BY day ASC
            """, dp)
            rows = cursor.fetchall()
            data = [
                SpendingDataPoint(
                    label=row["day"][5:],  # "MM-DD"
                    amount=round(row["total"], 2),
                )
                for row in rows
            ]
        elif granularity == "weekly":
            # Group by ISO week using strftime('%W')
            cursor.execute(f"""
                SELECT
                    MIN(DATE(timestamp)) as week_start,
                    SUM(amount) as total
                FROM transactions
                WHERE predicted_category != 'Income'{date_where}
                GROUP BY strftime('%Y-%W', timestamp)
                ORDER BY week_start ASC
            """, dp)
            rows = cursor.fetchall()
            data = [
                SpendingDataPoint(
                    label=row["week_start"][5:],  # "MM-DD" of week start
                    amount=round(row["total"], 2),
                )
                for row in rows
            ]
        else:
            # Monthly (default / backward compat)
            if not start and not end:
                # Single year mode
                use_year = year or 2024
                cursor.execute("""
                    SELECT month, SUM(amount) as total
                    FROM transactions
                    WHERE year = ? AND predicted_category != 'Income'
                    GROUP BY month
                    ORDER BY month ASC
                """, (use_year,))
                rows = cursor.fetchall()
                data = [
                    SpendingDataPoint(
                        label=month_names.get(row["month"], str(row["month"])),
                        amount=round(row["total"], 2),
                    )
                    for row in rows
                ]
            else:
                cursor.execute(f"""
                    SELECT year, month, SUM(amount) as total
                    FROM transactions
                    WHERE predicted_category != 'Income'{date_where}
                    GROUP BY year, month
                    ORDER BY year ASC, month ASC
                """, dp)
                rows = cursor.fetchall()
                data = [
                    SpendingDataPoint(
                        label=f"{month_names.get(row['month'], str(row['month']))} {row['year']}",
                        amount=round(row["total"], 2),
                    )
                    for row in rows
                ]

        conn.close()

        return SpendingTrendResponse(data=data, granularity=granularity)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


_SUBS_CACHE_PATH = _BACKEND_DIR / "data" / "subscriptions_cache.json"


def _load_subs_cache() -> Optional[dict]:
    """Load cached subscription data if it exists."""
    if _SUBS_CACHE_PATH.exists():
        try:
            with open(_SUBS_CACHE_PATH) as f:
                return json.load(f)
        except Exception:
            return None
    return None


def _save_subs_cache(data: dict):
    """Save subscription data to cache."""
    with open(_SUBS_CACHE_PATH, "w") as f:
        json.dump(data, f, indent=2)


def _detect_subscriptions_with_llm() -> dict:
    """
    Use Claude to classify real subscriptions by comparing the last two months
    of transaction data. Falls back to a tight heuristic if the LLM is unavailable.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT MAX(timestamp) as max_ts FROM transactions")
    max_ts = cursor.fetchone()["max_ts"]

    # Get the last 2 months of data grouped by merchant
    cursor.execute("""
        SELECT
            merchant_name,
            predicted_category,
            year, month,
            COUNT(*) as txn_count,
            ROUND(AVG(amount), 2) as avg_amount,
            GROUP_CONCAT(ROUND(amount, 2)) as amounts,
            MAX(timestamp) as last_charge
        FROM transactions
        WHERE predicted_category != 'Income'
          AND DATE(timestamp) >= DATE(?, '-62 days')
        GROUP BY merchant_name, year, month
        ORDER BY merchant_name, year DESC, month DESC
    """, (max_ts,))
    rows = cursor.fetchall()
    conn.close()

    # Build a summary for the LLM
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

    # Filter to merchants that appear in at least the most recent month
    summary_lines = []
    for merchant, months in merchant_months.items():
        month_strs = []
        for m in months:
            month_strs.append(
                f"  {m['month']}: {m['count']} charge(s), amounts=[{m['amounts']}]"
            )
        summary_lines.append(f"- {merchant} ({months[0]['category']}):\n" + "\n".join(month_strs))

    merchant_summary = "\n".join(summary_lines)

    # Try LLM classification
    try:
        api_key = os.getenv("ANTHROPIC_API_KEY", "")
        if not api_key:
            raise ValueError("No API key")

        from langchain_anthropic import ChatAnthropic
        from langchain_core.messages import HumanMessage as HM

        llm = ChatAnthropic(
            model="claude-haiku-4-5-20251001",
            anthropic_api_key=api_key,
            temperature=0,
            max_tokens=2048,
        )

        prompt = f"""Analyse these merchant transaction patterns from the last 2 months and identify ONLY real subscriptions — recurring services that charge a fixed amount on a regular (monthly/yearly) basis.

Real subscriptions are things like: Netflix, Spotify, Disney+, HBO, gym memberships, phone plans, cloud storage, insurance, internet service, etc.

NOT subscriptions: restaurants, bars, grocery stores, clothing shops, ATM withdrawals, parking, taxi/rideshare, general retail stores — even if the person visits them regularly.

Key signals for a real subscription:
- Nearly identical amount each month (within €1 variance)
- Exactly 1 charge per month (not 5-10 visits like a grocery store)
- The merchant name sounds like a service/platform, not a store

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

        # Parse JSON from response
        import re
        json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
        if json_match:
            detected = json.loads(json_match.group())
        else:
            detected = []

    except Exception as e:
        print(f"LLM subscription detection failed, using tight heuristic: {e}")
        detected = _fallback_heuristic_subscriptions(merchant_months)

    # Build the response from detected subscriptions
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DATE(?, '-30 days') as cutoff", (max_ts,))
    cutoff = cursor.fetchone()["cutoff"]

    active = []
    inactive = []
    total_monthly = 0.0

    for sub_info in detected:
        merchant = sub_info.get("merchant", "")
        # Look up actual data
        cursor.execute("""
            SELECT COUNT(*) as cnt, MAX(timestamp) as last_charge
            FROM transactions WHERE merchant_name = ?
        """, (merchant,))
        row = cursor.fetchone()
        if not row or row["cnt"] == 0:
            continue

        cost = float(sub_info.get("monthlyCost", 0))
        sub = Subscription(
            merchant=merchant,
            category=sub_info.get("category", ""),
            monthlyCost=round(cost, 2),
            lastCharge=row["last_charge"],
            chargeCount=row["cnt"],
            active=False,
        )

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
    """
    Tight heuristic fallback: only merchants with exactly 1 charge per month,
    nearly identical amounts (within €1), amount < €150, appearing in both months.
    """
    detected = []
    for merchant, months in merchant_months.items():
        if len(months) < 2:
            continue
        # Must have exactly 1 charge per month in the most recent 2 months
        recent_two = months[:2]
        if any(m["count"] != 1 for m in recent_two):
            continue
        # Amounts must be nearly identical
        amounts = [m["avg"] for m in recent_two]
        if abs(amounts[0] - amounts[1]) > 1.0:
            continue
        # Must be under €150
        avg = sum(amounts) / len(amounts)
        if avg > 150 or avg <= 0:
            continue
        detected.append({
            "merchant": merchant,
            "category": recent_two[0]["category"],
            "monthlyCost": round(avg, 2),
            "isSubscription": True,
        })
    return detected


@app.post("/api/subscriptions/detect")
async def detect_subscriptions():
    """Trigger LLM-based subscription detection (results are cached)."""
    try:
        result = _detect_subscriptions_with_llm()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection error: {str(e)}")


@app.get("/api/subscriptions", response_model=SubscriptionsResponse)
async def get_subscriptions():
    """Get subscription data from cache, or detect if not cached yet."""
    try:
        cached = _load_subs_cache()
        if cached:
            return SubscriptionsResponse(**cached)

        # No cache — run detection
        result = _detect_subscriptions_with_llm()
        return SubscriptionsResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Subscription error: {str(e)}")


@app.get("/api/stats")
async def get_stats():
    """Get overall stats like total transaction count (for billing page)."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as total FROM transactions")
        total = cursor.fetchone()["total"]
        conn.close()
        return {"transactionCount": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
