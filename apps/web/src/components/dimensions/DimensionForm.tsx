import { useEffect, useMemo, useState } from "react";
import SqlEditor from "@/components/shared/SqlEditor";
import { listDatasets, type Dataset } from "@/services/datasetsService";
import type { Dimension, DimensionPayload } from "@/services/dimensionsService";
import styles from "./DimensionForm.module.css";

type Props = {
  initial?: Dimension;
  datasetId?: string;
  onCancel?: () => void;
  onSave: (payload: DimensionPayload) => Promise<void> | void;
  showTitle?: boolean;
};

function formatOverrides(overrides: Record<string, any> | undefined): string {
  if (!overrides || Object.keys(overrides).length === 0) return "{}";
  return JSON.stringify(overrides, null, 2);
}

export default function DimensionForm({ initial, datasetId, onCancel, onSave, showTitle = true }: Props) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(initial?.dataset_id ?? datasetId ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [expression, setExpression] = useState(initial?.expression ?? "");
  const [dataType, setDataType] = useState(initial?.data_type ?? "text");
  const [overridesText, setOverridesText] = useState(formatOverrides(initial?.overrides));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(Boolean(initial?.overrides && Object.keys(initial.overrides).length));

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

  const overridesError = useMemo(() => {
    try {
      JSON.parse(overridesText || "{}");
      return "";
    } catch {
      return "Overrides deve ser um JSON valido.";
    }
  }, [overridesText]);

  async function handleSave() {
    if (!selectedDatasetId) {
      setError("Dataset e obrigatorio.");
      return;
    }
    if (!name.trim()) {
      setError("Nome e obrigatorio.");
      return;
    }
    if (!expression.trim()) {
      setError("Expressao SQL e obrigatoria.");
      return;
    }
    if (overridesError) {
      setError(overridesError);
      return;
    }

    setError("");
    setSaving(true);
    try {
      await onSave({
        dataset_id: selectedDatasetId,
        name: name.trim(),
        description: description.trim(),
        expression,
        data_type: dataType,
        overrides: JSON.parse(overridesText || "{}"),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.form}>
      {showTitle ? <h3 className={styles.title}>{initial ? "Editar Dimensao" : "Nova Dimensao"}</h3> : null}

      <div className={styles.row}>
        <label className={styles.label} htmlFor="dimension-dataset">Dataset</label>
        <select
          id="dimension-dataset"
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
        <label className={styles.label} htmlFor="dimension-name">Nome</label>
        <input
          id="dimension-name"
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ex: data_venda"
        />
      </div>

      <div className={styles.row}>
        <label className={styles.label} htmlFor="dimension-description">Descricao</label>
        <input
          id="dimension-description"
          className={styles.input}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descricao opcional"
        />
      </div>

      <div className={styles.row}>
        <label className={styles.label}>Expressao SQL</label>
        <SqlEditor value={expression} onChange={setExpression} height="180px" />
      </div>

      <div className={styles.row}>
        <label className={styles.label} htmlFor="dimension-data-type">Data Type</label>
        <select
          id="dimension-data-type"
          className={styles.select}
          value={dataType}
          onChange={(e) => setDataType(e.target.value)}
        >
          <option value="text">text</option>
          <option value="number">number</option>
          <option value="date">date</option>
          <option value="boolean">boolean</option>
        </select>
      </div>

      <details className={styles.advancedBox} open={advancedOpen} onToggle={(e) => setAdvancedOpen(e.currentTarget.open)}>
        <summary className={styles.advancedSummary}>Avancado</summary>
        <div className={styles.row}>
          <label className={styles.label} htmlFor="dimension-overrides">Overrides (JSON)</label>
          <textarea
            id="dimension-overrides"
            className={styles.textarea}
            value={overridesText}
            onChange={(e) => setOverridesText(e.target.value)}
            placeholder="{}"
          />
          {overridesError ? <p className={styles.error}>{overridesError}</p> : null}
        </div>
      </details>

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
