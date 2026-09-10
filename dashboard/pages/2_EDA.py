import plotly.express as px
import streamlit as st

from utils import ACTIVITY_COLORS, FEATURE_COLUMNS, inject_css, hero, load_ml_ready

st.set_page_config(page_title="EDA · MotionSense-AI", page_icon="📊", layout="wide")
inject_css()
hero("📊 Exploratory Data Analysis", "Understanding how sensor readings vary across activities.")

df = load_ml_ready()

col1, col2 = st.columns(2)

with col1:
    st.markdown("### Class Balance")
    counts = df["activity"].value_counts().reset_index()
    counts.columns = ["activity", "count"]
    fig = px.pie(
        counts, names="activity", values="count", hole=0.5,
        color="activity", color_discrete_map=ACTIVITY_COLORS,
    )
    fig.update_layout(height=380, margin=dict(t=10, b=10))
    st.plotly_chart(fig, use_container_width=True)

with col2:
    st.markdown("### Correlation Heatmap")
    corr = df[FEATURE_COLUMNS].corr()
    fig2 = px.imshow(
        corr, text_auto=".2f", color_continuous_scale="Purples", aspect="auto",
    )
    fig2.update_layout(height=380, margin=dict(t=10, b=10))
    st.plotly_chart(fig2, use_container_width=True)

st.markdown("### Motion Intensity by Activity")
metric_choice = st.radio(
    "Compare using:", ["acc_magnitude", "gyro_magnitude"], horizontal=True
)
fig3 = px.box(
    df, x="activity", y=metric_choice, color="activity",
    color_discrete_map=ACTIVITY_COLORS,
    category_orders={"activity": list(ACTIVITY_COLORS.keys())},
)
fig3.update_layout(showlegend=False, height=420, margin=dict(t=20, b=10))
st.plotly_chart(fig3, use_container_width=True)

st.markdown("### Feature Relationships")
c1, c2 = st.columns(2)
with c1:
    x_axis = st.selectbox("X axis", FEATURE_COLUMNS, index=FEATURE_COLUMNS.index("acc_magnitude"))
with c2:
    y_axis = st.selectbox("Y axis", FEATURE_COLUMNS, index=FEATURE_COLUMNS.index("gyro_magnitude"))

sample = df.sample(min(2000, len(df)), random_state=1)
fig4 = px.scatter(
    sample, x=x_axis, y=y_axis, color="activity",
    color_discrete_map=ACTIVITY_COLORS, opacity=0.6,
)
fig4.update_layout(height=430, margin=dict(t=10, b=10))
st.plotly_chart(fig4, use_container_width=True)

st.markdown("### Histogram")
hist_col = st.selectbox("Feature", FEATURE_COLUMNS, index=FEATURE_COLUMNS.index("acc_magnitude"), key="hist")
fig5 = px.histogram(
    df, x=hist_col, color="activity", color_discrete_map=ACTIVITY_COLORS,
    barmode="overlay", opacity=0.65, nbins=60,
)
fig5.update_layout(height=380, margin=dict(t=10, b=10))
st.plotly_chart(fig5, use_container_width=True)
