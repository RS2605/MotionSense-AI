import React, { useEffect, useMemo, useState } from "react";
import { Target, Zap, Shuffle, Upload, FileText, X, CheckCircle2, AlertCircle, Download } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, LabelList, Cell
} from "recharts";
import SensorWaveBackground from "../components/SensorWaveBackground";
import { Card, SectionTitle, Chip, Skeleton, Stat } from "../components/ui";
import { endpoints } from "../lib/api";

const FEATURES_INPUT = ["acc_x","acc_y","acc_z","gyro_x","gyro_y","gyro_z"];
const ALL_FEATURES  = [...FEATURES_INPUT, "acc_magnitude", "gyro_magnitude"];
const AXIS_STYLE = { fill: "#0c4a6e", fontSize: 11, fontFamily: "JetBrains Mono" };
const GRID = "rgba(2, 132, 199, 0.15)";

// Fallback color mapping used for the ground-truth "activity" column in CSV results
const ACTIVITY_META_FALLBACK = {
  "Laying":              { color: "#6C5CE7" },
  "Sitting":             { color: "#00B894" },
  "Standing":            { color: "#0984E3" },
  "Walking":             { color: "#FDCB6E" },
  "Walking Downstairs":  { color: "#E17055" },
  "Walking Upstairs":    { color: "#D63031" },
};

