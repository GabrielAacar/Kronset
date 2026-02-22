import axios from "axios";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import GridLayout from "react-grid-layout";
import { useNavigate, useParams } from "react-router-dom";
import WidgetRenderer from "@/components/charts/WidgetRenderer";
import LayoutConfigPanel from "@/components/dashboard/LayoutConfigPanel";
import WidgetConfigPanel from "@/components/dashboard/WidgetConfigPanel";
import { useToastContext } from "@/contexts/ToastContext";
import {
  getDashboard,
  publishDashboard,
  unpublishDashboard,
  type Dashboard,
  type DashboardLayoutContentConfig,
  type Widget,
  type WidgetType,
} from "@/services/dashboardsService";
import { createWidget, deleteWidget, listWidgets, updateWidget } from "@/services/widgetsService";
import styles from "./DashboardBuilderPage.module.css";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

type QueryResponse = {
  sql: string;
  rows: Record<string, any>[];
};

type GridItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

const api = axios.create({
  baseURL: "http://localhost:8000",
});

type WidgetDraft = {
  type: WidgetType;
  title: string;
  query: Widget["query"];
  style: Widget["style"];
  layout: Widget["layout"];
};

function defaultContentConfig(): DashboardLayoutContentConfig {
  return {
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
  };
}

function getContentLayoutConfig(dashboard: Dashboard | null): DashboardLayoutContentConfig {
  const rawLayout = dashboard?.layout;
  const parsed = typeof rawLayout === "string"
    ? (() => {
        try {
          return JSON.parse(rawLayout);
        } catch {
          return {};
        }
      })()
    : (rawLayout || {});

  return {
    ...defaultContentConfig(),
    ...(parsed?.content || {}),
  };
}

