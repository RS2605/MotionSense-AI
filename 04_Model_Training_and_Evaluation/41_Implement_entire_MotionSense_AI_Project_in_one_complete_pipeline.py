# %% [markdown]
# # 41 — Complete MotionSense-AI ML Project with Better Accuracy
# 
# ## Goal
# Run the entire machine learning workflow from raw data cleaning to final model evaluation.
# 
# ## Research Question
# Can smartphone sensor data predict human activity using a complete machine learning pipeline?
# 
# ## MotionSense-AI Pipeline
# 
# ```text
# Raw Data → Clean Data → Features → Machine Learning → Prediction
# ```
# 
# This notebook completes the **entire pipeline in one place**.
# %% [markdown]
# ## Complete project workflow
# 
# This final notebook combines the Session 2 cleaning steps and the Session 4 machine learning steps.
# 
# ```text
# Load Raw Data
# → Inspect Target
# → Clean Missing Values
# → Remove Duplicates
# → Engineer Features
# → Save Processed Data
# → Select Features
# → Split Data
# → Train Model
# → Predict
# → Evaluate
# → Save Model
# ```
# %%
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, ConfusionMatrixDisplay

# All notebooks use the same shared data folder.
DATA_DIR = Path("../data")
RAW_PATH = DATA_DIR / "raw" / "motionsense_raw_better_accuracy.csv"
PROCESSED_DIR = DATA_DIR / "processed"

CLEAN_PATH = PROCESSED_DIR / "motionsense_clean.csv"
ML_READY_PATH = PROCESSED_DIR / "motionsense_ml_ready.csv"
FINAL_MODEL_PATH = PROCESSED_DIR / "motionsense_final_model.joblib"

pd.set_option("display.max_columns", 20)
pd.set_option("display.width", 120)
# %% [markdown]
# ## Part 1 — Load and inspect the raw data
# 
# We begin with the raw smartphone sensor dataset.
# %%
# 1. Load raw data.
df = pd.read_csv(RAW_PATH)

print("Raw dataset shape:", df.shape)
df.head()
# %%
# 2. Inspect the target column.
print(df["activity"].value_counts())
# %% [markdown]
# ## Part 2 — Clean the raw data
# 
# The cleaning logic follows the Session 2 mini data-wrangling project:
# 
# - create a safe working copy,
# - standardize activity text,
# - convert sensor columns to numeric values,
# - fill missing sensor values with column means,
# - remove duplicate rows.
# %%
# 3. Create a clean working copy.
clean_df = df.copy()

# Standardize text in the activity column.
clean_df["activity"] = clean_df["activity"].str.strip()

# Fill missing sensor values with each column mean.
sensor_columns = ["acc_x", "acc_y", "acc_z", "gyro_x", "gyro_y", "gyro_z"]

for column in sensor_columns:
    clean_df[column] = pd.to_numeric(clean_df[column], errors="coerce")
    clean_df[column] = clean_df[column].fillna(clean_df[column].mean())

# Remove duplicate rows and reset row numbers.
clean_df = clean_df.drop_duplicates().reset_index(drop=True)

print("Clean dataset shape:", clean_df.shape)
print("Missing values remaining:", clean_df[sensor_columns].isna().sum().sum())
clean_df.head()
# %% [markdown]
# ## Part 3 — Feature engineering
# 
# Magnitude combines movement across the three sensor axes into one useful value.
# 
# ```text
# magnitude = square root of (x² + y² + z²)
# ```
# %%
# 4. Create magnitude features.
clean_df["acc_magnitude"] = np.sqrt(
    clean_df["acc_x"]**2
    + clean_df["acc_y"]**2
    + clean_df["acc_z"]**2
)

clean_df["gyro_magnitude"] = np.sqrt(
    clean_df["gyro_x"]**2
    + clean_df["gyro_y"]**2
    + clean_df["gyro_z"]**2
)

clean_df[["activity", "acc_magnitude", "gyro_magnitude"]].head()
# %%
# 5. Create an ML-ready copy with an activity code.
ml_ready_df = clean_df.copy()

activity_map = {
    activity: code
    for code, activity in enumerate(sorted(ml_ready_df["activity"].unique()))
}

ml_ready_df["activity_code"] = ml_ready_df["activity"].map(activity_map)

print(activity_map)
ml_ready_df.head()
# %%
# 6. Export clean and ML-ready datasets.
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

clean_df.to_csv(CLEAN_PATH, index=False)
ml_ready_df.to_csv(ML_READY_PATH, index=False)

print("Saved clean dataset to:", CLEAN_PATH)
print("Saved ML-ready dataset to:", ML_READY_PATH)
# %% [markdown]
# ## Part 4 — Build the machine learning model
# 
# Now the processed data is ready for the complete Session 4 workflow.
# %%
# 7. Select the feature set.
feature_columns = [
    "acc_x", "acc_y", "acc_z",
    "gyro_x", "gyro_y", "gyro_z",
    "acc_magnitude", "gyro_magnitude"
]

X = ml_ready_df[feature_columns]
y = ml_ready_df["activity"]

print("Feature matrix shape:", X.shape)
print("Target shape:", y.shape)
# %%
# 8. Split the data.
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("Training rows:", len(X_train))
print("Testing rows:", len(X_test))
# %%
# 9. Train the model.
model = RandomForestClassifier(
    n_estimators=50,
    random_state=42
)

model.fit(X_train, y_train)

print("Model training complete.")
# %%
# 10. Make predictions.
predictions = model.predict(X_test)

# 11. Evaluate accuracy.
accuracy = accuracy_score(y_test, predictions)
print(f"Final accuracy: {accuracy:.2%}")
# %%
# Show detailed performance by activity.
print(classification_report(y_test, predictions))
# %%
# Visualize prediction mistakes.
ConfusionMatrixDisplay.from_predictions(
    y_test,
    predictions,
    xticks_rotation=45
)

plt.title("Final MotionSense-AI Confusion Matrix")
plt.tight_layout()
plt.show()
# %%
# 12. Show feature importance.
feature_importance = pd.Series(
    model.feature_importances_,
    index=feature_columns
).sort_values(ascending=False)

print(feature_importance)

feature_importance.sort_values().plot(kind="barh")
plt.title("MotionSense-AI Feature Importance")
plt.xlabel("Importance")
plt.tight_layout()
plt.show()
# %%
# 13. Save the final model.
joblib.dump(model, FINAL_MODEL_PATH)

print("Final model saved to:", FINAL_MODEL_PATH)
print("Clean data saved to:", CLEAN_PATH)
print("ML-ready data saved to:", ML_READY_PATH)
# %% [markdown]
# ## Final research conclusion
# 
# The notebook begins with raw smartphone sensor measurements, cleans the data, creates engineered motion features, trains a Random Forest model, evaluates its predictions, and saves all final outputs.
# 
# This completes the full MotionSense-AI pipeline:
# 
# ```text
# Raw Data → Clean Data → Engineered Features → Trained Model → Predictions
# ```
# %% [markdown]
# ## Quick Check
# 
# Before moving on, confirm that you can explain:
# 
# 1. Why missing sensor values must be handled.
# 2. Why duplicate rows are removed.
# 3. What accelerometer and gyroscope magnitudes represent.
# 4. Why identifier columns are not used as model features.
# 5. Why the dataset is divided into training and testing data.
# 6. What accuracy and the confusion matrix tell us.
# 7. Why the trained model is saved.
# 
# ## Summary
# 
# This notebook combines data cleaning, feature engineering, model training, prediction, evaluation, and model saving into one complete machine learning pipeline.