export default function LivePrediction() {
  const [schema, setSchema]         = useState(null);
  const [values, setValues]         = useState({ acc_x: 0, acc_y: 0, acc_z: 9.8, gyro_x: 0, gyro_y: 0, gyro_z: 0 });
  const [prediction, setPrediction] = useState(null); // used by manual + sample
  const [loading, setLoading]       = useState(false);
  const [tab, setTab]               = useState("manual");
  const [csvResult, setCsvResult]   = useState(null);
  const [csvFile, setCsvFile]       = useState(null);
  const [csvFileName, setCsvFileName] = useState("");

  useEffect(() => { endpoints.dataSchema().then(r => setSchema(r.data)); }, []);

  // Reset prediction & inputs whenever user switches tabs
  useEffect(() => {
    setPrediction(null);
    setCsvResult(null);
  }, [tab]);

  const magnitudes = useMemo(() => ({
    acc_magnitude: Math.sqrt(values.acc_x ** 2 + values.acc_y ** 2 + values.acc_z ** 2),
    gyro_magnitude: Math.sqrt(values.gyro_x ** 2 + values.gyro_y ** 2 + values.gyro_z ** 2),
  }), [values]);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const r = await endpoints.predict(values);
      setPrediction(r.data);
    } finally { setLoading(false); }
  };

  const handleRandomSample = async () => {
    setLoading(true);
    try {
      const r = await endpoints.predictSample(null);
      setPrediction(r.data);
    } finally { setLoading(false); }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", csvFile);
      const r = await endpoints.predictCsv(fd);
      setCsvResult(r.data);
    } catch (e) {
      alert("CSV error: " + (e?.response?.data?.detail ?? e.message));
    } finally { setLoading(false); }
  };

  const downloadCsv = () => {
    if (!csvResult?.predictions?.length) return;
    const cols = csvResult.columns || [];
    const header = cols.join(",");
    const escape = (v) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = csvResult.predictions.map(p =>
      cols.map(c => {
        const v = p[c];
        return typeof v === "number" ? escape(v) : escape(v);
      }).join(",")
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "motionsense_predictions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <SensorWaveBackground />
      <div className="relative pt-8 stagger">
        <SectionTitle
          eyebrow="05 · Live Inference"
          title="Predict Human Activity"
          subtitle="Feed the Random Forest model with sensor readings and watch the predicted activity in real time."
        />

        {/* Tabs */}
        <div className="glass !p-1 inline-flex items-center gap-1 rounded-full" data-testid="prediction-tabs">
          {[
            { id: "manual", label: "Manual Sliders",   icon: Target  },
            { id: "sample", label: "Sample From Data", icon: Shuffle },
            { id: "csv",    label: "Upload CSV",       icon: Upload  },
          ].map(t => (
            <button
              key={t.id}
              data-testid={`tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`nav-pill ${tab === t.id ? "active" : ""}`}
            >
              <t.icon size={15} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {tab === "csv" ? (
          <CsvSection
            csvFile={csvFile}
            csvFileName={csvFileName}
            setCsvFile={setCsvFile}
            setCsvFileName={setCsvFileName}
            csvResult={csvResult}
            setCsvResult={setCsvResult}
            loading={loading}
            onUpload={handleCsvUpload}
            onDownload={downloadCsv}
          />
        ) : (
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Left: Controls */}
            <div className="lg:col-span-3 space-y-5">
              {tab === "manual" && (
                <Card dataTestId="manual-input-card">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-eyebrow">Sensor Inputs</div>
                      <h3 className="font-display font-bold text-xl text-sky-ink">Set the 6 sensor axes</h3>
                    </div>
                    <button onClick={handlePredict} className="btn-primary" data-testid="predict-btn" disabled={loading}>
                      <Zap size={16} /> {loading ? "Predicting…" : "Predict Activity"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {FEATURES_INPUT.map(f => {
                      const range = schema?.sensor_ranges?.[f];
                      const min = range ? Math.floor(range.min) - 1 : (f.startsWith("acc") ? -20 : -5);
                      const max = range ? Math.ceil(range.max)  + 1 : (f.startsWith("acc") ? 20  : 5);
                      const isAcc = f.startsWith("acc");
                      const pct = ((values[f] - min) / (max - min)) * 100;
                      return (
                        <div key={f} data-testid={`slider-${f}`}>
                          <div className="flex justify-between mb-1">
                            <span className="font-mono text-xs uppercase tracking-wider text-sky-deep">{f}</span>
                            <span className="font-mono text-xs text-sky-ink font-semibold">{values[f].toFixed(3)}</span>
                          </div>
                          <input
                            type="range"
                            min={min}
                            max={max}
                            step="0.001"
                            value={values[f]}
                            onChange={(e) => setValues(v => ({ ...v, [f]: parseFloat(e.target.value) }))}
                            className={`ms-slider ${isAcc ? "acc" : "gyro"}`}
                            style={{ "--fill": `${Math.max(0, Math.min(100, pct))}%` }}
                          />
                          <div className="flex justify-between text-[10px] font-mono text-sky-deep/60">
                            <span>{min}</span><span>{max}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="glass !rounded-xl !p-3 text-sm">
                      <div className="text-eyebrow">Computed acc_magnitude</div>
                      <div className="font-mono text-lg font-bold text-sky-ink">{magnitudes.acc_magnitude.toFixed(4)}</div>
                    </div>
                    <div className="glass !rounded-xl !p-3 text-sm">
                      <div className="text-eyebrow">Computed gyro_magnitude</div>
                      <div className="font-mono text-lg font-bold" style={{ color: "#8b5cf6" }}>{magnitudes.gyro_magnitude.toFixed(4)}</div>
                    </div>
                  </div>
                </Card>
              )}

              {tab === "sample" && (
                <SampleSection
                  loading={loading}
                  prediction={prediction}
                  onRandomSample={handleRandomSample}
                />
              )}
            </div>

            {/* Right: Prediction result */}
            <div className="lg:col-span-2 space-y-5">
              <PredictionResultCard prediction={prediction} />
              <Card dataTestId="how-it-works">
                <div className="text-eyebrow">How it works</div>
                <ol className="mt-2 space-y-2 text-sm text-sky-ink/90">
                  <li className="flex gap-2"><span className="font-mono text-sky-deep">01.</span> Six sensor axes are captured (accelerometer + gyroscope).</li>
                  <li className="flex gap-2"><span className="font-mono text-sky-deep">02.</span> Magnitudes are computed as <span className="font-mono">√(x²+y²+z²)</span>.</li>
                  <li className="flex gap-2"><span className="font-mono text-sky-deep">03.</span> The 8-feature vector is fed to a trained Random Forest (50 trees).</li>
                  <li className="flex gap-2"><span className="font-mono text-sky-deep">04.</span> The class with the highest probability is returned as the activity.</li>
                </ol>
              </Card>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ----------------- Sample From Data section ----------------- */
function SampleSection({ loading, prediction, onRandomSample }) {
  return (
    <Card dataTestId="sample-input-card">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-eyebrow">Real dataset sample</div>
          <h3 className="font-display font-bold text-xl text-sky-ink">
            Predict a random real sensor reading
          </h3>
          <p className="text-sm text-sky-deep/80 mt-1 max-w-xl">
            Pulls a random row directly from the shipped MotionSense dataset (4,320 real
            readings) and feeds it into the model.
          </p>
        </div>
        <button
          onClick={onRandomSample}
          className="btn-primary"
          data-testid="sample-random-btn"
          disabled={loading}
        >
          <Shuffle size={16} /> {loading ? "Sampling…" : "Random Sample"}
        </button>
      </div>

      {!prediction && (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-sky-deep/25 p-8 text-center text-sky-deep/70 text-sm">
          Click <span className="font-semibold">Random Sample</span> to fetch a real row from the dataset.
        </div>
      )}

      {prediction?.sampled_row && (
        <div className="mt-5 space-y-4" data-testid="sampled-row-panel">
          {/* Row metadata */}
          <div className="flex flex-wrap gap-2 items-center">
            <Chip color="#0284c7">Row ID: <span className="font-mono ml-1">{prediction.row_id}</span></Chip>
            <Chip color="#8b5cf6">Subject: <span className="font-mono ml-1">{prediction.subject}</span></Chip>
            <Chip color="#06b6d4">{prediction.device}</Chip>
            <Chip color="#f59e0b">Time-step: <span className="font-mono ml-1">{prediction.time_step}</span></Chip>
          </div>

          {/* Ground truth */}
          <div className={`glass !rounded-2xl !p-4 flex items-center gap-3`}
               style={{
                 borderLeft: `4px solid ${prediction.is_correct ? "#22c55e" : "#ef4444"}`,
               }}>
            {prediction.is_correct ? (
              <CheckCircle2 className="text-green-600" size={22} />
            ) : (
              <AlertCircle className="text-red-500" size={22} />
            )}
            <div className="text-sm">
              <div className="font-semibold text-sky-ink">
                Ground truth: <span className="font-mono">{prediction.true_activity}</span>
              </div>
              <div className="text-sky-deep/70">
                {prediction.is_correct
                  ? "Model prediction matches the true label."
                  : `Model predicted "${prediction.predicted_activity}" instead.`}
              </div>
            </div>
          </div>

          {/* Sensor values from the exact row */}
          <div>
            <div className="text-eyebrow mb-2">Sensor Values (from dataset row #{prediction.row_id})</div>
            <div className="overflow-x-auto rounded-2xl border border-white/60 bg-white/40 backdrop-blur">
              <table className="w-full text-sm">
                <thead className="bg-white/60">
                  <tr>
                    {ALL_FEATURES.map(f => (
                      <th key={f} className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-sky-deep">
                        {f}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-white/60">
                    {ALL_FEATURES.map(f => (
                      <td key={f} className="px-3 py-2 font-mono text-sky-ink">
                        {Number(prediction.sampled_row[f]).toFixed(6)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ----------------- Prediction result card (right) ----------------- */
function PredictionResultCard({ prediction }) {
  return (
    <Card dataTestId="prediction-result-card">
      <div className="text-eyebrow">Prediction</div>
      <h3 className="font-display font-bold text-xl text-sky-ink">Result</h3>

      {!prediction ? (
        <div className="mt-6 text-sky-deep/70 text-sm">
          Adjust sliders or grab a random real sample to see live model output here.
        </div>
      ) : (
        <div className="mt-4 space-y-4" data-testid="prediction-content">
          <div
            className="rounded-3xl p-6 relative overflow-hidden text-white"
            style={{
              background: `linear-gradient(135deg, ${prediction.color} 0%, #0c4a6e 120%)`,
              boxShadow: `0 18px 40px ${prediction.color}55`,
            }}
          >
            <div className="text-6xl">{prediction.emoji}</div>
            <div className="mt-2 text-eyebrow text-white/70">Predicted Activity</div>
            <div className="font-display font-extrabold text-3xl tracking-tight" data-testid="predicted-activity">
              {prediction.predicted_activity}
            </div>
            <div className="mt-3 text-sm">
              Confidence <span className="font-mono font-bold">{(prediction.confidence * 100).toFixed(2)}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/25 overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${prediction.confidence * 100}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="glass !rounded-xl !p-3 text-sm">
              <div className="text-eyebrow">acc_magnitude</div>
              <div className="font-mono text-lg font-bold text-sky-ink">{prediction.features_used.acc_magnitude.toFixed(3)}</div>
            </div>
            <div className="glass !rounded-xl !p-3 text-sm">
              <div className="text-eyebrow">gyro_magnitude</div>
              <div className="font-mono text-lg font-bold" style={{ color: "#8b5cf6" }}>{prediction.features_used.gyro_magnitude.toFixed(3)}</div>
            </div>
          </div>

          <div>
            <div className="text-eyebrow mb-2">Probability Distribution</div>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <BarChart
                  data={Object.entries(prediction.probabilities)
                        .map(([k, v]) => ({ activity: k, prob: v * 100 }))
                        .sort((a,b) => b.prob - a.prob)}
                  layout="vertical"
                  margin={{ top: 5, right: 45, left: 10, bottom: 0 }}
                >
                  <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tick={AXIS_STYLE} />
                  <YAxis type="category" dataKey="activity" width={130} tick={{ ...AXIS_STYLE, fontSize: 11 }} />
                  <Tooltip formatter={(v) => `${v.toFixed(2)}%`}
                           contentStyle={{ background: "rgba(255,255,255,0.9)", border: "1px solid #bae6fd", borderRadius: 12 }} />
                  <Bar dataKey="prob" fill={prediction.color} radius={[0, 8, 8, 0]}>
                    <LabelList dataKey="prob" position="right"
                               formatter={(v) => `${v.toFixed(1)}%`}
                               fill="#0c4a6e" fontSize={10} fontFamily="JetBrains Mono" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ----------------- CSV section ----------------- */
function CsvSection({ csvFile, csvFileName, setCsvFile, setCsvFileName, csvResult, setCsvResult, loading, onUpload, onDownload }) {
  return (
    <div className="mt-5 space-y-5">
      <Card dataTestId="csv-input-card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-eyebrow">Batch inference</div>
            <h3 className="font-display font-bold text-xl text-sky-ink">
              Upload a CSV with sensor columns
            </h3>
            <p className="text-sm text-sky-deep/80 mt-1">
              Required columns: <span className="font-mono">acc_x, acc_y, acc_z, gyro_x, gyro_y, gyro_z</span>.
              Magnitudes are computed automatically.
            </p>
          </div>
        </div>

        <label
          htmlFor="csv-file-input"
          className="mt-4 block border-2 border-dashed border-sky-deep/30 rounded-2xl p-8 text-center cursor-pointer hover:border-sky-deep/60 hover:bg-white/40 transition"
        >
          <input
            id="csv-file-input"
            data-testid="csv-file-input"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setCsvFile(f ?? null);
              setCsvFileName(f?.name ?? "");
              setCsvResult(null);
            }}
          />
          <FileText size={36} className="mx-auto text-sky-deep/60" />
          <div className="mt-2 font-semibold text-sky-ink">
            {csvFileName || "Choose a CSV file"}
          </div>
          <div className="text-xs text-sky-deep/60 mt-1">Predictions include per-row activity & confidence</div>
        </label>

        <div className="mt-4 flex gap-2">
          <button onClick={onUpload} className="btn-primary" data-testid="csv-predict-btn" disabled={!csvFile || loading}>
            <Zap size={16} /> {loading ? "Processing…" : "Predict CSV"}
          </button>
          {csvFile && (
            <button onClick={() => { setCsvFile(null); setCsvFileName(""); setCsvResult(null); }} className="btn-ghost text-sm">
              <X size={14} /> Remove
            </button>
          )}
        </div>
      </Card>

      {csvResult && (
        <>
          {/* Success banner + full data table (matches reference) */}
          <Card className="!p-0 overflow-hidden" dataTestId="csv-table-card">
            <div className="p-5 flex items-center justify-between gap-4 flex-wrap border-b border-white/60">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-green-600" size={22} />
                <div>
                  <div className="font-display font-semibold text-sky-ink">
                    Predicted activity for <span className="font-mono">{csvResult.total_rows.toLocaleString()}</span> rows.
                  </div>
                  <div className="text-xs text-sky-deep/70 mt-0.5">
                    Full dataset preserved · magnitudes computed · predicted_activity appended
                  </div>
                </div>
              </div>
              <button onClick={onDownload} className="btn-primary" data-testid="csv-download-btn">
                <Download size={16} /> Download predictions as CSV
              </button>
            </div>
            <div className="overflow-x-auto max-h-[520px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white/70 backdrop-blur-md">
                  <tr>
                    <th className="text-left px-3 py-2.5 font-mono text-[10px] uppercase tracking-wider text-sky-deep">#</th>
                    {(csvResult.columns || []).map(c => (
                      <th key={c} className="text-left px-3 py-2.5 font-mono text-[10px] uppercase tracking-wider text-sky-deep whitespace-nowrap">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvResult.predictions.map((p) => (
                    <tr key={p.row} className="border-t border-white/40 hover:bg-white/30 transition" data-testid={`csv-row-${p.row}`}>
                      <td className="px-3 py-2 font-mono text-sky-deep/70">{p.row}</td>
                      {(csvResult.columns || []).map(c => {
                        const v = p[c];
                        if (c === "predicted_activity") {
                          return (
                            <td key={c} className="px-3 py-2 whitespace-nowrap">
                              <Chip color={p.color}>{p.emoji} {v}</Chip>
                            </td>
                          );
                        }
                        if (c === "confidence") {
                          return (
                            <td key={c} className="px-3 py-2 font-mono text-sky-ink whitespace-nowrap">
                              {typeof v === "number" ? `${(v * 100).toFixed(2)}%` : "—"}
                            </td>
                          );
                        }
                        if (c === "activity") {
                          const color = v ? ACTIVITY_META_FALLBACK[v]?.color ?? "#0284c7" : "#0284c7";
                          return (
                            <td key={c} className="px-3 py-2 whitespace-nowrap">
                              {v ? <Chip color={color}>{v}</Chip> : <span className="text-sky-deep/40">—</span>}
                            </td>
                          );
                        }
                        return (
                          <td key={c} className="px-3 py-2 font-mono text-sky-ink/90 whitespace-nowrap">
                            {typeof v === "number" ? v.toFixed(4) : (v ?? "—")}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Distribution bar chart */}
          <Card dataTestId="csv-distribution-card">
            <div className="text-eyebrow">Result Summary</div>
            <h3 className="font-display font-bold text-xl text-sky-ink">Predicted Activity Distribution</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {csvResult.distribution.map(d => (
                <Chip key={d.activity} color={d.color}>
                  {d.emoji} {d.activity}: <span className="font-mono ml-1">{d.count}</span>
                </Chip>
              ))}
            </div>
            <div style={{ width: "100%", height: 380 }} className="mt-4">
              <ResponsiveContainer>
                <BarChart data={csvResult.distribution} margin={{ top: 10, right: 10, left: -20, bottom: 30 }}>
                  <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                  <XAxis dataKey="activity" tick={AXIS_STYLE} angle={-10} textAnchor="end" height={60} />
                  <YAxis tick={AXIS_STYLE} />
                  <Tooltip contentStyle={{ background: "rgba(255,255,255,0.9)", border: "1px solid #bae6fd", borderRadius: 12 }} />
                  <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                    {csvResult.distribution.map((d, i) => <Cell key={i} fill={d.color} />)}
                    <LabelList dataKey="count" position="top" fill="#0c4a6e" fontSize={11} fontFamily="JetBrains Mono" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
