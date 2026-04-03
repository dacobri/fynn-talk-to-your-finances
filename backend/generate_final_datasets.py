#!/usr/bin/env python3
"""
Three deliverables:
1. marc_revolut_export.csv   — real Revolut export format, 40 txns, NO category column
2. marc_caixabank_v2.parquet — source column added, salary raised, DEGIRO purchases added
3. marc_investments.csv      — ticker, company, asset_type, purchase_date, price, qty
"""

import pandas as pd
import numpy as np
import random
import calendar
from datetime import datetime, timedelta
import os

random.seed(42)
np.random.seed(42)

ALPHANUMS = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
def r_c(n=6): return "".join(random.choices(ALPHANUMS, k=n))
def r_s():    return random.randint(1000, 9999)
def r_ref():  return f"REF{random.randint(100000,999999)}"
def rand_dt(year, month, day_lo=1, day_hi=None):
    last = calendar.monthrange(year, month)[1]
    hi   = min(day_hi or last, last)
    d    = random.randint(max(1, day_lo), hi)
    return datetime(year, month, d, random.randint(8, 23), random.randint(0, 59))
def fixed_dt(year, month, day, night=False):
    last = calendar.monthrange(year, month)[1]
    d    = min(day, last)
    h    = random.randint(0, 5) if night else random.randint(8, 12)
    return datetime(year, month, d, h, random.randint(0, 59))

# ─────────────────────────────────────────────────────────────────────────────
# 1. REVOLUT CSV — real export format, ~40 transactions, NO category column
#    Covers last ~3 months (Oct–Dec 2024) — small and fast for demo upload
#    Descriptions are real Revolut-style (clean merchant names, CARD PAYMENT prefix)
# ─────────────────────────────────────────────────────────────────────────────
print("=" * 60)
print("1. Generating Revolut CSV (real export format)...")
print("=" * 60)

def revolut_row(txn_type, description, amount, currency="EUR",
                year=2024, month=10, day_lo=1, day_hi=None, fee=0.00):
    started   = rand_dt(year, month, day_lo, day_hi)
    completed = started + timedelta(minutes=random.randint(1, 60))
    return {
        "Type":           txn_type,
        "Product":        "Current",
        "Started Date":   started.strftime("%Y-%m-%d %H:%M:%S"),
        "Completed Date": completed.strftime("%Y-%m-%d %H:%M:%S"),
        "Description":    description,
        "Amount":         round(amount, 2),
        "Fee":            fee,
        "Currency":       currency,
        "State":          "COMPLETED",
    }

# Build running balance — start at €450
rows = []

# October 2024
rows += [
    revolut_row("TOPUP",        "Top-Up by *4242",                        350.00, year=2024, month=10, day_lo=4,  day_hi=5),
    revolut_row("CARD_PAYMENT", "Glovo",                                  -22.50, year=2024, month=10, day_lo=3,  day_hi=6),
    revolut_row("CARD_PAYMENT", "Ryanair",                                -89.99, year=2024, month=10, day_lo=5,  day_hi=7),
    revolut_row("CARD_PAYMENT", "Airbnb",                                -180.00, year=2024, month=10, day_lo=5,  day_hi=7),
    revolut_row("CARD_PAYMENT", "Starbucks",                               -4.80, year=2024, month=10, day_lo=8,  day_hi=10),
    revolut_row("CARD_PAYMENT", "Uber",                                   -12.40, year=2024, month=10, day_lo=12, day_hi=14),
    revolut_row("CARD_PAYMENT", "Amazon",                                 -34.99, year=2024, month=10, day_lo=15, day_hi=17),
    revolut_row("CARD_PAYMENT", "FYNN *PRO SUBSCRIPTION",                  -9.99, year=2024, month=10, day_lo=15, day_hi=15),
    revolut_row("CARD_PAYMENT", "Spotify",                                 -9.99, year=2024, month=10, day_lo=9,  day_hi=9),
    revolut_row("CARD_PAYMENT", "Mercadona",                              -47.30, year=2024, month=10, day_lo=18, day_hi=20),
    revolut_row("CARD_PAYMENT", "Bar El Born BCN",                        -18.50, year=2024, month=10, day_lo=19, day_hi=21),
    revolut_row("TRANSFER",     "Marc Garcia",                             28.00, year=2024, month=10, day_lo=22, day_hi=23),   # P2P in
    revolut_row("CARD_PAYMENT", "Lidl",                                   -31.20, year=2024, month=10, day_lo=24, day_hi=26),
    revolut_row("CARD_PAYMENT", "PlayStation Network",                     -8.99, year=2024, month=10, day_lo=18, day_hi=18),
    revolut_row("TRANSFER",     "STRIPE TRANSFER PHOTO R8X2KL",           597.00, year=2024, month=10, day_lo=14, day_hi=16),   # photography
]

