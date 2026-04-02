#!/usr/bin/env python3
"""
Barcelona Personal Transaction Generator
=========================================
Character: Marc Ferrer, 27, junior banker at a financial firm in Barcelona.
  • Net salary: €5,000/month
  • Shares a nice apartment with his girlfriend → €2,000/month rent (his portion)
  • Loves tapas bars, craft beer, eating out
  • Pays all couple subscriptions (Netflix, Spotify, Disney+, HBO Max, etc.)
  • Girlfriend gifts: expensive in July (her birthday) and December (Christmas)
    — up to €2,000–3,000 — he really adores her
  • Owns a Seat León + Honda PCX scooter (gas + occasional repairs)
  • Budget airline trips (Vueling, Ryanair): weekends + holidays
  • Gym membership at DiR Barcelona
  • COVID-19 adjustments: Mar–Jun 2020 (lockdown), 2021 gradual recovery

Output: ~4,200 transactions (2020-01-01 → 2024-12-31), one person, EUR
"""

import pandas as pd
import numpy as np
import random
import calendar
from datetime import datetime, date, timedelta

random.seed(99)
np.random.seed(99)

OUTPUT = "/mnt/user-data/outputs/barcelona_personal.parquet"

# ── Helpers ───────────────────────────────────────────────────────────────────
ALPHANUMS = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")

def r_s():    return random.randint(1000, 9999)
def r_c(n=6): return "".join(random.choices(ALPHANUMS, k=n))

def rand_date(year, month, day_lo=1, day_hi=None):
    last = calendar.monthrange(year, month)[1]
    hi   = min(day_hi or last, last)
    lo   = max(day_lo, 1)
    d    = random.randint(lo, hi)
    h    = random.randint(8, 23)
    m    = random.randint(0, 59)
    return datetime(year, month, d, h, m)

def tx(year, month, name, desc_fn, category, amount, day_lo=1, day_hi=None):
    """Build a transaction dict."""
    desc = desc_fn() if callable(desc_fn) else desc_fn
    return {
        "account_id":              "ACC0000001",
        "merchant_name":           name,
        "merchant_id":             MERCHANT_IDS.get(name, f"MRC_{name[:3].upper()}_001"),
        "timestamp":               rand_date(year, month, day_lo, day_hi),
        "transaction_description": desc,
        "category":                category,
        "amount":                  round(float(amount), 2),
        "currency":                "EUR",
    }

def tx_fixed(year, month, day, name, desc, category, amount):
    """Fixed-date scheduled transaction."""
    last = calendar.monthrange(year, month)[1]
    d    = min(day, last)
    h    = random.randint(0, 6)   # bank processes at night
    return {
        "account_id":              "ACC0000001",
        "merchant_name":           name,
        "merchant_id":             MERCHANT_IDS.get(name, "MRC_SCH_001"),
        "timestamp":               datetime(year, month, d, h, random.randint(0, 59)),
        "transaction_description": desc,
        "category":                category,
        "amount":                  round(float(amount), 2),
        "currency":                "EUR",
    }

