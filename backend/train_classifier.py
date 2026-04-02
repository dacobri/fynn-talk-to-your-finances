#!/usr/bin/env python3
"""
Transaction Category Classifier — Training Pipeline
=====================================================
Model:  TF-IDF (word 1-2 grams + char 2-4 grams) → LightGBM (multiclass)

Why NOT DistilBERT:
  • Bank descriptions are mostly brand names + patterns — not semantic language.
    Char/word n-grams capture these just as well.
  • Training DistilBERT on 1M rows requires GPU + hours. This runs on CPU in ~15 min.
  • TF-IDF + LightGBM serves in <1ms per transaction; ideal for production.
  • Expected accuracy: 92–97% (very strong signals in merchant names).

Why LightGBM over Logistic Regression:
  • Handles feature interactions (e.g. "APPLE" alone is ambiguous → Shopping or
    Entertainment; the combination of merchant + description resolves it).
  • Natively handles class imbalance with is_unbalance=True.
  • Early stopping prevents overfitting without manual tuning.

Features used:
  • text = merchant_name + " " + transaction_description
  • word TF-IDF (1-2 grams): captures full names & keyword pairs
  • char TF-IDF (2-4 grams, char_wb): robust to truncation & special chars
    e.g. "SQ *MCDONAL" still contains "MCDONA", "CDONAN" etc.

Evaluation:
  • 80/20 stratified holdout split
  • 3-fold stratified CV on 200k subsample of training set (fast, reliable estimate)
  • Full test metrics: accuracy, macro F1, weighted F1, per-class report
  • Confusion matrix saved as CSV

Usage:
  python train_classifier.py
  (expects transactions_1m_v2.parquet in the same directory)
"""

import os
import time
import joblib
import numpy as np
import pandas as pd
from scipy.sparse import hstack, csr_matrix
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, f1_score,
                             classification_report, confusion_matrix)
import lightgbm as lgb

# ── Config ────────────────────────────────────────────────────────────────────
DATA_PATH = "data/transactions_1m_v3.parquet"
OUTPUT_DIR  = "classifier"
RANDOM_SEED = 42
CV_SAMPLE   = 200_000   # rows used for cross-validation (speed vs. accuracy trade-off)
TEST_SIZE   = 0.20
N_CV_FOLDS  = 3

os.makedirs(OUTPUT_DIR, exist_ok=True)
t_total = time.time()

# ── 1. Load & inspect ─────────────────────────────────────────────────────────
print("=" * 65)
print("1. LOADING DATA")
print("=" * 65)
df = pd.read_parquet(DATA_PATH)
print(f"   Rows: {len(df):,}  |  Columns: {list(df.columns)}")
print(f"   Categories ({df['category'].nunique()}):")
for cat, cnt in df['category'].value_counts().items():
    print(f"     {cat:<35} {cnt:>8,}  ({cnt/len(df)*100:.1f}%)")

# ── 2. Feature engineering ────────────────────────────────────────────────────
print("\n" + "=" * 65)
print("2. FEATURE ENGINEERING")
print("=" * 65)

# Combine merchant_name + description. Merchant name is clean; description adds
# format-level context (e.g. "SQ *" prefix signals Square POS transactions).
df["text"] = (df["merchant_name"].fillna("") + " " +
              df["transaction_description"].fillna("")).str.strip()

X = df["text"].values
y = df["category"].values

le = LabelEncoder()
y_enc = le.fit_transform(y)
print(f"   Text feature sample:")
for t in df["text"].sample(5, random_state=1):
    print(f"     '{t}'")
print(f"\n   Labels: {list(le.classes_)}")

# ── 3. Stratified train / test split (80 / 20) ───────────────────────────────
print("\n" + "=" * 65)
print("3. TRAIN / TEST SPLIT  (stratified, 80/20)")
print("=" * 65)
X_train, X_test, y_train, y_test = train_test_split(
    X, y_enc, test_size=TEST_SIZE, random_state=RANDOM_SEED, stratify=y_enc
)
print(f"   Train: {len(X_train):,}  |  Test: {len(X_test):,}")

# Verify stratification
for i, cls in enumerate(le.classes_):
    tr_pct = (y_train == i).mean() * 100
    te_pct = (y_test  == i).mean() * 100
    print(f"   {cls:<35} train {tr_pct:.1f}%  test {te_pct:.1f}%")

# ── 4. TF-IDF vectorisation ───────────────────────────────────────────────────
print("\n" + "=" * 65)
print("4. TF-IDF VECTORISATION")
print("=" * 65)

# Word n-grams (1-2): captures full merchant names and two-word patterns
tfidf_word = TfidfVectorizer(
    analyzer="word",
    ngram_range=(1, 2),
    max_features=80_000,
    sublinear_tf=True,        # log(1+tf) — dampens very frequent tokens
    min_df=2,
    strip_accents="unicode",
    lowercase=True,
)