# November 2024
rows += [
    revolut_row("TOPUP",        "Top-Up by *4242",                        378.00, year=2024, month=11, day_lo=4,  day_hi=6),
    revolut_row("CARD_PAYMENT", "Netflix",                                -17.99, year=2024, month=11, day_lo=5,  day_hi=5),
    revolut_row("CARD_PAYMENT", "FYNN *PRO SUBSCRIPTION",                  -9.99, year=2024, month=11, day_lo=15, day_hi=15),
    revolut_row("CARD_PAYMENT", "Spotify",                                 -9.99, year=2024, month=11, day_lo=9,  day_hi=9),
    revolut_row("CARD_PAYMENT", "Glovo",                                  -19.80, year=2024, month=11, day_lo=7,  day_hi=9),
    revolut_row("CARD_PAYMENT", "Vueling Airlines",                       -74.99, year=2024, month=11, day_lo=8,  day_hi=10),
    revolut_row("CARD_PAYMENT", "Booking.com",                           -220.00, year=2024, month=11, day_lo=8,  day_hi=10),
    revolut_row("CARD_PAYMENT", "Uber Eats",                              -28.40, year=2024, month=11, day_lo=14, day_hi=16),
    revolut_row("CARD_PAYMENT", "Mercadona",                              -52.10, year=2024, month=11, day_lo=17, day_hi=19),
    revolut_row("CARD_PAYMENT", "Cerveceria BCN",                         -24.00, year=2024, month=11, day_lo=21, day_hi=23),
    revolut_row("TRANSFER",     "INGRESO FOTOGRAFIA REF712834",           441.00, year=2024, month=11, day_lo=12, day_hi=14),   # photography
    revolut_row("CARD_PAYMENT", "PlayStation Network",                     -8.99, year=2024, month=11, day_lo=18, day_hi=18),
    revolut_row("CARD_PAYMENT", "Decathlon",                              -44.99, year=2024, month=11, day_lo=25, day_hi=27),
]

# December 2024
rows += [
    revolut_row("TOPUP",        "Top-Up by *4242",                        424.00, year=2024, month=12, day_lo=4,  day_hi=6),
    revolut_row("CARD_PAYMENT", "FYNN *PRO SUBSCRIPTION",                  -9.99, year=2024, month=12, day_lo=15, day_hi=15),
    revolut_row("CARD_PAYMENT", "Spotify",                                 -9.99, year=2024, month=12, day_lo=9,  day_hi=9),
    revolut_row("CARD_PAYMENT", "Netflix",                                -17.99, year=2024, month=12, day_lo=5,  day_hi=5),
    revolut_row("CARD_PAYMENT", "Glovo",                                  -31.50, year=2024, month=12, day_lo=6,  day_hi=8),
    revolut_row("CARD_PAYMENT", "Ryanair",                                -64.99, year=2024, month=12, day_lo=9,  day_hi=11),
    revolut_row("CARD_PAYMENT", "Airbnb",                                -145.00, year=2024, month=12, day_lo=9,  day_hi=11),
    revolut_row("CARD_PAYMENT", "Amazon",                                 -67.40, year=2024, month=12, day_lo=12, day_hi=14),
    revolut_row("CARD_PAYMENT", "Mercadona",                              -58.90, year=2024, month=12, day_lo=20, day_hi=22),
    revolut_row("CARD_PAYMENT", "PlayStation Network",                     -8.99, year=2024, month=12, day_lo=18, day_hi=18),
    revolut_row("TRANSFER",     "BIZUM FOTOGRAFIA JORDI_LOPEZ",           623.00, year=2024, month=12, day_lo=10, day_hi=12),   # photography
    revolut_row("CARD_PAYMENT", "Starbucks",                               -5.60, year=2024, month=12, day_lo=22, day_hi=24),
    revolut_row("TRANSFER",     "TRANSFER TO CAIXABANK REF891234",       -188.00, year=2024, month=12, day_lo=26, day_hi=28),   # surplus back
]

