import React, { useEffect, useMemo, useState } from "react";
import ChartWidget from "./components/ChartWidget";
import CardWidget from "./components/CardWidget";
import Modal from "./components/Modal";
import BottomDrawer from "./components/BottomDrawer";
import { PageModel, Widget, WidgetChart, WidgetCard, ChartType, SeriesType, WidgetSeries, CalcType } from "./types";

const API = "http://localhost:8000";

type Dataset = { id: string; name: string; description: string };
type Dimension = { name: string; description: string; data_type: string };
type Metric = { name: string; description: string; metric_type: string };

function uid() {
  return crypto.randomUUID();
}

function pillStyle(active: boolean) {
  return {
    border: "1px solid " + (active ? "#111" : "#e5e5e5"),
    background: active ? "#111" : "#fff",
    color: active ? "#fff" : "#111",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    cursor: "pointer",
  } as React.CSSProperties;
}

export default function App() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [dims, setDims] = useState<Dimension[]>([]);
  const [mets, setMets] = useState<Metric[]>([]);

  const [page, setPage] = useState<PageModel>({
    id: uid(),
    name: "My first page",
    datasetId: "3bb48514-80fc-4ca7-9c6e-23dc34eb84ac",
    widgets: [
      {
        id: uid(),
        type: "card",
        title: "Total Units",
        metric: "sum_units",
      } as WidgetCard,
      {
        id: uid(),
        type: "chart",
        title: "Units by Zone",
        chartType: "combined",
        dimension: "zone",
        series: [{ id: uid(), metric: "sum_units", type: "bar", name: "Units" }],
        limit: 500,
      } as WidgetChart,
    ],
  });

  const [selectedId, setSelectedId] = useState<string>(page.widgets[0]?.id ?? "");
  const selectedWidget = useMemo(() => page.widgets.find((w) => w.id === selectedId), [page.widgets, selectedId]);

  const [results, setResults] = useState<Record<string, { sql: string; rows: any[] }>>({});
  const [error, setError] = useState<string>("");

  // modals
  const [openData, setOpenData] = useState(false);
  const [openChart, setOpenChart] = useState(false);
  const [openCard, setOpenCard] = useState(false);

  // bottom drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showSQL, setShowSQL] = useState(false);

  useEffect(() => {
    fetch(`${API}/datasets`).then((r) => r.json()).then(setDatasets).catch(() => setDatasets([]));
  }, []);

  useEffect(() => {
    if (!page.datasetId) return;
    Promise.all([
      fetch(`${API}/datasets/${page.datasetId}/dimensions`).then((r) => r.json()),
      fetch(`${API}/datasets/${page.datasetId}/metrics`).then((r) => r.json()),
    ])
      .then(([d, m]) => {
        setDims(d);
        setMets(m);
      })
      .catch(() => {
        setDims([]);
        setMets([]);
      });
  }, [page.datasetId]);

  const dimOptions = useMemo(
    () => dims.map((d) => ({ value: d.name, label: d.description ? `${d.name} — ${d.description}` : d.name })),
    [dims]
  );
  const metOptions = useMemo(
    () => mets.map((m) => ({ value: m.name, label: m.description ? `${m.name} — ${m.description}` : m.name })),
    [mets]
  );

  function updateWidget(id: string, patch: Partial<Widget>) {
    setPage((p) => ({
      ...p,
      widgets: p.widgets.map((w) => (w.id === id ? ({ ...w, ...patch } as Widget) : w)),
    }));
  }

  function addCard() {
    const w: WidgetCard = { id: uid(), type: "card", title: "New KPI", metric: "" };
    setPage((p) => ({ ...p, widgets: [w, ...p.widgets] }));
    setSelectedId(w.id);
  }

  function addChart() {
    const w: WidgetChart = { id: uid(), type: "chart", title: "New Chart", chartType: "combined", dimension: "", series: [], limit: 500 };
    setPage((p) => ({ ...p, widgets: [w, ...p.widgets] }));
    setSelectedId(w.id);
  }

  function addSeries(widgetId: string) {
    setPage((p) => ({
      ...p,
      widgets: p.widgets.map((w) => {
        if (w.id !== widgetId || w.type !== "chart") return w;
        const nw: WidgetChart = { ...w, series: [...w.series, { id: uid(), metric: "", type: "line", name: "" }] };
        return nw;
      }),
    }));
  }

  function updateSeries(widgetId: string, seriesId: string, patch: Partial<WidgetSeries>) {
    setPage((p) => ({
      ...p,
      widgets: p.widgets.map((w) => {
        if (w.id !== widgetId || w.type !== "chart") return w;
        const nw: WidgetChart = { ...w, series: w.series.map((s) => (s.id === seriesId ? { ...s, ...patch } : s)) };
        return nw;
      }),
    }));
  }

  function removeSeries(widgetId: string, seriesId: string) {
    setPage((p) => ({
      ...p,
      widgets: p.widgets.map((w) => {
        if (w.id !== widgetId || w.type !== "chart") return w;
        const nw: WidgetChart = { ...w, series: w.series.filter((s) => s.id !== seriesId) };
        return nw;
      }),
    }));
  }

  async function runWidget(widget: Widget) {
    setError("");
    try {
      // chart: usa /query com métricas cadastradas
      if (widget.type === "chart") {
        const metricNames = widget.series.map((s) => s.metric).filter(Boolean);
        const payload = {
          dataset_id: page.datasetId,
          metrics: metricNames,
          dimensions: widget.dimension ? [widget.dimension] : [],
          filters: [],
          limit: widget.limit,
        };

        const res = await fetch(`${API}/query`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setResults((r) => ({ ...r, [widget.id]: data }));
        setDrawerOpen(true);
        return;
      }

      // card: metric cadastrada
      if (widget.metric && !widget.adhoc) {
        const payload = { dataset_id: page.datasetId, metrics: [widget.metric], dimensions: [], filters: [], limit: 1 };
        const res = await fetch(`${API}/query`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setResults((r) => ({ ...r, [widget.id]: data }));
        setDrawerOpen(true);
        return;
      }

      // card: adhoc via /query_v2
      if (widget.adhoc) {
        const calc = widget.adhoc.calc_type;
        if (calc === "min" || calc === "max") throw new Error("min/max not implemented yet (next step).");

        const metric_type =
          calc === "count" ? "count" :
          calc === "count_distinct" ? "count_distinct" :
          calc === "avg" ? "avg" : "sum";

        const config: any = {};
        if (metric_type === "count") config.field = widget.adhoc.field ? widget.adhoc.field : "*";
        else {
          if (!widget.adhoc.field) throw new Error(`${calc} requires field`);
          config.field = widget.adhoc.field;
        }

        const payload = {
          dataset_id: page.datasetId,
          metrics: [{ alias: widget.adhoc.alias || "value", metric_type, config }],
          dimensions: [],
          filters: [],
          limit: 1,
        };

        const res = await fetch(`${API}/query_v2`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setResults((r) => ({ ...r, [widget.id]: data }));
        setDrawerOpen(true);
        return;
      }

      throw new Error("Card needs metric or adhoc");
    } catch (e: any) {
      setError(e?.message ?? "Query error");
    }
  }

  function cardValue(widget: WidgetCard): string {
    const res = results[widget.id];
    if (!res?.rows?.length) return "—";
    const row = res.rows[0];
    if (widget.metric) return String(row[widget.metric] ?? "—");
    if (widget.adhoc?.alias) return String(row[widget.adhoc.alias] ?? "—");
    return "—";
  }

  // Table preview (selected widget)
  const preview = selectedWidget ? results[selectedWidget.id] : undefined;

  return (
    <div style={{ fontFamily: "system-ui", background: "#f6f6f6", minHeight: "100vh", paddingBottom: 330 }}>
      {/* HEADER */}
      <header
        style={{
          height: 64,
          background: "#fff",
          borderBottom: "1px solid #eee",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
          <div style={{ fontWeight: 900 }}>Kronset</div>
          <div style={{ opacity: 0.6, fontSize: 12 }}>Page Builder</div>
          <input
            value={page.name}
            onChange={(e) => setPage((p) => ({ ...p, name: e.target.value }))}
            style={{ marginLeft: 8, border: "1px solid #eee", borderRadius: 10, padding: "8px 10px", minWidth: 220 }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Dataset</div>
          <select
            value={page.datasetId}
            onChange={(e) => {
              setResults({});
              setPage((p) => ({ ...p, datasetId: e.target.value }));
            }}
            style={{ padding: 9, borderRadius: 10, border: "1px solid #eee", background: "#fff" }}
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <button onClick={addCard} style={{ border: "1px solid #111", background: "#111", color: "#fff", borderRadius: 12, padding: "9px 12px" }}>
            + Card
          </button>
          <button onClick={addChart} style={{ border: "1px solid #eee", background: "#fff", borderRadius: 12, padding: "9px 12px" }}>
            + Chart
          </button>
        </div>
      </header>

      {/* BODY LAYOUT */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 14, padding: 14 }}>
        {/* ASIDE: widget list + actions */}
        <aside style={{ position: "sticky", top: 78, alignSelf: "start" }}>
          <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: 12, borderBottom: "1px solid #eee" }}>
              <div style={{ fontWeight: 900, fontSize: 13 }}>Widgets</div>
              <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
                Selecione um widget para editar.
              </div>
            </div>

            <div style={{ maxHeight: 320, overflow: "auto" }}>
              {page.widgets.map((w) => {
                const active = w.id === selectedId;
                return (
                  <button
                    key={w.id}
                    onClick={() => setSelectedId(w.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 12px",
                      border: "none",
                      borderBottom: "1px solid #f3f3f3",
                      background: active ? "#f7f7f7" : "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {w.title}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.6 }}>{w.type}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Inspector */}
            <div style={{ padding: 12 }}>
              {!selectedWidget ? (
                <div style={{ fontSize: 12, opacity: 0.7 }}>Selecione um widget.</div>
              ) : (
                <>
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10 }}>Inspector</div>

                  <input
                    value={selectedWidget.title}
                    onChange={(e) => updateWidget(selectedWidget.id, { title: e.target.value } as any)}
                    style={{ width: "100%", border: "1px solid #eee", borderRadius: 12, padding: "10px 10px" }}
                  />

                  <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button style={pillStyle(false)} onClick={() => setOpenData(true)}>Data</button>

                    {selectedWidget.type === "chart" ? (
                      <button style={pillStyle(false)} onClick={() => setOpenChart(true)}>Chart</button>
                    ) : (
                      <button style={pillStyle(false)} onClick={() => setOpenCard(true)}>Card</button>
                    )}

                    <button
                      style={pillStyle(true)}
                      onClick={() => runWidget(selectedWidget)}
                    >
                      Run
                    </button>
                  </div>

                  {error ? (
                    <div style={{ marginTop: 10, padding: 10, borderRadius: 12, border: "1px solid #f2c2c2", background: "#fff5f5" }}>
                      <div style={{ fontWeight: 800, fontSize: 12 }}>Error</div>
                      <div style={{ fontSize: 12, marginTop: 6, whiteSpace: "pre-wrap" }}>{error}</div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </aside>

        {/* MAIN: Canvas */}
        <main>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {page.widgets.map((w) => {
              const active = w.id === selectedId;
              const rows = results[w.id]?.rows ?? [];

              return (
                <div
                  key={w.id}
                  onClick={() => setSelectedId(w.id)}
                  style={{
                    background: "#fff",
                    border: active ? "2px solid #111" : "1px solid #eee",
                    borderRadius: 16,
                    padding: 14,
                    cursor: "pointer",
                    boxShadow: active ? "0 12px 26px rgba(0,0,0,0.08)" : "none",
                    transition: "all 120ms ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontWeight: 900 }}>{w.title}</div>
                    <div style={{ fontSize: 12, opacity: 0.6 }}>
                      {w.type === "card" ? "KPI" : `rows: ${rows.length}`}
                    </div>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    {w.type === "card" ? (
                      <CardWidget
                        title={w.title}
                        value={cardValue(w)}
                        subtitle={w.metric ? `metric: ${w.metric}` : w.adhoc ? `adhoc: ${w.adhoc.calc_type}(${w.adhoc.field || "*"})` : "not configured"}
                      />
                    ) : (
                      <ChartWidget chartType={w.chartType} rows={rows} dimension={w.dimension} series={w.series} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* MODAL: Data (per widget) */}
      <Modal
        open={openData && !!selectedWidget}
        title="Data"
        onClose={() => setOpenData(false)}
      >
        {!selectedWidget ? null : selectedWidget.type === "chart" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Dimension (x-axis)</div>
              <select
                value={selectedWidget.dimension}
                onChange={(e) => updateWidget(selectedWidget.id, { dimension: e.target.value } as any)}
                style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #eee" }}
              >
                <option value="">-- select --</option>
                {dimOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Limit</div>
              <input
                type="number"
                value={selectedWidget.limit}
                min={1}
                max={5000}
                onChange={(e) => updateWidget(selectedWidget.id, { limit: Number(e.target.value) } as any)}
                style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #eee" }}
              />
            </div>

            <div style={{ gridColumn: "1 / span 2" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Series</div>
                <button
                  onClick={() => addSeries(selectedWidget.id)}
                  style={{ border: "1px solid #eee", background: "#fff", borderRadius: 12, padding: "8px 10px" }}
                >
                  + Add series
                </button>
              </div>

              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                {selectedWidget.series.map((s) => (
                  <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1fr 130px 42px", gap: 10 }}>
                    <select
                      value={s.metric}
                      onChange={(e) => updateSeries(selectedWidget.id, s.id, { metric: e.target.value })}
                      style={{ padding: 10, borderRadius: 12, border: "1px solid #eee" }}
                    >
                      <option value="">-- metric --</option>
                      {metOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={s.type}
                      onChange={(e) => updateSeries(selectedWidget.id, s.id, { type: e.target.value as SeriesType })}
                      style={{ padding: 10, borderRadius: 12, border: "1px solid #eee" }}
                    >
                      <option value="line">line</option>
                      <option value="bar">bar</option>
                      <option value="scatter">scatter</option>
                      <option value="area">area</option>
                    </select>

                    <button
                      onClick={() => removeSeries(selectedWidget.id, s.id)}
                      style={{ border: "1px solid #eee", background: "#fff", borderRadius: 12 }}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>KPI source</div>

            <select
              value={(selectedWidget.metric ?? "") as any}
              onChange={(e) => updateWidget(selectedWidget.id, { metric: e.target.value, adhoc: undefined } as any)}
              style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #eee" }}
            >
              <option value="">-- saved metric --</option>
              {metOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <div style={{ textAlign: "center", fontSize: 12, opacity: 0.5 }}>or</div>

            <div style={{ border: "1px dashed #e5e5e5", borderRadius: 14, padding: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 12, marginBottom: 10 }}>Ad-hoc metric</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <select
                  value={selectedWidget.adhoc?.calc_type ?? "sum"}
                  onChange={(e) =>
                    updateWidget(selectedWidget.id, {
                      metric: "",
                      adhoc: {
                        alias: selectedWidget.adhoc?.alias ?? "value",
                        calc_type: e.target.value as CalcType,
                        field: selectedWidget.adhoc?.field ?? "",
                      },
                    } as any)
                  }
                  style={{ padding: 10, borderRadius: 12, border: "1px solid #eee" }}
                >
                  <option value="sum">sum</option>
                  <option value="avg">avg</option>
                  <option value="count">count</option>
                  <option value="count_distinct">count_distinct</option>
                  <option value="min">min (next)</option>
                  <option value="max">max (next)</option>
                </select>

                <input
                  placeholder="alias (ex: value)"
                  value={selectedWidget.adhoc?.alias ?? "value"}
                  onChange={(e) =>
                    updateWidget(selectedWidget.id, {
                      metric: "",
                      adhoc: {
                        alias: e.target.value,
                        calc_type: selectedWidget.adhoc?.calc_type ?? "sum",
                        field: selectedWidget.adhoc?.field ?? "",
                      },
                    } as any)
                  }
                  style={{ padding: 10, borderRadius: 12, border: "1px solid #eee" }}
                />

                <input
                  placeholder="field (ex: units)"
                  value={selectedWidget.adhoc?.field ?? ""}
                  onChange={(e) =>
                    updateWidget(selectedWidget.id, {
                      metric: "",
                      adhoc: {
                        alias: selectedWidget.adhoc?.alias ?? "value",
                        calc_type: selectedWidget.adhoc?.calc_type ?? "sum",
                        field: e.target.value,
                      },
                    } as any)
                  }
                  style={{ gridColumn: "1 / span 2", padding: 10, borderRadius: 12, border: "1px solid #eee" }}
                />
              </div>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>
                Ad-hoc usa <code>/query_v2</code>.
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: Chart (apenas chartType por enquanto) */}
      <Modal open={openChart && !!selectedWidget && selectedWidget.type === "chart"} title="Chart" onClose={() => setOpenChart(false)}>
        {selectedWidget && selectedWidget.type === "chart" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Chart type</div>
            <select
              value={selectedWidget.chartType}
              onChange={(e) => updateWidget(selectedWidget.id, { chartType: e.target.value as any } as any)}
              style={{ padding: 10, borderRadius: 12, border: "1px solid #eee" }}
            >
              <option value="combined">combined</option>
              <option value="pie">pie</option>
              <option value="heatmap">heatmap</option>
            </select>

            <div style={{ fontSize: 12, opacity: 0.6 }}>
              (Style options: próximas sprints — cor, gridlines, legend etc.)
            </div>
          </div>
        ) : null}
      </Modal>

      {/* MODAL: Card (por enquanto só placeholder, Data já cobre) */}
      <Modal open={openCard && !!selectedWidget && selectedWidget.type === "card"} title="Card" onClose={() => setOpenCard(false)}>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Card é configurado em <b>Data</b> (saved metric ou ad-hoc). Estilos depois.
        </div>
      </Modal>

      {/* BOTTOM DRAWER: table preview */}
      <BottomDrawer
        open={drawerOpen}
        onToggle={() => setDrawerOpen((v) => !v)}
        title={`Data preview — ${selectedWidget?.title ?? "no widget selected"}`}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Rows: {preview?.rows?.length ?? 0}
          </div>
          <button
            onClick={() => setShowSQL((v) => !v)}
            style={{ border: "1px solid #eee", background: "#fff", borderRadius: 12, padding: "8px 10px" }}
          >
            {showSQL ? "Hide SQL" : "Show SQL"}
          </button>
        </div>

        {showSQL && (
          <pre style={{ margin: 0, padding: 12, background: "#fafafa", border: "1px solid #eee", borderRadius: 12, overflowX: "auto", fontSize: 12 }}>
            {preview?.sql ?? "—"}
          </pre>
        )}

        <div style={{ marginTop: 12 }}>
          {!preview?.rows?.length ? (
            <div style={{ fontSize: 12, opacity: 0.7 }}>No data.</div>
          ) : (
            <Table rows={preview.rows} />
          )}
        </div>
      </BottomDrawer>
    </div>
  );
}

function Table({ rows }: { rows: Record<string, any>[] }) {
  const cols = Object.keys(rows[0] ?? {});
  return (
    <div style={{ overflowX: "auto", border: "1px solid #eee", borderRadius: 12 }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c} style={{ textAlign: "left", fontSize: 12, padding: "10px 12px", borderBottom: "1px solid #eee", background: "#fcfcfc" }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx}>
              {cols.map((c) => (
                <td key={c} style={{ padding: "10px 12px", borderBottom: "1px solid #f3f3f3", fontSize: 13 }}>
                  {String(r[c] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