# ── Stable merchant IDs ───────────────────────────────────────────────────────
MERCHANT_IDS = {
    # Income
    "Employer":            "MRC_INC_001",
    # Fixed bills
    "Landlord":            "MRC_RNT_001",
    "Netflix":             "MRC_SUB_001",
    "Spotify":             "MRC_SUB_002",
    "Disney+":             "MRC_SUB_003",
    "HBO Max":             "MRC_SUB_004",
    "Amazon Prime":        "MRC_SUB_005",
    "YouTube Premium":     "MRC_SUB_006",
    "iCloud":              "MRC_SUB_007",
    "DiR Gym":             "MRC_GYM_001",
    "Movistar":            "MRC_UTL_001",
    "Orange Internet":     "MRC_UTL_002",
    # Food / groceries
    "Mercadona":           "MRC_GRC_001",
    "Lidl":                "MRC_GRC_002",
    "Caprabo":             "MRC_GRC_003",
    "Bon Preu":            "MRC_GRC_004",
    "Consum":              "MRC_GRC_005",
    # Food delivery
    "Glovo":               "MRC_DLV_001",
    "Just Eat":            "MRC_DLV_002",
    # Restaurants / bars
    "El Nacional":         "MRC_RST_001",
    "Cerveceria Catalana": "MRC_RST_002",
    "Bar del Pla":         "MRC_RST_003",
    "La Pepita":           "MRC_RST_004",
    "El Xampanyet":        "MRC_RST_005",
    "Mikkeller Barcelona": "MRC_BAR_001",
    "El Born Bar":         "MRC_BAR_002",
    "Local bar":           "MRC_BAR_003",
    "Local restaurant":    "MRC_RST_006",
    "Dry Martini":         "MRC_BAR_004",
    # Gas
    "Repsol":              "MRC_GAS_001",
    "Cepsa":               "MRC_GAS_002",
    "BP Spain":            "MRC_GAS_003",
    # Airlines
    "Vueling":             "MRC_AIR_001",
    "Ryanair":             "MRC_AIR_002",
    "EasyJet":             "MRC_AIR_003",
    "Iberia":              "MRC_AIR_004",
    # Hotels / accommodation
    "Booking.com":         "MRC_HTL_001",
    "Airbnb":              "MRC_HTL_002",
    # Parking
    "SABA Parking":        "MRC_PRK_001",
    "BSM Parking":         "MRC_PRK_002",
    # Shopping
    "Zara":                "MRC_SHP_001",
    "Mango":               "MRC_SHP_002",
    "El Corte Inglés":     "MRC_SHP_003",
    "H&M":                 "MRC_SHP_004",
    "Amazon ES":           "MRC_SHP_005",
    "MediaMarkt":          "MRC_SHP_006",
    "Decathlon":           "MRC_SHP_007",
    "Primark":             "MRC_SHP_008",
    "Pull&Bear":           "MRC_SHP_009",
    # Entertainment
    "Cinesa":              "MRC_ENT_001",
    "Ticketmaster ES":     "MRC_ENT_002",
    # Healthcare
    "Farmàcia":            "MRC_MED_001",
    # Car / scooter repair
    "Taller mecànic":      "MRC_RPR_001",
    # Gifts
    "Pandora":             "MRC_GFT_001",
    "Sephora":             "MRC_GFT_002",
    "Joyería":             "MRC_GFT_003",
    "Fnac":                "MRC_GFT_004",
    # Transfers
    "CaixaBank ATM":       "MRC_ATM_001",
    # Government
    "DGT":                 "MRC_GOV_001",
    "ITV":                 "MRC_GOV_002",
}