# Sort by Started Date and add running balance
df_rev = pd.DataFrame(rows)
df_rev = df_rev.sort_values("Started Date").reset_index(drop=True)

balance = 450.00
balances = []
for amt in df_rev["Amount"]:
    balance = round(balance + amt, 2)
    balances.append(balance)
df_rev["Balance"] = balances

# NO category column — this is the raw export
out_revolut_csv = "/mnt/user-data/outputs/marc_revolut_export.csv"
df_rev.to_csv(out_revolut_csv, index=False)
print(f"  Saved: {out_revolut_csv}  ({len(df_rev)} rows)")
print(f"  Columns: {list(df_rev.columns)}")
print(f"  Sample:")
for _, r in df_rev.head(4).iterrows():
    print(f"    {r['Started Date']}  {r['Description']:<35}  {r['Amount']:>+8.2f}  {r['Currency']}")


# ─────────────────────────────────────────────────────────────────────────────
# 2. CAIXABANK V2 — source column, salary raise, DEGIRO monthly purchases
# ─────────────────────────────────────────────────────────────────────────────
print()
print("=" * 60)
print("2. Rebuilding CaixaBank dataset (v2)...")
print("=" * 60)

ALPHANUMS = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
def r_c(n=6): return "".join(random.choices(ALPHANUMS, k=n))

def make_tx(account_id, ts, merchant_name, merchant_id,
            description, category, amount, currency="EUR", source="CaixaBank"):
    # Income is positive, all expenses are negative
    signed_amount = abs(float(amount)) if category == "Income" else -abs(float(amount))
    return {
        "account_id":              account_id,
        "source":                  source,
        "timestamp":               ts,
        "merchant_name":           merchant_name,
        "merchant_id":             merchant_id,
        "transaction_description": description,
        "category":                category,
        "amount":                  round(signed_amount, 2),
        "currency":                currency,
    }

COVID = {
    (2020,3):0.5,(2020,4):0.1,(2020,5):0.15,(2020,6):0.55,
    (2020,7):0.75,(2020,8):0.80,(2020,9):0.85,(2020,10):0.80,
    (2020,11):0.70,(2020,12):0.80,
    (2021,1):0.70,(2021,2):0.75,(2021,3):0.80,(2021,4):0.85,
    (2021,5):0.88,(2021,6):0.92,
}
def cf(year, month): return COVID.get((year, month), 1.0)
def ni(n, year, month): return max(0, round(n * cf(year, month)))

# Salary progression — banker career growth
def salary(year):
    return {2020: 5000, 2021: 5000, 2022: 5500, 2023: 6000, 2024: 6500}[year]

all_txns = []

