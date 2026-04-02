"""
=============================================================================
CHAT ENGINE — LLM INTEGRATION POINT
=============================================================================

This module handles all chat responses for the "Talk to your Finances" app.

CURRENT STATE (MVP):
    Simple keyword-matching + pandas queries. Good enough to demo basic
    financial queries but NOT intelligent.

FOR THE LLM TEAMMATE:
    Replace the logic inside `get_response()` with your Cohere agent.
    The function signature and return dict format MUST stay the same so
    the frontend renders everything correctly.

    Return format:
        {
            "text": str,              # Always shown as a chat bubble
            "chart": plotly.Figure,   # Rendered inline (or None)
            "table": pd.DataFrame,    # Rendered as a table (or None)
            "suggestions": list[str]  # Shown as clickable chips (or [])
        }

FUTURE MIGRATION:
    When we move to Next.js + FastAPI, this function becomes a POST endpoint.
    The return dict maps cleanly to a JSON response (chart becomes JSON spec).
=============================================================================
"""

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import re
from datetime import datetime

# ── Category colors (keep in sync with app.py) ──────────────────────────
CATEGORY_COLORS = {
    "Food & Dining":              {"bg": "#FFF0E6", "text": "#C45800", "chart": "#E8860C"},
    "Transportation":             {"bg": "#E8EEF8", "text": "#1A3A6B", "chart": "#2E6BC6"},
    "Entertainment & Recreation": {"bg": "#F3E8F8", "text": "#5B1A6B", "chart": "#8B3AA0"},
    "Shopping & Retail":          {"bg": "#FDF3E3", "text": "#8B5E1A", "chart": "#C4881D"},
    "Financial Services":         {"bg": "#F0F0F0", "text": "#555555", "chart": "#888888"},
    "Healthcare & Medical":       {"bg": "#FBEAEA", "text": "#B83232", "chart": "#D94444"},
    "Utilities & Services":       {"bg": "#E0E8F0", "text": "#2A4A6B", "chart": "#3A6A9B"},
    "Income":                     {"bg": "#E8F5EF", "text": "#1E6B4A", "chart": "#2A9D6A"},
    "Government & Legal":         {"bg": "#ECEDF0", "text": "#3A3F4A", "chart": "#5A6070"},
    "Charity & Donations":        {"bg": "#FCE8F0", "text": "#8B2252", "chart": "#C44A7A"},
}

MONTH_NAMES = {
    1: "January", 2: "February", 3: "March", 4: "April",
    5: "May", 6: "June", 7: "July", 8: "August",
    9: "September", 10: "October", 11: "November", 12: "December"
}


def _parse_month_year(msg: str):
    """Try to extract month and year from a message."""
    msg_lower = msg.lower()
    month = None
    year = None

    for num, name in MONTH_NAMES.items():
        if name.lower() in msg_lower:
            month = num
            break

    year_match = re.search(r'20[2][0-4]', msg)
    if year_match:
        year = int(year_match.group())

    return month, year


def _filter_by_period(df: pd.DataFrame, month=None, year=None):
    """Filter dataframe by month and/or year."""
    filtered = df.copy()
    if year:
        filtered = filtered[filtered["timestamp"].dt.year == year]
    if month:
        filtered = filtered[filtered["timestamp"].dt.month == month]
    return filtered


def _format_currency(amount):
    """Format number as EUR currency."""
    return f"€{amount:,.2f}"


def _make_category_chart(data, title="Spending by Category"):
    """Create a donut chart for category breakdown."""
    colors = [CATEGORY_COLORS.get(cat, {}).get("chart", "#888") for cat in data.index]
    fig = go.Figure(data=[go.Pie(
        labels=data.index,
        values=data.values,
        hole=0.55,
        marker_colors=colors,
        textinfo="percent",
        textfont_size=11,
    )])
    fig.update_layout(
        title=title,
        showlegend=True,
        legend=dict(font=dict(size=10)),
        margin=dict(t=40, b=20, l=20, r=20),
        height=300,
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(family="DM Sans"),
    )
    return fig


def _make_monthly_chart(monthly_data, title="Monthly Spending"):
    """Create a bar chart for monthly spending."""
    fig = px.bar(
        x=monthly_data.index.astype(str),
        y=monthly_data.values,
        title=title,
        labels={"x": "Month", "y": "Amount (€)"},
        color_discrete_sequence=["#1A1916"],
    )
    fig.update_layout(
        margin=dict(t=40, b=40, l=40, r=20),
        height=280,
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(family="DM Sans"),
        xaxis=dict(showgrid=False),
        yaxis=dict(showgrid=True, gridcolor="#E5E2DA"),
    )
    return fig


def get_response(user_message: str, df: pd.DataFrame, chat_history: list = None) -> dict:
    """
    Process a user message and return a response.

    Delegates to the LangChain SQL agent (agent.py).
    The df parameter is kept for API compatibility but is not used —
    the agent queries SQLite directly.

    chat_history: list of {"role": "user"|"bot", "text": str} dicts
                  (previous messages for context, excluding the current one)

    Returns:
        {
            "text": str,
            "chart": plotly.Figure | None,
            "table": pd.DataFrame | None,
            "suggestions": list[str],
        }
    """
    from agent import query_agent
    return query_agent(user_message, chat_history=chat_history)