# ── COVID modifier ────────────────────────────────────────────────────────────
def covid_factor(year, month, key):
    """
    Returns a multiplier (0–1) for transaction frequency during COVID.
    key: "dining", "bars", "travel", "shopping", "fuel", "entertainment"
    """
    factors = {
        # Full lockdown: March 14 – May 31 2020
        (2020, 3): {"dining": 0.45, "bars": 0.15, "travel": 0.20,
                    "shopping": 0.70, "fuel": 0.40, "entertainment": 0.50},
        (2020, 4): {"dining": 0.05, "bars": 0.00, "travel": 0.00,
                    "shopping": 0.55, "fuel": 0.10, "entertainment": 0.40},
        (2020, 5): {"dining": 0.08, "bars": 0.00, "travel": 0.00,
                    "shopping": 0.60, "fuel": 0.15, "entertainment": 0.45},
        (2020, 6): {"dining": 0.50, "bars": 0.35, "travel": 0.15,
                    "shopping": 0.75, "fuel": 0.55, "entertainment": 0.60},
        (2020, 7): {"dining": 0.75, "bars": 0.65, "travel": 0.45,
                    "shopping": 0.85, "fuel": 0.80, "entertainment": 0.75},
        (2020, 8): {"dining": 0.80, "bars": 0.70, "travel": 0.50,
                    "shopping": 0.85, "fuel": 0.85, "entertainment": 0.80},
        (2020, 9): {"dining": 0.85, "bars": 0.75, "travel": 0.50,
                    "shopping": 0.90, "fuel": 0.85, "entertainment": 0.80},
        (2020,10): {"dining": 0.75, "bars": 0.55, "travel": 0.35,
                    "shopping": 0.85, "fuel": 0.80, "entertainment": 0.70},
        (2020,11): {"dining": 0.65, "bars": 0.40, "travel": 0.30,
                    "shopping": 0.80, "fuel": 0.70, "entertainment": 0.65},
        (2020,12): {"dining": 0.80, "bars": 0.60, "travel": 0.50,
                    "shopping": 0.90, "fuel": 0.80, "entertainment": 0.75},
        (2021,  1): {"dining": 0.70, "bars": 0.50, "travel": 0.25,
                     "shopping": 0.80, "fuel": 0.75, "entertainment": 0.70},
        (2021,  2): {"dining": 0.75, "bars": 0.55, "travel": 0.30,
                     "shopping": 0.82, "fuel": 0.80, "entertainment": 0.72},
        (2021,  3): {"dining": 0.78, "bars": 0.60, "travel": 0.35,
                     "shopping": 0.85, "fuel": 0.82, "entertainment": 0.75},
        (2021,  4): {"dining": 0.80, "bars": 0.65, "travel": 0.50,
                     "shopping": 0.87, "fuel": 0.85, "entertainment": 0.78},
        (2021,  5): {"dining": 0.85, "bars": 0.70, "travel": 0.55,
                     "shopping": 0.90, "fuel": 0.88, "entertainment": 0.82},
        (2021,  6): {"dining": 0.90, "bars": 0.78, "travel": 0.65,
                     "shopping": 0.92, "fuel": 0.90, "entertainment": 0.85},
    }
    f = factors.get((year, month), {})
    return f.get(key, 1.0)

def n_times(base_n, year, month, key):
    """Apply COVID factor and return integer count."""
    return max(0, round(base_n * covid_factor(year, month, key)))

