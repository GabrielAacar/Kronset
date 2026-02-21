import { useEffect, useMemo, useState } from "react";
import DimensionModal from "@/components/dimensions/DimensionModal";
import { useToastContext } from "@/contexts/ToastContext";
import { listDatasets, type Dataset } from "@/services/datasetsService";
import { deleteDimension, listDimensions, type Dimension } from "@/services/dimensionsService";
import styles from "./DimensionsPage.module.css";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

export default function DimensionsPage() {
  const { addToast } = useToastContext();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [items, setItems] = useState<Dimension[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDimension, setEditingDimension] = useState<Dimension | undefined>();

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
    async function loadDimensions() {
      setLoading(true);
      setError("");
      try {
        const rows = await listDimensions(selectedDatasetId);
        setItems(rows);
      } catch (err: any) {
        setError(err?.message || "Erro ao carregar dimensoes.");
      } finally {
        setLoading(false);
      }
    }
    void loadDimensions();
  }, [selectedDatasetId]);

  async function handleDelete(item: Dimension) {
    const ok = window.confirm(`Deseja deletar a dimensao "${item.name}"?`);
    if (!ok) return;
    try {
      await deleteDimension(item.id);
      addToast("Dimensao deletada com sucesso.", "success");
      const rows = await listDimensions(selectedDatasetId);
      setItems(rows);
    } catch (err: any) {
      addToast(err?.message || "Erro ao deletar dimensao.", "error");
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Dimensoes</h1>
          <p className={styles.subtitle}>Gerencie dimensoes por dataset.</p>
        </div>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={() => {
            setEditingDimension(undefined);
            setModalOpen(true);
          }}
        >
          Nova Dimensao
        </button>
      </header>

      <div className={styles.toolbar}>
        <label className={styles.label} htmlFor="filter-dataset-dimensions">Dataset</label>
        <select
          id="filter-dataset-dimensions"
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
      {!loading && items.length === 0 ? <p className={styles.empty}>Nenhuma dimensao cadastrada.</p> : null}

      {!loading && items.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Expressao</th>
                <th>Data Type</th>
                <th>Dataset</th>
                <th>Data criacao</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td className={styles.mono}>{item.expression}</td>
                  <td>{item.data_type}</td>
                  <td>{datasetNameById.get(item.dataset_id) || item.dataset_id}</td>
                  <td>{formatDate(item.created_at)}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.button}
                        onClick={() => {
                          setEditingDimension(item);
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

      <DimensionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        dimension={editingDimension}
        datasetId={selectedDatasetId || undefined}
        onSaved={async () => {
          setModalOpen(false);
          setEditingDimension(undefined);
          addToast("Dimensao salva com sucesso.", "success");
          const rows = await listDimensions(selectedDatasetId);
          setItems(rows);
        }}
      />
    </section>
  );
}
