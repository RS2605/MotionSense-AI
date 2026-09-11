"""
MotionSense-AI FastAPI Backend
Serves the trained Random Forest model + real dataset from the original repository.
"""
import os
import io
import json
from pathlib import Path
from typing import Optional, List, Dict, Any

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix
)

# ---------------------------------------------------------------------------
# Paths & assets
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).parent
ASSETS_DIR = BASE_DIR / "ml_assets"
MODEL_PATH = ASSETS_DIR / "motionsense_final_model.joblib"
DATA_PATH = ASSETS_DIR / "motionsense_ml_ready.csv"

FEATURE_COLUMNS = [
    "acc_x", "acc_y", "acc_z",
    "gyro_x", "gyro_y", "gyro_z",
    "acc_magnitude", "gyro_magnitude",
]

# Activity emoji/label mapping for the UI (colors match the reference dashboard)
ACTIVITY_META = {
    "Laying":              {"emoji": "🛌", "color": "#6C5CE7"},
    "Sitting":             {"emoji": "🪑", "color": "#00B894"},
    "Standing":            {"emoji": "🧍", "color": "#0984E3"},
    "Walking":             {"emoji": "🚶", "color": "#FDCB6E"},
    "Walking Downstairs":  {"emoji": "⬇️", "color": "#E17055"},
    "Walking Upstairs":    {"emoji": "⬆️", "color": "#D63031"},
}

# ---------------------------------------------------------------------------
# Load model + dataset ONCE at startup
# ---------------------------------------------------------------------------
model = joblib.load(MODEL_PATH)
df_full = pd.read_csv(DATA_PATH)

# Recompute realistic metrics on a stratified test split (matches original notebook)
X = df_full[FEATURE_COLUMNS]
y = df_full["activity"]
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)
_predictions = model.predict(X_test)
_ACCURACY = float(accuracy_score(y_test, _predictions))
_CLASSIFICATION_REPORT = classification_report(
    y_test, _predictions, output_dict=True, zero_division=0
)
_LABELS = sorted(list(model.classes_))
_CM = confusion_matrix(y_test, _predictions, labels=_LABELS).tolist()
_FEATURE_IMPORTANCE = {
    feat: float(imp)
    for feat, imp in zip(FEATURE_COLUMNS, model.feature_importances_)
}

