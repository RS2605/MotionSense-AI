import plotly.express as px
import streamlit as st

from utils import ACTIVITY_COLORS, inject_css, hero, load_clean

st.set_page_config(page_title="Data Explorer · MotionSense-AI", page_icon="📂", layout="wide")
inject_css()
hero("📂 Data Explorer", "Filter, browse, and plot the sensor readings directly.")

df = load_clean()

st.markdown("### Filters")
f1, f2, f3 = st.columns(3)
with f1:
    activities = st.multiselect(
        "Activity", sorted(df["activity"].unique()), default=list(df["activity"].unique())
    )
with f2:
    subjects = st.multiselect(
        "Subject", sorted(df["subject"].unique()), default=[]
    )
with f3:
    devices = st.multiselect(
        "Device", sorted(df["device"].unique()), default=list(df["device"].unique())
    )

filtered = df[df["activity"].isin(activities) & df["device"].isin(devices)]
if subjects:
    filtered = filtered[filtered["subject"].isin(subjects)]

st.caption(f"Showing **{len(filtered):,}** of {len(df):,} readings")

tab1, tab2 = st.tabs(["📈 Sensor Signal", "🗂️ Raw Table"])

with tab1:
    if filtered.empty:
        st.warning("No rows match the current filters.")
    else:
        one_subject = subjects[0] if subjects else filtered["subject"].iloc[0]
        segment = filtered[filtered["subject"] == one_subject].sort_values("time_step")

        st.markdown(f"**Time-series for subject {one_subject}** (accelerometer & gyroscope magnitude)")
        c1, c2 = st.columns(2)
        with c1:
            fig = px.line(
                segment, x="time_step", y="acc_magnitude", color="activity",
                color_discrete_map=ACTIVITY_COLORS, title="Accelerometer Magnitude",
            )
            fig.update_layout(height=350, margin=dict(t=40, b=10))
            st.plotly_chart(fig, use_container_width=True)
        with c2:
            fig2 = px.line(
                segment, x="time_step", y="gyro_magnitude", color="activity",
                color_discrete_map=ACTIVITY_COLORS, title="Gyroscope Magnitude",
            )
            fig2.update_layout(height=350, margin=dict(t=40, b=10))
            st.plotly_chart(fig2, use_container_width=True)

        st.markdown("**Raw axis signals (acc_x, acc_y, acc_z)**")
        fig3 = px.line(
            segment, x="time_step", y=["acc_x", "acc_y", "acc_z"],
            title="Accelerometer Axes Over Time",
        )
        fig3.update_layout(height=350, margin=dict(t=40, b=10))
        st.plotly_chart(fig3, use_container_width=True)

with tab2:
    st.dataframe(filtered, use_container_width=True, height=500)
    st.download_button(
        "⬇️ Download filtered data as CSV",
        filtered.to_csv(index=False).encode("utf-8"),
        file_name="motionsense_filtered.csv",
        mime="text/csv",
    )