# ── Monthly generator ─────────────────────────────────────────────────────────
def generate_month(year, month):
    txns = []

    # ── INCOME ──────────────────────────────────────────────────────────────
    txns.append(tx_fixed(year, month, 28, "Employer",
                         f"NOMINA BANCO FERRER SA {year}{month:02d}",
                         "Income", 5000.00))

    # ── RENT (1st of month) ─────────────────────────────────────────────────
    txns.append(tx_fixed(year, month, 1, "Landlord",
                         f"TRANSFERENCIA ALQUILER REF{random.randint(100000,999999)}",
                         "Financial Services", 2000.00))

    # ── SUBSCRIPTIONS (fixed dates throughout month) ─────────────────────────
    subs = [
        (5,  "Netflix",         "NETFLIX.COM",                          17.99),
        (8,  "Spotify",         f"SPOTIFY ES {r_c()}",                  9.99),
        (10, "Disney+",         "DISNEY PLUS*",                         8.99),
        (12, "HBO Max",         f"MAX *SUBSCRIPTION {r_c()}",           8.99),
        (15, "Amazon Prime",    "AMAZON PRIME*",                        4.99),
        (20, "iCloud",          "APPLE.COM/BILL",                       2.99),
    ]
    # YouTube Premium: Marc starts it from mid-2022
    if (year, month) >= (2022, 6):
        subs.append((22, "YouTube Premium", f"GOOGLE *YOUTUBE PREMIUM {r_c()}", 13.99))

    for day, name, desc, amt in subs:
        txns.append(tx_fixed(year, month, day, name, desc,
                             "Entertainment & Recreation", amt))

    # ── GYM (15th) — DiR Barcelona ──────────────────────────────────────────
    # He doesn't cancel it even during lockdown (can't access for months)
    txns.append(tx_fixed(year, month, 15, "DiR Gym",
                         f"GIMNASIO DIR {r_s()} BCN",
                         "Healthcare & Medical", 59.90))

    # ── PHONE BILL (Movistar) — 5th ─────────────────────────────────────────
    phone_cost = 35.99 if year <= 2021 else 39.99
    txns.append(tx_fixed(year, month, 5, "Movistar",
                         f"MOVISTAR ES {r_c()}",
                         "Utilities & Services", phone_cost))

    # ── INTERNET (Orange) — 3rd ─────────────────────────────────────────────
    txns.append(tx_fixed(year, month, 3, "Orange Internet",
                         f"ORANGE ES {r_c()}",
                         "Utilities & Services", 29.99))

    # ── GROCERIES (Mercadona 2x/week, Lidl/Caprabo occasionally) ────────────
    n_grocery = n_times(10, year, month, "dining")  # more groceries during COVID
    covid_grocery_boost = max(0, (1 - covid_factor(year, month, "dining")) * 0.6)
    n_grocery = round(n_grocery * (1 + covid_grocery_boost))

    grocery_choices = [
        ("Mercadona", lambda: f"MERCADONA 0{r_s()}", 50),
        ("Lidl",      lambda: f"LIDL ES {r_s()}",    25),
        ("Caprabo",   lambda: f"CAPRABO {r_s()} BCN",15),
        ("Bon Preu",  lambda: f"BON PREU {r_s()} BCN",10),
    ]
    gw  = [x[2] for x in grocery_choices]
    gtot= sum(gw)
    gw  = [w/gtot for w in gw]

    for _ in range(n_grocery):
        name, desc_fn, _ = random.choices(grocery_choices, weights=gw)[0]
        amt = random.gauss(52, 18)
        amt = max(15, min(120, amt))
        txns.append(tx(year, month, name, desc_fn, "Food & Dining", amt))

    # ── EATING OUT (tapas, restaurants) ─────────────────────────────────────
    n_dining = n_times(13, year, month, "dining")

    dining_choices = [
        ("El Nacional",         lambda: "EL NACIONAL BARCELONA",         15),
        ("Cerveceria Catalana",  lambda: "CERVECERIA CATALANA BCN",       15),
        ("Bar del Pla",          lambda: "BAR DEL PLA BCNA",              10),
        ("La Pepita",            lambda: "LA PEPITA BCN",                 10),
        ("El Xampanyet",         lambda: "EL XAMPANYET BCN",               8),
        ("Local restaurant",     lambda: f"RESTAURANTE {r_c(5)} BCN",     20),
        ("Local restaurant",     lambda: f"CAFETERIA {r_c(4)} BCN",       10),
        ("Glovo",                lambda: f"GLOVO *ORDER {r_c()}",          7),
        ("Just Eat",             lambda: f"JUST EAT ES {r_c()}",           5),
    ]
    dw  = [x[2] for x in dining_choices]
    dtot= sum(dw)
    dw  = [w/dtot for w in dw]

    for _ in range(n_dining):
        name, desc_fn, _ = random.choices(dining_choices, weights=dw)[0]
        if name in ("Glovo", "Just Eat"):
            amt = random.gauss(27, 8)
            amt = max(14, min(55, amt))
        else:
            amt = random.gauss(42, 14)
            amt = max(18, min(95, amt))
        txns.append(tx(year, month, name, desc_fn, "Food & Dining", amt))

    # ── BARS & BEERS ─────────────────────────────────────────────────────────
    n_bars = n_times(8, year, month, "bars")

    bar_choices = [
        ("Local bar",          lambda: f"BAR {r_c(4)} BCN",         40),
        ("Mikkeller Barcelona", lambda: "MIKKELLER BARCELONA",       20),
        ("El Born Bar",        lambda: "EL BORN BAR BCN",            15),
        ("Dry Martini",        lambda: "DRY MARTINI BCN",            10),
        ("Local bar",          lambda: f"CERVECERIA {r_c(4)} BCN",  15),
    ]
    bw  = [x[2] for x in bar_choices]
    btot= sum(bw)
    bw  = [w/btot for w in bw]

    for _ in range(n_bars):
        name, desc_fn, _ = random.choices(bar_choices, weights=bw)[0]
        amt = random.gauss(22, 9)
        amt = max(8, min(60, amt))
        txns.append(tx(year, month, name, desc_fn, "Food & Dining", amt,
                       day_lo=17, day_hi=31))  # mostly weekends / end of month

    # ── CAR FUEL (Seat León, ~50L tank, fill every 2-3 weeks) ───────────────
    n_car_fuel = n_times(2, year, month, "fuel")
    for _ in range(n_car_fuel):
        name = random.choices(["Repsol","Cepsa","BP Spain"], weights=[55,30,15])[0]
        desc_fn = {
            "Repsol":   lambda: f"REPSOL {r_s()} ES",
            "Cepsa":    lambda: f"CEPSA {r_s()} ES",
            "BP Spain": lambda: f"BP #{r_s()} BCN",
        }[name]
        price_per_l = random.uniform(1.45, 1.95)  # realistic EUR/L range 2020-2024
        litres = random.uniform(35, 52)
        amt = price_per_l * litres
        txns.append(tx(year, month, name, desc_fn, "Transportation", amt))

    # ── SCOOTER FUEL (Honda PCX, 8L tank, fill every 2-3 weeks) ────────────
    n_scooter = n_times(2, year, month, "fuel")
    for _ in range(n_scooter):
        name = random.choice(["Repsol","Cepsa"])
        desc_fn = lambda n=name: f"{'REPSOL' if n=='Repsol' else 'CEPSA'} {r_s()} ES"
        amt = random.uniform(9, 18)
        txns.append(tx(year, month, name, desc_fn, "Transportation", amt))

    # ── PARKING ──────────────────────────────────────────────────────────────
    n_parking = n_times(6, year, month, "fuel")
    for _ in range(n_parking):
        name = random.choice(["SABA Parking","BSM Parking"])
        desc_fn = {
            "SABA Parking": lambda: f"SABA PARKING {r_c(4)} BCN",
            "BSM Parking":  lambda: f"BSM PARKING BCN {r_c(4)}",
        }[name]
        amt = random.uniform(5, 22)
        txns.append(tx(year, month, name, desc_fn, "Transportation", amt))

    # ── CLOTHES & SHOPPING ───────────────────────────────────────────────────
    n_shop = n_times(3, year, month, "shopping")

    shop_choices = [
        ("Zara",          lambda: f"ZARA {r_s()} BCN",              25),
        ("Mango",         lambda: f"MANGO {r_s()} BCN",             15),
        ("H&M",           lambda: f"H&M {r_s()} BCN",              15),
        ("Primark",       lambda: f"PRIMARK BCN {r_s()}",           10),
        ("Pull&Bear",     lambda: f"PULL AND BEAR {r_s()} ES",       8),
        ("Amazon ES",     lambda: f"AMZN MKTP ES*{r_c(8)}",         15),
        ("El Corte Inglés",lambda: f"EL CORTE INGLES BCN {r_s()}",   8),
        ("Decathlon",     lambda: f"DECATHLON {r_s()} BCN",          4),
    ]
    sw  = [x[2] for x in shop_choices]
    stot= sum(sw)
    sw  = [w/stot for w in sw]

    for _ in range(n_shop):
        name, desc_fn, _ = random.choices(shop_choices, weights=sw)[0]
        if name in ("El Corte Inglés", "Decathlon", "MediaMarkt"):
            amt = random.uniform(50, 250)
        elif name == "Amazon ES":
            amt = random.uniform(15, 120)
        else:
            amt = random.gauss(65, 30)
            amt = max(20, min(180, amt))
        txns.append(tx(year, month, name, desc_fn, "Shopping & Retail", amt))

    # ── PHARMACY ─────────────────────────────────────────────────────────────
    if random.random() < 0.65:
        amt = random.uniform(6, 38)
        txns.append(tx(year, month, "Farmàcia",
                       lambda: f"FARMACIA {r_c(4)} BCN",
                       "Healthcare & Medical", amt))

    # ── CINEMA / ENTERTAINMENT ───────────────────────────────────────────────
    n_cinema = n_times(1, year, month, "entertainment")
    for _ in range(n_cinema):
        if random.random() < 0.5:
            amt = random.uniform(9.5, 15)
            txns.append(tx(year, month, "Cinesa",
                           lambda: f"CINESA {r_s()} BCN",
                           "Entertainment & Recreation", amt,
                           day_lo=12, day_hi=31))

    # ── SMALL GIRLFRIEND GIFTS (non-birthday, non-Christmas) ────────────────
    is_birthday_month = (month == 7)
    is_christmas_month= (month == 12)
    if not is_birthday_month and not is_christmas_month:
        if random.random() < 0.50:   # ~50% chance some small gift each regular month
            gift_options = [
                ("Sephora",  lambda: f"SEPHORA BCN {r_s()}",           (20, 70)),
                ("Zara",     lambda: f"ZARA {r_s()} BCN",              (30, 80)),
                ("Mango",    lambda: f"MANGO {r_s()} BCN",             (35, 90)),
                ("Fnac",     lambda: f"FNAC ES {r_s()}",               (25, 60)),
                ("Floristería",   lambda: f"FLORISTA {r_c(4)} BCN",   (15, 40)),
            ]
            name, desc_fn, (lo, hi) = random.choice(gift_options)
            amt = random.uniform(lo, hi)
            txns.append(tx(year, month, name, desc_fn, "Shopping & Retail", amt))

    # ── TRAVEL ───────────────────────────────────────────────────────────────
    # Monthly travel probability (realistic for a Barcelona young professional)
    travel_base_probs = {
        1: 0.20, 2: 0.25, 3: 0.35, 4: 0.35, 5: 0.50,
        6: 0.65, 7: 0.80, 8: 0.85, 9: 0.55, 10: 0.45,
        11: 0.30, 12: 0.55,
    }
    travel_prob = travel_base_probs[month] * covid_factor(year, month, "travel")

    if random.random() < travel_prob:
        # Domestic or European destination
        domestic_cities = ["MAD","SEV","VAL","BIL","ALC","VLC","PMI"]
        eu_cities       = ["AMS","PAR","ROM","LIS","LON","PRG","VIE","DUB","MXP","FCO"]
        is_domestic     = random.random() < 0.45

        if is_domestic:
            dest     = random.choice(domestic_cities)
            airline  = random.choices(["Vueling","Ryanair"], weights=[65,35])[0]
            flight_amt = random.uniform(40, 140)
            nights   = random.randint(1, 3)
            hotel_amt  = random.uniform(60, 130)
        else:
            dest     = random.choice(eu_cities)
            airline  = random.choices(["Vueling","Ryanair","EasyJet","Iberia"],
                                      weights=[35,35,20,10])[0]
            flight_amt = random.uniform(50, 200)
            nights   = random.randint(2, 6)
            hotel_amt  = random.uniform(80, 200)

        airline_descs = {
            "Vueling": lambda: f"VUELING AIRLINES {r_c()}",
            "Ryanair": lambda: f"RYANAIR LTD {r_c()}",
            "EasyJet": lambda: f"EASYJET {r_c()}",
            "Iberia":  lambda: f"IBERIA LINEAS AEREAS {r_c()}",
        }

        # Outbound + return flight (sometimes same booking, sometimes separate)
        if random.random() < 0.60:
            # Round trip in one booking
            txns.append(tx(year, month, airline, airline_descs[airline],
                           "Transportation", flight_amt * 2 * random.uniform(0.85, 1.0),
                           day_lo=1, day_hi=10))
        else:
            txns.append(tx(year, month, airline, airline_descs[airline],
                           "Transportation", flight_amt, day_lo=1, day_hi=10))
            txns.append(tx(year, month, airline, airline_descs[airline],
                           "Transportation", flight_amt * random.uniform(0.9, 1.1),
                           day_lo=10, day_hi=28))

        # Accommodation
        acc_name = random.choices(["Booking.com","Airbnb"], weights=[60,40])[0]
        acc_fn   = {
            "Booking.com": lambda: f"BOOKING.COM {r_c()}",
            "Airbnb":      lambda: f"AIRBNB *{r_c()}",
        }[acc_name]
        txns.append(tx(year, month, acc_name, acc_fn,
                       "Transportation", hotel_amt * nights,
                       day_lo=1, day_hi=15))

    # ── ANNUAL: CAR INSURANCE (January) ─────────────────────────────────────
    if month == 1:
        txns.append(tx_fixed(year, 1, 10, "Mutua",
                             f"MUTUA MADRILENA {r_c()}",
                             "Financial Services", random.uniform(780, 960)))

    # ── ANNUAL: CAR SERVICE (October/November) ───────────────────────────────
    if month in (10, 11) and random.random() < 0.6:
        txns.append(tx(year, month, "Taller mecànic",
                       lambda: f"TALLER MECANICA {r_c(4)} BCN",
                       "Transportation",
                       random.uniform(180, 420),
                       day_lo=5, day_hi=25))

    # ── ANNUAL: ITV (scooter, every 2 years: 2020, 2022, 2024) ─────────────
    if month == 4 and year in (2020, 2022, 2024):
        txns.append(tx(year, month, "ITV",
                       lambda: f"ITV ESTACION {r_s()} BCN",
                       "Government & Legal", random.uniform(30, 50)))

    # ── ATM CASH WITHDRAWAL ─────────────────────────────────────────────────
    n_atm = random.randint(2, 4)
    for _ in range(n_atm):
        txns.append(tx(year, month, "CaixaBank ATM",
                       lambda: f"RETIRADA EFECTIVO CAJERO {r_c(4)}",
                       "Financial Services", random.choice([50, 100, 150, 200])))

    return txns


