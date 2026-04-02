# Fynn — Talk to Your Finances

Fynn is an AI-powered personal finance dashboard that lets users consolidate bank accounts, explore spending analytics, and chat with an intelligent financial assistant. Users can ask natural language questions about their money and receive real-time answers backed by SQL queries and interactive charts.

Built as a group project for the **Prototyping Products with Data & AI** course at **Esade MSc Business Analytics** (2025–2026). The project earned a grade weight of 20% for the course.

---

## Features

**Interactive Dashboard** — Five metric cards (income, spending, net balance, top category, active subscriptions) with a date range selector supporting presets (last month, last 3/6/12 months, max) and a custom calendar picker. Spending trend chart adapts its granularity automatically: daily for short ranges, weekly for medium, monthly for long.

**Transaction Management** — Full-featured table with search, type filter (all/expenses/income), category filter, min/max amount range, and URL-synced pagination. Clicking a bar chart category on the dashboard navigates directly to a pre-filtered transactions view.

**AI Chat Copilot** — A conversational financial assistant powered by Claude (Anthropic) with tool calling. The agent executes SQL queries against the user's transaction database and generates Plotly charts inline. Responses stream in real time with visible reasoning steps. Available as a full page or a slide-out panel accessible from anywhere via a floating action button.

**LLM-Based Subscription Detection** — Uses Claude to classify recurring charges by analyzing the last two months of transaction patterns, distinguishing real subscriptions (Netflix, Spotify, gym memberships) from frequently visited stores. Results are cached so the detection only runs once.

**Editable User Profile** — Users can update their name, contact info, preferred language, monthly budget, and spending alert threshold. These preferences are passed to the AI assistant, personalizing its responses and budget advice.