for year in range(2020, 2025):
    for month in range(1, 13):
        ACCT = "ACC_CAIXA_001"
        sal  = salary(year)

        # ── INCOME ───────────────────────────────────────────────────────────
        all_txns.append(make_tx(ACCT, fixed_dt(year, month, 28, night=True),
            "Employer", "MRC_INC_001",
            f"NOMINA {random.choice(['BANCO SABADELL SA','CAIXABANK SA','INDRA SA','SEAT SA'])} {year}{month:02d}",
            "Income", sal))

        # ── RENT ─────────────────────────────────────────────────────────────
        all_txns.append(make_tx(ACCT, fixed_dt(year, month, 1, night=True),
            "Landlord", "MRC_RNT_001",
            f"TRANSFERENCIA ALQUILER {r_ref()}",
            "Financial Services", 2000.00))

        # ── SUBSCRIPTIONS ────────────────────────────────────────────────────
        subs = [
            (5,  "Netflix",      "MRC_SUB_001", "NETFLIX.COM",                17.99),
            (8,  "Disney+",      "MRC_SUB_003", "DISNEY PLUS*",               8.99),
            (12, "HBO Max",      "MRC_SUB_004", f"MAX *SUBSCRIPTION {r_c()}", 8.99),
            (15, "Amazon Prime", "MRC_SUB_005", "AMAZON PRIME*",              4.99),
            (20, "iCloud",       "MRC_SUB_006", "APPLE.COM/BILL",             2.99),
        ]
        if (year, month) >= (2022, 6):
            subs.append((22, "YouTube Premium", "MRC_SUB_007",
                         f"GOOGLE *YOUTUBE PREMIUM {r_c()}", 13.99))
        for day, name, mid, desc, amt in subs:
            all_txns.append(make_tx(ACCT, fixed_dt(year, month, day),
                name, mid, desc, "Entertainment & Recreation", amt))

        # ── GYM ──────────────────────────────────────────────────────────────
        all_txns.append(make_tx(ACCT, fixed_dt(year, month, 15),
            "DiR Gym", "MRC_GYM_001",
            f"GIMNASIO DIR {r_s()} BCN",
            "Healthcare & Medical", 59.90))

        # ── PHONE ─────────────────────────────────────────────────────────────
        all_txns.append(make_tx(ACCT, fixed_dt(year, month, 5),
            "Movistar", "MRC_UTL_001",
            f"MOVISTAR ES {r_c()}",
            "Utilities & Services", 35.99 if year <= 2021 else 39.99))

        # ── INTERNET ──────────────────────────────────────────────────────────
        all_txns.append(make_tx(ACCT, fixed_dt(year, month, 3),
            "Orange Internet", "MRC_UTL_002",
            f"ORANGE ES {r_c()}",
            "Utilities & Services", 29.99))

        # ── GROCERIES ────────────────────────────────────────────────────────
        for _ in range(ni(8, year, month)):
            name, mid, desc_fn = random.choices([
                ("Mercadona","MRC_GRC_001", lambda: f"MERCADONA 0{r_s()}"),
                ("Lidl",     "MRC_GRC_002", lambda: f"LIDL ES {r_s()}"),
                ("Caprabo",  "MRC_GRC_003", lambda: f"CAPRABO {r_s()} BCN"),
                ("Bon Preu", "MRC_GRC_004", lambda: f"BON PREU {r_s()} BCN"),
            ], weights=[55,25,12,8])[0]
            all_txns.append(make_tx(ACCT, rand_dt(year, month),
                name, mid, desc_fn(),
                "Food & Dining", max(15, min(130, random.gauss(52, 18)))))

        # ── EATING OUT ───────────────────────────────────────────────────────
        dining_opts = [
            ("Cerveceria Catalana","MRC_RST_001","CERVECERIA CATALANA BCN"),
            ("Bar del Pla",        "MRC_RST_002","BAR DEL PLA BCNA"),
            ("El Xampanyet",       "MRC_RST_003","EL XAMPANYET BCN"),
            ("El Nacional",        "MRC_RST_004","EL NACIONAL BARCELONA"),
            ("La Pepita",          "MRC_RST_005","LA PEPITA BCN"),
            ("Mikkeller Barcelona","MRC_BAR_001","MIKKELLER BARCELONA"),
            ("Dry Martini",        "MRC_BAR_002","DRY MARTINI BCN"),
        ]
        for _ in range(ni(8, year, month)):
            name, mid, desc = random.choice(dining_opts)
            all_txns.append(make_tx(ACCT, rand_dt(year, month, 17, 31),
                name, mid, desc,
                "Food & Dining", max(12, min(85, random.gauss(35, 12)))))

        # ── FUEL ─────────────────────────────────────────────────────────────
        for _ in range(ni(2, year, month)):
            name, desc_fn = random.choice([
                ("Repsol", lambda: f"REPSOL {r_s()} ES"),
                ("Cepsa",  lambda: f"CEPSA {r_s()} ES"),
            ])
            all_txns.append(make_tx(ACCT, rand_dt(year, month),
                name, "MRC_GAS_001", desc_fn(), "Transportation",
                round(random.uniform(35,50) * random.uniform(1.45,1.95), 2)))
        for _ in range(ni(2, year, month)):  # scooter
            all_txns.append(make_tx(ACCT, rand_dt(year, month),
                "Repsol", "MRC_GAS_001", f"REPSOL {r_s()} ES",
                "Transportation", round(random.uniform(9, 16), 2)))

        # ── PARKING ───────────────────────────────────────────────────────────
        for _ in range(ni(3, year, month)):
            all_txns.append(make_tx(ACCT, rand_dt(year, month),
                "SABA Parking", "MRC_PRK_001",
                f"SABA PARKING {r_c(4)} BCN",
                "Transportation", round(random.uniform(5, 18), 2)))

        # ── SHOPPING ──────────────────────────────────────────────────────────
        for _ in range(ni(2, year, month)):
            name, mid, desc_fn = random.choice([
                ("Zara",      "MRC_SHP_001", lambda: f"ZARA {r_s()} BCN"),
                ("Amazon ES", "MRC_SHP_005", lambda: f"AMZN MKTP ES*{r_c(8)}"),
                ("H&M",       "MRC_SHP_004", lambda: f"H&M {r_s()} BCN"),
                ("Decathlon", "MRC_SHP_007", lambda: f"DECATHLON {r_s()} BCN"),
            ])
            all_txns.append(make_tx(ACCT, rand_dt(year, month),
                name, mid, desc_fn(),
                "Shopping & Retail", round(random.uniform(20, 150), 2)))

        # ── PHARMACY ──────────────────────────────────────────────────────────
        if random.random() < 0.55:
            all_txns.append(make_tx(ACCT, rand_dt(year, month),
                "Farmàcia", "MRC_MED_001",
                f"FARMACIA {r_c(4)} BCN",
                "Healthcare & Medical", round(random.uniform(6, 35), 2)))

        # ── ATM ───────────────────────────────────────────────────────────────
        for _ in range(random.randint(1, 2)):
            all_txns.append(make_tx(ACCT, rand_dt(year, month),
                "CaixaBank ATM", "MRC_ATM_001",
                f"RETIRADA EFECTIVO CAJERO {r_c(4)}",
                "Financial Services", random.choice([50, 100, 150])))

        # ── CAR INSURANCE (January) ───────────────────────────────────────────
        if month == 1:
            all_txns.append(make_tx(ACCT, fixed_dt(year, 1, 10),
                "Mutua", "MRC_INS_001",
                f"MUTUA MADRILENA {r_c()}",
                "Financial Services", round(random.uniform(780, 960), 2)))

        # ── CAR SERVICE (Oct/Nov) ─────────────────────────────────────────────
        if month in (10, 11) and random.random() < 0.50:
            all_txns.append(make_tx(ACCT, rand_dt(year, month, 5, 25),
                "Taller mecànic", "MRC_RPR_001",
                f"TALLER MECANICA {r_c(4)} BCN",
                "Transportation", round(random.uniform(180, 420), 2)))

        # ── REVOLUT TOP-UP ────────────────────────────────────────────────────
        topup = round(random.gauss(350, 50), 2)
        topup = max(150, min(550, topup))
        all_txns.append(make_tx(ACCT, fixed_dt(year, month, random.randint(3,7), night=True),
            "Revolut", "MRC_REV_OUT",
            f"TRANSFERENCIA REVOLUT LTD {r_ref()}",
            "Financial Services", round(topup, 2)))

        # ── DEGIRO INVESTMENT PURCHASE (monthly, €200) ─────────────────────
        all_txns.append(make_tx(ACCT, fixed_dt(year, month, random.randint(8, 12)),
            "DEGIRO", "MRC_INV_001",
            f"DEGIRO COMPRA VALORES {r_ref()}",
            "Financial Services", 200.00))

        # ── BIRTHDAY GIFT (July) ──────────────────────────────────────────────
        if month == 7:
            gift_amt = {2020:1400,2021:1900,2022:2300,2023:2600,2024:2900}[year]
            gift_amt *= random.uniform(0.92, 1.08)
            name, desc = random.choice([
                ("El Corte Inglés", f"EL CORTE INGLES BCN {r_s()}"),
                ("Joyería",         f"JOYERIA {r_c(5)} BCN"),
                ("Pandora",         f"PANDORA JEWELRY BCN {r_s()}"),
            ])
            all_txns.append(make_tx(ACCT, rand_dt(year, 7, 14, 20),
                name, "MRC_GFT_001", desc, "Shopping & Retail", round(gift_amt, 2)))
            all_txns.append(make_tx(ACCT, rand_dt(year, 7, 14, 22),
                "El Nacional", "MRC_RST_004", "EL NACIONAL BARCELONA",
                "Food & Dining", round(random.uniform(95, 160), 2)))

        # ── REVOLUT SURPLUS RETURN (December 2024 only — matching the Revolut CSV) ──
        if year == 2024 and month == 12:
            all_txns.append(make_tx(ACCT,
                datetime(2024, 12, 27, random.randint(8,12), random.randint(0,59)),
                "Revolut", "MRC_REV_IN",
                "INGRESO REVOLUT REF891234",
                "Income", 188.00))

        # ── CHRISTMAS GIFT (December) ─────────────────────────────────────────
        if month == 12:
            gift_amt = {2020:1300,2021:1900,2022:2400,2023:2700,2024:3000}[year]
            gift_amt *= random.uniform(0.93, 1.07)
            name, desc = random.choice([
                ("El Corte Inglés", f"EL CORTE INGLES BCN {r_s()}"),
                ("Joyería",         f"JOYERIA {r_c(5)} BCN"),
                ("Pandora",         f"PANDORA JEWELRY BCN {r_s()}"),
            ])
            all_txns.append(make_tx(ACCT, rand_dt(year, 12, 18, 23),
                name, "MRC_GFT_001", desc, "Shopping & Retail", round(gift_amt, 2)))
            all_txns.append(make_tx(ACCT, rand_dt(year, 12, 23, 25),
                "El Nacional", "MRC_RST_004", "EL NACIONAL BARCELONA",
                "Food & Dining", round(random.uniform(110, 200), 2)))