# ── SPECIAL MONTHS ────────────────────────────────────────────────────────────
def add_birthday_gift(year, month, txns):
    """
    July: girlfriend's birthday. Marc goes all out.
    Gift escalates each year as relationship deepens.
    """
    gift_amounts = {2020: 1400, 2021: 1900, 2022: 2300, 2023: 2600, 2024: 2900}
    gift_amount  = gift_amounts[year] * random.uniform(0.92, 1.08)

    # The main gift
    gift_venues = [
        ("Pandora",      lambda: f"PANDORA JEWELRY BCN {r_s()}"),
        ("Joyería",      lambda: f"JOYERIA {r_c(5)} BCN"),
        ("El Corte Inglés", lambda: f"EL CORTE INGLES BCN {r_s()}"),
    ]
    name, desc_fn = random.choice(gift_venues)
    txns.append(tx(year, month, name, desc_fn, "Shopping & Retail",
                   gift_amount, day_lo=14, day_hi=20))

    # Birthday dinner (nice restaurant, both of them)
    txns.append(tx(year, month, "El Nacional",
                   lambda: "EL NACIONAL BARCELONA",
                   "Food & Dining", random.uniform(95, 160),
                   day_lo=14, day_hi=22))

    # Birthday weekend outing / activity
    if random.random() < 0.7:
        txns.append(tx(year, month, "Ticketmaster ES",
                       lambda: f"TICKETMASTER ES {r_c()}",
                       "Entertainment & Recreation",
                       random.uniform(60, 150), day_lo=14, day_hi=22))

    # Sephora (her favourite, small extra)
    txns.append(tx(year, month, "Sephora",
                   lambda: f"SEPHORA BCN {r_s()}",
                   "Shopping & Retail", random.uniform(45, 90),
                   day_lo=12, day_hi=20))


