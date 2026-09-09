"""
Shared helpers for the MotionSense-AI dashboard:
data loading, model loading, and small reusable computations.
Everything here is cached so the app stays snappy.
"""

from pathlib import Path

import numpy as np
import pandas as pd
import streamlit as st

DATA_DIR = Path(__file__).parent / "data"
PROCESSED_DIR = DATA_DIR / "processed"

RAW_PATH = DATA_DIR / "motionsense_raw.csv"
CLEAN_PATH = PROCESSED_DIR / "motionsense_clean.csv"
ML_READY_PATH = PROCESSED_DIR / "motionsense_ml_ready.csv"
MODEL_PATH = PROCESSED_DIR / "motionsense_final_model.joblib"

FEATURE_COLUMNS = [
    "acc_x", "acc_y", "acc_z",
    "gyro_x", "gyro_y", "gyro_z",
    "acc_magnitude", "gyro_magnitude",
]

ACTIVITY_ORDER = [
    "Laying", "Sitting", "Standing",
    "Walking", "Walking Downstairs", "Walking Upstairs",
]

ACTIVITY_COLORS = {
    "Laying": "#6C5CE7",
    "Sitting": "#00B894",
    "Standing": "#0984E3",
    "Walking": "#FDCB6E",
    "Walking Downstairs": "#E17055",
    "Walking Upstairs": "#D63031",
}

ACTIVITY_ICONS = {
    "Laying": "🛌",
    "Sitting": "🪑",
    "Standing": "🧍",
    "Walking": "🚶",
    "Walking Downstairs": "⬇️",
    "Walking Upstairs": "⬆️",
}


@st.cache_data(show_spinner=False)
def load_raw() -> pd.DataFrame:
    return pd.read_csv(RAW_PATH)


@st.cache_data(show_spinner=False)
def load_clean() -> pd.DataFrame:
    return pd.read_csv(CLEAN_PATH)


@st.cache_data(show_spinner=False)
def load_ml_ready() -> pd.DataFrame:
    return pd.read_csv(ML_READY_PATH)


@st.cache_resource(show_spinner=False)
def load_model():
    import joblib  # deferred: avoids paying this import cost before the
    # first UI elements have rendered
    return joblib.load(MODEL_PATH)


@st.cache_data(show_spinner=False)
def get_train_test_split(random_state: int = 42, test_size: float = 0.20):
    """Recreate the exact split used when the shipped model was trained,
    so evaluation reflects genuinely held-out rows."""
    from sklearn.model_selection import train_test_split  # deferred import

    df = load_ml_ready()
    X = df[FEATURE_COLUMNS]
    y = df["activity"]
    return train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )


@st.cache_data(show_spinner=False)
def get_test_predictions():
    """Predictions of the shipped model on the held-out test split."""
    _, X_test, _, y_test = get_train_test_split()
    model = load_model()
    y_pred = model.predict(X_test)
    return X_test, y_test, y_pred


@st.cache_data(show_spinner=False)
def get_eval_metrics():
    from sklearn.metrics import (  # deferred import
        accuracy_score,
        classification_report,
        confusion_matrix,
    )

    _, y_test, y_pred = get_test_predictions()
    acc = accuracy_score(y_test, y_pred)
    labels = [a for a in ACTIVITY_ORDER if a in set(y_test) | set(y_pred)]
    cm = confusion_matrix(y_test, y_pred, labels=labels)
    report = classification_report(
        y_test, y_pred, labels=labels, output_dict=True, zero_division=0
    )
    return {
        "accuracy": acc,
        "labels": labels,
        "confusion_matrix": cm,
        "report": report,
        "n_test": len(y_test),
    }


@st.cache_data(show_spinner=False)
def get_feature_importance():
    model = load_model()
    importances = pd.Series(
        model.feature_importances_, index=FEATURE_COLUMNS
    ).sort_values(ascending=False)
    return importances


def predict_activity(sensor_values: dict):
    """sensor_values must contain acc_x, acc_y, acc_z, gyro_x, gyro_y, gyro_z."""
    model = load_model()

    acc_mag = float(np.sqrt(
        sensor_values["acc_x"] ** 2
        + sensor_values["acc_y"] ** 2
        + sensor_values["acc_z"] ** 2
    ))
    gyro_mag = float(np.sqrt(
        sensor_values["gyro_x"] ** 2
        + sensor_values["gyro_y"] ** 2
        + sensor_values["gyro_z"] ** 2
    ))

    row = {**sensor_values, "acc_magnitude": acc_mag, "gyro_magnitude": gyro_mag}
    X = pd.DataFrame([row])[FEATURE_COLUMNS]

    pred = model.predict(X)[0]
    proba = model.predict_proba(X)[0]
    proba_series = pd.Series(proba, index=model.classes_).sort_values(ascending=False)

    return pred, proba_series, acc_mag, gyro_mag


def inject_css():
    st.markdown(
        """
        <style>
        .block-container {
            padding-top: 2rem;
            padding-bottom: 3rem;
        }
        [data-testid="stMetric"] {
            background: linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%);
            border: 1px solid #E4DEFB;
            border-radius: 14px;
            padding: 14px 18px 10px 18px;
        }
        [data-testid="stMetricLabel"] {
            font-weight: 600;
            color: #6C5CE7;
        }
        h1, h2, h3 {
            font-weight: 800;
        }
        .ms-hero {
            background: linear-gradient(120deg, #6C5CE7 0%, #A29BFE 100%);
            border-radius: 20px;
            padding: 28px 32px;
            color: white;
            margin-bottom: 1.5rem;
        }
        .ms-hero h1 {
            margin: 0;
            font-size: 2.1rem;
        }
        .ms-hero p {
            margin: 6px 0 0 0;
            opacity: 0.92;
            font-size: 1.02rem;
        }
        .ms-pill {
            display: inline-block;
            background: rgba(255,255,255,0.18);
            border-radius: 999px;
            padding: 4px 14px;
            margin-right: 8px;
            font-size: 0.85rem;
        }
        .ms-card {
            background: #FAFAFF;
            border: 1px solid #ECE9FB;
            border-radius: 16px;
            padding: 18px 20px;
            height: 100%;
        }
        /* Reliable, encoding-safe sidebar icons (fix for corrupted
           characters like "ƒö"/"ƒª"). These are injected via CSS, which is
           always rendered by the browser as UTF-8 regardless of the host
           OS's filename/console encoding — unlike emoji embedded directly
           in page filenames, which Windows can mis-decode. */
        [data-testid="stSidebarNav"] li:nth-child(1) a span::before { content: "🏠  "; }
        [data-testid="stSidebarNav"] li:nth-child(2) a span::before { content: "📂  "; }
        [data-testid="stSidebarNav"] li:nth-child(3) a span::before { content: "📊  "; }
        [data-testid="stSidebarNav"] li:nth-child(4) a span::before { content: "🌲  "; }
        [data-testid="stSidebarNav"] li:nth-child(5) a span::before { content: "🎯  "; }
        </style>
        """,
        unsafe_allow_html=True,
    )


def hero(title: str, subtitle: str, pills: list[str] | None = None):
    pills_html = "".join(f'<span class="ms-pill">{p}</span>' for p in (pills or []))
    st.markdown(
        f"""
        <div class="ms-hero">
            <h1>{title}</h1>
            <p>{subtitle}</p>
            <div style="margin-top:12px;">{pills_html}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )
