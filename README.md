# Fynn — Talk to Your Finances

Fynn is an AI-powered personal finance dashboard that lets users consolidate multiple bank accounts, explore spending analytics, track investment portfolios, and chat with an intelligent financial assistant. Users can ask natural language questions about their money and receive real-time answers backed by SQL queries and interactive charts.

Built as a group project for the **Prototyping Products with Data & AI** course at **Esade MSc Business Analytics** (2025-2026). The project accounts for 20% of the course grade.

**The problem:** People manage their money across multiple bank accounts and brokerage platforms but have no single place to see the full picture. Existing banking apps show only their own data and offer no intelligent analysis.

**The solution:** Fynn unifies all financial data into one dashboard with an AI copilot that understands the user's complete financial situation and can answer questions, generate charts, and surface insights in natural language.

---

## Features

**Multi-Bank Dashboard** -- Six metric cards (income, spending, net balance, top category, subscriptions, investment assets) with a date range selector supporting presets and custom calendar ranges. Charts adapt granularity automatically (daily, weekly, monthly). The spending trend, portfolio value, spending by category, and recent transactions update in real time as the date range changes.

**Transaction Management** -- Full-featured table with search, type filter (all/expenses/income), category filter, bank account filter, min/max amount range, and URL-synced pagination. Clicking a bar chart category on the dashboard navigates directly to a pre-filtered transactions view.

**CSV Bank Upload** -- Users can connect additional bank accounts by uploading CSV exports (Revolut format supported). Uploaded transactions are classified in real time using a keyword-based ML classifier and immediately appear in the dashboard. Inter-account transfers are automatically detected and excluded from spending metrics.

**Investment Portfolio Tracking** -- Dedicated investments page with live stock and ETF prices from Yahoo Finance, multi-currency support (USD, GBP, EUR) with FX conversion, sortable holdings table with expandable rows showing individual buy orders, today's return column, and an asset allocation donut chart. A portfolio value line chart also appears on the main dashboard.

**AI Chat Copilot** -- A conversational financial assistant powered by Claude (Anthropic) with tool calling. The agent executes SQL queries against the user's transaction database and generates Plotly charts inline. Responses stream in real time with visible reasoning steps. The agent is aware of multi-bank data, signed amounts, transfers, and investments. Available as a full page or a slide-out panel accessible from anywhere via a floating action button.

**LLM-Based Subscription Detection** -- Uses Claude to classify recurring charges by analyzing the last two months of transaction patterns, distinguishing real subscriptions (Netflix, Spotify, gym memberships) from frequently visited stores. Results are cached so the detection only runs once.

**Editable User Profile** -- Users can update their name, contact info, preferred language, monthly budget, and spending alert threshold. These preferences are passed to the AI assistant, personalizing its responses and budget advice.