export default function DashboardBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToastContext();

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [rowsByWidgetId, setRowsByWidgetId] = useState<Record<string, Record<string, any>[]>>({});
  const [loadingWidgetId, setLoadingWidgetId] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [layoutPanelOpen, setLayoutPanelOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | undefined>();

  const contentConfig = useMemo(() => getContentLayoutConfig(dashboard), [dashboard]);
  const gridCols = useMemo(() => {
    const value = Number(contentConfig.grid_columns || 12);
    return Number.isFinite(value) && value > 0 ? value : 12;
  }, [contentConfig.grid_columns]);
  const gridRowHeight = useMemo(() => {
    const value = Number(contentConfig.row_height || 80);
    return Number.isFinite(value) && value > 0 ? value : 80;
  }, [contentConfig.row_height]);

  const gridLayout: GridItem[] = useMemo(
    () =>
      widgets.map((w) => {
        const rawW = Math.max(1, w.layout?.w ?? 6);
        const clampedW = Math.min(rawW, gridCols);
        const rawX = Math.max(0, w.layout?.x ?? 0);
        const clampedX = Math.min(rawX, Math.max(0, gridCols - clampedW));
        return {
          i: w.id,
          x: clampedX,
          y: Math.max(0, w.layout?.y ?? 0),
          w: clampedW,
          h: Math.max(1, w.layout?.h ?? 3),
        };
      }),
    [widgets, gridCols],
  );

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      setError("");
      try {
        const [dash, widgetRows] = await Promise.all([getDashboard(id), listWidgets(id)]);
        setDashboard(dash);
        setWidgets(widgetRows);
        await loadWidgetData(widgetRows);
      } catch (err: any) {
        setError(err?.message || "Erro ao carregar dashboard.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  async function loadWidgetData(list: Widget[]) {
    const loadingMap: Record<string, boolean> = {};
    list.forEach((w) => {
      loadingMap[w.id] = true;
    });
    setLoadingWidgetId(loadingMap);

    const entries = await Promise.all(
      list.map(async (widget) => {
        try {
          const { data } = await api.post<QueryResponse>("/query", widget.query);
          return [widget.id, data.rows] as const;
        } catch {
          return [widget.id, [] as Record<string, any>[]] as const;
        }
      }),
    );

    const rowsMap: Record<string, Record<string, any>[]> = {};
    const doneMap: Record<string, boolean> = {};
    entries.forEach(([widgetId, rows]) => {
      rowsMap[widgetId] = rows;
      doneMap[widgetId] = false;
    });
    setRowsByWidgetId(rowsMap);
    setLoadingWidgetId(doneMap);
  }

  async function refreshWidgets() {
    if (!id) return;
    const widgetRows = await listWidgets(id);
    setWidgets(widgetRows);
    await loadWidgetData(widgetRows);
  }

  async function handleSaveWidget(draft: WidgetDraft) {
    if (!id) return;
    if (editingWidget) {
      await updateWidget(editingWidget.id, {
        title: draft.title,
        query: draft.query,
        style: draft.style,
        layout: draft.layout,
      });
      addToast("Widget atualizado.", "success");
    } else {
      await createWidget({
        dashboard_id: id,
        type: draft.type,
        title: draft.title,
        query: draft.query,
        style: draft.style,
        layout: draft.layout,
      });
      addToast("Widget criado.", "success");
    }
    setPanelOpen(false);
    setEditingWidget(undefined);
    await refreshWidgets();
  }

  async function handleDeleteWidget(widget: Widget) {
    const ok = window.confirm(`Deseja remover o widget "${widget.title || widget.type}"?`);
    if (!ok) return;
    try {
      await deleteWidget(widget.id);
      addToast("Widget removido.", "success");
      await refreshWidgets();
    } catch (err: any) {
      addToast(err?.message || "Erro ao remover widget.", "error");
    }
  }

  async function handleLayoutSave(layout: GridItem[]) {
    const changed = widgets.filter((w) => {
      const next = layout.find((l) => l.i === w.id);
      if (!next) return false;
      return w.layout.x !== next.x || w.layout.y !== next.y || w.layout.w !== next.w || w.layout.h !== next.h;
    });
    if (changed.length === 0) return;

    setWidgets((prev) =>
      prev.map((w) => {
        const next = layout.find((l) => l.i === w.id);
        if (!next) return w;
        return { ...w, layout: { x: next.x, y: next.y, w: next.w, h: next.h } };
      }),
    );

    await Promise.all(
      changed.map((w) => {
        const next = layout.find((l) => l.i === w.id)!;
        return updateWidget(w.id, {
          layout: { x: next.x, y: next.y, w: next.w, h: next.h },
        });
      }),
    );
  }

  async function handlePublishToggle() {
    if (!dashboard) return;
    try {
      if (dashboard.is_published) {
        await unpublishDashboard(dashboard.id);
        setDashboard({ ...dashboard, is_published: false });
        addToast("Dashboard despublicado.", "info");
      } else {
        await publishDashboard(dashboard.id);
        setDashboard({ ...dashboard, is_published: true });
        addToast("Dashboard publicado.", "success");
      }
    } catch (err: any) {
      addToast(err?.message || "Erro ao alterar publicacao.", "error");
    }
  }

  function handlePreview() {
    if (!dashboard?.slug) return;
    window.open(`/view/${dashboard.slug}`, "_blank");
  }

  if (!id) {
    return <p className={styles.error}>Dashboard invalido.</p>;
  }

  const builderContentBackgroundLayers: string[] = [];
  if (contentConfig.grid_show_lines) {
    builderContentBackgroundLayers.push(
      `linear-gradient(to right, ${contentConfig.grid_line_color || "#e0e0e0"} 1px, transparent 1px)`,
    );
  }
  if (contentConfig.background_image) {
    builderContentBackgroundLayers.push(`url(${contentConfig.background_image})`);
  }

  const builderContentStyle: CSSProperties = {
    backgroundColor: contentConfig.background_color || "#f5f5f5",
    backgroundImage: builderContentBackgroundLayers.length ? builderContentBackgroundLayers.join(", ") : undefined,
    backgroundSize: contentConfig.grid_show_lines
      ? [
          `calc(100% / ${contentConfig.grid_columns || 12}) 100%`,
          ...(contentConfig.background_image ? ["cover"] : []),
        ].join(", ")
      : (contentConfig.background_image ? "cover" : undefined),
    backgroundPosition: contentConfig.background_image ? "center" : undefined,
    backgroundRepeat: contentConfig.background_image ? "no-repeat" : undefined,
    padding: contentConfig.padding ?? 24,
  };

  const builderWidgetCardStyle: CSSProperties = {
    background: contentConfig.widget_background || "#ffffff",
    borderRadius: contentConfig.border_radius_widgets ?? 12,
    boxShadow: contentConfig.widget_shadow !== false ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
  };

  return (
    <section className={styles.page}>
      <header className={styles.toolbar}>
        <div className={styles.titleBox}>
          <h1>{dashboard?.name || "Dashboard"}</h1>
          <p>{dashboard?.description || "Editor de dashboard"}</p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.button}
            onClick={() => {
              setLayoutPanelOpen(true);
              setPanelOpen(false);
              setEditingWidget(undefined);
            }}
          >
            ⚙ Layout
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={() => {
              setLayoutPanelOpen(false);
              setEditingWidget(undefined);
              setPanelOpen(true);
            }}
          >
            Adicionar Widget
          </button>
          <button type="button" className={styles.button} onClick={handlePreview} disabled={!dashboard?.slug}>
            Preview
          </button>
          <button type="button" className={`${styles.button} ${styles.buttonAccent}`} onClick={() => void handlePublishToggle()}>
            {dashboard?.is_published ? "Despublicar" : "Publicar"}
          </button>
          <button type="button" className={styles.button} onClick={() => navigate("/dashboards")}>
            Voltar
          </button>
        </div>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}
      {loading ? <p className={styles.empty}>Carregando...</p> : null}

      {!loading ? (
        <div
          className={`${styles.content} ${panelOpen || layoutPanelOpen ? styles.withPanel : ""}`}
          style={builderContentStyle}
        >
          {widgets.length === 0 ? (
            <p className={styles.empty}>Nenhum widget. Clique em "Adicionar Widget".</p>
          ) : (
            <GridLayout
              className="layout"
              cols={gridCols}
              rowHeight={gridRowHeight}
              width={1120}
              margin={[contentConfig.gap ?? 16, contentConfig.gap ?? 16]}
              layout={gridLayout}
              onDragStop={(layout) => void handleLayoutSave(layout as unknown as GridItem[])}
              onResizeStop={(layout) => void handleLayoutSave(layout as unknown as GridItem[])}
            >
              {widgets.map((widget) => (
                <div
                  key={widget.id}
                  onClick={() => {
                    setEditingWidget(widget);
                    setLayoutPanelOpen(false);
                    setPanelOpen(true);
                  }}
                >
                  <div className={styles.widgetCard} style={builderWidgetCardStyle}>
                    <div className={styles.widgetHead}>
                      <p className={styles.widgetTitle}>{widget.title || widget.type}</p>
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDeleteWidget(widget);
                        }}
                      >
                        x
                      </button>
                    </div>
                    <div className={styles.widgetBody}>
                      <WidgetRenderer
                        widget={widget}
                        data={rowsByWidgetId[widget.id] || []}
                        loading={Boolean(loadingWidgetId[widget.id])}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </GridLayout>
          )}
        </div>
      ) : null}

      <WidgetConfigPanel
        isOpen={panelOpen}
        widget={editingWidget}
        defaultDatasetId={dashboard?.dataset_id}
        onSave={handleSaveWidget}
        onCancel={() => {
          setPanelOpen(false);
          setEditingWidget(undefined);
        }}
      />

      <LayoutConfigPanel
        isOpen={layoutPanelOpen}
        dashboard={dashboard}
        onClose={() => setLayoutPanelOpen(false)}
        onSaved={(nextLayout) => {
          setDashboard((prev) => (prev ? { ...prev, layout: nextLayout } : prev));
        }}
      />
    </section>
  );
}