# Build DataFrame
df_caixa = pd.DataFrame(all_txns)
df_caixa = df_caixa.sort_values("timestamp").reset_index(drop=True)
df_caixa.insert(0, "transaction_id", [f"CXB{i:05d}" for i in range(len(df_caixa))])

out_caixa = "/mnt/user-data/outputs/marc_caixabank_v2.parquet"
df_caixa.to_parquet(out_caixa, index=False, compression="snappy")

# Income vs spending summary
income   = df_caixa[df_caixa["category"]=="Income"].groupby(df_caixa["timestamp"].dt.year)["amount"].sum()
spending = df_caixa[df_caixa["category"]!="Income"].groupby(df_caixa["timestamp"].dt.year)["amount"].sum().abs()
print(f"  Saved: {out_caixa}  ({len(df_caixa):,} txns)")
print(f"  Columns: {list(df_caixa.columns)}")
print(f"\n  Amount sign check: min={df_caixa['amount'].min():.2f}  max={df_caixa['amount'].max():.2f}")
print(f"  Income vs Spending by year:")
for yr in range(2020, 2025):
    inc = income.get(yr, 0)
    spd = spending.get(yr, 0)
    net = inc - spd
    print(f"    {yr}  income €{inc:>7,.0f}  spending €{spd:>7,.0f}  net €{net:>+6,.0f}  salary €{salary(yr):,}")


