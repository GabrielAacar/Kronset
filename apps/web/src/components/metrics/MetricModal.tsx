import { useEffect, useState } from "react";
import MetricForm from "@/components/metrics/MetricForm";
import { createMetric, type Metric, type MetricPayload, updateMetric } from "@/services/metricsService";
import styles from "./MetricModal.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  metric?: Metric;
  datasetId?: string;
  onSaved: () => void;
};

export default function MetricModal({ isOpen, onClose, metric, datasetId, onSaved }: Props) {
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

  async function handleSave(payload: MetricPayload) {
    setError("");
    try {
      if (metric) {
        await updateMetric(metric.id, payload);
      } else {
        await createMetric(payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar metrica.");
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.currentTarget === e.target && onClose()}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2 className={styles.title}>{metric ? "Editar Metrica" : "Nova Metrica"}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            x
          </button>
        </header>

        {error ? <p className={styles.error}>{error}</p> : null}

        <MetricForm
          initial={metric}
          datasetId={datasetId}
          onCancel={onClose}
          onSave={handleSave}
          showTitle={false}
        />
      </div>
    </div>
  );
}
