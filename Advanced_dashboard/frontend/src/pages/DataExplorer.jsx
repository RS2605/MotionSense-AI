import React, { useEffect, useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Database, LineChart as LineIcon, Table2 } from "lucide-react";
import SensorWaveBackground from "../components/SensorWaveBackground";
import MultiSelect from "../components/MultiSelect";
import PlotlyChart from "../components/PlotlyChart";
import { Card, SectionTitle, Chip, Skeleton } from "../components/ui";
import { endpoints } from "../lib/api";

const NUMERIC_COLS = ["acc_x","acc_y","acc_z","gyro_x","gyro_y","gyro_z","acc_magnitude","gyro_magnitude"];
const ACTIVITY_ORDER = ["Laying", "Sitting", "Standing", "Walking", "Walking Downstairs", "Walking Upstairs"];

export default function DataExplorer() {
  const [schema, setSchema] = useState(null);
  const [tab, setTab] = useState("signal");

  // Filters
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [selectedSubjects, setSelectedSubjects]     = useState([]);
  const [selectedDevices, setSelectedDevices]       = useState([]);
  const [search, setSearch]                         = useState("");

  // Table state
  const [rows, setRows]             = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [pageSize]                  = useState(25);
  const [loadingRows, setLoadingRows] = useState(false);

  // Time-series (Sensor Signal tab)
  const [tsData, setTsData]     = useState({ subject: null, rows: [], available_subjects: [] });
  const [loadingTs, setLoadingTs] = useState(false);

  useEffect(() => { endpoints.dataSchema().then(r => {
    setSchema(r.data);
    // Default: everything selected (matches the reference)
    setSelectedActivities(r.data.activity_labels.map(a => a.label));
    setSelectedDevices(r.data.devices);
  }); }, []);

  // Load table
  useEffect(() => {
    setLoadingRows(true);
    const params = { page, page_size: pageSize };
    if (selectedActivities.length) params.activities = selectedActivities.join(",");
    if (selectedDevices.length)    params.devices    = selectedDevices.join(",");
    if (selectedSubjects.length)   params.subjects   = selectedSubjects.join(",");
    if (search)                    params.search     = search;
    endpoints.dataRows(params)
      .then(r => { setRows(r.data.rows); setTotal(r.data.total); })
      .finally(() => setLoadingRows(false));
  }, [page, pageSize, selectedActivities, selectedDevices, selectedSubjects, search]);

  // Load time-series (first selected subject or fallback to first available)
  useEffect(() => {
    setLoadingTs(true);
    const subject = selectedSubjects.length ? selectedSubjects[0] : undefined;
    const params = {};
    if (subject !== undefined) params.subject = subject;
    if (selectedActivities.length) params.activities = selectedActivities.join(",");
    if (selectedDevices.length)    params.devices    = selectedDevices.join(",");
    endpoints.edaTimeSeries(params)
      .then(r => setTsData(r.data))
      .finally(() => setLoadingTs(false));
  }, [selectedSubjects, selectedActivities, selectedDevices]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const displayCols = useMemo(() => schema?.columns.map(c => c.name) ?? [], [schema]);

  const activityColorMap = useMemo(() => {
    const m = {};
    (schema?.activity_labels ?? []).forEach(a => { m[a.label] = a.color; });
    return m;
  }, [schema]);

  // Build plotly traces (one per activity) for magnitudes
  const magnitudeTraces = (dataKey) => {
    if (!tsData.rows.length) return [];
    const grouped = {};
    for (const r of tsData.rows) {
      if (!grouped[r.activity]) grouped[r.activity] = { x: [], y: [] };
      grouped[r.activity].x.push(r.t);
      grouped[r.activity].y.push(r[dataKey]);
    }
    // Order traces canonically
    return ACTIVITY_ORDER.filter(a => grouped[a]).map(a => ({
      x: grouped[a].x,
      y: grouped[a].y,
      type: "scatter",
      mode: "lines",
      name: a,
      line: { color: activityColorMap[a], width: 2, shape: "linear" },
      hovertemplate:
        "<b>activity</b>=" + a +
        "<br><b>time_step</b>=%{x}" +
        "<br><b>" + dataKey + "</b>=%{y:.4f}<extra></extra>",
    }));
  };

  // Raw axes traces (acc_x, acc_y, acc_z) — one line each, distinct colors
  const rawAxesTraces = useMemo(() => {
    if (!tsData.rows.length) return [];
    const cols = [
      { key: "acc_x", color: "#08519c" },
      { key: "acc_y", color: "#6baed6" },
      { key: "acc_z", color: "#d62728" },
    ];
    return cols.map(c => ({
      x: tsData.rows.map(r => r.t),
      y: tsData.rows.map(r => r[c.key]),
      type: "scatter",
      mode: "lines",
      name: c.key,
      line: { color: c.color, width: 2 },
      hovertemplate:
        "<b>variable</b>=" + c.key +
        "<br><b>time_step</b>=%{x}" +
        "<br><b>value</b>=%{y:.4f}<extra></extra>",
    }));
  }, [tsData.rows]);

  return (
    <>
      <SensorWaveBackground />
      <div className="relative pt-8 stagger">
        <SectionTitle
          eyebrow="02 · Dataset"
          title="Data Explorer"
          subtitle="Filter, browse, and plot the real MotionSense-AI sensor readings directly."
        />

        {/* Filters */}
        <Card className="!p-6" dataTestId="filters-card">
          <h3 className="font-display font-bold text-lg text-sky-ink mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-eyebrow mb-1.5">Activity</div>
              <MultiSelect
                testid="filter-activities"
                value={selectedActivities}
                onChange={(v) => { setSelectedActivities(v); setPage(1); }}
                options={(schema?.activity_labels ?? []).map(a => ({
                  value: a.label, label: a.label, color: a.color, emoji: a.emoji,
                }))}
                placeholder="Choose activities"
              />
            </div>
            <div>
              <div className="text-eyebrow mb-1.5">Subject</div>
              <MultiSelect
                testid="filter-subjects"
                value={selectedSubjects}
                onChange={(v) => { setSelectedSubjects(v); setPage(1); }}
                options={(schema?.subjects ?? []).map(s => ({
                  value: s, label: String(s), color: "#8b5cf6",
                }))}
                placeholder="Choose subjects (leave empty for all)"
              />
            </div>
            <div>
              <div className="text-eyebrow mb-1.5">Device</div>
              <MultiSelect
                testid="filter-devices"
                value={selectedDevices}
                onChange={(v) => { setSelectedDevices(v); setPage(1); }}
                options={(schema?.devices ?? []).map(d => ({
                  value: d, label: d, color: "#8b5cf6",
                }))}
                placeholder="Choose devices"
              />
            </div>
          </div>
          <div className="mt-3 text-sm text-sky-deep/70">
            Showing <span className="font-semibold text-sky-ink font-mono">{total.toLocaleString()}</span> of{" "}
            <span className="font-mono">{schema ? schema.subjects.length ? "4,320" : "0" : "…"}</span> readings
          </div>
        </Card>

        {/* Tabs */}
        <div className="mt-5 glass !p-1 inline-flex items-center gap-1 rounded-full" data-testid="explorer-tabs">
          <button
            data-testid="tab-signal"
            onClick={() => setTab("signal")}
            className={`nav-pill ${tab === "signal" ? "active" : ""}`}
          >
            <LineIcon size={15} /> Sensor Signal
          </button>
          <button
            data-testid="tab-table"
            onClick={() => setTab("table")}
            className={`nav-pill ${tab === "table" ? "active" : ""}`}
          >
            <Table2 size={15} /> Raw Table
          </button>
        </div>

        {/* Sensor Signal tab */}
        {tab === "signal" && (
          <div className="mt-4 space-y-5" data-testid="signal-panel">
            <div>
              <h3 className="font-display font-bold text-xl text-sky-ink">
                Time-series for subject {tsData.subject ?? "—"}{" "}
                <span className="font-body font-normal text-sky-deep/70 text-base">
                  (accelerometer &amp; gyroscope magnitude)
                </span>
              </h3>
              {tsData.available_subjects.length > 0 && !selectedSubjects.length && (
                <div className="text-xs text-sky-deep/60 mt-1">
                  Auto-picked subject <span className="font-mono">{tsData.subject}</span> · pick one from the filter above to change
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card className="!p-4" dataTestId="chart-acc-magnitude">
                {loadingTs ? <Skeleton className="w-full h-[380px]" /> : (
                  <PlotlyChart
                    dataTestId="plot-acc-magnitude"
                    title="Accelerometer Magnitude"
                    data={magnitudeTraces("acc_magnitude")}
                    height={380}
                    filename={`acc_magnitude_subject_${tsData.subject}`}
                    layout={{
                      xaxis: { title: "time_step" },
                      yaxis: { title: "acc_magnitude" },
                      legend: { title: { text: "activity" } },
                    }}
                  />
                )}
              </Card>

              <Card className="!p-4" dataTestId="chart-gyro-magnitude">
                {loadingTs ? <Skeleton className="w-full h-[380px]" /> : (
                  <PlotlyChart
                    dataTestId="plot-gyro-magnitude"
                    title="Gyroscope Magnitude"
                    data={magnitudeTraces("gyro_magnitude")}
                    height={380}
                    filename={`gyro_magnitude_subject_${tsData.subject}`}
                    layout={{
                      xaxis: { title: "time_step" },
                      yaxis: { title: "gyro_magnitude" },
                      legend: { title: { text: "activity" } },
                    }}
                  />
                )}
              </Card>
            </div>

            <div>
              <h3 className="font-display font-bold text-lg text-sky-ink mt-2">
                Raw axis signals{" "}
                <span className="font-body font-normal text-sky-deep/70 text-base">
                  (acc_x, acc_y, acc_z)
                </span>
              </h3>
            </div>

            <Card className="!p-4" dataTestId="chart-raw-axes">
              {loadingTs ? <Skeleton className="w-full h-[380px]" /> : (
                <PlotlyChart
                  dataTestId="plot-raw-axes"
                  title="Accelerometer Axes Over Time"
                  data={rawAxesTraces}
                  height={380}
                  filename={`acc_axes_subject_${tsData.subject}`}
                  layout={{
                    xaxis: { title: "time_step" },
                    yaxis: { title: "value" },
                    legend: { title: { text: "variable" } },
                  }}
                />
              )}
            </Card>
          </div>
        )}

        {/* Raw Table tab */}
        {tab === "table" && (
          <div className="mt-4 space-y-4" data-testid="table-panel">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-deep/60" />
                <input
                  data-testid="data-search-input"
                  value={search}
                  onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                  placeholder="Search activity or device"
                  className="w-full pl-9 pr-3 py-2.5 rounded-full bg-white/60 border border-white/70 outline-none focus:border-sky-deep/50 text-sm"
                />
              </div>
              <Pagination page={page} setPage={setPage} totalPages={totalPages} />
            </div>

            {/* Activity legend */}
            {schema && (
              <div className="flex flex-wrap gap-2" data-testid="activity-legend">
                <span className="text-eyebrow mr-2 self-center">Activities:</span>
                {schema.activity_labels.map(a => (
                  <Chip key={a.label} color={a.color}>{a.emoji} {a.label}</Chip>
                ))}
              </div>
            )}

            <Card className="!p-0 overflow-hidden" dataTestId="data-table-card">
              <div className="p-4 flex items-center justify-between border-b border-white/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-sky-500/10 text-sky-deep">
                    <Database size={18} />
                  </div>
                  <div>
                    <div className="font-display font-semibold text-sky-ink">Dataset Rows</div>
                    <div className="text-xs text-sky-deep/70">{total.toLocaleString()} matches</div>
                  </div>
                </div>
                <span className="text-xs text-sky-deep/70 font-mono">Page {page} / {totalPages}</span>
              </div>
              <div className="overflow-x-auto max-h-[520px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white/70 backdrop-blur-md">
                    <tr>
                      {displayCols.map(c => (
                        <th key={c} className="text-left px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-sky-deep">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingRows ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i}><td colSpan={displayCols.length} className="p-3"><Skeleton className="h-6" /></td></tr>
                      ))
                    ) : rows.length === 0 ? (
                      <tr><td colSpan={displayCols.length} className="p-8 text-center text-sky-deep/60">No rows match your filters.</td></tr>
                    ) : (
                      rows.map((r, i) => (
                        <tr key={r.row_id ?? i} className="border-t border-white/40 hover:bg-white/30 transition" data-testid={`data-row-${i}`}>
                          {displayCols.map(c => (
                            <td key={c} className="px-4 py-2.5 whitespace-nowrap">
                              {c === "activity" ? (
                                <Chip color={activityColorMap[r[c]] ?? "#0284c7"}>
                                  {schema?.activity_labels?.find(a => a.label === r[c])?.emoji} {r[c]}
                                </Chip>
                              ) : NUMERIC_COLS.includes(c) ? (
                                <span className="font-mono text-sky-ink/90">{Number(r[c]).toFixed(4)}</span>
                              ) : (
                                <span className="text-sky-ink/90">{String(r[c])}</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-4 flex items-center justify-between border-t border-white/60">
                <span className="text-xs text-sky-deep/70 font-mono">Page {page} / {totalPages}</span>
                <Pagination page={page} setPage={setPage} totalPages={totalPages} />
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}

function Pagination({ page, setPage, totalPages }) {
  return (
    <div className="flex items-center gap-1">
      <button
        data-testid="pagination-prev"
        disabled={page <= 1}
        onClick={() => setPage(p => Math.max(1, p - 1))}
        className="p-2 rounded-full bg-white/60 hover:bg-white/90 border border-white/70 disabled:opacity-40 transition"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        data-testid="pagination-next"
        disabled={page >= totalPages}
        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
        className="p-2 rounded-full bg-white/60 hover:bg-white/90 border border-white/70 disabled:opacity-40 transition"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
