"""
Fake Review Detector
Uses TF-IDF vectorizer + Logistic Regression to classify reviews
as genuine (1) or suspicious/fake (0)

Trained on sample_reviews.csv dataset
"""

import os
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
import joblib


# Path to saved model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "review_classifier.pkl")
DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "sample_reviews.csv")


def train_model():
    """Train and save the fake review detection model."""
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

    df = pd.read_csv(DATA_PATH)
    # Strip whitespace from column names (handles BOM/encoding quirks)
    df.columns = df.columns.str.strip()
    X = df["review"].values
    y = df["label"].values

    # Build pipeline: TF-IDF → Logistic Regression
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            ngram_range=(1, 2),       # unigrams + bigrams
            max_features=5000,
            stop_words="english",
            lowercase=True,
        )),
        ("clf", LogisticRegression(
            C=1.0,
            max_iter=1000,
            class_weight="balanced",  # handle class imbalance
        )),
    ])

    pipeline.fit(X, y)
    joblib.dump(pipeline, MODEL_PATH)
    print(f"✅ Fake review model trained and saved to {MODEL_PATH}")

    # Quick accuracy check
    if len(X) >= 10:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        pipe2 = Pipeline([
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=5000, stop_words="english")),
            ("clf", LogisticRegression(C=1.0, max_iter=1000, class_weight="balanced")),
        ])
        pipe2.fit(X_train, y_train)
        acc = pipe2.score(X_test, y_test)
        print(f"📊 Cross-val accuracy: {acc:.1%}")

    return pipeline


def load_model():
    """Load saved model if exists, otherwise train a new one."""
    if os.path.exists(MODEL_PATH):
        return joblib.load(MODEL_PATH)
    print("⚠️  No saved model found — training now...")
    return train_model()


# Lazy-load model on first use
_model = None


def get_model():
    global _model
    if _model is None:
        _model = load_model()
    return _model


def check_review(review_text: str) -> dict:
    """
    Classify a review as genuine or suspicious.

    Args:
        review_text: The review comment string

    Returns:
        dict with keys: label ("genuine" | "suspicious"), confidence (float 0-1)
    """
    # 1. Basic length check
    if not review_text or len(review_text.strip()) < 3:
        return {"label": "suspicious", "confidence": 0.95}
        
    # 2. Heuristic Enhancement: Excessive Repetition Verification
    words = review_text.lower().split()
    if len(words) > 3:
        word_counts = {}
        for w in words:
            word_counts[w] = word_counts.get(w, 0) + 1
            # If the same word appears many times (spam behavior like "terrible terrible terrible")
            if word_counts[w] >= max(3, len(words) * 0.3):
                return {"label": "suspicious", "confidence": 0.88}

    # 3. Heuristic Enhancement: Excessive ALL CAPS (shouting/spam)
    if len(words) > 5:
        upper_words = [w for w in review_text.split() if w.isupper() and len(w) > 1]
        if len(upper_words) / len(words) > 0.4:
            return {"label": "suspicious", "confidence": 0.85}

    # 4. Fallback to NLP Logistic Regression Model
    model = get_model()
    proba = model.predict_proba([review_text])[0]
    prediction = model.predict([review_text])[0]

    label = "genuine" if prediction == 1 else "suspicious"
    confidence = float(proba[prediction])

    return {"label": label, "confidence": round(confidence, 3)}
