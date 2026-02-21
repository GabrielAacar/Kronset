import type { Toast as ToastItem } from "@/hooks/useToast";
import styles from "./Toast.module.css";

type ToastContainerProps = {
  toasts: ToastItem[];
  onClose: (id: number) => void;
};

function iconFor(type: ToastItem["type"]): string {
  if (type === "success") return "OK";
  if (type === "error") return "ER";
  return "i";
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`} role="status">
          <span>{iconFor(toast.type)}</span>
          <span>{toast.message}</span>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => onClose(toast.id)}
            aria-label="Fechar toast"
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
}
