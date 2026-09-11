import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, Legend, CartesianGrid, ScatterChart, Scatter, ZAxis,
  ComposedChart, PieChart, Pie, Area, AreaChart
} from "recharts";
import SensorWaveBackground from "../components/SensorWaveBackground";
import { Card, SectionTitle, Chip, Skeleton } from "../components/ui";
import { endpoints } from "../lib/api";

const AXIS_STYLE = { fill: "#0c4a6e", fontSize: 11, fontFamily: "JetBrains Mono" };
const GRID = "rgba(2, 132, 199, 0.15)";
const FEATURES = ["acc_x","acc_y","acc_z","gyro_x","gyro_y","gyro_z","acc_magnitude","gyro_magnitude"];
const ACTIVITY_ORDER = ["Laying", "Sitting", "Standing", "Walking", "Walking Downstairs", "Walking Upstairs"];

export default function EDA() {
  const [activityDist, setActivityDist] = useState([]);
  const [deviceDist, setDeviceDist]     = useState([]);
  const [avgMotion, setAvgMotion]       = useState([]);
  const [correlation, setCorrelation]   = useState(null);
  const [boxData, setBoxData]           = useState([]);
  const [boxMetric, setBoxMetric]       = useState("acc_magnitude");
  const [scatter, setScatter]           = useState([]);
  const [scatterX, setScatterX]         = useState("acc_magnitude");
  const [scatterY, setScatterY]         = useState("gyro_magnitude");
  const [histogram, setHistogram]       = useState(null);
  const [histFeature, setHistFeature]   = useState("acc_magnitude");

  useEffect(() => {
    endpoints.edaActivityDist().then(r => setActivityDist(r.data));
    endpoints.edaDeviceDist().then(r => setDeviceDist(r.data));
    endpoints.edaAverageMotion().then(r => setAvgMotion(r.data));
    endpoints.edaCorrelation().then(r => setCorrelation(r.data));
  }, []);

  useEffect(() => {
    endpoints.edaBoxPlot(boxMetric).then(r => setBoxData(r.data));
  }, [boxMetric]);

  useEffect(() => {
    endpoints.edaScatter({ x: scatterX, y: scatterY, sample: 1500 })
      .then(r => setScatter(r.data));
  }, [scatterX, scatterY]);

  useEffect(() => {
    endpoints.edaHistogram(histFeature, 40).then(r => setHistogram(r.data));
  }, [histFeature]);

  const scatterGroups = useMemo(() => {
    const groups = {};
    for (const p of scatter) {
      if (!groups[p.activity]) groups[p.activity] = { color: p.color, data: [] };
      groups[p.activity].data.push(p);
    }
    return groups;
  }, [scatter]);

  // Segment computation moved to Data Explorer

  return (
    <>
      <SensorWaveBackground />
      <div className="relative pt-8 stagger">
        <SectionTitle
          eyebrow="03 · Exploratory Analysis"
          title="Sensor Signals & Patterns"
          subtitle="Every chart is computed live from the real MotionSense-AI dataset (4,320 timestamped readings, 30 subjects, 2 devices)."
        />

        {/* Row 1 — Class balance (bar + donut) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card dataTestId="chart-activity-dist">
            <div className="text-eyebrow">Class Balance</div>
            <h3 className="font-display font-bold text-xl text-sky-ink">Activity Distribution</h3>
            <div style={{ width: "100%", height: 320 }} className="mt-3">
              {activityDist.length === 0 ? <Skeleton className="w-full h-full" /> : (
                <ResponsiveContainer>
                  <BarChart data={activityDist} margin={{ top: 10, right: 10, left: -20, bottom: 30 }}>
                    <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                    <XAxis dataKey="activity" tick={AXIS_STYLE} angle={-15} textAnchor="end" height={60} />
                    <YAxis tick={AXIS_STYLE} />
                    <Tooltip content={<GlassTooltip />} />
                    <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                      {activityDist.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card dataTestId="chart-activity-pie">
            <div className="text-eyebrow">Proportional View</div>
            <h3 className="font-display font-bold text-xl text-sky-ink">Class Share (Donut)</h3>
            <div style={{ width: "100%", height: 320 }} className="mt-3">
              {activityDist.length === 0 ? <Skeleton className="w-full h-full" /> : (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={activityDist}
                      dataKey="count"
                      nameKey="activity"
                      innerRadius={70}
                      outerRadius={115}
                      paddingAngle={2}
                      stroke="rgba(255,255,255,0.7)"
                      strokeWidth={2}
                    >
                      {activityDist.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip content={<GlassTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        {/* Device distribution + Average motion */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
          <Card dataTestId="chart-device-dist">
            <div className="text-eyebrow">Devices</div>
            <h3 className="font-display font-bold text-xl text-sky-ink">Device Distribution</h3>
            <div className="mt-6 space-y-4">
              {deviceDist.map(d => {
                const total = deviceDist.reduce((s, x) => s + x.count, 0);
                const pct = total ? (d.count / total) * 100 : 0;
                return (
                  <div key={d.device} data-testid={`device-${d.device}`}>
                    <div className="flex justify-between mb-1.5 text-sm">
                      <span className="font-medium text-sky-ink">{d.device}</span>
                      <span className="font-mono text-sky-deep">{d.count.toLocaleString()} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-3 rounded-full bg-white/60 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: d.device === "phone_A"
                            ? "linear-gradient(90deg, #0ea5e9, #06b6d4)"
                            : "linear-gradient(90deg, #8b5cf6, #ec4899)"
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="lg:col-span-2" dataTestId="chart-avg-motion">
            <div className="text-eyebrow">Motion Magnitude</div>
            <h3 className="font-display font-bold text-xl text-sky-ink">Average Movement by Activity</h3>
            <div style={{ width: "100%", height: 320 }} className="mt-3">
              {avgMotion.length === 0 ? <Skeleton className="w-full h-full" /> : (
                <ResponsiveContainer>
                  <BarChart data={avgMotion} margin={{ top: 10, right: 10, left: -10, bottom: 30 }}>
                    <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                    <XAxis dataKey="activity" tick={AXIS_STYLE} angle={-15} textAnchor="end" height={60} />
                    <YAxis tick={AXIS_STYLE} />
                    <Tooltip content={<GlassTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="acc_magnitude"  name="Acc Magnitude"  fill="#0ea5e9" radius={[8,8,0,0]} />
                    <Bar dataKey="gyro_magnitude" name="Gyro Magnitude" fill="#8b5cf6" radius={[8,8,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        {/* Time-series moved to Data Explorer → Sensor Signal tab */}

        {/* Motion Intensity Box Plot */}
        <Card className="mt-5" dataTestId="chart-box-plot">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-eyebrow">Distribution per Activity</div>
              <h3 className="font-display font-bold text-xl text-sky-ink">Motion Intensity Box Plot</h3>
            </div>
            <div className="inline-flex glass !p-1 !rounded-full">
              {["acc_magnitude", "gyro_magnitude"].map(m => (
                <button
                  key={m}
                  data-testid={`box-metric-${m}`}
                  onClick={() => setBoxMetric(m)}
                  className={`nav-pill ${boxMetric === m ? "active" : ""}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <BoxPlot data={boxData} metric={boxMetric} />
          </div>
        </Card>

        {/* Feature relationship scatter with dropdowns */}
        <Card className="mt-5" dataTestId="chart-scatter">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-eyebrow">Feature Relationships</div>
              <h3 className="font-display font-bold text-xl text-sky-ink">Scatter Plot Explorer</h3>
            </div>
            <div className="flex gap-3 flex-wrap">
              <div>
                <div className="text-eyebrow mb-1">X axis</div>
                <select
                  data-testid="scatter-x-select"
                  value={scatterX}
                  onChange={(e) => setScatterX(e.target.value)}
                  className="px-3 py-2 rounded-full bg-white/60 border border-white/70 text-sm outline-none"
                >
                  {FEATURES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <div className="text-eyebrow mb-1">Y axis</div>
                <select
                  data-testid="scatter-y-select"
                  value={scatterY}
                  onChange={(e) => setScatterY(e.target.value)}
                  className="px-3 py-2 rounded-full bg-white/60 border border-white/70 text-sm outline-none"
                >
                  {FEATURES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div style={{ width: "100%", height: 380 }} className="mt-4">
            {scatter.length === 0 ? <Skeleton className="w-full h-full" /> : (
              <ResponsiveContainer>
                <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="x" name={scatterX} tick={AXIS_STYLE} domain={["auto", "auto"]} />
                  <YAxis type="number" dataKey="y" name={scatterY} tick={AXIS_STYLE} domain={["auto", "auto"]} />
                  <ZAxis range={[35, 35]} />
                  <Tooltip content={<GlassTooltip />} cursor={{ strokeDasharray: "3 3" }} />
                  {Object.entries(scatterGroups).map(([name, g]) => (
                    <Scatter key={name} name={name} data={g.data} fill={g.color} fillOpacity={0.7} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Histogram */}
        <Card className="mt-5" dataTestId="chart-histogram">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-eyebrow">Feature Distribution</div>
              <h3 className="font-display font-bold text-xl text-sky-ink">Overlaid Histogram</h3>
            </div>
            <div>
              <div className="text-eyebrow mb-1">Feature</div>
              <select
                data-testid="hist-feature-select"
                value={histFeature}
                onChange={(e) => setHistFeature(e.target.value)}
                className="px-3 py-2 rounded-full bg-white/60 border border-white/70 text-sm outline-none"
              >
                {FEATURES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div style={{ width: "100%", height: 360 }} className="mt-4">
            {!histogram ? <Skeleton className="w-full h-full" /> : (
              <ResponsiveContainer>
                <AreaChart data={histogram.bins} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                  <XAxis dataKey="bin" tick={AXIS_STYLE} tickFormatter={(v) => Number(v).toFixed(2)} />
                  <YAxis tick={AXIS_STYLE} />
                  <Tooltip content={<GlassTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {histogram.activities.map(a => {
                    const color = activityDist.find(x => x.activity === a)?.color ?? "#0ea5e9";
                    return (
                      <Area
                        key={a}
                        type="monotone"
                        dataKey={a}
                        stackId={undefined}
                        stroke={color}
                        fill={color}
                        fillOpacity={0.35}
                        strokeWidth={1.5}
                      />
                    );
                  })}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Correlation heatmap */}
        <Card className="mt-5" dataTestId="chart-correlation">
          <div className="text-eyebrow">Feature Correlations</div>
          <h3 className="font-display font-bold text-xl text-sky-ink">Correlation Heatmap</h3>
          {correlation && <Heatmap data={correlation} />}
        </Card>
      </div>
    </>
  );
}

/* -------------------- helpers -------------------- */

function segmentByActivity(rows) {
  if (!rows?.length) return [];
  const segs = [];
  let cur = null;
  for (const r of rows) {
    if (!cur || cur.activity !== r.activity) {
      if (cur) segs.push(cur);
      cur = { activity: r.activity, color: r.color, data: [r] };
    } else {
      cur.data.push(r);
    }
  }
  if (cur) segs.push(cur);
  return segs;
}

function ActivitySegmentedChart({ title, dataKey, segments }) {
  // Compute domain from all data
  const allT = segments.flatMap(s => s.data.map(d => d.t));
  const allV = segments.flatMap(s => s.data.map(d => d[dataKey]));
  const domainX = allT.length ? [Math.min(...allT), Math.max(...allT)] : [0, 1];
  const domainY = allV.length ? [Math.min(...allV) * 0.98, Math.max(...allV) * 1.02] : [0, 1];

  return (
    <div>
      <div className="text-sm font-semibold text-sky-ink mb-1">{title}</div>
      <div style={{ width: "100%", height: 260 }}>
        {segments.length === 0 ? <Skeleton className="w-full h-full" /> : (
          <ResponsiveContainer>
            <LineChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
              <XAxis type="number" dataKey="t" domain={domainX} tick={AXIS_STYLE} />
              <YAxis type="number" domain={domainY} tick={AXIS_STYLE} />
              <Tooltip content={<GlassTooltip />} />
              {segments.map((seg, i) => (
                <Line
                  key={i}
                  data={seg.data}
                  dataKey={dataKey}
                  type="monotone"
                  stroke={seg.color}
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                  name={seg.activity}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function BoxPlot({ data, metric }) {
  const [hovered, setHovered] = React.useState(null); // { activity, x, y }

  if (!data?.length) return <Skeleton className="w-full h-80" />;
  const globalMin = Math.min(...data.map(d => d.min), ...data.flatMap(d => d.outliers || []));
  const globalMax = Math.max(...data.map(d => d.max), ...data.flatMap(d => d.outliers || []));
  const range = globalMax - globalMin || 1;
  const H = 340;
  const cellWidth = 130;
  const svgWidth = data.length * cellWidth;

  const toY = (v) => H - ((v - globalMin) / range) * (H - 40) - 20;

  // Upper/lower fence for tooltip (IQR method)
  const withFences = data.map(d => {
    const iqr = d.q3 - d.q1;
    return {
      ...d,
      upperFence: d.q3 + 1.5 * iqr,
      lowerFence: d.q1 - 1.5 * iqr,
    };
  });

  return (
    <div className="relative overflow-x-auto" data-testid="box-plot-container">
      <svg
        width="100%"
        height={H + 40}
        viewBox={`0 0 ${svgWidth} ${H + 40}`}
        preserveAspectRatio="xMinYMid meet"
      >
        {/* Y-axis reference lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const val = globalMin + range * pct;
          const y = toY(val);
          return (
            <g key={pct}>
              <line x1="0" x2={svgWidth} y1={y} y2={y} stroke={GRID} strokeDasharray="3 3" />
              <text x="4" y={y - 3} fill="#0c4a6e" fontSize="10" fontFamily="JetBrains Mono">
                {val.toFixed(3)}
              </text>
            </g>
          );
        })}

        {withFences.map((d, i) => {
          const cx = i * cellWidth + cellWidth / 2;
          const boxWidth = 60;
          const yUpperFence = toY(Math.min(d.upperFence, d.max));
          const yQ3 = toY(d.q3);
          const yMed = toY(d.median);
          const yQ1 = toY(d.q1);
          const yLowerFence = toY(Math.max(d.lowerFence, d.min));
          const isHovered = hovered?.activity === d.activity;

          const handleEnter = (e) => {
            const svg = e.currentTarget.ownerSVGElement || e.currentTarget;
            const rect = svg.getBoundingClientRect?.();
            const scaleX = rect ? rect.width / svgWidth : 1;
            const scaleY = rect ? rect.height / (H + 40) : 1;
            const containerHeight = rect ? rect.height : H + 40;
            const containerWidth  = rect ? rect.width  : svgWidth;

            // Ideal anchor: to the right of the box, vertically aligned with median
            const anchorRightPx = (cx + boxWidth / 2 + 12) * scaleX;
            const anchorLeftPx  = (cx - boxWidth / 2 - 12) * scaleX;
            const medYPx        = yMed * scaleY;

            // Tooltip dimensions (approx)
            const ttW = 210;
            const ttH = 230;

            // Choose horizontal side
            let px = anchorRightPx;
            let placement = "right";
            if (anchorRightPx + ttW > containerWidth) {
              px = Math.max(4, anchorLeftPx - ttW);
              placement = "left";
            }

            // Choose vertical placement (default: centered on median, clamped)
            let py = medYPx - ttH / 2;
            py = Math.max(4, Math.min(containerHeight - ttH - 4, py));

            setHovered({
              activity: d.activity,
              px, py, placement,
              color: d.color,
              stats: d,
            });
          };
          const handleLeave = () => setHovered(null);

          return (
            <g
              key={d.activity}
              data-testid={`box-${d.activity.replace(/ /g, "-")}`}
              onMouseEnter={handleEnter}
              onMouseLeave={handleLeave}
              style={{ cursor: "crosshair" }}
            >
              {/* Large hit zone (semi-transparent white rect covering the box+whiskers) */}
              <rect
                x={cx - boxWidth / 2 - 10}
                y={yUpperFence - 12}
                width={boxWidth + 20}
                height={Math.max(40, yLowerFence - yUpperFence + 40)}
                fill="#ffffff"
                fillOpacity={isHovered ? 0.15 : 0.001}
                rx="6"
              />

              {/* Whiskers */}
              <line x1={cx} x2={cx} y1={yUpperFence} y2={yLowerFence} stroke={d.color} strokeWidth="1.5" pointerEvents="none" />
              <line x1={cx - 15} x2={cx + 15} y1={yUpperFence} y2={yUpperFence} stroke={d.color} strokeWidth="1.5" pointerEvents="none" />
              <line x1={cx - 15} x2={cx + 15} y1={yLowerFence} y2={yLowerFence} stroke={d.color} strokeWidth="1.5" pointerEvents="none" />

              {/* Box */}
              <rect
                x={cx - boxWidth / 2}
                y={yQ3}
                width={boxWidth}
                height={yQ1 - yQ3}
                fill={d.color}
                fillOpacity={isHovered ? 0.65 : 0.45}
                stroke={d.color}
                strokeWidth={isHovered ? 2.2 : 1.6}
                rx="4"
                pointerEvents="none"
              />

              {/* Median line — matches the box color, slightly darker for visibility */}
              <line
                x1={cx - boxWidth / 2}
                x2={cx + boxWidth / 2}
                y1={yMed}
                y2={yMed}
                stroke={d.color}
                strokeWidth="3"
                strokeLinecap="round"
                pointerEvents="none"
              />

              {/* Outliers */}
              {(d.outliers || []).slice(0, 20).map((o, j) => (
                <circle
                  key={j}
                  cx={cx}
                  cy={toY(o)}
                  r="2.3"
                  fill={d.color}
                  fillOpacity="0.7"
                  pointerEvents="none"
                />
              ))}

              {/* Cross-hair "+" on hover (colored to match box) */}
              {isHovered && (
                <g pointerEvents="none">
                  <line x1={cx - 10} x2={cx + 10} y1={yMed} y2={yMed} stroke={d.color} strokeWidth="2" strokeLinecap="round" />
                  <line x1={cx} x2={cx} y1={yMed - 10} y2={yMed + 10} stroke={d.color} strokeWidth="2" strokeLinecap="round" />
                </g>
              )}

              {/* X-axis labels */}
              <text
                x={cx}
                y={H + 12}
                textAnchor="middle"
                fill={isHovered ? d.color : "#0c4a6e"}
                fontSize="10"
                fontFamily="JetBrains Mono"
                fontWeight={isHovered ? 700 : 500}
                pointerEvents="none"
              >
                {d.activity.length > 12 ? d.activity.slice(0, 10) + "…" : d.activity}
              </text>
              <text
                x={cx}
                y={H + 26}
                textAnchor="middle"
                fill={d.color}
                fontSize="9"
                fontFamily="JetBrains Mono"
                pointerEvents="none"
              >
                med={d.median.toFixed(3)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating tooltip */}
      {hovered && (
        <div
          className="pointer-events-none absolute z-20 glass !rounded-xl !p-3 text-xs font-mono"
          style={{
            left: hovered.px,
            top: hovered.py,
            borderLeft: `3px solid ${hovered.color}`,
            width: 210,
          }}
          data-testid="box-plot-tooltip"
        >
          <div
            className="font-display font-bold text-sm mb-1.5"
            style={{ color: hovered.color }}
          >
            {hovered.activity}
          </div>
          <TooltipRow label="max"         value={hovered.stats.max} />
          <TooltipRow label="upper fence" value={hovered.stats.upperFence} />
          <TooltipRow label="q3"          value={hovered.stats.q3} />
          <TooltipRow label="median"      value={hovered.stats.median} bold />
          <TooltipRow label="q1"          value={hovered.stats.q1} />
          <TooltipRow label="lower fence" value={hovered.stats.lowerFence} />
          <TooltipRow label="min"         value={hovered.stats.min} />
          <div className="mt-1.5 pt-1.5 border-t border-white/50 text-[10px] text-sky-deep/70">
            metric: <span className="text-sky-ink">{metric}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function TooltipRow({ label, value, bold }) {
  return (
    <div className="flex justify-between gap-4 py-0.5">
      <span className="text-sky-deep/80">{label}</span>
      <span className={`text-sky-ink ${bold ? "font-bold" : ""}`}>
        {typeof value === "number" ? value.toFixed(6) : value}
      </span>
    </div>
  );
}

function GlassTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass !p-3 !rounded-xl text-xs font-mono">
      {label !== undefined && <div className="text-sky-deep font-semibold mb-1">{typeof label === "number" ? label.toFixed(3) : label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-sky-ink">{p.name}: {typeof p.value === "number" ? p.value.toFixed(3) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

function Heatmap({ data }) {
  const { features, matrix } = data;
  const cellColor = (v) => {
    if (v >= 0) {
      const alpha = Math.min(1, Math.abs(v));
      return `rgba(14, 165, 233, ${0.15 + alpha * 0.75})`;
    }
    const alpha = Math.min(1, Math.abs(v));
    return `rgba(239, 68, 68, ${0.15 + alpha * 0.75})`;
  };
  return (
    <div className="overflow-x-auto mt-3">
      <table className="text-xs border-separate" style={{ borderSpacing: "3px" }}>
        <thead>
          <tr>
            <th></th>
            {features.map(f => (
              <th key={f} className="p-2 font-mono text-[10px] uppercase text-sky-deep text-right rotate-[-25deg]">
                {f}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={features[i]}>
              <th className="p-2 font-mono text-[10px] uppercase text-sky-deep text-right whitespace-nowrap">
                {features[i]}
              </th>
              {row.map((v, j) => (
                <td
                  key={j}
                  className="w-14 h-10 text-center rounded-lg font-mono text-[11px] transition hover:scale-110 cursor-help"
                  style={{
                    background: cellColor(v),
                    color: Math.abs(v) > 0.6 ? "white" : "#0c4a6e",
                    fontWeight: Math.abs(v) > 0.5 ? 700 : 500,
                  }}
                  title={`${features[i]} × ${features[j]} = ${v}`}
                >
                  {v.toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