**Authentication** — User sign-in and sign-up flows via Clerk.

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| [Next.js](https://nextjs.org/) 16 | React framework with App Router and parallel routes |
| [React](https://react.dev/) 19 | UI library |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Tailwind CSS](https://tailwindcss.com/) v4 | Utility-first styling with dark mode |
| [shadcn/ui](https://ui.shadcn.com/) | Component library (60+ Radix-based primitives) |
| [Recharts](https://recharts.org/) | Dashboard chart components |
| [Plotly.js](https://plotly.com/javascript/) | AI-generated interactive charts |
| [TanStack Table](https://tanstack.com/table) | Data table with sorting, filtering, pagination |
| [Zustand](https://zustand-demo.pmnd.rs/) | Lightweight state management for chat and user preferences |
| [nuqs](https://nuqs.47ng.com/) | URL search param state (filter persistence) |
| [Clerk](https://clerk.com/) | Authentication |

### Backend

| Technology | Purpose |
|---|---|
| [FastAPI](https://fastapi.tiangolo.com/) | REST API + SSE streaming endpoints |
| [LangChain](https://python.langchain.com/) | Agent framework with tool calling |
| [Claude Haiku](https://docs.anthropic.com/) | LLM for chat, subscription detection |
| [SQLite](https://www.sqlite.org/) | Transaction database (3,494 records, 2020–2024) |
| [scikit-learn](https://scikit-learn.org/) + [LightGBM](https://lightgbm.readthedocs.io/) | Transaction category classifier (TF-IDF + gradient boosting) |
| [Plotly](https://plotly.com/python/) | Server-side chart generation |
| [Pandas](https://pandas.pydata.org/) | Data manipulation |

---

## Getting Started

Follow these steps to run Fynn on your local machine. No prior experience with Next.js or Python is required.

### Prerequisites

Install the following before proceeding:

| Tool | Version | Download |
|---|---|---|
| **Node.js** | 18 or newer | [nodejs.org/en/download](https://nodejs.org/en/download) |
| **Python** | 3.9 or newer | [python.org/downloads](https://www.python.org/downloads/) |
| **Git** | Any recent version | [git-scm.com/downloads](https://git-scm.com/downloads) |

Verify your installations by running:

```bash
node --version    # Should print v18.x.x or higher
python3 --version # Should print 3.9.x or higher
git --version
```

### Step 1 — Clone the repository

```bash
git clone https://github.com/your-org/fynn.git
cd fynn
```

### Step 2 — Set up API keys

Fynn requires two services, each with their own API keys.

#### Clerk (authentication)

1. Go to [clerk.com](https://clerk.com/) and create a free account.
2. Create a new application in the Clerk dashboard.
3. Copy your **Publishable Key** and **Secret Key** from the API Keys page.

#### Anthropic (AI assistant)

1. Go to [console.anthropic.com](https://console.anthropic.com/) and create an account.
2. Navigate to **API Keys** and generate a new key.
3. Copy the key (it starts with `sk-ant-`).

#### Create the environment files

Create a file called **`.env.local`** in the project root:

```env
# Clerk authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-key-here
CLERK_SECRET_KEY=sk_test_your-key-here

# Clerk route configuration
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard/overview
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard/overview

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Create a file called **`.env`** inside the `backend/` folder:

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Step 3 — Install and run the backend

Open a terminal and run:

```bash
cd backend
pip install -r requirements.txt
```

> **Note:** On some systems you may need to use `pip3` instead of `pip`. If you get a permissions error, add `--user` to the install command, or use a virtual environment (`python3 -m venv venv && source venv/bin/activate` first).

Start the backend server:

```bash
bash start.sh
```

The API will start at **http://localhost:8000**. Verify it is running by visiting [http://localhost:8000/api/health](http://localhost:8000/api/health) in your browser — you should see a JSON response with `"status": "ok"`.

### Step 4 — Install and run the frontend

Open a **second terminal** (keep the backend running in the first) and run:

```bash
npm install
npm run dev
```

The app will start at **http://localhost:3000**.

### Step 5 — Open the app and sign in

1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. You will be redirected to the Clerk sign-in page. Create an account or sign in.
3. After authentication you will land on the dashboard at `/dashboard/overview`.

> **Note:** The frontend works without the backend running — it falls back to mock data. The backend is required for the live AI chat, real transaction queries, and subscription detection.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check (agent and database status) |
| `POST` | `/api/chat` | Send a message to the AI assistant |
| `POST` | `/api/chat/stream` | Streaming SSE endpoint with live reasoning steps |
| `GET` | `/api/transactions` | Paginated transactions with search, filter, date range |
| `GET` | `/api/summary` | Aggregate financial metrics for a date range |
| `GET` | `/api/categories` | Spending breakdown by category |
| `GET` | `/api/monthly-spending` | Spending trend with adaptive granularity |
| `GET` | `/api/subscriptions` | Detected subscriptions (from cache or LLM) |
| `POST` | `/api/subscriptions/detect` | Trigger LLM-based subscription detection |
| `GET` | `/api/stats` | Total transaction count |

---

## The Data

The app uses synthetic financial data for **Marc Ferrer**, a 27-year-old junior banker living in Barcelona. The dataset spans January 2020 to December 2024 and includes 3,494 transactions across 10 categories: Food & Dining, Transportation, Entertainment & Recreation, Shopping & Retail, Financial Services, Healthcare & Medical, Utilities & Services, Income, Government & Legal, and Charity & Donations.

Marc earns a net salary of €5,000 per month. His spending patterns include Barcelona-specific merchants (Mercadona, CaixaBank, Renfe, DiR Gym), subscriptions (Netflix, Spotify, Disney+, HBO Max), and seasonal variations (higher spending in July and December for travel and gifts).

The transaction classifier uses a dual TF-IDF vectorizer (word n-grams + character n-grams) fed into a LightGBM model, trained on 1 million synthetic transactions. It achieves near-perfect accuracy on the standardized bank transaction format.

---

## Project Structure

```
fynn/
│
├── src/                              Frontend (Next.js)
│   ├── app/
│   │   ├── layout.tsx                Root layout (theme providers, Clerk)
│   │   ├── page.tsx                  Auth guard / redirect
│   │   ├── auth/                     Sign-in and sign-up pages
│   │   └── dashboard/
│   │       ├── layout.tsx            Dashboard shell (sidebar, header, chat FAB)
│   │       ├── overview/             Metric cards, charts (parallel route slots)
│   │       │   ├── layout.tsx        DashboardProvider + date range selector
│   │       │   ├── @area_stats/      Spending trend area chart
│   │       │   ├── @bar_stats/       Category bar chart (click to filter)
│   │       │   ├── @pie_stats/       Category donut chart
│   │       │   └── @sales/           Recent transactions list
│   │       ├── transactions/         Transaction table with URL-synced filters
│   │       ├── chat/                 Full-page AI chat
│   │       ├── subscriptions/        Detected subscriptions
│   │       ├── profile/              Editable user profile
│   │       ├── billing/              Billing and usage info
│   │       └── settings/             App settings
│   │
│   ├── features/finance/
│   │   ├── components/               Domain-specific UI (chat panel, date picker,
│   │   │                             transaction table, category badges, etc.)
│   │   └── utils/                    API client, chat store, user preferences
│   │                                 store, formatters, mock data
│   │
│   ├── components/                   Shared components (shadcn/ui, layout,
│   │                                 navigation, themes, forms)
│   ├── config/                       Navigation and table configuration
│   ├── hooks/                        Custom React hooks
│   └── lib/                          Utility functions
│
├── backend/                          Backend (Python / FastAPI)
│   ├── fastapi_server.py             REST API + SSE streaming (10 endpoints)
│   ├── agent.py                      LangChain + Claude agent (SQL + chart tools)
│   ├── classify_marc.py              Transaction classification script
│   ├── train_classifier.py           ML training pipeline
│   ├── generate_barcelona_personal.py  Synthetic data generator
│   ├── requirements.txt              Python dependencies
│   ├── start.sh                      Server start script
│   ├── .env                          Anthropic API key
│   ├── classifier/                   Trained model files (TF-IDF + LightGBM)
│   └── data/                         SQLite database + source CSVs
│
├── prototype/                        Original HTML prototype (reference)
├── package.json                      Frontend dependencies
├── .env.local                        Frontend environment variables
├── next.config.ts                    Next.js configuration
├── tsconfig.json                     TypeScript configuration
└── postcss.config.js                 Tailwind CSS configuration
```

---

## Team

**Team Fynn** — Esade MSc Business Analytics, Prototyping Products with Data & AI

<!-- Replace with your names and links -->
- Team Member 1
- Team Member 2
- Team Member 3
- Team Member 4

---

## Acknowledgments

- Frontend scaffolding based on the [Next.js & shadcn/ui Dashboard Starter](https://github.com/Kiranism/next-shadcn-dashboard-starter) by Kiran
- UI components from [shadcn/ui](https://ui.shadcn.com/) (built on [Radix UI](https://www.radix-ui.com/))
- Icons from [Tabler Icons](https://tabler.io/icons)
- AI assistant powered by [Anthropic Claude](https://www.anthropic.com/)
- Agent framework by [LangChain](https://python.langchain.com/)
- Authentication by [Clerk](https://clerk.com/)

---

## License

This project was built for academic purposes as part of a university course. It is not intended for commercial use.
