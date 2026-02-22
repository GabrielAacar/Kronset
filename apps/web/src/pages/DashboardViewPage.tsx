import axios from "axios";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import WidgetRenderer from "@/components/charts/WidgetRenderer";
import DashboardAside from "@/components/dashboard/view/DashboardAside";
import DashboardFooter from "@/components/dashboard/view/DashboardFooter";
import DashboardHeader from "@/components/dashboard/view/DashboardHeader";
import { listDimensions, type Dimension } from "@/services/dimensionsService";
import {
  getDashboardBySlug,
  type Dashboard,
  type DashboardLayoutConfig,
  type DashboardLayoutFilterConfig,
  type Widget,
} from "@/services/dashboardsService";
import { listWidgets } from "@/services/widgetsService";
import styles from "./DashboardViewPage.module.css";

type QueryResponse = {
  sql: string;
  rows: Record<string, any>[];
};

const api = axios.create({
  baseURL: "http://localhost:8000",
});

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
      text_color: "#0f172a",
      filters: [],
    },
    footer: {
      enabled: true,
      text: "",
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
  const parsedRaw = typeof raw === "string"
    ? (() => {
        try {
          return JSON.parse(raw);
        } catch {
          return {};
        }
      })()
    : (raw || {});
  const base = defaultLayout(title);
  return {
    template: parsedRaw?.template ?? base.template,
    header: { ...base.header, ...(parsedRaw?.header || {}) },
    aside: {
      ...base.aside,
      ...(parsedRaw?.aside || {}),
      filters: Array.isArray(parsedRaw?.aside?.filters) ? parsedRaw.aside.filters : [],
    },
    footer: { ...base.footer, ...(parsedRaw?.footer || {}) },
    content: { ...base.content, ...(parsedRaw?.content || {}) },
  };
}

function buildFilters(
  activeFilters: Record<string, any>,
  configuredFilters: DashboardLayoutFilterConfig[],
): any[] {
  const result: any[] = [];

  configuredFilters.forEach((filter) => {
    const currentValue = activeFilters[filter.id];
    if (filter.type === "select") {
      if (!filter.dimension || currentValue == null || currentValue === "") return;
      result.push({
        field: filter.dimension,
        op: "eq",
        value: currentValue,
      });
      return;
    }

    if (!filter.dimension) return;
    const from = currentValue?.from;
    const to = currentValue?.to;
    if (!from || !to) return;
    result.push({
      field: filter.dimension,
      op: "between",
      value: [from, to],
    });
  });

  return result;
}

