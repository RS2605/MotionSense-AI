import pandas as pd
import plotly.express as px
import streamlit as st

from utils import (
    ACTIVITY_COLORS,
    inject_css,
    hero,
    load_clean,
    load_ml_ready,
    get_eval_metrics,
)

st.set_page_config(
    page_title="MotionSense-AI Dashboard",
    page_icon="🏃",
    layout="wide",
    initial_sidebar_state="expanded",
)
inject_css()

with st.sidebar:
    st.markdown("## 🏃 MotionSense-AI")
    st.caption("Human Activity Recognition from smartphone sensors")
    st.markdown("---")
    st.markdown(
        "Use the pages above to explore the raw data, dig into the EDA, "
        "inspect model performance, or try a live prediction."
    )
    st.markdown("---")
    st.caption("Built on a Random Forest classifier trained on accelerometer "
                "+ gyroscope readings.")

hero(
    "MotionSense-AI",
    "Predicting human activity from smartphone accelerometer &amp; gyroscope data.",
    pills=["Random Forest", "6 Activities", "30 Subjects", "2 Devices"],
)

clean_df = load_clean()
metrics = get_eval_metrics()

col1, col2, col3, col4 = st.columns(4)
col1.metric("Total Readings", f"{len(clean_df):,}")
col2.metric("Subjects", clean_df["subject"].nunique())
col3.metric("Activities", clean_df["activity"].nunique())
col4.metric("Test Accuracy", f"{metrics['accuracy']*100:.1f}%")

st.markdown("### The Pipeline")
pipe_cols = st.columns(6)
steps = [
    ("📥", "Raw Data"),
    ("🧹", "Cleaning"),
    ("⚙️", "Feature Eng."),
    ("📊", "EDA"),
    ("🌲", "Random Forest"),
    ("🎯", "Prediction"),
]
for c, (icon, label) in zip(pipe_cols, steps):
    with c:
        st.markdown(
            f"""<div class="ms-card" style="text-align:center;">
                <div style="font-size:1.8rem;">{icon}</div>
                <div style="font-weight:600; margin-top:6px; font-size:0.9rem;">{label}</div>
            </div>""",
            unsafe_allow_html=True,
        )

st.markdown("&nbsp;")

left, right = st.columns([1.2, 1])

with left:
    st.markdown("### Activity Distribution")
    counts = clean_df["activity"].value_counts().reset_index()
    counts.columns = ["activity", "count"]
    fig = px.bar(
        counts,
        x="activity",
        y="count",
        color="activity",
        color_discrete_map=ACTIVITY_COLORS,
        text="count",
    )
    fig.update_layout(
        showlegend=False,
        xaxis_title="",
        yaxis_title="Readings",
        margin=dict(t=10, b=10),
        height=380,
    )
    st.plotly_chart(fig, use_container_width=True)

with right:
    st.markdown("### About this Dataset")
    st.markdown(
        """
        <div class="ms-card">
        Each row is a snapshot of a phone's <b>accelerometer</b> (acc_x/y/z) and
        <b>gyroscope</b> (gyro_x/y/z) readings, labeled with the activity the
        subject was performing at that moment.<br><br>
        <b>Activities:</b> Laying, Sitting, Standing, Walking, Walking Upstairs,
        Walking Downstairs.<br><br>
        Engineered <b>magnitude</b> features combine the 3 axes of each sensor
        into a single overall motion intensity value — one of the strongest
        predictors in the model.
        </div>
        """,
        unsafe_allow_html=True,
    )

st.markdown("&nbsp;")
st.info(
    "👈 Use the sidebar to jump into **Data Explorer**, **EDA**, "
    "**Model Performance**, or **Live Prediction**.",
    icon="✨",
)
