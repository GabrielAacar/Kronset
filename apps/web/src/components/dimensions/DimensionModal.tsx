import { useEffect, useState } from "react";
import DimensionForm from "@/components/dimensions/DimensionForm";
import {
  createDimension,
  type Dimension,
  type DimensionPayload,
  updateDimension,
} from "@/services/dimensionsService";
import styles from "./DimensionModal.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  dimension?: Dimension;
  datasetId?: string;
  onSaved: () => void;
};

export default function DimensionModal({ isOpen, onClose, dimension, datasetId, onSaved }: Props) {
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

  async function handleSave(payload: DimensionPayload) {
    setError("");
    try {
      if (dimension) {
        await updateDimension(dimension.id, payload);
      } else {
        await createDimension(payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar dimensao.");
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.currentTarget === e.target && onClose()}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2 className={styles.title}>{dimension ? "Editar Dimensao" : "Nova Dimensao"}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            x
          </button>
        </header>

        {error ? <p className={styles.error}>{error}</p> : null}

        <DimensionForm
          initial={dimension}
          datasetId={datasetId}
          onCancel={onClose}
          onSave={handleSave}
          showTitle={false}
        />
      </div>
    </div>
  );
}