def add_christmas_gifts(year, month, txns):
    """
    December: Christmas gift for girlfriend + extra festive spending.
    Also increases as the relationship grows.
    """
    gift_amounts = {2020: 1300, 2021: 1900, 2022: 2400, 2023: 2700, 2024: 3000}
    gift_amount  = gift_amounts[year] * random.uniform(0.93, 1.07)

    gift_venues = [
        ("El Corte Inglés", lambda: f"EL CORTE INGLES BCN {r_s()}"),
        ("Joyería",         lambda: f"JOYERIA {r_c(5)} BCN"),
        ("Pandora",         lambda: f"PANDORA JEWELRY BCN {r_s()}"),
    ]
    name, desc_fn = random.choice(gift_venues)
    txns.append(tx(year, month, name, desc_fn, "Shopping & Retail",
                   gift_amount, day_lo=18, day_hi=23))

    # Christmas Eve dinner (family or couple, Catalan tradition)
    txns.append(tx(year, month, "El Nacional",
                   lambda: "EL NACIONAL BARCELONA",
                   "Food & Dining", random.uniform(110, 200),
                   day_lo=23, day_hi=25))

    # Extra festive shopping (small gifts for family)
    for _ in range(random.randint(2, 4)):
        s_opts = [
            ("Zara",  lambda: f"ZARA {r_s()} BCN",      (25, 70)),
            ("Fnac",  lambda: f"FNAC ES {r_s()}",        (20, 60)),
            ("Sephora",lambda: f"SEPHORA BCN {r_s()}",   (30, 80)),
        ]
        name, desc_fn, (lo, hi) = random.choice(s_opts)
        txns.append(tx(year, month, name, desc_fn, "Shopping & Retail",
                       random.uniform(lo, hi), day_lo=10, day_hi=23))

    # New Year's Eve outgoing (ticket to party/event)
    if random.random() < 0.75:
        txns.append(tx(year, month, "Ticketmaster ES",
                       lambda: f"TICKETMASTER ES {r_c()}",
                       "Entertainment & Recreation",
                       random.uniform(70, 200), day_lo=28, day_hi=31))

    # Cava / wine for celebrations (Mercadona run)
    txns.append(tx(year, month, "Mercadona",
                   lambda: f"MERCADONA 0{r_s()}",
                   "Food & Dining", random.uniform(45, 90),
                   day_lo=23, day_hi=30))


