import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToastContext } from "@/contexts/ToastContext";
import { listDatasets, type Dataset } from "@/services/datasetsService";
import {
  createDashboard,
  deleteDashboard,
  listDashboards,
  publishDashboard,
  type Dashboard,
  unpublishDashboard,
} from "@/services/dashboardsService";
import styles from "./DashboardsPage.module.css";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

export default function DashboardsPage() {
  const navigate = useNavigate();
  const { addToast } = useToastContext();
  const [items, setItems] = useState<Dashboard[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [datasetId, setDatasetId] = useState("");

  const datasetNameById = useMemo(() => {
    const map = new Map<string, string>();
    datasets.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [datasets]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [dashboards, datasetRows] = await Promise.all([listDashboards(), listDatasets()]);
      setItems(dashboards);
      setDatasets(datasetRows);
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar dashboards.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate() {
    if (!name.trim()) {
      addToast("Nome e obrigatorio.", "error");
      return;
    }
    if (!datasetId) {
      addToast("Dataset e obrigatorio.", "error");
      return;
    }
    setCreating(true);
    try {
      await createDashboard({
        name: name.trim(),
        description: description.trim(),
        dataset_id: datasetId,
        header: {},
        layout: {},
      });
      addToast("Dashboard criado com sucesso.", "success");
      setModalOpen(false);
      setName("");
      setDescription("");
      setDatasetId("");
      await load();
    } catch (err: any) {
      addToast(err?.message || "Erro ao criar dashboard.", "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(item: Dashboard) {
    const ok = window.confirm(`Deseja deletar o dashboard "${item.name}"?`);
    if (!ok) return;
    try {
      await deleteDashboard(item.id);
      addToast("Dashboard deletado.", "success");
      await load();
    } catch (err: any) {
      addToast(err?.message || "Erro ao deletar dashboard.", "error");
    }
  }

  async function handlePublishToggle(item: Dashboard) {
    try {
      if (item.is_published) {
        await unpublishDashboard(item.id);
        addToast("Dashboard despublicado.", "info");
      } else {
        await publishDashboard(item.id);
        addToast("Dashboard publicado.", "success");
      }
      await load();
    } catch (err: any) {
      addToast(err?.message || "Erro ao alterar publicacao.", "error");
    }
  }

  async function handleCopyPublicLink(item: Dashboard) {
    try {
      const link = `${window.location.origin}/view/${item.slug}`;
      await navigator.clipboard.writeText(link);
      addToast("Link copiado!", "success");
    } catch {
      addToast("Nao foi possivel copiar o link.", "error");
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboards</h1>
          <p className={styles.subtitle}>Gerencie e publique seus dashboards.</p>
        </div>
        <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => setModalOpen(true)}>
          Novo Dashboard
        </button>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}
      {loading ? <p className={styles.empty}>Carregando...</p> : null}
      {!loading && items.length === 0 ? <p className={styles.empty}>Nenhum dashboard cadastrado.</p> : null}

      {!loading && items.length > 0 ? (
        <div className={styles.grid}>
          {items.map((item) => (
            <article key={item.id} className={styles.card} onClick={() => navigate(`/dashboards/${item.id}/edit`)}>
              <div className={styles.row}>
                <h3 className={styles.name}>{item.name}</h3>
                <span className={`${styles.badge} ${item.is_published ? styles.published : styles.draft}`}>
                  {item.is_published ? "Publicado" : "Rascunho"}
                </span>
              </div>

              <p className={styles.desc}>{item.description || "Sem descricao"}</p>
              <p className={styles.meta}>
                Dataset: {datasetNameById.get(item.dataset_id) || item.dataset_id}
              </p>
              <p className={styles.meta}>Criado em: {formatDate(item.created_at)}</p>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.button}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/dashboards/${item.id}/edit`);
                  }}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className={styles.button}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDelete(item);
                  }}
                >
                  Deletar
                </button>
                <button
                  type="button"
                  className={styles.button}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handlePublishToggle(item);
                  }}
                >
                  {item.is_published ? "Despublicar" : "Publicar"}
                </button>
                {item.is_published ? (
                  <button
                    type="button"
                    className={styles.button}
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleCopyPublicLink(item);
                    }}
                  >
                    Copiar Link
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {modalOpen ? (
        <div className={styles.overlay} onClick={(e) => e.currentTarget === e.target && setModalOpen(false)}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Novo Dashboard</h3>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="dashboard-name">Nome</label>
              <input
                id="dashboard-name"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Painel de Vendas"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="dashboard-description">Descricao</label>
              <textarea
                id="dashboard-description"
                className={styles.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descricao do dashboard"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="dashboard-dataset">Dataset</label>
              <select
                id="dashboard-dataset"
                className={styles.select}
                value={datasetId}
                onChange={(e) => setDatasetId(e.target.value)}
              >
                <option value="">Selecione um dataset</option>
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => void handleCreate()}
                disabled={creating}
              >
                {creating ? "Criando..." : "Criar"}
              </button>
              <button type="button" className={styles.button} onClick={() => setModalOpen(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