# ─────────────────────────────────────────────────────────────────────────────
# 3. INVESTMENTS CSV — real tickers, purchase history 2020–2024
#    Marc builds a diversified portfolio: core ETFs + a few individual stocks
#    Prices are historically realistic (approximate at purchase date)
# ─────────────────────────────────────────────────────────────────────────────
print()
print("=" * 60)
print("3. Generating investments dataset...")
print("=" * 60)

# Marc's investment journey:
# 2020: Starts with VWCE (monthly DCA €200) — conservative start
# 2021: Adds individual stocks: AAPL, MSFT
# 2022: Adds ASML (European conviction), keeps DCA
# 2023: Adds NVDA (AI hype), MC.PA (LVMH - luxury)
# 2024: Full portfolio, adds CSPX as second ETF

investments = [
    # ticker, company, asset_type, purchase_date, purchase_price, qty, notes
    # VWCE — monthly DCA, 60 purchases across 5 years (showing key purchases)
    ("VWCE.DE",  "Vanguard FTSE All-World UCITS ETF",  "ETF",   "2020-02-10",  72.50,  2.0),
    ("VWCE.DE",  "Vanguard FTSE All-World UCITS ETF",  "ETF",   "2020-05-11",  68.20,  2.0),
    ("VWCE.DE",  "Vanguard FTSE All-World UCITS ETF",  "ETF",   "2020-08-10",  78.40,  2.0),
    ("VWCE.DE",  "Vanguard FTSE All-World UCITS ETF",  "ETF",   "2020-11-09",  83.10,  2.0),
    ("VWCE.DE",  "Vanguard FTSE All-World UCITS ETF",  "ETF",   "2021-02-08",  88.60,  2.0),
    ("VWCE.DE",  "Vanguard FTSE All-World UCITS ETF",  "ETF",   "2021-05-10",  94.20,  2.0),
    ("VWCE.DE",  "Vanguard FTSE All-World UCITS ETF",  "ETF",   "2021-08-09",  99.70,  2.0),
    ("VWCE.DE",  "Vanguard FTSE All-World UCITS ETF",  "ETF",   "2021-11-08", 104.30,  1.0),
    ("VWCE.DE",  "Vanguard FTSE All-World UCITS ETF",  "ETF",   "2022-02-07",  94.10,  2.0),
    ("VWCE.DE",  "Vanguard FTSE All-World UCITS ETF",  "ETF",   "2022-05-09",  88.50,  2.0),
    ("VWCE.DE",  "Vanguard FTSE All-World UCITS ETF",  "ETF",   "2022-08-08",  91.20,  2.0),
    ("VWCE.DE",  "Vanguard FTSE All-World UCITS ETF",  "ETF",   "2022-11-07",  95.80,  2.0),
    ("VWCE.DE",  "Vanguard FTSE All-World UCITS ETF",  "ETF",   "2023-02-06", 100.40,  2.0),
    ("VWCE.DE",  "Vanguard FTSE All-World UCITS ETF",  "ETF",   "2023-05-08", 107.60,  1.0),
    ("VWCE.DE",  "Vanguard FTSE All-World UCITS ETF",  "ETF",   "2023-08-07", 111.20,  1.0),
    ("VWCE.DE",  "Vanguard FTSE All-World UCITS ETF",  "ETF",   "2023-11-06", 116.90,  1.0),
    ("VWCE.DE",  "Vanguard FTSE All-World UCITS ETF",  "ETF",   "2024-02-05", 122.40,  1.0),
    ("VWCE.DE",  "Vanguard FTSE All-World UCITS ETF",  "ETF",   "2024-05-07", 128.80,  1.0),
    ("VWCE.DE",  "Vanguard FTSE All-World UCITS ETF",  "ETF",   "2024-08-06", 124.60,  1.0),
    ("VWCE.DE",  "Vanguard FTSE All-World UCITS ETF",  "ETF",   "2024-11-05", 133.20,  1.0),

    # AAPL — bought in batches
    ("AAPL",     "Apple Inc.",                          "Stock", "2021-03-10", 121.50,  4.0),
    ("AAPL",     "Apple Inc.",                          "Stock", "2021-09-07", 156.70,  2.0),
    ("AAPL",     "Apple Inc.",                          "Stock", "2022-06-13", 131.88,  3.0),
    ("AAPL",     "Apple Inc.",                          "Stock", "2023-04-10", 165.79,  2.0),
    ("AAPL",     "Apple Inc.",                          "Stock", "2024-01-08", 185.92,  1.0),

    # MSFT — conviction buy
    ("MSFT",     "Microsoft Corporation",               "Stock", "2021-06-07", 257.89,  2.0),
    ("MSFT",     "Microsoft Corporation",               "Stock", "2022-03-14", 279.41,  1.0),
    ("MSFT",     "Microsoft Corporation",               "Stock", "2023-01-09", 231.93,  2.0),
    ("MSFT",     "Microsoft Corporation",               "Stock", "2024-03-11", 415.10,  1.0),

    # ASML — European flagship, Marc's conviction stock
    ("ASML.AS",  "ASML Holding N.V.",                   "Stock", "2022-02-07", 620.70,  1.0),
    ("ASML.AS",  "ASML Holding N.V.",                   "Stock", "2022-10-10", 394.25,  1.0),
    ("ASML.AS",  "ASML Holding N.V.",                   "Stock", "2023-07-10", 698.40,  1.0),
    ("ASML.AS",  "ASML Holding N.V.",                   "Stock", "2024-05-07", 872.60,  1.0),

    # NVDA — bought into AI wave
    ("NVDA",     "NVIDIA Corporation",                  "Stock", "2023-03-13", 231.50,  2.0),
    ("NVDA",     "NVIDIA Corporation",                  "Stock", "2023-06-12", 415.32,  1.0),
    ("NVDA",     "NVIDIA Corporation",                  "Stock", "2024-01-08", 495.22,  1.0),

    # MC.PA — LVMH, European luxury conviction
    ("MC.PA",    "LVMH Moët Hennessy Louis Vuitton SE", "Stock", "2023-05-08", 822.70,  1.0),
    ("MC.PA",    "LVMH Moët Hennessy Louis Vuitton SE", "Stock", "2023-11-06", 690.40,  1.0),

    # CSPX.L — second ETF added for S&P 500 exposure (GBX, priced in pence)
    ("CSPX.L",   "iShares Core S&P 500 UCITS ETF",      "ETF",   "2024-02-05", 516.40,  1.0),
    ("CSPX.L",   "iShares Core S&P 500 UCITS ETF",      "ETF",   "2024-08-06", 548.70,  1.0),
    ("CSPX.L",   "iShares Core S&P 500 UCITS ETF",      "ETF",   "2024-11-05", 581.20,  1.0),
]

