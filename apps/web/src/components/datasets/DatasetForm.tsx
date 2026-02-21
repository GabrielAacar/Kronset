import { useEffect, useMemo, useState } from "react";
import SqlEditor from "@/components/shared/SqlEditor";
import { listConnections, type Connection } from "@/services/connectionsService";
import type { Dataset, DatasetPayload } from "@/services/datasetsService";
import styles from "./DatasetForm.module.css";

type Props = {
  initial?: Dataset;
  onCancel?: () => void;
  onSave: (data: DatasetPayload) => Promise<void> | void;
  showTitle?: boolean;
};

function formatOverrides(overrides: Record<string, any> | undefined): string {
  if (!overrides || Object.keys(overrides).length === 0) return "{}";
  return JSON.stringify(overrides, null, 2);
}

export default function DatasetForm({ initial, onCancel, onSave, showTitle = true }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [connectionId, setConnectionId] = useState(initial?.connection_id ?? "");
  const [baseSql, setBaseSql] = useState(initial?.base_sql ?? "");
  const [overridesText, setOverridesText] = useState(formatOverrides(initial?.overrides));
  const [connections, setConnections] = useState<Connection[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadConnections() {
      try {
        const rows = await listConnections();
        setConnections(rows);
      } catch (err: any) {
        setError(err?.message || "Erro ao carregar conexoes.");
      }
    }
    void loadConnections();
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
    if (!name.trim()) {
      setError("Nome e obrigatorio.");
      return;
    }
    if (!connectionId) {
      setError("Conexao e obrigatoria.");
      return;
    }
    if (!baseSql.trim()) {
      setError("Base SQL e obrigatoria.");
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
        connection_id: connectionId,
        name: name.trim(),
        description: description.trim(),
        base_sql: baseSql,
        overrides: JSON.parse(overridesText || "{}"),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.form}>
      {showTitle ? <h3 className={styles.title}>{initial ? "Editar Dataset" : "Novo Dataset"}</h3> : null}

      <div className={styles.row}>
        <label className={styles.label} htmlFor="dataset-name">Nome</label>
        <input
          id="dataset-name"
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Vendas Mensais"
        />
      </div>

      <div className={styles.row}>
        <label className={styles.label} htmlFor="dataset-description">Descricao</label>
        <input
          id="dataset-description"
          className={styles.input}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Dataset para analise de vendas"
        />
      </div>

      <div className={styles.row}>
        <label className={styles.label} htmlFor="dataset-connection">Conexao</label>
        <select
          id="dataset-connection"
          className={styles.select}
          value={connectionId}
          onChange={(e) => setConnectionId(e.target.value)}
        >
          <option value="">Selecione uma conexao</option>
          {connections.map((conn) => (
            <option key={conn.id} value={conn.id}>
              {conn.name} ({conn.db_type})
            </option>
          ))}
        </select>
      </div>

      <div className={styles.row}>
        <label className={styles.label}>Base SQL</label>
        <SqlEditor value={baseSql} onChange={setBaseSql} height="220px" />
      </div>

      <div className={styles.row}>
        <label className={styles.label} htmlFor="dataset-overrides">Overrides (JSON)</label>
        <textarea
          id="dataset-overrides"
          className={styles.textarea}
          value={overridesText}
          onChange={(e) => setOverridesText(e.target.value)}
          placeholder="{}"
        />
        {overridesError ? <p className={styles.error}>{overridesError}</p> : null}
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
