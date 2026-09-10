import pandas as pd
import plotly.express as px
import streamlit as st

from utils import inject_css, hero, get_eval_metrics, get_feature_importance

st.set_page_config(page_title="Model Performance · MotionSense-AI", page_icon="🌲", layout="wide")
inject_css()
hero("🌲 Model Performance", "How well does the Random Forest classify activity on unseen data?")

metrics = get_eval_metrics()

c1, c2, c3 = st.columns(3)
c1.metric("Overall Accuracy", f"{metrics['accuracy']*100:.2f}%")
c2.metric("Test Samples", f"{metrics['n_test']:,}")
macro_f1 = metrics["report"]["macro avg"]["f1-score"]
c3.metric("Macro F1-score", f"{macro_f1:.3f}")

st.markdown("### Confusion Matrix")
cm = metrics["confusion_matrix"]
labels = metrics["labels"]
fig = px.imshow(
    cm, x=labels, y=labels, text_auto=True,
    color_continuous_scale="Purples",
    labels=dict(x="Predicted", y="Actual", color="Count"),
)
fig.update_layout(height=480, margin=dict(t=20, b=10))
st.plotly_chart(fig, use_container_width=True)

st.markdown("### Classification Report")
report_df = pd.DataFrame(metrics["report"]).T
report_df = report_df.drop(index=["accuracy"], errors="ignore")
st.dataframe(
    report_df.style.format({"precision": "{:.2f}", "recall": "{:.2f}",
                             "f1-score": "{:.2f}", "support": "{:.0f}"}),
    use_container_width=True,
)

st.markdown("### Feature Importance")
importance = get_feature_importance().reset_index()
importance.columns = ["feature", "importance"]
fig2 = px.bar(
    importance.sort_values("importance"),
    x="importance", y="feature", orientation="h",
    color="importance", color_continuous_scale="Purples",
)
fig2.update_layout(height=400, margin=dict(t=10, b=10), coloraxis_showscale=False)
st.plotly_chart(fig2, use_container_width=True)

st.caption(
    "Metrics are computed on a stratified 80/20 held-out test split "
    "(random_state=42), matching how the shipped model was originally evaluated."
)
