import { useEffect, useState } from "react";
import {
  createConnection,
  type Connection,
  type ConnectionPayload,
  updateConnection,
} from "@/services/connectionsService";
import ConnectionForm from "./ConnectionForm";
import styles from "./ConnectionModal.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  connection?: Connection;
  onSaved: () => void;
};

export default function ConnectionModal({ isOpen, onClose, connection, onSaved }: Props) {
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSave(payload: ConnectionPayload) {
    setError("");
    try {
      if (connection) {
        await updateConnection(connection.id, payload);
      } else {
        await createConnection(payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar conexao.");
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.currentTarget === e.target && onClose()}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2 className={styles.title}>{connection ? "Editar Conexao" : "Nova Conexao"}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            x
          </button>
        </header>

        {error ? <p className={styles.error}>{error}</p> : null}

        <ConnectionForm initial={connection} onCancel={onClose} onSave={handleSave} showTitle={false} />
      </div>
    </div>
  );
}
