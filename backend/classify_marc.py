#!/usr/bin/env python3
"""
Classify Marc's Barcelona transactions using the trained model.
Outputs a new parquet + CSV with predicted categories and confidence scores.

Run from project root:
    python classify_marc.py
"""

import pandas as pd
import joblib
from scipy.sparse import hstack

# ── Load model artefacts ──────────────────────────────────────────────────────
print("Loading model...")
tfidf_word = joblib.load("classifier/tfidf_word.pkl")
tfidf_char = joblib.load("classifier/tfidf_char.pkl")
model      = joblib.load("classifier/lgbm_model.pkl")
le         = joblib.load("classifier/label_encoder.pkl")

# ── Load Marc's data ──────────────────────────────────────────────────────────
print("Loading Marc's transactions...")
df = pd.read_parquet("data/barcelona_personal.parquet")
print(f"  {len(df):,} transactions loaded")

# ── Build features ────────────────────────────────────────────────────────────
text   = (df["merchant_name"].fillna("") + " " +
          df["transaction_description"].fillna("")).str.strip()

X_word = tfidf_word.transform(text)
X_char = tfidf_char.transform(text)
X      = hstack([X_word, X_char])

# ── Predict ───────────────────────────────────────────────────────────────────
print("Running classifier...")
preds      = model.predict(X)
probs      = model.predict_proba(X)

df["predicted_category"] = le.inverse_transform(preds)
df["confidence"]         = probs.max(axis=1).round(4)
df["correct"]            = df["predicted_category"] == df["category"]

# ── Results ───────────────────────────────────────────────────────────────────
accuracy = df["correct"].mean()
print(f"\n{'='*55}")
print(f"  Accuracy on Marc's data: {accuracy*100:.2f}%")
print(f"{'='*55}")

# Show any misclassifications
wrong = df[~df["correct"]][["timestamp","merchant_name",
                             "transaction_description",
                             "category","predicted_category","confidence"]]
if len(wrong) == 0:
    print("\n  ✅ Zero misclassifications!")
else:
    print(f"\n  ⚠️  {len(wrong)} misclassified transactions:")
    for _, r in wrong.iterrows():
        print(f"  {str(r['timestamp'])[:16]}  {r['merchant_name']:<22}"
              f"  actual: {r['category']:<28}"
              f"  predicted: {r['predicted_category']:<28}"
              f"  conf: {r['confidence']:.3f}")

# Per-category accuracy
print("\n  Per-category breakdown:")
for cat, grp in df.groupby("category"):
    acc = grp["correct"].mean() * 100
    print(f"    {cat:<35}  {len(grp):>4} txns  {acc:.1f}% correct")

# Confidence distribution
print(f"\n  Confidence distribution:")
for thr in [0.99, 0.95, 0.90, 0.80]:
    pct = (df["confidence"] >= thr).mean() * 100
    print(f"    ≥ {thr:.0%}: {pct:.1f}% of transactions")

# ── Save outputs ──────────────────────────────────────────────────────────────
out_parquet = "data/marc_classified.parquet"
out_csv     = "data/marc_classified.csv"

df.to_parquet(out_parquet, index=False)
df.to_csv(out_csv, index=False)

print(f"\n  Saved → {out_parquet}")
print(f"  Saved → {out_csv}  (open in Excel to inspect)")
