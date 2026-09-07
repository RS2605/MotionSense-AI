# MotionSense-AI Project

This repository is built around a single end-to-end research project:

> **MotionSense-AI** — Predict human activities using smartphone sensor data using Python, NumPy, Pandas, Data Visualization, and Machine Learning.

The repository is traversed as a progressive learning journey where every notebook builds on the previous one, ultimately leading to a complete end-to-end AI research pipeline.

---

# Repository Structure

```text
MotionSense-AI Project
│
├── data/
│   ├── raw/
│   │   └── motionsense_raw.csv
│   │
│   ├── processed/
│   │   ├── motionsense_clean.csv
│   │   ├── motionsense_ml_ready.csv
│   │   └── motionsense_window_features.csv
│   │
│   └── sample/
│       └── motionsense_sample_200.csv
│
├── 01_Data_Analysis/
├── 02_Data_Cleaning_and_Feature_Engineering/
├── 03_EDA_Exploratory_Data_Analysis/
├── 04_Model_Training_and_Evaluation/
│
├── DATA_DICTIONARY.md
├── README.md
└── requirements.txt
```

---

# Project Overview

The Project has been meaningfully divided into 4 sequential parts:

## 01 — Data Analysis: Understanding the Data

**Notebook Numbers:** **01 – 10**

Concepts Implemented:

- NumPy Arrays
- Indexing & Slicing
- Vectorized Calculations
- Reading Data
- DataFrames
- Filtering
- Missing Values
- Feature Engineering
- Mini MotionSense Project

---

## 02 — Data Wrangling & Transformation

**Notebook Numbers:** **11 – 20**

Concepts Implemented:

- Loading Real Datasets
- Understanding the Target Variable
- Selecting Data
- Filtering Rows
- Sorting
- Missing Data
- Cleaning Data
- Removing Duplicates
- Feature Engineering
- Mini Data Wrangling Project

---

## 03 — Statistical Analysis & Visualization 

**Notebook Numbers:** **21 – 30**

Concepts Implemented:

- Exploratory Data Analysis (EDA)
- Descriptive Statistics
- Histograms
- Bar Charts
- Line Charts
- Scatter Plots
- Box Plots
- Correlation
- Heatmaps
- Mini EDA Project

---

## 04 — Data Modeling & Prediction

**Notebook Numbers:** **31 – 42**

Concepts Implemented:

- Machine Learning Fundamentals
- Features vs Target
- Train/Test Split
- Random Forest
- Predictions
- Accuracy
- Confusion Matrix
- Classification Report
- Feature Importance
- Complete Machine Learning Project

---

# MotionSense-AI Pipeline



The complete research workflow is as follows:

```
Raw Data
        ↓
Data Loading
        ↓
Data Cleaning
        ↓
Feature Engineering
        ↓
Exploratory Data Analysis
        ↓
Visualization
        ↓
Machine Learning
        ↓
Model Evaluation
        ↓
Human Activity Prediction
```

---

# Learning Objectives Accomplished


- Work confidently with NumPy arrays
- Analyze datasets using Pandas
- Clean and transform real-world data
- Engineer useful machine learning features
- Perform Exploratory Data Analysis (EDA)
- Create informative visualizations
- Train and evaluate Machine Learning models
- Build an end-to-end Human Activity Recognition (HAR) system

---

# Prerequisites

Install the required Python packages:

```bash
pip install -r requirements.txt
```

---

# Final Outcome

Built a complete **MotionSense-AI Human Activity Recognition system** that follows the same end-to-end workflow as used in real-world data science and machine learning projects.