# Character n-grams (2-4, word-boundary padded):
# Handles truncated names: "SQ *MCDONAL" → shares "MCDON", "CDONL" with "MCDONALD'S"
tfidf_char = TfidfVectorizer(
    analyzer="char_wb",
    ngram_range=(2, 4),
    max_features=80_000,
    sublinear_tf=True,
    min_df=3,
    strip_accents="unicode",
    lowercase=True,
)

t0 = time.time()
print("   Fitting word TF-IDF...")
X_train_word = tfidf_word.fit_transform(X_train)
X_test_word  = tfidf_word.transform(X_test)

print("   Fitting char TF-IDF...")
X_train_char = tfidf_char.fit_transform(X_train)
X_test_char  = tfidf_char.transform(X_test)

X_train_vec = hstack([X_train_word, X_train_char], format="csr")
X_test_vec  = hstack([X_test_word,  X_test_char],  format="csr")

print(f"   Feature matrix shape: {X_train_vec.shape}  [{time.time()-t0:.1f}s]")
print(f"   Sparsity: {1 - X_train_vec.nnz / (X_train_vec.shape[0]*X_train_vec.shape[1]):.4f}")

# ── 5. Cross-validation (3-fold, subsample for speed) ────────────────────────
print("\n" + "=" * 65)
print(f"5. {N_CV_FOLDS}-FOLD STRATIFIED CROSS-VALIDATION  (n={CV_SAMPLE:,} subsample)")
print("=" * 65)

rng    = np.random.RandomState(RANDOM_SEED)
cv_idx = rng.choice(len(X_train), min(CV_SAMPLE, len(X_train)), replace=False)
X_cv   = X_train_vec[cv_idx]
y_cv   = y_train[cv_idx]

# Use LogisticRegression for CV (fast on sparse, gives reliable accuracy estimate).
# Final model will be LightGBM which captures non-linear interactions.
lr_cv = LogisticRegression(
    max_iter=300, C=1.0, solver="saga",
    multi_class="multinomial", n_jobs=-1, random_state=RANDOM_SEED,
)
skf = StratifiedKFold(n_splits=N_CV_FOLDS, shuffle=True, random_state=RANDOM_SEED)

t0 = time.time()
cv_scores = cross_val_score(lr_cv, X_cv, y_cv, cv=skf, scoring="accuracy", n_jobs=-1)
print(f"   Logistic Regression CV Accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
print(f"   Per-fold: {[f'{s:.4f}' for s in cv_scores]}  [{time.time()-t0:.1f}s]")
print(f"\n   → Provides lower-bound estimate. LightGBM will perform better.")

# ── 6. Train final model — LightGBM ──────────────────────────────────────────
print("\n" + "=" * 65)
print("6. TRAINING LightGBM CLASSIFIER  (full training set)")
print("=" * 65)

# Hold out 5% of training data for early stopping
X_tr2, X_val, y_tr2, y_val = train_test_split(
    X_train_vec, y_train, test_size=0.05,
    stratify=y_train, random_state=RANDOM_SEED,
)
print(f"   Train: {X_tr2.shape[0]:,}  |  Early-stop val: {X_val.shape[0]:,}")

model = lgb.LGBMClassifier(
    objective="multiclass",
    num_class=len(le.classes_),
    n_estimators=100,
    learning_rate=0.08,
    num_leaves=127,
    max_depth=-1,
    min_child_samples=20,
    subsample=0.85,
    colsample_bytree=0.7,
    reg_alpha=0.05,
    reg_lambda=1.0,
    is_unbalance=True,          # automatically accounts for class imbalance
    n_jobs=-1,
    random_state=RANDOM_SEED,
    verbose=-1,
)

t0 = time.time()
model.fit(
    X_tr2, y_tr2,
    eval_set=[(X_val, y_val)],
    callbacks=[
        lgb.early_stopping(stopping_rounds=40, verbose=False),
        lgb.log_evaluation(period=50),
    ],
)
print(f"   Best iteration: {model.best_iteration_}  [{time.time()-t0:.1f}s]")

# ── 7. Holdout test set evaluation ───────────────────────────────────────────
print("\n" + "=" * 65)
print("7. HOLDOUT TEST SET EVALUATION")
print("=" * 65)

y_pred      = model.predict(X_test_vec)
y_pred_prob = model.predict_proba(X_test_vec)

acc         = accuracy_score(y_test, y_pred)
f1_macro    = f1_score(y_test, y_pred, average="macro")
f1_weighted = f1_score(y_test, y_pred, average="weighted")

print(f"\n   Accuracy         : {acc:.4f}  ({acc*100:.2f}%)")
print(f"   F1 macro         : {f1_macro:.4f}")
print(f"   F1 weighted      : {f1_weighted:.4f}")

print(f"\n   Per-class report:")
print(classification_report(y_test, y_pred, target_names=le.classes_, digits=4))

# Confusion matrix
cm    = confusion_matrix(y_test, y_pred)
cm_df = pd.DataFrame(cm, index=le.classes_, columns=le.classes_)
cm_path = os.path.join(OUTPUT_DIR, "confusion_matrix.csv")
cm_df.to_csv(cm_path)
print(f"   Confusion matrix → {cm_path}")

# Confidence analysis
max_probs = y_pred_prob.max(axis=1)
print(f"\n   Prediction confidence (on test set):")
for thr in [0.5, 0.7, 0.9, 0.95, 0.99]:
    pct = (max_probs >= thr).mean() * 100
    print(f"     ≥ {thr:.0%}: {pct:.1f}% of test transactions")

# ── 8. Save artefacts ────────────────────────────────────────────────────────
print("\n" + "=" * 65)
print("8. SAVING ARTEFACTS")
print("=" * 65)

joblib.dump(tfidf_word, os.path.join(OUTPUT_DIR, "tfidf_word.pkl"))
joblib.dump(tfidf_char, os.path.join(OUTPUT_DIR, "tfidf_char.pkl"))
joblib.dump(model,      os.path.join(OUTPUT_DIR, "lgbm_model.pkl"))
joblib.dump(le,         os.path.join(OUTPUT_DIR, "label_encoder.pkl"))

# Save metadata
import json
meta = {
    "n_train":      int(len(X_train)),
    "n_test":       int(len(X_test)),
    "n_classes":    int(len(le.classes_)),
    "classes":      list(le.classes_),
    "accuracy":     float(round(acc, 6)),
    "f1_macro":     float(round(f1_macro, 6)),
    "f1_weighted":  float(round(f1_weighted, 6)),
    "cv_mean":      float(round(cv_scores.mean(), 6)),
    "cv_std":       float(round(cv_scores.std(), 6)),
    "best_iter":    int(model.best_iteration_),
    "word_features":int(X_train_word.shape[1]),
    "char_features":int(X_train_char.shape[1]),
}
with open(os.path.join(OUTPUT_DIR, "model_metadata.json"), "w") as f:
    json.dump(meta, f, indent=2)

print(f"   Saved: tfidf_word.pkl, tfidf_char.pkl, lgbm_model.pkl,")
print(f"          label_encoder.pkl, model_metadata.json, confusion_matrix.csv")
print(f"   → ./{OUTPUT_DIR}/")

print(f"\n{'='*65}")
print(f"   TOTAL TRAINING TIME: {(time.time()-t_total)/60:.1f} minutes")
print(f"{'='*65}")

# ── 9. Inference example ──────────────────────────────────────────────────────
print("""
INFERENCE USAGE
───────────────
from classifier import predict

result = predict("Mercadona", "MERCADONA 01234")
# → {"category": "Food & Dining", "confidence": 0.9987, ...}
""")


# ── Inference module (save alongside model) ───────────────────────────────────
INFERENCE_CODE = '''
import joblib
from scipy.sparse import hstack

_tfidf_word = joblib.load("classifier/tfidf_word.pkl")
_tfidf_char = joblib.load("classifier/tfidf_char.pkl")
_model      = joblib.load("classifier/lgbm_model.pkl")
_le         = joblib.load("classifier/label_encoder.pkl")

def predict(merchant_name: str, description: str) -> dict:
    """
    Classify a single transaction.

    Args:
        merchant_name: Clean merchant name (e.g. "Mercadona")
        description:   Bank-style description (e.g. "MERCADONA 01234")

    Returns:
        {category, confidence, all_probabilities}
    """
    text = f"{merchant_name} {description}"
    X_w  = _tfidf_word.transform([text])
    X_c  = _tfidf_char.transform([text])
    X    = hstack([X_w, X_c])
    pred = _model.predict(X)[0]
    prob = _model.predict_proba(X)[0]
    return {
        "category":           _le.inverse_transform([pred])[0],
        "confidence":         float(prob.max()),
        "all_probabilities":  dict(zip(_le.classes_, prob.round(4).tolist())),
    }

def predict_batch(merchant_names: list, descriptions: list) -> list:
    """Classify a batch of transactions efficiently."""
    texts = [f"{m} {d}" for m, d in zip(merchant_names, descriptions)]
    X_w   = _tfidf_word.transform(texts)
    X_c   = _tfidf_char.transform(texts)
    X     = hstack([X_w, X_c])
    preds = _model.predict(X)
    probs = _model.predict_proba(X)
    return [
        {
            "category":    _le.inverse_transform([p])[0],
            "confidence":  float(pr.max()),
        }
        for p, pr in zip(preds, probs)
    ]
'''
with open(os.path.join(OUTPUT_DIR, "classifier.py"), "w") as f:
    f.write(INFERENCE_CODE)
print(f"   Inference module → ./{OUTPUT_DIR}/classifier.py")
