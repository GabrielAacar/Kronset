import { useEffect, useMemo, useState } from "react";
import DatasetModal from "@/components/datasets/DatasetModal";
import { useToastContext } from "@/contexts/ToastContext";
import { listConnections, type Connection } from "@/services/connectionsService";
import { deleteDataset, listDatasets, type Dataset } from "@/services/datasetsService";
import styles from "./DatasetsPage.module.css";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

export default function DatasetsPage() {
  const { addToast } = useToastContext();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDataset, setEditingDataset] = useState<Dataset | undefined>();

  const connectionNameById = useMemo(() => {
    const map = new Map<string, string>();
    connections.forEach((conn) => map.set(conn.id, conn.name));
    return map;
  }, [connections]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [datasetRows, connectionRows] = await Promise.all([listDatasets(), listConnections()]);
      setDatasets(datasetRows);
      setConnections(connectionRows);
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar datasets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleDelete(dataset: Dataset) {
    const ok = window.confirm(`Deseja deletar o dataset "${dataset.name}"?`);
    if (!ok) return;

    try {
      await deleteDataset(dataset.id);
      addToast("Dataset deletado com sucesso.", "success");
      await load();
    } catch (err: any) {
      addToast(err?.message || "Erro ao deletar dataset.", "error");
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Datasets</h1>
          <p className={styles.subtitle}>Gerencie datasets e SQL base.</p>
        </div>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={() => {
            setEditingDataset(undefined);
            setModalOpen(true);
          }}
        >
          Novo Dataset
        </button>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}

      {loading ? <p className={styles.empty}>Carregando...</p> : null}

      {!loading && datasets.length === 0 ? (
        <p className={styles.empty}>Nenhum dataset cadastrado.</p>
      ) : null}

      {!loading && datasets.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descricao</th>
                <th>Conexao</th>
                <th>Data de criacao</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((dataset) => (
                <tr key={dataset.id}>
                  <td>{dataset.name}</td>
                  <td>{dataset.description || "-"}</td>
                  <td>{connectionNameById.get(dataset.connection_id) || dataset.connection_id}</td>
                  <td>{formatDate(dataset.created_at)}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.button}
                        onClick={() => {
                          setEditingDataset(dataset);
                          setModalOpen(true);
                        }}
                      >
                        Editar
                      </button>
                      <button type="button" className={styles.button} onClick={() => void handleDelete(dataset)}>
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

      <DatasetModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        dataset={editingDataset}
        onSaved={() => {
          setModalOpen(false);
          setEditingDataset(undefined);
          addToast("Dataset salvo com sucesso.", "success");
          void load();
        }}
      />
    </section>
  );
}
