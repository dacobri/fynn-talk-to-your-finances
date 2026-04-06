"""
Talk to your Finances — Full-page Chat UI
"""

import streamlit as st
import pandas as pd
from chat_engine import get_response, CATEGORY_COLORS

st.set_page_config(
    page_title="Talk to your finances",
    page_icon="💰",
    layout="centered",
    initial_sidebar_state="collapsed",
)

st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

/* ── Streamlit chrome ─────────────────────────────────── */
#MainMenu, header, footer,
.stDeployButton,
div[data-testid="stToolbar"],
div[data-testid="stDecoration"],
div[data-testid="stStatusWidget"] { display: none !important; }

/* ── Root ─────────────────────────────────────────────── */
html, body, .stApp { background: #F0EEE9; font-family: 'DM Sans', sans-serif; }
.block-container {
    padding: 0 0 120px 0 !important;
    max-width: 860px !important;
}

/* ── Topbar ───────────────────────────────────────────── */
.topbar {
    background: #fff;
    border-bottom: 1px solid #E5E2DA;
    padding: 13px 28px;
    display: flex; align-items: center; justify-content: space-between;
    margin: 0 -2rem 28px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    position: sticky; top: 0; z-index: 999;
}
.brand { display: flex; align-items: center; gap: 11px; }
.brand-mark {
    width: 34px; height: 34px; background: #1A1916; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 12px;
}
.brand-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 16px; color: #1A1916; }
.brand-sub  { font-size: 11px; color: #A8A49C; }
.avatar {
    width: 32px; height: 32px; background: #F7F6F2; border: 2px solid #E5E2DA;
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: #6B6860; font-family: 'Syne', sans-serif;
}

/* ── Chat messages via st.chat_message ───────────────────── */
div[data-testid="stChatMessage"] {
    background: transparent !important;
    border: none !important;
    padding: 2px 0 !important;
}

/* User bubble */
div[data-testid="stChatMessage"][data-testid*="user"],
div[data-testid="stChatMessageContent"] {
    font-size: 15px;
    line-height: 1.65;
}

/* ── Bot avatar override ──────────────────────────────── */
div[data-testid="stChatMessage"] .stChatMessageAvatarUser > div {
    background: #1A1916 !important;
    color: #fff !important;
}
div[data-testid="stChatMessage"] .stChatMessageAvatarAssistant > div {
    background: #1A1916 !important;
    color: #fff !important;
    font-family: 'Syne', sans-serif !important;
    font-weight: 800 !important;
}

/* ── Message content font ─────────────────────────────── */
div[data-testid="stChatMessageContent"] p,
div[data-testid="stChatMessageContent"] li {
    font-size: 15px !important;
    line-height: 1.65 !important;
    font-family: 'DM Sans', sans-serif !important;
    color: #1A1916 !important;
}
div[data-testid="stChatMessageContent"] strong {
    color: #1A1916 !important;
    font-weight: 600 !important;
}

/* ── Chart container (Streamlit wraps plotly in these) ─── */
div[data-testid="stChatMessage"] div[data-testid="stPlotlyChart"],
div[data-testid="stChatMessage"] .stPlotlyChart {
    background: #FAFAF8 !important;
    border: 1px solid #E5E2DA !important;
    border-radius: 14px !important;
    overflow: hidden !important;
    margin-top: 4px !important;
    box-shadow: 0 1px 6px rgba(0,0,0,0.05) !important;
}
/* Remove any stray hr / divider Streamlit adds */
div[data-testid="stChatMessage"] hr {
    display: none !important;
}

/* ── Chips ────────────────────────────────────────────── */
div[data-testid="stHorizontalBlock"] .stButton > button {
    border-radius: 20px !important;
    border: 1px solid #E5E2DA !important;
    background: #fff !important;
    color: #6B6860 !important;
    font-size: 13px !important;
    font-family: 'DM Sans', sans-serif !important;
    font-weight: 500 !important;
    padding: 6px 14px !important;
    transition: all .15s !important;
}
div[data-testid="stHorizontalBlock"] .stButton > button:hover {
    background: #1A1916 !important; color: #fff !important;
    border-color: #1A1916 !important;
}

/* ── Bottom bar: nuke all dark backgrounds ────────────── */
div[data-testid="stBottom"],
div[data-testid="stBottom"] > div,
div[data-testid="stBottom"] > div > div,
.stChatFloatingInputContainer,
.stChatFloatingInputContainer > div,
section[data-testid="stBottom"] {
    background: #F0EEE9 !important;
    border-top: 1px solid #E5E2DA !important;
}

/* ── Chat input box ───────────────────────────────────── */
div[data-testid="stChatInput"],
div[data-testid="stChatInput"] > div,
div[data-testid="stChatInput"] > div > div {
    background: #FFFFFF !important;
    background-color: #FFFFFF !important;
}
div[data-testid="stChatInput"] > div {
    border-radius: 14px !important;
    border: 1.5px solid #D8D4CC !important;
    box-shadow: 0 2px 16px rgba(26,25,22,0.10) !important;
    min-height: 52px !important;
}
div[data-testid="stChatInput"] > div:focus-within {
    border-color: #1A1916 !important;
    box-shadow: 0 2px 20px rgba(26,25,22,0.14) !important;
}
div[data-testid="stChatInput"] textarea {
    font-size: 15px !important;
    font-family: 'DM Sans', sans-serif !important;
    color: #1A1916 !important;
    background: #FFFFFF !important;
    background-color: #FFFFFF !important;
    padding: 10px 8px !important;
    line-height: 1.5 !important;
    caret-color: #1A1916 !important;
}
div[data-testid="stChatInput"] textarea::placeholder {
    color: #B0AA9F !important;
}
/* Send button */
div[data-testid="stChatInput"] button {
    background: #1A1916 !important;
    border-radius: 10px !important;
    width: 34px !important;
    height: 34px !important;
    border: none !important;
    margin-right: 6px !important;
    flex-shrink: 0 !important;
}
div[data-testid="stChatInput"] button svg {
    fill: #fff !important;
    color: #fff !important;
}

/* ── Plotly modebar ───────────────────────────────────── */
.js-plotly-plot .plotly .modebar { display: none !important; }
</style>
""", unsafe_allow_html=True)


# ── Data ──────────────────────────────────────────────────────────────────
@st.cache_data
def load_data():
    return pd.read_csv("data/marc_classified.csv", parse_dates=["timestamp"])

df = load_data()

# ── Session state ──────────────────────────────────────────────────────────
if "messages" not in st.session_state:
    st.session_state.messages = [{
        "role": "bot",
        "text": "Hello Marc. I'm your financial assistant. Ask me about your spending, trends, categories, merchants, or subscriptions.",
        "chart": None,
        "table": None,
    }]
if "suggestions" not in st.session_state:
    st.session_state.suggestions = [
        "Monthly summary",
        "Spending by category",
        "Top merchants",
        "Show subscriptions",
    ]

# ── Topbar ─────────────────────────────────────────────────────────────────
st.markdown("""
<div class="topbar">
  <div class="brand">
    <div class="brand-mark">tf</div>
    <div>
      <div class="brand-name">Talk to your finances</div>
      <div class="brand-sub">Powered by AI</div>
    </div>
  </div>
  <div class="avatar">M</div>
</div>
""", unsafe_allow_html=True)

# ── Chat messages ──────────────────────────────────────────────────────────
for i, msg in enumerate(st.session_state.messages):
    if msg["role"] == "user":
        st.markdown(f"""
        <div style="display:flex;justify-content:flex-end;margin:6px 0 10px">
            <div style="background:#1A1916;color:#fff;padding:12px 18px;
                        border-radius:18px 18px 4px 18px;font-size:15px;
                        line-height:1.65;max-width:75%;word-break:break-word;">
                {msg['text']}
            </div>
        </div>
        """, unsafe_allow_html=True)
    else:
        with st.chat_message("assistant", avatar="💬"):
            st.markdown(msg["text"])
            if msg.get("chart") is not None:
                st.plotly_chart(
                    msg["chart"],
                    use_container_width=True,
                    config={"displayModeBar": False},
                    key=f"chart_{i}",
                )
            if msg.get("table") is not None:
                st.dataframe(msg["table"], use_container_width=True, hide_index=True)

# ── Suggestion chips ───────────────────────────────────────────────────────
if st.session_state.suggestions:
    cols = st.columns(len(st.session_state.suggestions))
    for i, chip in enumerate(st.session_state.suggestions):
        with cols[i]:
            if st.button(chip, key=f"chip_{i}", use_container_width=True):
                st.session_state.messages.append(
                    {"role": "user", "text": chip, "chart": None, "table": None}
                )
                st.session_state.suggestions = []
                with st.spinner("Thinking…"):
                    resp = get_response(chip, df, chat_history=st.session_state.messages)
                st.session_state.messages.append({
                    "role": "bot",
                    "text": resp["text"],
                    "chart": resp.get("chart"),
                    "table": resp.get("table"),
                })
                st.session_state.suggestions = resp.get("suggestions", [])
                st.rerun()

# ── JS: inject a <style> tag into parent document to fix chat input colors ──
st.components.v1.html("""
<script>
(function() {
    var doc = window.parent.document;
    // Inject a style tag if not already present
    if (!doc.getElementById('st-chat-fix')) {
        var s = doc.createElement('style');
        s.id = 'st-chat-fix';
        s.innerHTML = [
            '[data-testid="stBottom"] { background: #F0EEE9 !important; border-top: 1px solid #E5E2DA !important; }',
            '[data-testid="stBottom"] > * { background: #F0EEE9 !important; }',
            '[data-testid="stChatInput"] > div { background: #ffffff !important; border-radius: 14px !important; border: 1.5px solid #D8D4CC !important; box-shadow: 0 2px 16px rgba(26,25,22,0.10) !important; }',
            '[data-testid="stChatInput"] textarea { background: #ffffff !important; color: #1A1916 !important; caret-color: #1A1916 !important; }',
            '[data-testid="stChatInput"] textarea::placeholder { color: #B0AA9F !important; }',
            '[data-testid="stChatInput"] button { background: #1A1916 !important; border-radius: 10px !important; }',
            '[data-testid="stChatInput"] button svg path { fill: #ffffff !important; }',
        ].join('\\n');
        doc.head.appendChild(s);
    }
})();
</script>
""", height=0)

# ── Chat input ─────────────────────────────────────────────────────────────
user_input = st.chat_input("Ask me about your finances…")
if user_input:
    st.session_state.messages.append(
        {"role": "user", "text": user_input, "chart": None, "table": None}
    )
    st.session_state.suggestions = []
    # Pass history (all messages before the current one) for context
    history = st.session_state.messages[:-1]
    with st.spinner("Thinking…"):
        resp = get_response(user_input, df, chat_history=history)
    st.session_state.messages.append({
        "role": "bot",
        "text": resp["text"],
        "chart": resp.get("chart"),
        "table": resp.get("table"),
    })
    st.session_state.suggestions = resp.get("suggestions", [])
    st.rerun()
