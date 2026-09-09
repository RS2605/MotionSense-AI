# MotionSense-AI Dashboard

An interactive Streamlit dashboard for the MotionSense-AI human activity
recognition project — built on top of the actual trained Random Forest
model and processed datasets.

## Pages

- **Overview** — key stats, pipeline, activity distribution
- **📂 Data Explorer** — filter by activity/subject/device, view sensor
  time-series, browse and export the raw table
- **📊 EDA** — class balance, correlation heatmap, box plots, scatter plots,
  histograms
- **🌲 Model Performance** — confusion matrix, classification report,
  feature importance (computed live from the saved `.joblib` model)
- **🎯 Live Prediction** — predict activity from manual sensor sliders, a
  randomly sampled real reading, or an uploaded CSV of sensor readings

## Setup

```bash
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
streamlit run app.py
```

This opens the dashboard at `http://localhost:8501`.

## Project structure

```
dashboard/
├── app.py                          # Overview / home page
├── utils.py                        # Shared data + model loading (cached)
├── requirements.txt
├── .streamlit/config.toml          # Theme
├── data/
│   ├── motionsense_raw.csv
│   └── processed/
│       ├── motionsense_clean.csv
│       ├── motionsense_ml_ready.csv
│       └── motionsense_final_model.joblib
└── pages/
    ├── 1_📂_Data_Explorer.py
    ├── 2_📊_EDA.py
    ├── 3_🌲_Model_Performance.py
    └── 4_🎯_Live_Prediction.py
```

## Notes

- Model evaluation on the **Model Performance** page recreates the same
  80/20 stratified split (`random_state=42`) used when the shipped model
  was trained, so the confusion matrix and report reflect genuinely
  held-out data.
- If you retrain the model, just drop the new `motionsense_final_model.joblib`
  and `motionsense_ml_ready.csv` into `data/processed/` — no code changes
  needed.