df_inv = pd.DataFrame(investments, columns=[
    "ticker", "company_name", "asset_type",
    "purchase_date", "purchase_price", "quantity"
])
df_inv["purchase_date"]  = pd.to_datetime(df_inv["purchase_date"])
df_inv["total_cost"]     = (df_inv["purchase_price"] * df_inv["quantity"]).round(2)
df_inv["currency"]       = df_inv["ticker"].apply(
    lambda t: "GBP" if t.endswith(".L") else ("EUR" if ("." in t and not t.endswith(".L")) else "USD")
)

out_inv = "/mnt/user-data/outputs/marc_investments.csv"
df_inv.to_csv(out_inv, index=False)

print(f"  Saved: {out_inv}  ({len(df_inv)} purchases)")
print(f"\n  Portfolio summary:")
for ticker, grp in df_inv.groupby("ticker"):
    total_qty  = grp["quantity"].sum()
    total_cost = grp["total_cost"].sum()
    ccy        = grp["currency"].iloc[0]
    print(f"    {ticker:<10}  {grp['company_name'].iloc[0][:35]:<35}  "
          f"{total_qty:>5.1f} shares  {ccy} {total_cost:>8,.2f} invested")

total_eur = df_inv[df_inv["currency"]=="EUR"]["total_cost"].sum()
total_usd = df_inv[df_inv["currency"]=="USD"]["total_cost"].sum()
total_gbp = df_inv[df_inv["currency"]=="GBP"]["total_cost"].sum()
print(f"\n  Total invested: EUR {total_eur:,.2f}  |  USD {total_usd:,.2f}  |  GBP {total_gbp:,.2f}")

print("\nAll done.")
