import { useEffect, useState } from "react";
import { listDatasets, type Dataset } from "@/services/datasetsService";
import type { Metric, MetricPayload, MetricType } from "@/services/metricsService";
import styles from "./MetricForm.module.css";

type RatioPart = {
  type: Exclude<MetricType, "ratio">;
  field: string;
};

type Props = {
  initial?: Metric;
  datasetId?: string;
  onCancel?: () => void;
  onSave: (payload: MetricPayload) => Promise<void> | void;
  showTitle?: boolean;
};

function ensureMetricConfig(
  metricType: MetricType,
  field: string,
  numerator: RatioPart,
  denominator: RatioPart,
): Record<string, any> {
  if (metricType === "ratio") {
    return {
      numerator: {
        metric_type: numerator.type,
        config: { field: numerator.field },
      },
      denominator: {
        metric_type: denominator.type,
        config: { field: denominator.field },
      },
    };
  }
  return { field };
}

function parseInitialField(metric?: Metric): string {
  if (!metric || metric.metric_type === "ratio") return "";
  return String(metric.config?.field ?? "");
}

function parseInitialRatioPart(metric: Metric | undefined, key: "numerator" | "denominator"): RatioPart {
  const defaultPart: RatioPart = { type: "sum", field: "" };
  if (!metric || metric.metric_type !== "ratio") return defaultPart;
  const part = metric.config?.[key];
  return {
    type: part?.metric_type ?? "sum",
    field: String(part?.config?.field ?? ""),
  };
}

export default function MetricForm({ initial, datasetId, onCancel, onSave, showTitle = true }: Props) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(initial?.dataset_id ?? datasetId ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [metricType, setMetricType] = useState<MetricType>(initial?.metric_type ?? "sum");
  const [field, setField] = useState(parseInitialField(initial));
  const [numerator, setNumerator] = useState<RatioPart>(parseInitialRatioPart(initial, "numerator"));
  const [denominator, setDenominator] = useState<RatioPart>(parseInitialRatioPart(initial, "denominator"));
  const [format, setFormat] = useState(initial?.format ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const rows = await listDatasets();
        setDatasets(rows);
      } catch (err: any) {
        setError(err?.message || "Erro ao carregar datasets.");
      }
    }
    void load();
  }, []);

  function handleMetricTypeChange(nextType: MetricType) {
    setMetricType(nextType);
    if (nextType === "count" && !field.trim()) {
      setField("*");
    }
  }

  async function handleSave() {
    if (!selectedDatasetId) {
      setError("Dataset e obrigatorio.");
      return;
    }
    if (!name.trim()) {
      setError("Nome e obrigatorio.");
      return;
    }

    if (metricType === "ratio") {
      if (!numerator.field.trim() || !denominator.field.trim()) {
        setError("Numerador e denominador precisam de field.");
        return;
      }
    } else if (!field.trim()) {
      setError("Field e obrigatorio.");
      return;
    }

    setError("");
    setSaving(true);
    try {
      const normalizedField = metricType === "count" ? field.trim() || "*" : field.trim();
      await onSave({
        dataset_id: selectedDatasetId,
        name: name.trim(),
        description: description.trim(),
        metric_type: metricType,
        config: ensureMetricConfig(metricType, normalizedField, numerator, denominator),
        format: format.trim(),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.form}>
      {showTitle ? <h3 className={styles.title}>{initial ? "Editar Metrica" : "Nova Metrica"}</h3> : null}

      <div className={styles.row}>
        <label className={styles.label} htmlFor="metric-dataset">Dataset</label>
        <select
          id="metric-dataset"
          className={styles.select}
          value={selectedDatasetId}
          onChange={(e) => setSelectedDatasetId(e.target.value)}
        >
          <option value="">Selecione um dataset</option>
          {datasets.map((dataset) => (
            <option key={dataset.id} value={dataset.id}>
              {dataset.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.row}>
        <label className={styles.label} htmlFor="metric-name">Nome</label>
        <input
          id="metric-name"
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ex: total_vendas"
        />
      </div>

      <div className={styles.row}>
        <label className={styles.label} htmlFor="metric-description">Descricao</label>
        <input
          id="metric-description"
          className={styles.input}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descricao opcional"
        />
      </div>

      <div className={styles.row}>
        <label className={styles.label} htmlFor="metric-type">Tipo da metrica</label>
        <select
          id="metric-type"
          className={styles.select}
          value={metricType}
          onChange={(e) => handleMetricTypeChange(e.target.value as MetricType)}
        >
          <option value="sum">sum</option>
          <option value="count">count</option>
          <option value="count_distinct">count_distinct</option>
          <option value="avg">avg</option>
          <option value="ratio">ratio</option>
        </select>
      </div>

      {metricType !== "ratio" ? (
        <div className={styles.row}>
          <label className={styles.label} htmlFor="metric-field">Field</label>
          <input
            id="metric-field"
            className={styles.input}
            value={field}
            onChange={(e) => setField(e.target.value)}
            placeholder={metricType === "count" ? "*" : "nome_coluna"}
          />
        </div>
      ) : (
        <div className={styles.ratioGrid}>
          <div className={styles.ratioBlock}>
            <p className={styles.ratioTitle}>Numerador</p>
            <div className={styles.row}>
              <label className={styles.label} htmlFor="metric-numerator-type">Tipo</label>
              <select
                id="metric-numerator-type"
                className={styles.select}
                value={numerator.type}
                onChange={(e) => setNumerator((prev) => ({ ...prev, type: e.target.value as Exclude<MetricType, "ratio"> }))}
              >
                <option value="sum">sum</option>
                <option value="count">count</option>
                <option value="count_distinct">count_distinct</option>
                <option value="avg">avg</option>
              </select>
            </div>
            <div className={styles.row}>
              <label className={styles.label} htmlFor="metric-numerator-field">Field</label>
              <input
                id="metric-numerator-field"
                className={styles.input}
                value={numerator.field}
                onChange={(e) => setNumerator((prev) => ({ ...prev, field: e.target.value }))}
                placeholder={numerator.type === "count" ? "*" : "nome_coluna"}
              />
            </div>
          </div>

          <div className={styles.ratioBlock}>
            <p className={styles.ratioTitle}>Denominador</p>
            <div className={styles.row}>
              <label className={styles.label} htmlFor="metric-denominator-type">Tipo</label>
              <select
                id="metric-denominator-type"
                className={styles.select}
                value={denominator.type}
                onChange={(e) =>
                  setDenominator((prev) => ({ ...prev, type: e.target.value as Exclude<MetricType, "ratio"> }))
                }
              >
                <option value="sum">sum</option>
                <option value="count">count</option>
                <option value="count_distinct">count_distinct</option>
                <option value="avg">avg</option>
              </select>
            </div>
            <div className={styles.row}>
              <label className={styles.label} htmlFor="metric-denominator-field">Field</label>
              <input
                id="metric-denominator-field"
                className={styles.input}
                value={denominator.field}
                onChange={(e) => setDenominator((prev) => ({ ...prev, field: e.target.value }))}
                placeholder={denominator.type === "count" ? "*" : "nome_coluna"}
              />
            </div>
          </div>
        </div>
      )}

      <div className={styles.row}>
        <label className={styles.label} htmlFor="metric-format">Formato</label>
        <input
          id="metric-format"
          className={styles.input}
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          placeholder="R$ {value} ou {value}%"
        />
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
        {onCancel ? (
          <button type="button" className={styles.button} onClick={onCancel}>
            Cancelar
          </button>
        ) : null}
      </div>
    </section>
  );
}