# ── MAIN GENERATION LOOP ──────────────────────────────────────────────────────
all_txns = []
total_income   = 0
total_spending = 0

print("Generating Marc Ferrer's 5 years of transactions (2020–2024)...\n")
print(f"{'Month':<12} {'Txns':>5}  {'Income':>8}  {'Spending':>9}  {'Net':>8}  Notes")
print("-" * 65)

for year in range(2020, 2025):
    for month in range(1, 13):
        txns = generate_month(year, month)

        # Add birthday (July)
        if month == 7:
            add_birthday_gift(year, month, txns)

        # Add Christmas spending (December)
        if month == 12:
            add_christmas_gifts(year, month, txns)

        # Compute summary
        month_income   = sum(t["amount"] for t in txns if t["category"] == "Income")
        month_spending = sum(t["amount"] for t in txns if t["category"] != "Income")
        month_net      = month_income - month_spending

        total_income   += month_income
        total_spending += month_spending

        notes = []
        if month == 7:            notes.append("🎁 Birthday gift")
        if month == 12:           notes.append("🎄 Christmas gift")
        if year == 2020 and month in [4,5]: notes.append("🔒 Lockdown")
        if month == 1:            notes.append("🚗 Car insurance")

        print(f"{year}-{month:02d}     {len(txns):>5}  "
              f"€{month_income:>7,.0f}  €{month_spending:>8,.0f}  "
              f"€{month_net:>+7,.0f}  {' | '.join(notes)}")

        all_txns.extend(txns)

