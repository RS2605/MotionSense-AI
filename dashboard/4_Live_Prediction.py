import numpy as np
import pandas as pd
import plotly.express as px
import streamlit as st

from utils import (
    ACTIVITY_COLORS,
    ACTIVITY_ICONS,
    FEATURE_COLUMNS,
    inject_css,
    hero,
    load_ml_ready,
    predict_activity,
)

st.set_page_config(page_title="Live Prediction · MotionSense-AI", page_icon="🎯", layout="wide")
inject_css()
hero("🎯 Live Prediction", "Feed sensor values into the trained model and see the predicted activity.")

mode = st.radio(
    "Choose input method:",
    ["🎚️ Manual sliders", "🎲 Sample a real reading", "📁 Upload CSV"],
    horizontal=True,
)

df = load_ml_ready()


def render_result(pred, proba_series, acc_mag, gyro_mag):
    icon = ACTIVITY_ICONS.get(pred, "🏃")
    color = ACTIVITY_COLORS.get(pred, "#6C5CE7")

    st.markdown(
        f"""
        <div style="background:{color}22; border:2px solid {color};
                    border-radius:16px; padding:22px; text-align:center;">
            <div style="font-size:2.6rem;">{icon}</div>
            <div style="font-size:1.5rem; font-weight:800; color:{color};">{pred}</div>
            <div style="opacity:0.75;">Predicted confidence: {proba_series.iloc[0]*100:.1f}%</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.markdown("&nbsp;")
    c1, c2 = st.columns([1, 1])
    with c1:
        st.metric("Accelerometer magnitude", f"{acc_mag:.2f}")
    with c2:
        st.metric("Gyroscope magnitude", f"{gyro_mag:.2f}")

    st.markdown("**Prediction confidence by activity**")
    proba_df = proba_series.reset_index()
    proba_df.columns = ["activity", "probability"]
    fig = px.bar(
        proba_df, x="activity", y="probability", color="activity",
        color_discrete_map=ACTIVITY_COLORS, text_auto=".1%",
    )
    fig.update_layout(showlegend=False, yaxis_tickformat=".0%", height=350, margin=dict(t=20, b=10))
    st.plotly_chart(fig, use_container_width=True)


if mode == "🎚️ Manual sliders":
    st.markdown("### Set raw sensor readings")
    c1, c2, c3 = st.columns(3)
    with c1:
        acc_x = st.slider("acc_x", -20.0, 20.0, 0.0, 0.1)
        gyro_x = st.slider("gyro_x", -5.0, 5.0, 0.0, 0.05)
    with c2:
        acc_y = st.slider("acc_y", -20.0, 20.0, 0.0, 0.1)
        gyro_y = st.slider("gyro_y", -5.0, 5.0, 0.0, 0.05)
    with c3:
        acc_z = st.slider("acc_z", -20.0, 20.0, 9.8, 0.1)
        gyro_z = st.slider("gyro_z", -5.0, 5.0, 0.0, 0.05)

    if st.button("🔮 Predict Activity", type="primary"):
        pred, proba, acc_mag, gyro_mag = predict_activity(
            {"acc_x": acc_x, "acc_y": acc_y, "acc_z": acc_z,
             "gyro_x": gyro_x, "gyro_y": gyro_y, "gyro_z": gyro_z}
        )
        render_result(pred, proba, acc_mag, gyro_mag)

elif mode == "🎲 Sample a real reading":
    st.markdown("### Pull a random real reading from the dataset")
    if st.button("🎲 Sample a random row", type="primary"):
        row = df.sample(1).iloc[0]
        st.session_state["sampled_row"] = row

    if "sampled_row" in st.session_state:
        row = st.session_state["sampled_row"]
        st.write(f"**Actual activity (ground truth):** {row['activity']}")
        st.dataframe(row[FEATURE_COLUMNS].to_frame().T, use_container_width=True)

        pred, proba, acc_mag, gyro_mag = predict_activity(
            {k: float(row[k]) for k in ["acc_x", "acc_y", "acc_z", "gyro_x", "gyro_y", "gyro_z"]}
        )
        render_result(pred, proba, acc_mag, gyro_mag)

        if pred == row["activity"]:
            st.success("✅ Model prediction matches the ground truth!")
        else:
            st.warning(f"⚠️ Model predicted **{pred}**, ground truth was **{row['activity']}**.")

else:
    st.markdown("### Upload a CSV with sensor columns")
    st.caption("Required columns: acc_x, acc_y, acc_z, gyro_x, gyro_y, gyro_z")
    uploaded = st.file_uploader("Upload CSV", type=["csv"])

    if uploaded is not None:
        up_df = pd.read_csv(uploaded)
        required = ["acc_x", "acc_y", "acc_z", "gyro_x", "gyro_y", "gyro_z"]
        missing = [c for c in required if c not in up_df.columns]

        if missing:
            st.error(f"Missing required columns: {', '.join(missing)}")
        else:
            from utils import load_model

            model = load_model()
            up_df["acc_magnitude"] = np.sqrt(
                up_df["acc_x"]**2 + up_df["acc_y"]**2 + up_df["acc_z"]**2
            )
            up_df["gyro_magnitude"] = np.sqrt(
                up_df["gyro_x"]**2 + up_df["gyro_y"]**2 + up_df["gyro_z"]**2
            )
            X = up_df[FEATURE_COLUMNS]
            up_df["predicted_activity"] = model.predict(X)

            st.success(f"Predicted activity for {len(up_df)} rows.")
            st.dataframe(up_df, use_container_width=True, height=400)

            counts = up_df["predicted_activity"].value_counts().reset_index()
            counts.columns = ["activity", "count"]
            fig = px.bar(
                counts, x="activity", y="count", color="activity",
                color_discrete_map=ACTIVITY_COLORS,
            )
            fig.update_layout(showlegend=False, height=350, margin=dict(t=20, b=10))
            st.plotly_chart(fig, use_container_width=True)

            st.download_button(
                "⬇️ Download predictions as CSV",
                up_df.to_csv(index=False).encode("utf-8"),
                file_name="motionsense_predictions.csv",
                mime="text/csv",
            )