# Ranges for slider UI, computed from real data
_SENSOR_RANGES = {
    col: {
        "min": float(df_full[col].min()),
        "max": float(df_full[col].max()),
        "mean": float(df_full[col].mean()),
        "std": float(df_full[col].std()),
    }
    for col in FEATURE_COLUMNS
}

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(title="MotionSense-AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Security headers middleware (clickjacking / MIME sniffing / referrer)
# ---------------------------------------------------------------------------
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault(
            "Permissions-Policy",
            "geolocation=(), microphone=(), camera=(), payment=()",
        )
        return response

app.add_middleware(SecurityHeadersMiddleware)


# Security limits
MAX_CSV_BYTES = 5 * 1024 * 1024   # 5 MB upload cap
MAX_CSV_ROWS  = 10_000            # row cap after parse


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class SensorReading(BaseModel):
    acc_x: float
    acc_y: float
    acc_z: float
    gyro_x: float
    gyro_y: float
    gyro_z: float
    acc_magnitude: Optional[float] = None
    gyro_magnitude: Optional[float] = None


class PredictionResponse(BaseModel):
    predicted_activity: str
    confidence: float
    probabilities: Dict[str, float]
    emoji: str
    color: str
    features_used: Dict[str, float]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _fill_magnitudes(r: dict) -> dict:
    if r.get("acc_magnitude") in (None, 0) or r.get("acc_magnitude") is None:
        r["acc_magnitude"] = float(np.sqrt(r["acc_x"]**2 + r["acc_y"]**2 + r["acc_z"]**2))
    if r.get("gyro_magnitude") in (None, 0) or r.get("gyro_magnitude") is None:
        r["gyro_magnitude"] = float(np.sqrt(r["gyro_x"]**2 + r["gyro_y"]**2 + r["gyro_z"]**2))
    return r


def _predict_single(row: dict) -> dict:
    row = _fill_magnitudes(row)
    X_row = pd.DataFrame([[row[c] for c in FEATURE_COLUMNS]], columns=FEATURE_COLUMNS)
    probs = model.predict_proba(X_row)[0]
    idx = int(np.argmax(probs))
    label = str(model.classes_[idx])
    meta = ACTIVITY_META.get(label, {"emoji": "🎯", "color": "#0ea5e9"})
    return {
        "predicted_activity": label,
        "confidence": float(probs[idx]),
        "probabilities": {
            str(cls): float(p) for cls, p in zip(model.classes_, probs)
        },
        "emoji": meta["emoji"],
        "color": meta["color"],
        "features_used": {c: float(row[c]) for c in FEATURE_COLUMNS},
    }


# ---------------------------------------------------------------------------
# Routes - all prefixed with /api
# ---------------------------------------------------------------------------
@app.get("/api/")
def root():
    return {"message": "MotionSense-AI API", "status": "online"}


@app.get("/api/overview")
def overview():
    """Key project metrics for the Home page."""
    return {
        "total_readings": int(len(df_full)),
        "n_subjects": int(df_full["subject"].nunique()),
        "n_activities": int(df_full["activity"].nunique()),
        "n_devices": int(df_full["device"].nunique()),
        "activities": sorted(df_full["activity"].unique().tolist()),
        "devices": sorted(df_full["device"].unique().tolist()),
        "model_name": "Random Forest Classifier",
        "n_estimators": int(model.n_estimators),
        "model_accuracy": round(_ACCURACY * 100, 2),
        "n_features": len(FEATURE_COLUMNS),
        "feature_columns": FEATURE_COLUMNS,
        "pipeline": [
            {"icon": "smartphone", "label": "Sensor Data"},
            {"icon": "sparkles",   "label": "Processing"},
            {"icon": "cog",        "label": "Feature Engineering"},
            {"icon": "bar-chart",  "label": "Analysis"},
            {"icon": "brain",      "label": "ML Model"},
            {"icon": "target",     "label": "Prediction"},
        ],
    }


@app.get("/api/data/schema")
def data_schema():
    return {
        "columns": [
            {"name": c, "dtype": str(df_full[c].dtype)}
            for c in df_full.columns
        ],
        "activity_labels": [
            {"label": a, **ACTIVITY_META.get(a, {"emoji": "🎯", "color": "#0ea5e9"})}
            for a in sorted(df_full["activity"].unique().tolist())
        ],
        "devices": sorted(df_full["device"].unique().tolist()),
        "subjects": sorted(df_full["subject"].unique().tolist()),
        "sensor_ranges": _SENSOR_RANGES,
    }


@app.get("/api/data/rows")
def data_rows(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    activity: Optional[str] = None,
    activities: Optional[str] = Query(None, description="Comma-separated activities filter"),
    device: Optional[str] = None,
    devices: Optional[str] = Query(None, description="Comma-separated devices filter"),
    subject: Optional[int] = None,
    subjects: Optional[str] = Query(None, description="Comma-separated subjects filter"),
    search: Optional[str] = None,
):
    d = df_full.copy()
    if activities:
        acts = [a.strip() for a in activities.split(",") if a.strip()]
        if acts:
            d = d[d["activity"].isin(acts)]
    elif activity:
        d = d[d["activity"] == activity]
    if devices:
        devs = [x.strip() for x in devices.split(",") if x.strip()]
        if devs:
            d = d[d["device"].isin(devs)]
    elif device:
        d = d[d["device"] == device]
    if subjects:
        try:
            subs = [int(s.strip()) for s in subjects.split(",") if s.strip()]
        except ValueError:
            raise HTTPException(400, "subjects must be a comma-separated list of integers")
        if subs:
            d = d[d["subject"].isin(subs)]
    elif subject is not None:
        d = d[d["subject"] == subject]
    if search:
        s = search.lower()
        d = d[
            d["activity"].str.lower().str.contains(s, na=False, regex=False)
            | d["device"].str.lower().str.contains(s, na=False, regex=False)
        ]
    total = int(len(d))
    start = (page - 1) * page_size
    rows = d.iloc[start:start + page_size].to_dict(orient="records")
    for r in rows:
        for k, v in list(r.items()):
            if isinstance(v, (np.integer,)):
                r[k] = int(v)
            elif isinstance(v, (np.floating,)):
                r[k] = float(v)
    return {"total": total, "page": page, "page_size": page_size, "rows": rows}


# ------------------------- EDA endpoints -------------------------
@app.get("/api/eda/activity-distribution")
def eda_activity_distribution():
    counts = df_full["activity"].value_counts().sort_index()
    return [
        {
            "activity": act,
            "count": int(cnt),
            "emoji": ACTIVITY_META.get(act, {}).get("emoji", "🎯"),
            "color": ACTIVITY_META.get(act, {}).get("color", "#0ea5e9"),
        }
        for act, cnt in counts.items()
    ]


@app.get("/api/eda/subject-distribution")
def eda_subject_distribution():
    counts = df_full["subject"].value_counts().sort_index()
    return [{"subject": int(s), "count": int(c)} for s, c in counts.items()]


@app.get("/api/eda/device-distribution")
def eda_device_distribution():
    counts = df_full["device"].value_counts()
    return [{"device": str(d), "count": int(c)} for d, c in counts.items()]


@app.get("/api/eda/average-motion")
def eda_average_motion():
    """Average acc_magnitude and gyro_magnitude per activity."""
    agg = df_full.groupby("activity")[["acc_magnitude", "gyro_magnitude"]].mean()
    agg = agg.round(4).reset_index()
    return [
        {
            "activity": r["activity"],
            "acc_magnitude": float(r["acc_magnitude"]),
            "gyro_magnitude": float(r["gyro_magnitude"]),
            "color": ACTIVITY_META.get(r["activity"], {}).get("color", "#0ea5e9"),
        }
        for _, r in agg.iterrows()
    ]


@app.get("/api/eda/correlation")
def eda_correlation():
    corr = df_full[FEATURE_COLUMNS].corr().round(3)
    return {
        "features": FEATURE_COLUMNS,
        "matrix": corr.values.tolist(),
    }


@app.get("/api/eda/sensor-signal")
def eda_sensor_signal(
    activity: str = Query("Walking"),
    subject: int = Query(1),
    limit: int = Query(150, ge=10, le=500),
):
    d = df_full[(df_full["activity"] == activity) & (df_full["subject"] == subject)]
    d = d.sort_values("time_step").head(limit)
    if len(d) == 0:
        # fallback to first available subject for that activity
        d = df_full[df_full["activity"] == activity].sort_values(["subject", "time_step"]).head(limit)
    return [
        {
            "t": int(row["time_step"]),
            "acc_x": float(row["acc_x"]),
            "acc_y": float(row["acc_y"]),
            "acc_z": float(row["acc_z"]),
            "gyro_x": float(row["gyro_x"]),
            "gyro_y": float(row["gyro_y"]),
            "gyro_z": float(row["gyro_z"]),
        }
        for _, row in d.iterrows()
    ]


@app.get("/api/eda/scatter")
def eda_scatter(
    x: str = Query("acc_magnitude"),
    y: str = Query("gyro_magnitude"),
    sample: int = Query(600, ge=50, le=4000),
):
    if x not in FEATURE_COLUMNS or y not in FEATURE_COLUMNS:
        raise HTTPException(status_code=400, detail="Invalid feature name")
    d = df_full.sample(n=min(sample, len(df_full)), random_state=42)
    return [
        {
            "x": float(row[x]),
            "y": float(row[y]),
            "activity": row["activity"],
            "color": ACTIVITY_META.get(row["activity"], {}).get("color", "#0ea5e9"),
        }
        for _, row in d.iterrows()
    ]


@app.get("/api/eda/time-series")
def eda_time_series(
    subject: Optional[int] = None,
    activities: Optional[str] = Query(None, description="Comma-separated activities filter"),
    devices: Optional[str] = Query(None, description="Comma-separated devices filter"),
):
    """Time-series (acc_x/y/z + magnitudes) for a single subject across all activities.
    Optionally filter by activities and devices — matches the Data Explorer filter pane."""
    d = df_full.copy()
    activity_list = [a.strip() for a in activities.split(",")] if activities else None
    device_list = [d.strip() for d in devices.split(",")] if devices else None
    if activity_list:
        d = d[d["activity"].isin(activity_list)]
    if device_list:
        d = d[d["device"].isin(device_list)]

    if subject is None or subject not in d["subject"].unique().tolist():
        # Fallback: pick first available subject
        available = sorted(d["subject"].unique().tolist()) if len(d) else []
        if not available:
            return {"subject": None, "rows": [], "available_subjects": []}
        subject = int(available[0])

    d = d[d["subject"] == subject].sort_values("time_step")
    return {
        "subject": int(subject),
        "available_subjects": sorted(df_full[
            (df_full["activity"].isin(activity_list) if activity_list else pd.Series([True]*len(df_full), index=df_full.index)) &
            (df_full["device"].isin(device_list) if device_list else pd.Series([True]*len(df_full), index=df_full.index))
        ]["subject"].unique().tolist()),
        "rows": [
            {
                "t": int(row["time_step"]),
                "activity": row["activity"],
                "color": ACTIVITY_META.get(row["activity"], {}).get("color", "#0ea5e9"),
                "acc_x": float(row["acc_x"]),
                "acc_y": float(row["acc_y"]),
                "acc_z": float(row["acc_z"]),
                "gyro_x": float(row["gyro_x"]),
                "gyro_y": float(row["gyro_y"]),
                "gyro_z": float(row["gyro_z"]),
                "acc_magnitude": float(row["acc_magnitude"]),
                "gyro_magnitude": float(row["gyro_magnitude"]),
            }
            for _, row in d.iterrows()
        ],
    }


@app.get("/api/eda/box-plot")
def eda_box_plot(metric: str = Query("acc_magnitude")):
    """Return box-plot stats (min, q1, median, q3, max, outliers) per activity."""
    if metric not in FEATURE_COLUMNS:
        raise HTTPException(400, "Invalid metric")
    out = []
    for act, group in df_full.groupby("activity"):
        vals = group[metric].values
        q1 = float(np.percentile(vals, 25))
        q3 = float(np.percentile(vals, 75))
        iqr = q3 - q1
        lower_fence = q1 - 1.5 * iqr
        upper_fence = q3 + 1.5 * iqr
        non_out = vals[(vals >= lower_fence) & (vals <= upper_fence)]
        outliers = vals[(vals < lower_fence) | (vals > upper_fence)]
        out.append({
            "activity": act,
            "min": float(non_out.min()) if len(non_out) else float(vals.min()),
            "q1": q1,
            "median": float(np.median(vals)),
            "q3": q3,
            "max": float(non_out.max()) if len(non_out) else float(vals.max()),
            "outliers": [float(v) for v in outliers[:100]],
            "color": ACTIVITY_META.get(act, {}).get("color", "#0ea5e9"),
        })
    order = ["Laying", "Sitting", "Standing", "Walking", "Walking Downstairs", "Walking Upstairs"]
    out.sort(key=lambda r: order.index(r["activity"]) if r["activity"] in order else 99)
    return out


@app.get("/api/eda/histogram")
def eda_histogram(feature: str = Query("acc_magnitude"), bins: int = Query(40, ge=10, le=100)):
    """Return histogram bins per activity for a feature."""
    if feature not in FEATURE_COLUMNS:
        raise HTTPException(400, "Invalid feature")
    v_all = df_full[feature].values
    edges = np.linspace(v_all.min(), v_all.max(), bins + 1)
    centers = ((edges[:-1] + edges[1:]) / 2).tolist()
    result_bins = [{"bin": float(round(c, 4))} for c in centers]
    for act, group in df_full.groupby("activity"):
        counts, _ = np.histogram(group[feature].values, bins=edges)
        for i, c in enumerate(counts):
            result_bins[i][act] = int(c)
    return {
        "feature": feature,
        "activities": sorted(df_full["activity"].unique().tolist()),
        "bins": result_bins,
    }


# ------------------------- Model endpoints -------------------------
@app.get("/api/model/info")
def model_info():
    return {
        "algorithm": "Random Forest Classifier",
        "n_estimators": int(model.n_estimators),
        "n_features": int(model.n_features_in_),
        "classes": _LABELS,
        "feature_columns": FEATURE_COLUMNS,
        "accuracy": round(_ACCURACY * 100, 2),
        "training_rows": int(len(X_train)),
        "testing_rows": int(len(X_test)),
        "total_rows": int(len(df_full)),
    }


@app.get("/api/model/metrics")
def model_metrics():
    per_class = []
    for label in _LABELS:
        report = _CLASSIFICATION_REPORT.get(label, {})
        per_class.append({
            "activity": label,
            "precision": round(report.get("precision", 0) * 100, 2),
            "recall": round(report.get("recall", 0) * 100, 2),
            "f1_score": round(report.get("f1-score", 0) * 100, 2),
            "support": int(report.get("support", 0)),
            "emoji": ACTIVITY_META.get(label, {}).get("emoji", "🎯"),
            "color": ACTIVITY_META.get(label, {}).get("color", "#0ea5e9"),
        })
    macro = _CLASSIFICATION_REPORT.get("macro avg", {})
    weighted = _CLASSIFICATION_REPORT.get("weighted avg", {})
    return {
        "accuracy": round(_ACCURACY * 100, 2),
        "macro_avg": {
            "precision": round(macro.get("precision", 0) * 100, 2),
            "recall": round(macro.get("recall", 0) * 100, 2),
            "f1_score": round(macro.get("f1-score", 0) * 100, 2),
        },
        "weighted_avg": {
            "precision": round(weighted.get("precision", 0) * 100, 2),
            "recall": round(weighted.get("recall", 0) * 100, 2),
            "f1_score": round(weighted.get("f1-score", 0) * 100, 2),
        },
        "per_class": per_class,
        "confusion_matrix": {"labels": _LABELS, "matrix": _CM},
    }


@app.get("/api/model/feature-importance")
def model_feature_importance():
    ordered = sorted(_FEATURE_IMPORTANCE.items(), key=lambda x: x[1], reverse=True)
    return [
        {"feature": f, "importance": round(v * 100, 3)} for f, v in ordered
    ]


# ------------------------- Prediction endpoints -------------------------
@app.post("/api/predict", response_model=PredictionResponse)
def predict(reading: SensorReading):
    return _predict_single(reading.model_dump())


@app.get("/api/predict/sample")
def predict_sample(activity: Optional[str] = None):
    """Grab a random real reading from the dataset and predict it."""
    d = df_full
    if activity:
        d = d[d["activity"] == activity]
        if len(d) == 0:
            raise HTTPException(404, "No samples for activity")
    row = d.sample(1).iloc[0]
    reading = {c: float(row[c]) for c in FEATURE_COLUMNS}
    prediction = _predict_single(reading)
    prediction["true_activity"] = str(row["activity"])
    prediction["subject"] = int(row["subject"])
    prediction["device"] = str(row["device"])
    prediction["row_id"] = int(row["row_id"])
    prediction["time_step"] = int(row["time_step"])
    prediction["is_correct"] = prediction["predicted_activity"] == prediction["true_activity"]
    prediction["sampled_row"] = {c: float(row[c]) for c in FEATURE_COLUMNS}
    return prediction


@app.post("/api/predict/csv")
async def predict_csv(file: UploadFile = File(...)):
    """Upload CSV of sensor readings and predict activity for each row.
    Preserves all input columns, fills missing sensor values with column mean,
    computes acc_magnitude/gyro_magnitude, and adds predicted_activity + confidence."""
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Only .csv files supported")
    contents = await file.read()
    if len(contents) > MAX_CSV_BYTES:
        raise HTTPException(
            413,
            f"CSV file too large. Max allowed is {MAX_CSV_BYTES // (1024 * 1024)} MB.",
        )
    try:
        d = pd.read_csv(io.BytesIO(contents))
    except Exception:
        # Generic message — no raw parser detail leaked
        raise HTTPException(400, "Invalid CSV file")
    if len(d) > MAX_CSV_ROWS:
        raise HTTPException(
            413,
            f"CSV row count exceeds the limit of {MAX_CSV_ROWS}. Please split the file.",
        )

    required = ["acc_x", "acc_y", "acc_z", "gyro_x", "gyro_y", "gyro_z"]
    missing = [c for c in required if c not in d.columns]
    if missing:
        raise HTTPException(400, f"Missing required columns: {', '.join(missing)}")

    # Coerce sensor cols to numeric and fill NaN with column mean (matches reference cleaning)
    for c in required:
        d[c] = pd.to_numeric(d[c], errors="coerce")
        if d[c].isna().any():
            fill = d[c].mean()
            if pd.isna(fill):
                fill = 0.0
            d[c] = d[c].fillna(fill)

    # Compute magnitudes if missing
    if "acc_magnitude" not in d.columns:
        d["acc_magnitude"] = np.sqrt(d["acc_x"]**2 + d["acc_y"]**2 + d["acc_z"]**2)
    else:
        d["acc_magnitude"] = pd.to_numeric(d["acc_magnitude"], errors="coerce")
        d["acc_magnitude"] = d["acc_magnitude"].fillna(np.sqrt(d["acc_x"]**2 + d["acc_y"]**2 + d["acc_z"]**2))
    if "gyro_magnitude" not in d.columns:
        d["gyro_magnitude"] = np.sqrt(d["gyro_x"]**2 + d["gyro_y"]**2 + d["gyro_z"]**2)
    else:
        d["gyro_magnitude"] = pd.to_numeric(d["gyro_magnitude"], errors="coerce")
        d["gyro_magnitude"] = d["gyro_magnitude"].fillna(np.sqrt(d["gyro_x"]**2 + d["gyro_y"]**2 + d["gyro_z"]**2))

    X_in = d[FEATURE_COLUMNS].astype(float)
    preds = model.predict(X_in)
    probs = model.predict_proba(X_in)

    d["predicted_activity"] = preds
    d["confidence"] = np.max(probs, axis=1)

    # Original column order + magnitudes + predicted_activity + confidence
    display_columns = list(d.columns)
    # Ensure predicted_activity + confidence are last
    for col in ["predicted_activity", "confidence"]:
        if col in display_columns:
            display_columns.remove(col)
    display_columns.extend(["predicted_activity", "confidence"])

    # Build rows: convert NaN/inf to None so JSON is valid
    def _clean(v):
        if isinstance(v, (np.integer,)):
            return int(v)
        if isinstance(v, (np.floating, float)):
            fv = float(v)
            if not np.isfinite(fv):
                return None
            return fv
        return v

    rows = []
    for i, rec in enumerate(d.to_dict(orient="records")):
        clean_rec = {c: _clean(rec.get(c)) for c in display_columns}
        clean_rec["row"] = i
        act = str(clean_rec.get("predicted_activity"))
        meta = ACTIVITY_META.get(act, {"emoji": "🎯", "color": "#0ea5e9"})
        clean_rec["emoji"] = meta["emoji"]
        clean_rec["color"] = meta["color"]
        rows.append(clean_rec)

    # Aggregate distribution
    from collections import Counter
    dist = Counter([r["predicted_activity"] for r in rows])
    distribution = [
        {"activity": str(k), "count": int(v),
         "emoji": ACTIVITY_META.get(str(k), {}).get("emoji", "🎯"),
         "color": ACTIVITY_META.get(str(k), {}).get("color", "#0ea5e9")}
        for k, v in dist.items()
    ]
    return {
        "total_rows": len(rows),
        "columns": display_columns,
        "distribution": distribution,
        "predictions": rows,
    }
