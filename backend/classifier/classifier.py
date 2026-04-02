
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
