import { useEffect, useState } from "react";
import ConnectionModal from "@/components/connections/ConnectionModal";
import { useToastContext } from "@/contexts/ToastContext";
import {
  type Connection,
  deleteConnection,
  listConnections,
  testConnection,
} from "@/services/connectionsService";
import styles from "./ConnectionsPage.module.css";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

export default function ConnectionsPage() {
  const { addToast } = useToastContext();
  const [items, setItems] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | undefined>();

  async function load() {
    setLoading(true);
    setError("");
    try {
      const rows = await listConnections();
      setItems(rows);
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar conexoes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleDelete(id: string) {
    const confirmDelete = window.confirm("Deseja deletar esta conexao?");
    if (!confirmDelete) return;
    try {
      await deleteConnection(id);
      await load();
    } catch (err: any) {
      setError(err?.message || "Erro ao deletar conexao.");
    }
  }

  async function handleTest(id: string) {
    try {
      const result = await testConnection(id);
      if (result.success) {
        addToast("Conexao validada com sucesso.", "success");
      } else {
        addToast(`Falha no teste: ${result.error || "erro desconhecido"}`, "error");
      }
    } catch (err: any) {
      addToast(`Erro ao testar conexao: ${err?.message || "erro desconhecido"}`, "error");
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Conexoes</h1>
          <p className={styles.subtitle}>Gerencie conexoes com banco de dados.</p>
        </div>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={() => {
            setEditingConnection(undefined);
            setModalOpen(true);
          }}
        >
          Nova Conexao
        </button>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.list}>
        {loading ? <p className={styles.empty}>Carregando...</p> : null}

        {!loading && items.length === 0 ? (
          <p className={styles.empty}>Nenhuma conexao cadastrada.</p>
        ) : null}

        {items.map((conn) => (
          <article key={conn.id} className={styles.card}>
            <div className={styles.row}>
              <div>
                <h3 className={styles.name}>{conn.name}</h3>
                <p className={styles.meta}>
                  {conn.db_type} • {formatDate(conn.created_at)}
                </p>
              </div>
              <span
                className={`${styles.status} ${conn.is_enabled ? styles.enabled : styles.disabled}`}
              >
                {conn.is_enabled ? "Ativa" : "Inativa"}
              </span>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.button}
                onClick={() => {
                  setEditingConnection(conn);
                  setModalOpen(true);
                }}
              >
                Editar
              </button>
              <button type="button" className={styles.button} onClick={() => void handleTest(conn.id)}>
                Testar
              </button>
              <button type="button" className={styles.button} onClick={() => void handleDelete(conn.id)}>
                Deletar
              </button>
            </div>
          </article>
        ))}
      </div>

      <ConnectionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        connection={editingConnection}
        onSaved={() => {
          setModalOpen(false);
          setEditingConnection(undefined);
          void load();
        }}
      />
    </section>
  );
}


