"""
load_db.py — Load CaixaBank parquet + investments CSV into SQLite.

Usage:
    python3 load_db.py
"""

import sqlite3
import pandas as pd
from pathlib import Path

_DIR = Path(__file__).resolve().parent
PARQUET_PATH = str(_DIR / "data" / "marc_caixabank_v2.parquet")
INVESTMENTS_CSV = str(_DIR / "data" / "marc_investments.csv")
DB_PATH = str(_DIR / "data" / "transactions.db")


# ── Transfer / Investment detection rules ────────────────────────────────────

def _classify_transfers_and_investments(df: pd.DataFrame) -> pd.DataFrame:
    """
    Reclassify certain CaixaBank transactions:
      - Revolut top-ups (outgoing) → Transfer
      - Revolut incoming (INGRESO REVOLUT) → Transfer
      - DEGIRO purchases → Investment
    """
    df = df.copy()

    # Revolut outgoing: "TRANSFERENCIA REVOLUT LTD REF..."
    mask_rev_out = df["transaction_description"].str.contains(
        r"TRANSFERENCIA REVOLUT", case=False, na=False
    )
    df.loc[mask_rev_out, "predicted_category"] = "Transfer"

    # Revolut incoming: "INGRESO REVOLUT REF..."
    mask_rev_in = df["transaction_description"].str.contains(
        r"INGRESO REVOLUT", case=False, na=False
    )
    df.loc[mask_rev_in, "predicted_category"] = "Transfer"

    # DEGIRO investment purchases
    mask_degiro = df["merchant_name"].str.contains(
        r"DEGIRO", case=False, na=False
    )
    df.loc[mask_degiro, "predicted_category"] = "Investment"

    return df


def main():
    # ── 1. Load CaixaBank parquet ────────────────────────────────────────────
    print(f"Reading {PARQUET_PATH}...")
    df = pd.read_parquet(PARQUET_PATH)

    # Map parquet columns → DB schema
    # Parquet has: transaction_id, account_id, source, timestamp, merchant_name,
    #              merchant_id, transaction_description, category, amount, currency
    # DB needs:    + predicted_category, confidence, correct, year, month, day

    # Use the parquet 'category' as 'predicted_category' (it's the classification)
    df["predicted_category"] = df["category"]
    df["confidence"] = 1.0
    df["correct"] = True

    # Reclassify transfers and investments
    df = _classify_transfers_and_investments(df)

    # Time columns
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["year"] = df["timestamp"].dt.year
    df["month"] = df["timestamp"].dt.month
    df["day"] = df["timestamp"].dt.day
    df["timestamp"] = df["timestamp"].dt.strftime("%Y-%m-%d %H:%M:%S")

    # Ensure source column
    if "source" not in df.columns:
        df["source"] = "CaixaBank"

    # Select and order columns for DB
    cols = [
        "transaction_id", "account_id", "source", "merchant_name", "merchant_id",
        "timestamp", "transaction_description", "category", "amount", "currency",
        "predicted_category", "confidence", "correct", "year", "month", "day",
    ]
    df = df[cols]

    print(f"Loading {len(df):,} CaixaBank rows into {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    df.to_sql("transactions", conn, if_exists="replace", index=False)

    # Indexes
    conn.execute("CREATE INDEX IF NOT EXISTS idx_year_month ON transactions(year, month)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_category ON transactions(predicted_category)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_merchant ON transactions(merchant_name)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_source ON transactions(source)")
    conn.commit()

    # Print summary
    for row in conn.execute("SELECT predicted_category, COUNT(*) FROM transactions GROUP BY predicted_category ORDER BY COUNT(*) DESC").fetchall():
        print(f"  {row[0]:30s} {row[1]:>5d}")

    # ── 2. Load investments CSV ──────────────────────────────────────────────
    print(f"\nReading {INVESTMENTS_CSV}...")
    inv = pd.read_csv(INVESTMENTS_CSV)
    print(f"Loading {len(inv):,} investment rows...")
    inv.to_sql("investments", conn, if_exists="replace", index=False)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_inv_ticker ON investments(ticker)")
    conn.commit()

    # ── 3. Delete stale subscription cache ───────────────────────────────────
    cache_path = _DIR / "data" / "subscriptions_cache.json"
    if cache_path.exists():
        cache_path.unlink()
        print("Deleted stale subscriptions_cache.json")

    conn.close()
    print("\nDone.")


if __name__ == "__main__":
    main()
