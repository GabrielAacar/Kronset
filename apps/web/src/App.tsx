import React, { useEffect, useMemo, useState } from "react";

const API = "http://localhost:8000";

type Dataset = {
  id: string;
  name: string;
  description: string;
  connection_id: string;
  base_sql: string;
};

type Dimension = {
  id: string;
  dataset_id: string;
  name: string;
  description: string;
  expression: string;
  data_type: string;
};

type Metric = {
  id: string;
  dataset_id: string;
  name: string;
  description: string;
  metric_type: string;
};

type QueryResponse = {
  sql: string;
  rows: Record<string, any>[];
};

function MultiSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 12, opacity: 0.8 }}>{label}</div>
      <select
        multiple
        value={value}
        onChange={(e) => {
          const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
          onChange(selected);
        }}
        style={{
          minHeight: 140,
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 10,
          background: "#fff",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <div style={{ fontSize: 12, opacity: 0.6 }}>
        Dica: Ctrl/Cmd para selecionar múltiplos
      </div>
    </div>
  );
}

export default function App() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [datasetId, setDatasetId] = useState<string>("3bb48514-80fc-4ca7-9c6e-23dc34eb84ac");

  const [dims, setDims] = useState<Dimension[]>([]);
  const [mets, setMets] = useState<Metric[]>([]);

  const [selectedDims, setSelectedDims] = useState<string[]>(["zone"]);
  const [selectedMets, setSelectedMets] = useState<string[]>(["sum_units"]);

  const [limit, setLimit] = useState<number>(500);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<QueryResponse | null>(null);

  useEffect(() => {
    fetch(`${API}/datasets`)
      .then((r) => r.json())
      .then((data) => setDatasets(data))
      .catch(() => setDatasets([]));
  }, []);

  useEffect(() => {
    if (!datasetId) return;

    setError("");
    setResult(null);

    Promise.all([
      fetch(`${API}/datasets/${datasetId}/dimensions`).then((r) => r.json()),
      fetch(`${API}/datasets/${datasetId}/metrics`).then((r) => r.json()),
    ])
      .then(([d, m]) => {
        setDims(d);
        setMets(m);
      })
      .catch(() => {
        setDims([]);
        setMets([]);
      });
  }, [datasetId]);

  const dimOptions = useMemo(
    () => dims.map((d) => ({ value: d.name, label: d.description ? `${d.name} — ${d.description}` : d.name })),
    [dims]
  );

  const metOptions = useMemo(
    () => mets.map((m) => ({ value: m.name, label: m.description ? `${m.name} — ${m.description}` : m.name })),
    [mets]
  );

  const tableColumns = useMemo(() => {
    if (!result?.rows?.length) return [];
    const first = result.rows[0];
    return Object.keys(first);
  }, [result]);

  async function runQuery() {
    setLoading(true);
    setError("");
    try {
      const payload = {
        dataset_id: datasetId,
        metrics: selectedMets,
        dimensions: selectedDims,
        filters: [],
        limit,
      };

      const res = await fetch(`${API}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`${res.status} ${res.statusText}: ${txt}`);
      }

      const data = (await res.json()) as QueryResponse;
      setResult(data);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: "system-ui", padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
        <div>
          <h1 style={{ margin: 0 }}>Kronset</h1>
          <p style={{ margin: "6px 0 0", opacity: 0.75 }}>Explore (MVP) — metrics first, dashboards next.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <label style={{ fontSize: 12, opacity: 0.8 }}>Limit</label>
          <input
            type="number"
            value={limit}
            min={1}
            max={5000}
            onChange={(e) => setLimit(Number(e.target.value))}
            style={{ width: 100, padding: 8, borderRadius: 10, border: "1px solid #ddd" }}
          />
          <button
            onClick={runQuery}
            disabled={loading || !datasetId}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #111",
              background: loading ? "#eee" : "#111",
              color: loading ? "#111" : "#fff",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Running..." : "Run"}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 16 }}>
        <div style={{ border: "1px solid #eee", borderRadius: 16, padding: 16, background: "#fff" }}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Dataset</div>
          <select
            value={datasetId}
            onChange={(e) => setDatasetId(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd", background: "#fff" }}
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.65 }}>
            {datasets.find((d) => d.id === datasetId)?.description || "—"}
          </div>
          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.65 }}>
            <div style={{ marginBottom: 4 }}>Dataset ID:</div>
            <code>{datasetId || "—"}</code>
          </div>
        </div>

        <div style={{ border: "1px solid #eee", borderRadius: 16, padding: 16, background: "#fff" }}>
          <MultiSelect label="Dimensions" options={dimOptions} value={selectedDims} onChange={setSelectedDims} />
        </div>

        <div style={{ border: "1px solid #eee", borderRadius: 16, padding: 16, background: "#fff" }}>
          <MultiSelect label="Metrics" options={metOptions} value={selectedMets} onChange={setSelectedMets} />
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 16, padding: 12, borderRadius: 12, border: "1px solid #f2c2c2", background: "#fff5f5" }}>
          <b>Error</b>
          <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{error}</div>
        </div>
      )}

      <div style={{ marginTop: 16, border: "1px solid #eee", borderRadius: 16, padding: 16, background: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h3 style={{ margin: 0 }}>Result</h3>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Rows: {result?.rows?.length ?? 0}
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Generated SQL</div>
          <pre style={{ margin: 0, padding: 12, background: "#fafafa", border: "1px solid #eee", borderRadius: 12, overflowX: "auto" }}>
            {result?.sql ?? "—"}
          </pre>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Table</div>
          {!result?.rows?.length ? (
            <div style={{ opacity: 0.7 }}>No rows.</div>
          ) : (
            <div style={{ overflowX: "auto", border: "1px solid #eee", borderRadius: 12 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {tableColumns.map((c) => (
                      <th
                        key={c}
                        style={{
                          textAlign: "left",
                          fontSize: 12,
                          padding: "10px 12px",
                          borderBottom: "1px solid #eee",
                          background: "#fcfcfc",
                        }}
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, idx) => (
                    <tr key={idx}>
                      {tableColumns.map((c) => (
                        <td key={c} style={{ padding: "10px 12px", borderBottom: "1px solid #f3f3f3", fontSize: 13 }}>
                          {String(row[c] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
