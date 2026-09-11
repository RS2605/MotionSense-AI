# MotionSense·AI Dashboard

A premium, cinematic dashboard for the **MotionSense-AI Human Activity Recognition** project.
Built on top of the real trained Random Forest model (99.07% accuracy) and the real
4,320-row smartphone sensor dataset.

The dashboard exists inside a **living blue-sky environment** — drifting clouds, gentle
sunlight and an occasional football arcing across the sky — with premium glassmorphic
cards floating above it.

---

## What's inside

```
motionsense_dashboard_export/
├── backend/                     FastAPI + scikit-learn
│   ├── server.py                All /api routes (security-hardened)
│   ├── requirements.txt
│   ├── .env.example
│   └── ml_assets/
│       ├── motionsense_final_model.joblib   (Random Forest, 50 trees)
│       ├── motionsense_ml_ready.csv         (4,320 rows, ML-ready)
│       └── motionsense_clean.csv
│
└── frontend/                    React 18 + Tailwind + Plotly + Recharts
    ├── package.json / tailwind.config.js / postcss.config.js
    ├── .env.example
    ├── public/
    └── src/
        ├── App.js / index.js / index.css
        ├── lib/api.js
        ├── components/  (TopNav, SkyEnvironment, FootballTrajectory,
        │                SensorWaveBackground, PlotlyChart, MultiSelect, ui)
        └── pages/  (Overview, DataExplorer, EDA,
                      ModelPerformance, LivePrediction)
```

## Security-hardened backend
- CSV upload capped at 5 MB and 10,000 rows (returns HTTP 413 on overflow)
- Generic error messages, no parser stack traces leaked
- `subjects` filter validates integers (HTTP 400 on bad input)
- Security headers: X-Frame-Options=DENY, X-Content-Type-Options=nosniff,
  Referrer-Policy, Permissions-Policy
- CORS: allow_credentials=False, methods=[GET, POST]
- `pandas.str.contains(regex=False)` — ReDoS-safe search
- `python-multipart>=0.0.18` (patched multipart parser)

---

## Requirements

- Python 3.11+
- Node.js 20+ & Yarn 1.22+

---

## Running locally

### 1. Backend
```bash
cd backend
cp .env.example .env
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Sanity check:
```bash
curl http://localhost:8001/api/overview | python3 -m json.tool
```
You should see `"model_accuracy": 99.07` and the real dataset counts.

### 2. Frontend
```bash
cd frontend
cp .env.example .env
yarn install
yarn start
```
Frontend opens at `http://localhost:3000`.
