# Fynn — Talk to Your Finances

Fynn is a personal finance app that connects all your bank accounts into one platform and gives you a unified financial overview with AI-powered insights. Ask questions about your money in natural language, get spending breakdowns, and track every transaction — all in one place.

Built for the **Prototyping Products with Data & AI** course (Esade MSc, 2025–2026).

---

## Setup

### Prerequisites

- **Node.js** 18+ and **npm** (for the frontend)
- **Python** 3.10+ and **pip** (for the backend)
- An **Anthropic API key** (for the AI chat feature)

### 1. Frontend (Next.js)

```bash
cd Prototyping_AI_Final_Project_3
npm install
npm run dev
```

The app will be available at **http://localhost:3000**. You can sign in using Clerk authentication.

### 2. Backend (FastAPI)

Open a second terminal:

```bash
cd Prototyping_AI_Final_Project_3/backend
pip install -r requirements.txt
```

Add your Anthropic API key to `backend/.env`:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Then start the server:

```bash
bash start.sh
```

The API will be available at **http://localhost:8000**. You can verify it's running by visiting http://localhost:8000/api/health.

> **Note:** The frontend works without the backend running — it falls back to mock data. The backend is needed for the real AI chat and live transaction queries.

---

## Features

### Financial Dashboard
Five metric cards (Total Income, Total Spent, Net Balance, Top Category, Subscriptions), a spending-by-category bar chart, a category breakdown donut chart, a monthly spending trend line chart, and a recent transactions preview.

### Transaction Management
Full transaction table with search, filter by type (All / Expenses / Income), filter by category, sortable columns, and pagination. Includes an "Add Transaction" form with live auto-classification — as you type a merchant name, the system predicts the category in real time.

### AI Chat Copilot
A natural language financial assistant powered by Claude (Anthropic). Ask questions like "How much did I spend on food in December?" or "Show my monthly spending trend" and get text answers with inline charts — including multiple charts per response when relevant. Responses stream in real time with live reasoning steps (tool calls, SQL queries, chart generation). Available as a full page and as a slide-out panel accessible from anywhere via a floating button.

### Authentication
User authentication via Clerk with sign-in and sign-up flows.

---

## Tech Stack

**Frontend**
- Next.js 15 with App Router, React 19, TypeScript
- Tailwind CSS v4 with dark mode theme
- shadcn/ui component library
- Recharts for dashboard data visualization
- Plotly.js for AI-generated charts
- TanStack Table for the transaction table with URL-synced pagination (nuqs)
- Zustand for chat state management
- Clerk for authentication

**Backend**
- FastAPI (Python) serving REST + SSE streaming endpoints
- LangChain agent framework with Claude claude-sonnet-4-6 (Anthropic)
- SSE streaming with `asyncio.Queue` + `ThreadPoolExecutor` for real-time reasoning steps
- SQLite database with 3,494 classified transactions
- TF-IDF + LightGBM transaction classifier (10 categories, trained on 1M synthetic transactions)
- Plotly for chart generation (supports multiple charts per response)

---

## Project Structure

```
Prototyping_AI_Final_Project_3/
│
├── src/                            FRONTEND (Next.js)
│   ├── app/
│   │   ├── layout.tsx              Root layout (theme, providers)
│   │   ├── page.tsx                Auth guard (redirect)
│   │   ├── auth/                   Sign-in / Sign-up pages
│   │   └── dashboard/
│   │       ├── layout.tsx          Dashboard shell (sidebar, header, chat FAB)
│   │       ├── overview/           Financial dashboard with metrics & charts
│   │       ├── transactions/       Transaction table page
│   │       ├── chat/               Full-page AI chat
│   │       └── settings/           Settings page
│   ├── features/
│   │   └── finance/                All Fynn-specific logic
│   │       ├── components/         UI components (table, chat, badges, FAB)
│   │       └── utils/              Mock data, API client, formatters, chat store
│   ├── components/                 Shared UI components
│   ├── config/                     Navigation and data table config
│   ├── hooks/                      Custom React hooks
│   └── lib/                        Utility functions
│
├── backend/                        BACKEND (Python / FastAPI)
│   ├── fastapi_server.py           REST API (6 endpoints)
│   ├── agent.py                    LangChain + Claude AI agent
│   ├── chat_engine.py              Chat integration layer
│   ├── streamlit_app.py            Original Streamlit UI (reference)
│   ├── load_db.py                  SQLite database initializer
│   ├── classify_marc.py            Transaction classification script
│   ├── train_classifier.py         ML training pipeline (reference)
│   ├── generate_barcelona_personal.py  Synthetic data generator
│   ├── requirements.txt            Python dependencies
│   ├── start.sh                    Server start script
│   ├── .env                        API key configuration
│   ├── classifier/                 Trained ML model files
│   └── data/                       SQLite database + source CSVs
│
├── prototype/                      Original HTML prototype (reference)
│   └── Prototype_Team_F_v1.html
│
├── package.json                    Frontend dependencies
├── .env.local                      Frontend environment config
├── next.config.ts                  Next.js configuration
├── tsconfig.json                   TypeScript configuration
└── postcss.config.js               PostCSS / Tailwind config
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check (agent + database status) |
| POST | `/api/chat` | Send a message to the AI assistant |
| POST | `/api/chat/stream` | Streaming SSE endpoint with live reasoning steps |
| GET | `/api/transactions` | Paginated transaction list with filters |
| GET | `/api/summary` | Aggregate financial metrics |
| GET | `/api/categories` | Spending breakdown by category |
| GET | `/api/monthly-spending` | Monthly spending totals |

---

## The Data

The app uses synthetic financial data for **Marc Ferrer**, a 27-year-old junior banker living in Barcelona. The dataset spans 2020–2024 and includes 3,494 transactions across 10 categories: Food & Dining, Transportation, Entertainment & Recreation, Shopping & Retail, Financial Services, Healthcare & Medical, Utilities & Services, Income, Government & Legal, and Charity & Donations.

Marc earns a net salary of €5,000/month. His spending patterns include Barcelona-specific merchants (Mercadona, CaixaBank, Renfe, DiR Gym, etc.), subscriptions (Netflix, Spotify, Disney+, HBO Max), and seasonal variations (higher spending in July and December for gifts/travel).

The transaction classifier uses a dual TF-IDF vectorizer (word n-grams + character n-grams) fed into a LightGBM model, trained on 1 million synthetic transactions. It achieves near-perfect accuracy on the standardized bank transaction data.

---

## Team

**Team Fynn** — Esade MSc, Prototyping Products with Data & AI

---

## Acknowledgments

Frontend scaffolding based on the [Next.js & Shadcn UI Dashboard Starter](https://github.com/Kiranism/next-shadcn-dashboard-starter) by Kiran.
