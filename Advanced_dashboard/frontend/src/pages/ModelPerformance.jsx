import React, { useEffect, useState } from "react";
import { BrainCircuit, TrendingUp, Cpu, ShieldCheck, Layers } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from "recharts";
import SensorWaveBackground from "../components/SensorWaveBackground";
import { Card, SectionTitle, Stat, Chip, Skeleton } from "../components/ui";
import { endpoints } from "../lib/api";

const AXIS_STYLE = { fill: "#0c4a6e", fontSize: 11, fontFamily: "JetBrains Mono" };

export default function ModelPerformance() {
  const [info, setInfo]         = useState(null);
  const [metrics, setMetrics]   = useState(null);
  const [featImp, setFeatImp]   = useState([]);

  useEffect(() => {
    endpoints.modelInfo().then(r => setInfo(r.data));
    endpoints.modelMetrics().then(r => setMetrics(r.data));
    endpoints.modelFeatureImp().then(r => setFeatImp(r.data));
  }, []);

  return (
    <>
      <SensorWaveBackground />
      <div className="relative pt-8 stagger">
        <SectionTitle
          eyebrow="04 · Machine Learning"
          title="Model Performance"
          subtitle="A Random Forest Classifier evaluated on a stratified test split. All metrics computed live from the shipped .joblib model."
        />

        {/* Top stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {info ? (
            <>
              <Stat testid="model-accuracy"   label="Accuracy"      value={info.accuracy} unit="%" icon={TrendingUp}  accent="#22c55e" />
              <Stat testid="model-estimators" label="Estimators"    value={info.n_estimators}      icon={Layers}     accent="#0284c7" />
              <Stat testid="model-features"   label="Features Used" value={info.n_features}        icon={Cpu}        accent="#8b5cf6" />
              <Stat testid="model-classes"    label="Activity Classes" value={info.classes.length} icon={ShieldCheck} accent="#f59e0b" />
            </>
          ) : Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
          {/* Model info card */}
          <Card dataTestId="model-info-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-sky-500 to-violet-500 text-white shadow-lg">
                <BrainCircuit size={22} />
              </div>
              <div>
                <div className="text-eyebrow">Algorithm</div>
                <h3 className="font-display font-bold text-lg text-sky-ink">Random Forest</h3>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <InfoRow label="Training rows" value={info?.training_rows?.toLocaleString() ?? "—"} />
              <InfoRow label="Testing rows"  value={info?.testing_rows?.toLocaleString() ?? "—"} />
              <InfoRow label="Total dataset" value={info?.total_rows?.toLocaleString() ?? "—"} />
              <InfoRow label="Weighted F1"   value={metrics ? `${metrics.weighted_avg.f1_score}%` : "—"} />
              <InfoRow label="Macro F1"      value={metrics ? `${metrics.macro_avg.f1_score}%` : "—"} />
            </div>
            <div className="mt-4">
              <div className="text-eyebrow mb-2">Classes</div>
              <div className="flex flex-wrap gap-1.5">
                {(info?.classes ?? []).map((c, i) => (
                  <Chip key={c} color={metrics?.per_class?.[i]?.color ?? "#0284c7"}>
                    {metrics?.per_class?.[i]?.emoji} {c}
                  </Chip>
                ))}
              </div>
            </div>
          </Card>

          {/* Feature importance */}
          <Card className="lg:col-span-2" dataTestId="feature-importance-card">
            <div className="text-eyebrow">Signal Quality</div>
            <h3 className="font-display font-bold text-xl text-sky-ink">Feature Importance</h3>
            <div style={{ width: "100%", height: 320 }} className="mt-3">
              {featImp.length === 0 ? <Skeleton className="w-full h-full" /> : (
                <ResponsiveContainer>
                  <BarChart data={featImp} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(2,132,199,0.15)" strokeDasharray="3 3" />
                    <XAxis type="number" tick={AXIS_STYLE} unit="%" />
                    <YAxis type="category" dataKey="feature" tick={{ ...AXIS_STYLE, fontSize: 12 }} width={110} />
                    <Tooltip
                      formatter={(v) => `${v.toFixed(2)}%`}
                      contentStyle={{ background: "rgba(255,255,255,0.9)", border: "1px solid #bae6fd", borderRadius: 12 }}
                    />
                    <Bar dataKey="importance" radius={[0, 10, 10, 0]}>
                      {featImp.map((_, i) => (
                        <Cell key={i} fill={`hsl(${200 + i * 22} 85% 55%)`} />
                      ))}
                      <LabelList dataKey="importance" position="right" formatter={(v) => `${v.toFixed(1)}%`} fill="#0c4a6e" fontSize={11} fontFamily="JetBrains Mono" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        {/* Per-class metrics table */}
        <Card className="mt-5" dataTestId="per-class-metrics">
          <div className="text-eyebrow">Classification Report</div>
          <h3 className="font-display font-bold text-xl text-sky-ink mb-4">Per-Class Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-white/60">
                  <th className="py-2.5 px-3 text-eyebrow">Activity</th>
                  <th className="py-2.5 px-3 text-eyebrow text-right">Precision</th>
                  <th className="py-2.5 px-3 text-eyebrow text-right">Recall</th>
                  <th className="py-2.5 px-3 text-eyebrow text-right">F1 Score</th>
                  <th className="py-2.5 px-3 text-eyebrow text-right">Support</th>
                </tr>
              </thead>
              <tbody>
                {(metrics?.per_class ?? []).map((r) => (
                  <tr key={r.activity} className="border-b border-white/40 hover:bg-white/30 transition" data-testid={`row-${r.activity.replace(/ /g,'-')}`}>
                    <td className="py-3 px-3">
                      <Chip color={r.color}>{r.emoji} {r.activity}</Chip>
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      <MetricBar value={r.precision} color={r.color} />
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      <MetricBar value={r.recall} color={r.color} />
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      <MetricBar value={r.f1_score} color={r.color} />
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-sky-deep">{r.support}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Confusion matrix */}
        <Card className="mt-5" dataTestId="confusion-matrix-card">
          <div className="text-eyebrow">Prediction Errors</div>
          <h3 className="font-display font-bold text-xl text-sky-ink">Confusion Matrix</h3>
          {metrics && <ConfusionMatrix cm={metrics.confusion_matrix} />}
          <p className="text-xs text-sky-deep/70 mt-3">
            Rows = true activity · Columns = predicted activity. Diagonal cells show correct predictions.
          </p>
        </Card>
      </div>
    </>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between border-b border-white/40 py-1.5">
      <span className="text-sky-deep/80">{label}</span>
      <span className="font-mono font-semibold text-sky-ink">{value}</span>
    </div>
  );
}

function MetricBar({ value, color }) {
  return (
    <div className="flex items-center gap-2 justify-end">
      <div className="w-24 h-2 rounded-full bg-white/60 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-sky-ink w-14 text-right">{value.toFixed(1)}%</span>
    </div>
  );
}

function ConfusionMatrix({ cm }) {
  const { labels, matrix } = cm;
  const max = Math.max(...matrix.flat());
  const cell = (v) => {
    const alpha = max > 0 ? v / max : 0;
    return `rgba(14, 165, 233, ${0.08 + alpha * 0.85})`;
  };
  return (
    <div className="overflow-x-auto mt-3">
      <table className="text-xs border-separate" style={{ borderSpacing: 3 }}>
        <thead>
          <tr>
            <th></th>
            {labels.map(l => (
              <th key={l} className="p-2 font-mono text-[10px] uppercase text-sky-deep">
                {l}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={labels[i]}>
              <th className="p-2 font-mono text-[10px] uppercase text-sky-deep text-right whitespace-nowrap">
                {labels[i]}
              </th>
              {row.map((v, j) => (
                <td
                  key={j}
                  className="w-16 h-14 text-center rounded-lg font-mono transition hover:scale-105"
                  style={{
                    background: cell(v),
                    color: v > max * 0.5 ? "white" : "#0c4a6e",
                    fontWeight: i === j ? 700 : 500,
                    border: i === j ? "2px solid rgba(255,255,255,0.7)" : "1px solid rgba(255,255,255,0.4)",
                  }}
                >
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