# ── BUILD DATAFRAME ───────────────────────────────────────────────────────────
print(f"\n{'='*65}")
print(f"Total transactions : {len(all_txns):,}")
print(f"Total income       : €{total_income:,.2f}")
print(f"Total spending     : €{total_spending:,.2f}")
print(f"Net saved (5 yrs)  : €{total_income-total_spending:,.2f}")

df = pd.DataFrame(all_txns)
df = df.sort_values("timestamp").reset_index(drop=True)
df.insert(0, "transaction_id", [f"MARC{i:05d}" for i in range(len(df))])

# ── SAVE ─────────────────────────────────────────────────────────────────────
df.to_parquet(OUTPUT, index=False, compression="snappy")
size_kb = __import__("os").path.getsize(OUTPUT) / 1024

print(f"\nSaved → {OUTPUT}  ({size_kb:.0f} KB)")
print(f"\nColumn dtypes:\n{df.dtypes.to_string()}")
print(f"\nCategory breakdown:")
for cat, grp in df[df["category"]!="Income"].groupby("category"):
    print(f"  {cat:<35}  {len(grp):>4} txns  €{grp['amount'].sum():>8,.0f} total")

print(f"\nSample rows:")
sample = df.sample(10, random_state=7)
for _, r in sample.iterrows():
    print(f"  {str(r['timestamp'])[:16]}  {r['merchant_name']:<22}"
          f"  {r['category']:<28}  €{r['amount']:>8.2f}")
