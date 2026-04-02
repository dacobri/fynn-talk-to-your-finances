"""
load_db.py — Run once to load the classified CSV into SQLite.

Usage:
    python3 load_db.py
"""

import sqlite3
import pandas as pd
from pathlib import Path

_DIR = Path(__file__).resolve().parent
CSV_PATH = str(_DIR / "data" / "marc_classified.csv")
DB_PATH  = str(_DIR / "data" / "transactions.db")


def main():
    print(f"Reading {CSV_PATH}...")
    df = pd.read_csv(CSV_PATH, parse_dates=["timestamp"])

    # Add integer columns for easy SQL filtering
    df["year"]  = df["timestamp"].dt.year
    df["month"] = df["timestamp"].dt.month
    df["day"]   = df["timestamp"].dt.day

    # Store timestamp as ISO string (SQLite has no native datetime)
    df["timestamp"] = df["timestamp"].dt.strftime("%Y-%m-%d %H:%M:%S")

    print(f"Loading {len(df):,} rows into {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    df.to_sql("transactions", conn, if_exists="replace", index=False)

    # Useful indexes for common queries
    conn.execute("CREATE INDEX IF NOT EXISTS idx_year_month ON transactions(year, month)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_category ON transactions(predicted_category)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_merchant ON transactions(merchant_name)")
    conn.commit()
    conn.close()

    print("Done. Schema:")
    conn = sqlite3.connect(DB_PATH)
    for row in conn.execute("PRAGMA table_info(transactions)").fetchall():
        print(f"  {row[1]:35s} {row[2]}")
    conn.close()


if __name__ == "__main__":
    main()