**Authentication** -- User sign-in and sign-up flows via Clerk.

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| [Next.js](https://nextjs.org/) 16 | React framework with App Router and parallel routes |
| [React](https://react.dev/) 19 | UI library |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Tailwind CSS](https://tailwindcss.com/) v4 | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com/) | Component library (60+ Radix-based primitives) |
| [Recharts](https://recharts.org/) | Dashboard chart components |
| [Plotly.js](https://plotly.com/javascript/) | AI-generated interactive charts |
| [TanStack Table](https://tanstack.com/table) | Data table with sorting, filtering, pagination |
| [Zustand](https://zustand-demo.pmnd.rs/) | Lightweight state management for chat and user preferences |
| [nuqs](https://nuqs.47ng.com/) | URL search param state (filter persistence) |
| [Clerk](https://clerk.com/) | Authentication |
| [KBar](https://kbar.vercel.app/) | Command palette (keyboard-first navigation) |

### Backend

| Technology | Purpose |
|---|---|
| [FastAPI](https://fastapi.tiangolo.com/) | REST API + SSE streaming endpoints |
| [LangChain](https://python.langchain.com/) | Agent framework with tool calling |
| [Claude Haiku](https://docs.anthropic.com/) | LLM for chat, subscription detection, CSV classification |
| [SQLite](https://www.sqlite.org/) | Transaction and investment database |
| [scikit-learn](https://scikit-learn.org/) + [LightGBM](https://lightgbm.readthedocs.io/) | Transaction category classifier (TF-IDF + gradient boosting) |
| [yfinance](https://github.com/ranaroussi/yfinance) | Live stock/ETF prices and FX rates from Yahoo Finance |
| [Plotly](https://plotly.com/python/) | Server-side chart generation |
| [Pandas](https://pandas.pydata.org/) | Data manipulation |

---

## Architecture

```
Browser (localhost:3000)          Backend (localhost:8000)
+-----------------------+         +---------------------------+
|  Next.js 16 App       |  REST   |  FastAPI Server           |
|  React 19 + shadcn/ui | ------> |  /api/summary             |
|                       |  JSON   |  /api/transactions        |
|  Dashboard            | <------ |  /api/categories          |
|  Transactions Table   |         |  /api/monthly-spending    |
|  Chat Panel           |  SSE    |  /api/chat/stream         |
|  Investments Page     | <------ |  /api/investments         |
|  Profile / Upload     |  POST   |  /api/upload-csv          |
+-----------------------+         +---------------------------+
                                        |
                                        v
                                  +---------------------------+
                                  |  SQLite Database           |
                                  |  transactions table        |
                                  |  investments table         |
                                  +---------------------------+
                                        |
                          +-------------+-------------+
                          |                           |
                    LangChain Agent            Yahoo Finance
                    (Claude Haiku)            (yfinance API)
                    - SQL tool                - Live prices
                    - Chart tool              - FX rates
                    - Sub detection           - History data
```

The frontend communicates with the backend exclusively through REST API calls and server-sent events (SSE) for streaming chat responses. All financial data lives in a SQLite database. The AI agent uses LangChain to orchestrate tool calls (SQL queries, chart generation) against the same database. Investment prices are fetched from Yahoo Finance with in-memory caching.

---

## Getting Started

Follow these steps to run Fynn on your local machine.

### Prerequisites

| Tool | Version | Download |
|---|---|---|
| **Node.js** | 18 or newer | [nodejs.org/en/download](https://nodejs.org/en/download) |
| **Python** | 3.9 or newer | [python.org/downloads](https://www.python.org/downloads/) |
| **Git** | Any recent version | [git-scm.com/downloads](https://git-scm.com/downloads) |

Verify your installations:

```bash
node --version    # Should print v18.x.x or higher
python3 --version # Should print 3.9.x or higher
git --version
```

### Step 1 -- Clone the repository

```bash
git clone <repository-url>
cd Prototyping_AI_Final_Project
```

### Step 2 -- Set up API keys

Fynn requires two services, each with their own API keys.

**Clerk (authentication)**

1. Go to [clerk.com](https://clerk.com/) and create a free account.
2. Create a new application in the Clerk dashboard.
3. Copy your **Publishable Key** and **Secret Key** from the API Keys page.

**Anthropic (AI assistant)**

1. Go to [console.anthropic.com](https://console.anthropic.com/) and create an account.
2. Navigate to **API Keys** and generate a new key.
3. Copy the key (it starts with `sk-ant-`).

**Create the environment files**

Copy the example files and fill in your keys:

```bash
cp .env.example .env.local
cp backend/.env.example backend/.env
```

Edit `.env.local` and replace the placeholder values with your Clerk keys. Edit `backend/.env` and replace the placeholder with your Anthropic API key.

### Step 3 -- Install and run the backend

```bash
cd backend
pip install -r requirements.txt
python load_db.py           # Build the SQLite database from source data
uvicorn fastapi_server:app --reload --port 8000
```

> On some systems use `pip3` instead of `pip`. If you get permissions errors, use a virtual environment: `python3 -m venv venv && source venv/bin/activate` first.

The API will start at **http://localhost:8000**. Verify it by visiting [http://localhost:8000/api/health](http://localhost:8000/api/health).

### Step 4 -- Install and run the frontend

Open a **second terminal** (keep the backend running) and run:

```bash
npm install
npm run dev
```

The app will start at **http://localhost:3000**.

### Step 5 -- Open the app

1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. Sign in or create an account via the Clerk sign-in page.
3. You will land on the dashboard at `/dashboard/overview`.

> The frontend works without the backend running (it falls back to mock data), but the backend is required for the AI chat, live transaction queries, investment prices, and subscription detection.

---

## Demo Flow

Suggested walkthrough for presenting the app:

1. **Dashboard** -- Show the six metric cards, spending trend chart, and portfolio value chart. Change the date range (e.g., Last 3 months vs. Max) to show how everything updates.
2. **Category drill-down** -- Click a category bar in the Spending by Category chart to navigate to a pre-filtered Transactions view.
3. **Transactions** -- Demonstrate search, filters (type, category, bank account, amount range), and sorting. Show the signed amounts (green for income, red for expenses).
4. **CSV Upload** -- Navigate to Profile, click "Add Account", and upload the Revolut CSV (`backend/data/marc_revolut_export.csv`). Show transactions appearing with the Revolut bank filter.
5. **Investments** -- Navigate to the Investments page. Show the summary cards, sortable holdings table, today's return column, and expandable rows with individual buy orders. Point out the asset allocation donut.
6. **Chat with Fynn** -- Open the chat panel and ask questions: "What did I spend most on last month?", "Show me a chart of my monthly spending by category", "How much do I spend at restaurants vs supermarkets?". Highlight the SQL tool calls and inline Plotly charts.
7. **Subscriptions** -- Show the detected subscriptions page with active/inactive tabs.
8. **To reset the demo**: Run `python backend/load_db.py` to rebuild the database from scratch (removes uploaded Revolut data so the upload can be demonstrated again).

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check (agent and database status) |
| `POST` | `/api/chat` | Send a message to the AI assistant |
| `POST` | `/api/chat/stream` | Streaming SSE endpoint with live reasoning steps |
| `GET` | `/api/transactions` | Paginated transactions with search, filter, date range, source |
| `GET` | `/api/summary` | Aggregate financial metrics for a date range |
| `GET` | `/api/categories` | Spending breakdown by category |
| `GET` | `/api/monthly-spending` | Spending trend with adaptive granularity |
| `GET` | `/api/subscriptions` | Detected subscriptions (from cache or LLM) |
| `POST` | `/api/subscriptions/detect` | Trigger LLM-based subscription detection |
| `GET` | `/api/accounts` | Connected bank accounts with transaction counts |
| `POST` | `/api/upload-csv` | Upload and classify a bank CSV (multipart form) |
| `GET` | `/api/investments` | Holdings with live prices, gain/loss, optional orders |
| `GET` | `/api/investments/history` | Portfolio value over time for charting |
| `GET` | `/api/stats` | Total transaction count |
| `POST` | `/api/transactions/add` | Manually add a new transaction |
| `POST` | `/api/investments/add` | Manually add a new investment buy order |

---

## The Data

The app uses synthetic financial data for **Marc Ferrer**, a 27-year-old junior banker living in Barcelona. The dataset spans January 2020 to December 2024 and includes 2,280 CaixaBank transactions across 8 categories, plus a Revolut CSV export for demo upload and 41 DEGIRO investment purchase records across 7 holdings (VWCE.DE, ASML.AS, AAPL, MSFT, NVDA, MC.PA, CSPX.L).

Amounts are signed: negative for expenses, positive for income. Inter-account transfers (CaixaBank to Revolut and vice versa) and investment transactions (DEGIRO) are automatically classified and excluded from spending metrics.

The transaction classifier uses a dual TF-IDF vectorizer (word n-grams + character n-grams) fed into a LightGBM model, trained on 1 million synthetic transactions.

---

## Project Structure

```
Prototyping_AI_Final_Project/
|
|-- src/                              Frontend (Next.js / React / TypeScript)
|   |-- app/
|   |   |-- layout.tsx                Root layout (theme, Clerk, providers)
|   |   |-- page.tsx                  Auth guard / redirect to dashboard
|   |   |-- auth/                     Sign-in and sign-up pages
|   |   |-- dashboard/
|   |       |-- layout.tsx            Dashboard shell (sidebar, header, chat FAB)
|   |       |-- overview/             Metric cards, charts (4 parallel route slots)
|   |       |   |-- layout.tsx        DashboardProvider + date range selector
|   |       |   |-- @area_stats/      Spending trend area chart
|   |       |   |-- @bar_stats/       Category bar chart (click to filter)
|   |       |   |-- @pie_stats/       Portfolio value line chart
|   |       |   |-- @sales/           Recent transactions list
|   |       |-- transactions/         Transaction table with URL-synced filters
|   |       |-- chat/                 Full-page AI chat
|   |       |-- investments/          Investment portfolio page
|   |       |-- subscriptions/        Detected subscriptions
|   |       |-- profile/              User profile + CSV upload
|   |       |-- billing/              Billing info
|   |       |-- notifications/        Notification center + preferences
|   |
|   |-- features/finance/
|   |   |-- components/               Chat panel, date picker, transaction table,
|   |   |                             investments page, dashboard context, etc.
|   |   |-- utils/                    API client, chat store, user preferences,
|   |                                 mock data types, formatters
|   |
|   |-- components/                   Shared UI (shadcn/ui, layout, nav, themes)
|   |-- config/                       Navigation and table configuration
|   |-- hooks/                        Custom React hooks
|   |-- lib/                          Utility functions
|   |-- styles/                       Global CSS + theme variants
|
|-- backend/                          Backend (Python / FastAPI)
|   |-- fastapi_server.py             REST API + SSE streaming (16 endpoints)
|   |-- agent.py                      LangChain + Claude agent (SQL + chart tools)
|   |-- load_db.py                    Database builder (parquet + investments CSV)
|   |-- chat_engine.py                Chat message streaming logic
|   |-- requirements.txt              Python dependencies
|   |-- start.sh                      Server start script
|   |-- classifier/                   Trained ML model files (TF-IDF + LightGBM)
|   |-- data/                         SQLite DB, source CSVs, parquet files
|
|-- .env.example                      Frontend env template (copy to .env.local)
|-- package.json                      Frontend dependencies
|-- next.config.ts                    Next.js configuration
|-- tsconfig.json                     TypeScript configuration
|-- postcss.config.js                 Tailwind CSS configuration
```

---

## Team

**Team Fynn** -- Esade MSc Business Analytics, Prototyping Products with Data & AI (2025-2026)

- Brice Da Costa
- Florian Nix
- Gianluca Bavelloni

---

## Acknowledgments

- Frontend scaffolding based on the [Next.js & shadcn/ui Dashboard Starter](https://github.com/Kiranism/next-shadcn-dashboard-starter) by Kiran
- UI components from [shadcn/ui](https://ui.shadcn.com/) (built on [Radix UI](https://www.radix-ui.com/))
- Icons from [Tabler Icons](https://tabler.io/icons)
- AI assistant powered by [Anthropic Claude](https://www.anthropic.com/)
- Agent framework by [LangChain](https://python.langchain.com/)
- Authentication by [Clerk](https://clerk.com/)
- Market data from [Yahoo Finance](https://finance.yahoo.com/) via [yfinance](https://github.com/ranaroussi/yfinance)

---

## License

This project was built for academic purposes as part of a university course. It is not intended for commercial use.
