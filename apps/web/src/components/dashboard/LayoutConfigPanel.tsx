import { useEffect, useState } from "react";
import { useToastContext } from "@/contexts/ToastContext";
import {
  type Dashboard,
  type DashboardLayoutConfig,
  updateDashboard,
} from "@/services/dashboardsService";
import LayoutMinimap from "./LayoutMinimap";
import RegionConfigPanel from "./RegionConfigPanel";
import styles from "./LayoutConfigPanel.module.css";

type Props = {
  isOpen: boolean;
  dashboard?: Dashboard | null;
  onClose: () => void;
  onSaved?: (layout: DashboardLayoutConfig) => void;
};

type LayoutRegion = "header" | "aside" | "footer" | "content";

function defaultLayout(title = "Dashboard"): DashboardLayoutConfig {
  return {
    template: "sidebar-left",
    header: {
      enabled: true,
      logo_url: "",
      title,
      show_updated_at: true,
      background_color: "#1a3a4f",
      text_color: "#ffffff",
    },
    aside: {
      enabled: true,
      width: 220,
      background_color: "#e8f4fb",
      text_color: "#000000",
      filters: [],
    },
    footer: {
      enabled: true,
      text: "© 2024 Minha Empresa",
      background_color: "#1a3a4f",
      text_color: "#ffffff",
    },
    content: {
      background_color: "#f5f5f5",
      background_image: "",
      padding: 24,
      gap: 16,
      grid_columns: 12,
      row_height: 80,
      grid_show_lines: false,
      grid_line_color: "#e0e0e0",
      border_radius_widgets: 12,
      widget_shadow: true,
      widget_background: "#ffffff",
    },
  };
}

function normalizeLayout(raw: any, title: string): DashboardLayoutConfig {
  const base = defaultLayout(title);
  return {
    template: raw?.template ?? base.template,
    header: { ...base.header, ...(raw?.header || {}) },
    aside: {
      ...base.aside,
      ...(raw?.aside || {}),
      filters: Array.isArray(raw?.aside?.filters) ? raw.aside.filters : [],
    },
    footer: { ...base.footer, ...(raw?.footer || {}) },
    content: { ...base.content, ...(raw?.content || {}) },
  };
}

export default function LayoutConfigPanel({ isOpen, dashboard, onClose, onSaved }: Props) {
  const { addToast } = useToastContext();
  const [layout, setLayout] = useState<DashboardLayoutConfig>(defaultLayout());
  const [selectedRegion, setSelectedRegion] = useState<LayoutRegion | null>("header");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !dashboard) return;
    setLayout(normalizeLayout(dashboard.layout, dashboard.name));
    setSelectedRegion("header");
    setError("");
  }, [isOpen, dashboard]);

  function patch<K extends keyof DashboardLayoutConfig>(key: K, value: DashboardLayoutConfig[K]) {
    setLayout((prev) => ({ ...prev, [key]: value }));
  }

  function toggleRegion(region: "header" | "aside" | "footer") {
    if (region === "header") {
      patch("header", { ...layout.header, enabled: !layout.header.enabled });
      return;
    }
    if (region === "aside") {
      patch("aside", { ...layout.aside, enabled: !layout.aside.enabled });
      return;
    }
    patch("footer", { ...layout.footer, enabled: !layout.footer.enabled });
  }

  async function handleSave() {
    if (!dashboard?.id) return;
    setSaving(true);
    setError("");
    try {
      await updateDashboard(dashboard.id, { layout });
      addToast("Layout salvo com sucesso.", "success");
      onSaved?.(layout);
      onClose();
    } catch (err: any) {
      const message = err?.message || "Erro ao salvar layout.";
      setError(message);
      addToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen || !dashboard) return null;

  const templateButtons: Array<{ value: DashboardLayoutConfig["template"]; label: string }> = [
    { value: "sidebar-left", label: "Sidebar" },
    { value: "full-width", label: "Full Width" },
    { value: "minimal", label: "Minimal" },
  ];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <aside className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h3 className={styles.title}>Configurar Layout</h3>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            X
          </button>
        </header>

        <div className={styles.body}>
          <div className={styles.columns}>
            <section className={`${styles.section} ${styles.leftColumn}`}>
              <h4 className={styles.sectionTitle}>Template</h4>
              <div className={styles.templateButtons}>
                {templateButtons.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`${styles.templateBtn} ${layout.template === item.value ? styles.templateBtnActive : ""}`}
                    onClick={() => patch("template", item.value)}
                  >
                    <span className={styles.templateIcon} aria-hidden="true">
                      <svg viewBox="0 0 60 40" width="60" height="40">
                        <rect x="1" y="1" width="58" height="38" rx="4" fill="#ffffff" stroke="#cbd5e1" />
                        {item.value !== "minimal" ? (
                          <rect x="4" y="4" width="52" height="7" rx="2" fill="#dbeafe" stroke="#93c5fd" />
                        ) : null}
                        {item.value === "sidebar-left" ? (
                          <>
                            <rect x="4" y="13" width="14" height="18" rx="2" fill="#e2e8f0" stroke="#cbd5e1" />
                            <rect x="20" y="13" width="36" height="18" rx="2" fill="#f8fafc" stroke="#dbe3ee" />
                          </>
                        ) : (
                          <rect
                            x="4"
                            y={item.value === "minimal" ? 4 : 13}
                            width="52"
                            height={item.value === "minimal" ? 27 : 18}
                            rx="2"
                            fill="#f8fafc"
                            stroke="#dbe3ee"
                          />
                        )}
                        {item.value !== "minimal" ? (
                          <rect x="4" y="33" width="52" height="3" rx="1.5" fill="#e2e8f0" />
                        ) : null}
                      </svg>
                    </span>
                    <span className={styles.templateBtnLabel}>{item.label}</span>
                  </button>
                ))}
              </div>
              <LayoutMinimap
                layout={layout}
                selectedRegion={selectedRegion}
                onSelectRegion={setSelectedRegion}
                onToggleRegion={toggleRegion}
              />
            </section>

            <section className={`${styles.section} ${styles.rightColumn}`}>
              <h4 className={styles.sectionTitle}>Propriedades</h4>
              <div className={styles.propertiesWrap}>
                {selectedRegion === "aside" && layout.template !== "sidebar-left" ? (
                  <div className={styles.templatePreview}>
                    <span>Aside indisponivel</span>
                    <span>Selecione o template Sidebar para configurar o painel lateral.</span>
                  </div>
                ) : selectedRegion ? (
                  <RegionConfigPanel
                    region={selectedRegion}
                    config={
                      selectedRegion === "header"
                        ? layout.header
                        : selectedRegion === "aside"
                          ? layout.aside
                          : selectedRegion === "footer"
                            ? layout.footer
                            : layout.content
                    }
                    datasetId={dashboard.dataset_id}
                    onChange={(newConfig) => {
                      if (selectedRegion === "header") patch("header", newConfig);
                      else if (selectedRegion === "aside") patch("aside", newConfig);
                      else if (selectedRegion === "footer") patch("footer", newConfig);
                      else patch("content", newConfig);
                    }}
                  />
                ) : (
                  <div className={styles.templatePreview}>
                    <span>Selecione uma regiao no minimapa</span>
                  </div>
                )}
              </div>
            </section>
          </div>

          {error ? <p className={styles.error}>{error}</p> : null}

          <div className={styles.actions}>
            <button type="button" className={styles.button} onClick={onClose}>
              Cancelar
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonPrimary}`}
              onClick={() => void handleSave()}
              disabled={saving}
            >
              {saving ? "Salvando..." : "Salvar Layout"}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