export default function DashboardViewPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [rowsByWidgetId, setRowsByWidgetId] = useState<Record<string, Record<string, any>[]>>({});
  const [loadingWidgetId, setLoadingWidgetId] = useState<Record<string, boolean>>({});
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const layout = useMemo(
    () => normalizeLayout(dashboard?.layout, dashboard?.name || "Dashboard"),
    [dashboard?.layout, dashboard?.name],
  );

  const dimensionIdByName = useMemo(() => {
    const map: Record<string, string> = {};
    dimensions.forEach((d) => {
      map[d.name] = d.id;
    });
    return map;
  }, [dimensions]);

  useEffect(() => {
    async function load() {
      if (!slug) return;
      setLoading(true);
      setError("");
      try {
        const dash = await getDashboardBySlug(slug);
        setDashboard(dash);

        if (!dash.is_published) {
          setWidgets([]);
          return;
        }

        const [widgetRows, dimRows] = await Promise.all([
          listWidgets(dash.id),
          listDimensions(dash.dataset_id),
        ]);
        setWidgets(widgetRows);
        setDimensions(dimRows);
      } catch (err: any) {
        setError(err?.message || "Dashboard nao disponivel");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [slug]);

  useEffect(() => {
    async function loadWidgetData() {
      if (!dashboard || widgets.length === 0) {
        setRowsByWidgetId({});
        return;
      }

      const configuredFilters = layout.aside.filters || [];
      const pageFilters = buildFilters(activeFilters, configuredFilters);

      const loadingMap: Record<string, boolean> = {};
      widgets.forEach((w) => {
        loadingMap[w.id] = true;
      });
      setLoadingWidgetId(loadingMap);

      const entries = await Promise.all(
        widgets.map(async (widget) => {
          try {
            const payload = {
              ...widget.query,
              filters: [...(widget.query.filters || []), ...pageFilters],
            };
            const { data } = await api.post<QueryResponse>("/query", payload);
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

    void loadWidgetData();
  }, [dashboard, widgets, activeFilters, layout.aside.filters]);

  function handleFilterChange(filterId: string, value: any) {
    setActiveFilters((prev) => ({ ...prev, [filterId]: value }));
  }

  if (loading) {
    return <div className={styles.page}><p className={styles.empty}>Carregando...</p></div>;
  }

  if (error) {
    return <div className={styles.page}><p className={styles.error}>{error}</p></div>;
  }

  if (!dashboard || !dashboard.is_published) {
    return <div className={styles.page}><p className={styles.empty}>Dashboard nao disponivel</p></div>;
  }

  const templateClass =
    layout.template === "sidebar-left"
      ? styles.sidebarLeft
      : layout.template === "full-width"
        ? styles.fullWidth
        : styles.minimal;

  const showHeader = layout.template !== "minimal" && layout.header.enabled;
  const showAside = layout.template === "sidebar-left" && layout.aside.enabled;
  const showFooter = layout.template !== "minimal" && layout.footer.enabled;
  const contentConfig = layout.content || defaultLayout().content;
  const contentGridCols = Math.max(1, Number(contentConfig.grid_columns || 12));
  const rowHeight = Math.max(1, Number(contentConfig.row_height || 80));
  const contentGap = Math.max(0, Number(contentConfig.gap || 16));

  const contentBackgroundLayers: string[] = [];
  if (contentConfig.grid_show_lines) {
    contentBackgroundLayers.push(
      `linear-gradient(to right, ${contentConfig.grid_line_color || "#e0e0e0"} 1px, transparent 1px)`,
    );
  }
  if (contentConfig.background_image) {
    contentBackgroundLayers.push(`url(${contentConfig.background_image})`);
  }

  const contentStyle: CSSProperties = {
    backgroundColor: contentConfig.background_color || "#f5f5f5",
    backgroundImage: contentBackgroundLayers.length ? contentBackgroundLayers.join(", ") : undefined,
    backgroundSize: contentConfig.grid_show_lines
      ? [
          `calc(100% / ${contentConfig.grid_columns || 12}) 100%`,
          ...(contentConfig.background_image ? ["cover"] : []),
        ].join(", ")
      : (contentConfig.background_image ? "cover" : undefined),
    backgroundPosition: contentConfig.background_image ? "center" : undefined,
    backgroundRepeat: contentConfig.background_image ? "no-repeat" : undefined,
    padding: `${contentConfig.padding ?? 24}px`,
    gap: `${contentGap}px`,
    gridTemplateColumns: `repeat(${contentConfig.grid_columns || 12}, 1fr)`,
  };

  const widgetWrapperStyle: CSSProperties = {
    backgroundColor: contentConfig.widget_background || "#ffffff",
    borderRadius: `${contentConfig.border_radius_widgets ?? 12}px`,
    boxShadow: contentConfig.widget_shadow !== false ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
    overflow: "hidden",
    height: "100%",
  };

  return (
    <div className={`${styles.page} ${templateClass}`}>
      {showHeader ? (
        <DashboardHeader
          config={layout.header}
          updatedAt={dashboard.created_at}
        />
      ) : null}

      <div className={styles.body}>
        {showAside ? (
          <DashboardAside
            config={layout.aside}
            datasetId={dashboard.dataset_id}
            dimensionIdByName={dimensionIdByName}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
          />
        ) : null}

        <main className={styles.content} style={contentStyle}>
          {widgets.length === 0 ? (
            <p className={styles.empty}>Este dashboard ainda nao possui widgets.</p>
          ) : (
            widgets.map((widget) => {
              const rawW = Math.max(1, widget.layout?.w ?? 6);
              const clampedW = Math.min(rawW, contentGridCols);
              const rawX = Math.max(0, widget.layout?.x ?? 0);
              const clampedX = Math.min(rawX, Math.max(0, contentGridCols - clampedW));
              const rowStart = Math.max(1, (widget.layout?.y ?? 0) + 1);
              const rowSpan = Math.max(1, widget.layout?.h ?? 3);
              const widgetHeight = (rowSpan * rowHeight) + ((rowSpan - 1) * contentGap);
              return (
                <div
                  key={widget.id}
                  className={styles.widgetSlot}
                  style={{
                    gridColumn: `${clampedX + 1} / span ${clampedW}`,
                    gridRow: `${rowStart} / span ${rowSpan}`,
                    height: `${widgetHeight}px`,
                  }}
                >
                  <WidgetRenderer
                    widget={widget}
                    data={rowsByWidgetId[widget.id] || []}
                    loading={Boolean(loadingWidgetId[widget.id])}
                    wrapperStyle={widgetWrapperStyle}
                  />
                </div>
              );
            })
          )}
        </main>
      </div>

      {showFooter ? <DashboardFooter config={layout.footer} /> : null}
    </div>
  );
}
