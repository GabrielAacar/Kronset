import { useEffect, useMemo, useState } from "react";
import MetricModal from "@/components/metrics/MetricModal";
import { useToastContext } from "@/contexts/ToastContext";
import { listDatasets, type Dataset } from "@/services/datasetsService";
import { deleteMetric, listMetrics, type Metric } from "@/services/metricsService";
import styles from "./MetricsPage.module.css";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

export default function MetricsPage() {
  const { addToast } = useToastContext();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [items, setItems] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<Metric | undefined>();

  const datasetNameById = useMemo(() => {
    const map = new Map<string, string>();
    datasets.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [datasets]);

  useEffect(() => {
    async function loadDatasets() {
      try {
        const rows = await listDatasets();
        setDatasets(rows);
      } catch (err: any) {
        setError(err?.message || "Erro ao carregar datasets.");
      }
    }
    void loadDatasets();
  }, []);

  useEffect(() => {
    async function loadMetrics() {
      setLoading(true);
      setError("");
      try {
        const rows = await listMetrics(selectedDatasetId);
        setItems(rows);
      } catch (err: any) {
        setError(err?.message || "Erro ao carregar metricas.");
      } finally {
        setLoading(false);
      }
    }
    void loadMetrics();
  }, [selectedDatasetId]);

  async function handleDelete(item: Metric) {
    const ok = window.confirm(`Deseja deletar a metrica "${item.name}"?`);
    if (!ok) return;
    try {
      await deleteMetric(item.id);
      addToast("Metrica deletada com sucesso.", "success");
      const rows = await listMetrics(selectedDatasetId);
      setItems(rows);
    } catch (err: any) {
      addToast(err?.message || "Erro ao deletar metrica.", "error");
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Metricas</h1>
          <p className={styles.subtitle}>Gerencie metricas por dataset.</p>
        </div>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={() => {
            setEditingMetric(undefined);
            setModalOpen(true);
          }}
        >
          Nova Metrica
        </button>
      </header>

      <div className={styles.toolbar}>
        <label className={styles.label} htmlFor="filter-dataset-metrics">Dataset</label>
        <select
          id="filter-dataset-metrics"
          className={styles.select}
          value={selectedDatasetId}
          onChange={(e) => setSelectedDatasetId(e.target.value)}
        >
          <option value="">Todos</option>
          {datasets.map((dataset) => (
            <option key={dataset.id} value={dataset.id}>
              {dataset.name}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {loading ? <p className={styles.empty}>Carregando...</p> : null}
      {!loading && items.length === 0 ? <p className={styles.empty}>Nenhuma metrica cadastrada.</p> : null}

      {!loading && items.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Formato</th>
                <th>Dataset</th>
                <th>Data criacao</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.metric_type}</td>
                  <td className={styles.mono}>{item.format || "-"}</td>
                  <td>{datasetNameById.get(item.dataset_id) || item.dataset_id}</td>
                  <td>{formatDate(item.created_at)}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.button}
                        onClick={() => {
                          setEditingMetric(item);
                          setModalOpen(true);
                        }}
                      >
                        Editar
                      </button>
                      <button type="button" className={styles.button} onClick={() => void handleDelete(item)}>
                        Deletar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <MetricModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        metric={editingMetric}
        datasetId={selectedDatasetId || undefined}
        onSaved={async () => {
          setModalOpen(false);
          setEditingMetric(undefined);
          addToast("Metrica salva com sucesso.", "success");
          const rows = await listMetrics(selectedDatasetId);
          setItems(rows);
        }}
      />
    </section>
  );
}
