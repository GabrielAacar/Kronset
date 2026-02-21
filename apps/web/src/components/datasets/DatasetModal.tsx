import { useEffect, useState } from "react";
import DatasetForm from "@/components/datasets/DatasetForm";
import {
  createDataset,
  type Dataset,
  type DatasetPayload,
  updateDataset,
} from "@/services/datasetsService";
import styles from "./DatasetModal.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  dataset?: Dataset;
  onSaved: () => void;
};

export default function DatasetModal({ isOpen, onClose, dataset, onSaved }: Props) {
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSave(payload: DatasetPayload) {
    setError("");
    try {
      if (dataset) {
        await updateDataset(dataset.id, payload);
      } else {
        await createDataset(payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar dataset.");
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.currentTarget === e.target && onClose()}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2 className={styles.title}>{dataset ? "Editar Dataset" : "Novo Dataset"}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            x
          </button>
        </header>

        {error ? <p className={styles.error}>{error}</p> : null}

        <DatasetForm initial={dataset} onCancel={onClose} onSave={handleSave} showTitle={false} />
      </div>
    </div>
  );
}
