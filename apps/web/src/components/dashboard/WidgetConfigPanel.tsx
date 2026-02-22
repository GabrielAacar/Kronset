import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { listDatasets, type Dataset } from "@/services/datasetsService";
import { listDimensions, type Dimension } from "@/services/dimensionsService";
import { listMetrics, type Metric } from "@/services/metricsService";
import type {
  Widget,
  WidgetLayout,
  WidgetQuery,
  WidgetSeries,
  WidgetStyle,
  WidgetType,
} from "@/services/dashboardsService";
import styles from "./WidgetConfigPanel.module.css";

type WidgetDraft = {
  type: WidgetType;
  title: string;
  query: WidgetQuery;
  style: WidgetStyle;
  layout: WidgetLayout;
};

type Props = {
  isOpen: boolean;
  widget?: Widget;
  defaultDatasetId?: string;
  onSave: (draft: WidgetDraft) => Promise<void> | void;
  onCancel: () => void;
};

const widgetTypeOptions: Array<{ value: WidgetType; label: string }> = [
  { value: "kpi", label: "[#] KPI" },
  { value: "line", label: "[/] Linha" },
  { value: "bar", label: "[|] Barra" },
  { value: "area", label: "[~] Area" },
  { value: "pie", label: "[( )] Pizza" },
  { value: "table", label: "[=] Tabela" },
];

const chartOptionTypes: WidgetType[] = ["line", "bar", "area", "pie"];
const combinedSeriesTypes: WidgetType[] = ["line", "bar", "area"];

type SeriesFormState = {
  metric: string;
  type: "bar" | "line" | "area";
  color: string;
  y_axis: "left" | "right";
  label: string;
};

function createSeriesId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function toInitialSeries(widget?: Widget, defaultType: WidgetType = "line"): WidgetSeries[] {
  if (widget?.query?.series?.length) {
    return widget.query.series.map((series, index) => ({
      id: series.id || createSeriesId(),
      metric: series.metric,
      type: series.type,
      color: series.color || ["#2563eb", "#10b981", "#f59e0b", "#ef4444"][index % 4],
      y_axis: series.y_axis || "left",
      label: series.label,
    }));
  }

  if (widget?.query?.metrics?.length && combinedSeriesTypes.includes(widget.type)) {
    const fallbackType = (["line", "bar", "area"].includes(defaultType) ? defaultType : "line") as
      | "line"
      | "bar"
      | "area";
    return widget.query.metrics.slice(0, 8).map((metric, index) => ({
      id: createSeriesId(),
      metric,
      type: fallbackType,
      color: ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"][index % 6],
      y_axis: "left",
      label: "",
    }));
  }

  return [];
}

function getDefaultSeriesColor(index: number) {
  const palette = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];
  return palette[index % palette.length];
}

export default function WidgetConfigPanel({ isOpen, widget, defaultDatasetId, onSave, onCancel }: Props) {
  const [activeTab, setActiveTab] = useState<"dados" | "aparencia" | "layout">("dados");
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);

  const [type, setType] = useState<WidgetType>(widget?.type ?? "line");
  const [datasetId, setDatasetId] = useState(widget?.query?.dataset_id ?? defaultDatasetId ?? "");
  const [dimension, setDimension] = useState(widget?.query?.dimensions?.[0] ?? "");
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(widget?.query?.metrics ?? []);
  const [series, setSeries] = useState<WidgetSeries[]>(toInitialSeries(widget, widget?.type ?? "line"));
  const [seriesEditorOpen, setSeriesEditorOpen] = useState(false);
  const [editingSeriesId, setEditingSeriesId] = useState<string | null>(null);
  const [seriesForm, setSeriesForm] = useState<SeriesFormState>({
    metric: "",
    type: "bar",
    color: "#2563eb",
    y_axis: "left",
    label: "",
  });
  const [limit, setLimit] = useState<number>(widget?.query?.limit ?? 500);
  const [title, setTitle] = useState(widget?.title ?? "");
  const [color, setColor] = useState(widget?.style?.color ?? "#2563eb");
  const [kpiTemplate, setKpiTemplate] = useState<NonNullable<WidgetStyle["kpi_template"]>>(
    widget?.style?.kpi_template ?? "bordered-left",
  );
  const [showLegend, setShowLegend] = useState<boolean>(widget?.style?.showLegend ?? true);
  const [backgroundColor, setBackgroundColor] = useState(widget?.style?.background_color ?? "#ffffff");
  const [showBorder, setShowBorder] = useState<boolean>(widget?.style?.show_border ?? true);
  const [showGridHorizontal, setShowGridHorizontal] = useState<boolean>(widget?.style?.show_grid_horizontal ?? true);
  const [showGridVertical, setShowGridVertical] = useState<boolean>(widget?.style?.show_grid_vertical ?? false);
  const [gridColor, setGridColor] = useState(widget?.style?.grid_color ?? "#e0e0e0");
  const [legendPosition, setLegendPosition] = useState<NonNullable<WidgetStyle["legend_position"]>>(
    widget?.style?.legend_position ?? "top",
  );
  const [showAxisX, setShowAxisX] = useState<boolean>(widget?.style?.show_axis_x ?? true);
  const [showAxisY, setShowAxisY] = useState<boolean>(widget?.style?.show_axis_y ?? true);
  const [formatDatesX, setFormatDatesX] = useState<boolean>(widget?.style?.format_dates_x ?? false);
  const [colorPalette, setColorPalette] = useState<string[]>(
    widget?.style?.colors?.length ? widget.style.colors.slice(0, 8) : [widget?.style?.color ?? "#2563eb"],
  );
  const [w, setW] = useState<number>(widget?.layout?.w ?? 6);
  const [h, setH] = useState<number>(widget?.layout?.h ?? 3);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab("dados");
    setType(widget?.type ?? "line");
    setDatasetId(widget?.query?.dataset_id ?? defaultDatasetId ?? "");
    setDimension(widget?.query?.dimension ?? widget?.query?.dimensions?.[0] ?? "");
    setSelectedMetrics(widget?.query?.metrics ?? []);
    setSeries(toInitialSeries(widget, widget?.type ?? "line"));
    setSeriesEditorOpen(false);
    setEditingSeriesId(null);
    setSeriesForm({
      metric: "",
      type: "bar",
      color: "#2563eb",
      y_axis: "left",
      label: "",
    });
    setLimit(widget?.query?.limit ?? 500);
    setTitle(widget?.title ?? "");
    setColor(widget?.style?.color ?? "#2563eb");
    setKpiTemplate(widget?.style?.kpi_template ?? "bordered-left");
    setShowLegend(widget?.style?.showLegend ?? true);
    setBackgroundColor(widget?.style?.background_color ?? "#ffffff");
    setShowBorder(widget?.style?.show_border ?? true);
    setShowGridHorizontal(widget?.style?.show_grid_horizontal ?? true);
    setShowGridVertical(widget?.style?.show_grid_vertical ?? false);
    setGridColor(widget?.style?.grid_color ?? "#e0e0e0");
    setLegendPosition(widget?.style?.legend_position ?? "top");
    setShowAxisX(widget?.style?.show_axis_x ?? true);
    setShowAxisY(widget?.style?.show_axis_y ?? true);
    setFormatDatesX(widget?.style?.format_dates_x ?? false);
    setColorPalette(widget?.style?.colors?.length ? widget.style.colors.slice(0, 8) : [widget?.style?.color ?? "#2563eb"]);
    setW(widget?.layout?.w ?? 6);
    setH(widget?.layout?.h ?? 3);
    setError("");
  }, [isOpen, widget, defaultDatasetId]);

  useEffect(() => {
    if (!isOpen) return;
    async function loadDatasets() {
      try {
        const rows = await listDatasets();
        setDatasets(rows);
      } catch (err: any) {
        setError(err?.message || "Erro ao carregar datasets.");
      }
    }
    void loadDatasets();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !datasetId) {
      setDimensions([]);
      setMetrics([]);
      return;
    }
    async function loadDataModel() {
      try {
        const [dimRows, metricRows] = await Promise.all([
          listDimensions(datasetId),
          listMetrics(datasetId),
        ]);
        setDimensions(dimRows);
        setMetrics(metricRows);
      } catch (err: any) {
        setError(err?.message || "Erro ao carregar dimensoes/metricas.");
      }
    }
    void loadDataModel();
  }, [isOpen, datasetId]);

  const canConfigureChartOptions = useMemo(() => chartOptionTypes.includes(type), [type]);
  const canShowLegend = canConfigureChartOptions;
  const usesCombinedSeries = useMemo(() => combinedSeriesTypes.includes(type), [type]);

  function handleMetricSelection(event: ChangeEvent<HTMLSelectElement>) {
    const values = Array.from(event.target.selectedOptions).map((opt) => opt.value);
    setSelectedMetrics(values);
  }

  function openNewSeriesEditor() {
    if (series.length >= 8) return;
    setEditingSeriesId(null);
    setSeriesForm({
      metric: metrics[0]?.name ?? "",
      type: type === "line" || type === "bar" || type === "area" ? type : "bar",
      color: getDefaultSeriesColor(series.length),
      y_axis: "left",
      label: "",
    });
    setSeriesEditorOpen(true);
  }

  function openEditSeriesEditor(seriesId: string) {
    const current = series.find((item) => item.id === seriesId);
    if (!current) return;
    setEditingSeriesId(seriesId);
    setSeriesForm({
      metric: current.metric,
      type: current.type,
      color: current.color,
      y_axis: current.y_axis,
      label: current.label ?? "",
    });
    setSeriesEditorOpen(true);
  }

  function cancelSeriesEditor() {
    setSeriesEditorOpen(false);
    setEditingSeriesId(null);
  }

  function confirmSeriesEditor() {
    if (!seriesForm.metric) {
      setError("Selecione uma metrica para a serie.");
      return;
    }

    setError("");
    if (editingSeriesId) {
      setSeries((prev) =>
        prev.map((item) =>
          item.id === editingSeriesId
            ? { ...item, ...seriesForm, label: seriesForm.label.trim() || undefined }
            : item,
        ),
      );
    } else {
      setSeries((prev) => [
        ...prev,
        {
          id: createSeriesId(),
          ...seriesForm,
          label: seriesForm.label.trim() || undefined,
        },
      ]);
    }
    setSeriesEditorOpen(false);
    setEditingSeriesId(null);
  }

  function removeSeries(seriesId: string) {
    setSeries((prev) => prev.filter((item) => item.id !== seriesId));
    if (editingSeriesId === seriesId) {
      cancelSeriesEditor();
    }
  }

  function updatePaletteColor(index: number, next: string) {
    setColorPalette((prev) => prev.map((c, i) => (i === index ? next : c)));
    if (index === 0) {
      setColor(next);
    }
  }

  function addPaletteColor() {
    setColorPalette((prev) => (prev.length >= 8 ? prev : [...prev, "#2563eb"]));
  }

  function removePaletteColor(index: number) {
    setColorPalette((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== index);
      if (index === 0 && next[0]) {
        setColor(next[0]);
      }
      return next;
    });
  }

  async function handleSave() {
    if (!datasetId) {
      setError("Dataset e obrigatorio.");
      return;
    }
    if (usesCombinedSeries && series.length === 0) {
      setError("Adicione ao menos uma serie.");
      return;
    }
    if (!usesCombinedSeries && selectedMetrics.length === 0) {
      setError("Selecione ao menos uma metrica.");
      return;
    }
    if ((type !== "kpi" && type !== "table") && !dimension) {
      setError("Selecione uma dimensao.");
      return;
    }

    setError("");
    setSaving(true);
    try {
      const legacyMetrics = usesCombinedSeries ? series.map((item) => item.metric) : selectedMetrics;
      const legacyDimensions = dimension ? [dimension] : [];
      await onSave({
        type,
        title: title.trim() || "Widget",
        query: {
          dataset_id: datasetId,
          series: usesCombinedSeries ? series : undefined,
          dimension: usesCombinedSeries ? dimension : undefined,
          metrics: legacyMetrics,
          dimensions: legacyDimensions,
          filters: widget?.query?.filters ?? [],
          limit: Number(limit) || 500,
        },
        style: {
          color,
          colors: colorPalette.length ? colorPalette : [color],
          title: title.trim(),
          kpi_template: type === "kpi" ? kpiTemplate : undefined,
          showLegend: canShowLegend ? showLegend : undefined,
          background_color: canConfigureChartOptions ? backgroundColor : undefined,
          show_border: canConfigureChartOptions ? showBorder : undefined,
          show_grid_horizontal: canConfigureChartOptions ? showGridHorizontal : undefined,
          show_grid_vertical: canConfigureChartOptions ? showGridVertical : undefined,
          grid_color: canConfigureChartOptions ? gridColor : undefined,
          legend_position: canShowLegend ? legendPosition : undefined,
          show_axis_x: canConfigureChartOptions ? showAxisX : undefined,
          show_axis_y: canConfigureChartOptions ? showAxisY : undefined,
          format_dates_x: canConfigureChartOptions ? formatDatesX : undefined,
        },
        layout: {
          x: widget?.layout?.x ?? 0,
          y: widget?.layout?.y ?? 0,
          w,
          h,
        },
      });
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <aside className={styles.panel}>
      <header className={styles.header}>
        <h3 className={styles.title}>{widget ? "Editar Widget" : "Novo Widget"}</h3>
        <button type="button" className={styles.closeBtn} onClick={onCancel}>
          X
        </button>
      </header>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "dados" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("dados")}
        >
          Dados
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "aparencia" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("aparencia")}
        >
          Aparencia
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "layout" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("layout")}
        >
          Layout
        </button>
      </div>

      <div className={styles.body}>
        {activeTab === "dados" ? (
          <>
            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>Tipo</h4>
              <div className={styles.row}>
                <label className={styles.label} htmlFor="widget-type">Visualizacao</label>
                <select
                  id="widget-type"
                  className={styles.select}
                  value={type}
                  onChange={(e) => setType(e.target.value as WidgetType)}
                >
                  {widgetTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>Dados</h4>
              <div className={styles.row}>
                <label className={styles.label} htmlFor="widget-dataset">Dataset</label>
                <select
                  id="widget-dataset"
                  className={styles.select}
                  value={datasetId}
                  onChange={(e) => setDatasetId(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {datasets.map((dataset) => (
                    <option key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.row}>
                <label className={styles.label} htmlFor="widget-dimension">Dimensao</label>
                <select
                  id="widget-dimension"
                  className={styles.select}
                  value={dimension}
                  onChange={(e) => setDimension(e.target.value)}
                >
                  <option value="">Sem dimensao</option>
                  {dimensions.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.row}>
                <label className={styles.label} htmlFor="widget-metrics">Metricas</label>
                {usesCombinedSeries ? (
                  <div className={styles.seriesBuilder}>
                    <div className={styles.seriesList}>
                      {series.length === 0 ? (
                        <p className={styles.seriesEmpty}>Nenhuma serie adicionada.</p>
                      ) : (
                        series.map((item) => (
                          <div key={item.id} className={styles.seriesItem}>
                            <button
                              type="button"
                              className={styles.seriesMain}
                              onClick={() => openEditSeriesEditor(item.id)}
                            >
                              <span className={styles.seriesType}>
                                {item.type === "bar" ? "📊" : item.type === "line" ? "📈" : "🏔"}
                              </span>
                              <span className={styles.seriesName}>{item.label || item.metric}</span>
                              <span
                                className={styles.seriesColor}
                                style={{ backgroundColor: item.color }}
                                aria-hidden="true"
                              />
                              <span className={styles.seriesAxis}>{item.y_axis === "left" ? "Y1" : "Y2"}</span>
                            </button>
                            <button
                              type="button"
                              className={styles.smallBtn}
                              onClick={() => removeSeries(item.id)}
                              aria-label={`Remover serie ${item.label || item.metric}`}
                            >
                              x
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <button
                      type="button"
                      className={styles.button}
                      onClick={openNewSeriesEditor}
                      disabled={series.length >= 8 || metrics.length === 0}
                    >
                      + Adicionar Serie
                    </button>

                    {seriesEditorOpen ? (
                      <div className={styles.seriesEditor}>
                        <div className={styles.row}>
                          <label className={styles.label} htmlFor="series-metric">Metrica</label>
                          <select
                            id="series-metric"
                            className={styles.select}
                            value={seriesForm.metric}
                            onChange={(e) => setSeriesForm((prev) => ({ ...prev, metric: e.target.value }))}
                          >
                            <option value="">Selecione</option>
                            {metrics.map((metric) => (
                              <option key={metric.id} value={metric.name}>
                                {metric.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className={styles.rowInline}>
                          <div className={styles.row}>
                            <label className={styles.label} htmlFor="series-type">Tipo</label>
                            <select
                              id="series-type"
                              className={styles.select}
                              value={seriesForm.type}
                              onChange={(e) =>
                                setSeriesForm((prev) => ({
                                  ...prev,
                                  type: e.target.value as SeriesFormState["type"],
                                }))
                              }
                            >
                              <option value="bar">📊 Barra</option>
                              <option value="line">📈 Linha</option>
                              <option value="area">🏔 Area</option>
                            </select>
                          </div>
                          <div className={styles.row}>
                            <label className={styles.label} htmlFor="series-color">Cor</label>
                            <input
                              id="series-color"
                              className={styles.input}
                              type="color"
                              value={seriesForm.color}
                              onChange={(e) => setSeriesForm((prev) => ({ ...prev, color: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className={styles.row}>
                          <label className={styles.label} htmlFor="series-axis">Eixo Y</label>
                          <select
                            id="series-axis"
                            className={styles.select}
                            value={seriesForm.y_axis}
                            onChange={(e) =>
                              setSeriesForm((prev) => ({
                                ...prev,
                                y_axis: e.target.value as SeriesFormState["y_axis"],
                              }))
                            }
                          >
                            <option value="left">Esquerdo</option>
                            <option value="right">Direito</option>
                          </select>
                        </div>

                        <div className={styles.row}>
                          <label className={styles.label} htmlFor="series-label">Label customizado</label>
                          <input
                            id="series-label"
                            className={styles.input}
                            value={seriesForm.label}
                            onChange={(e) => setSeriesForm((prev) => ({ ...prev, label: e.target.value }))}
                            placeholder="Usa o nome da metrica se vazio"
                          />
                        </div>

                        <div className={styles.seriesEditorActions}>
                          <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={confirmSeriesEditor}>
                            Confirmar
                          </button>
                          <button type="button" className={styles.button} onClick={cancelSeriesEditor}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <select
                    id="widget-metrics"
                    className={styles.multiSelect}
                    multiple
                    value={selectedMetrics}
                    onChange={handleMetricSelection}
                  >
                    {metrics.map((metric) => (
                      <option key={metric.id} value={metric.name}>
                        {metric.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className={styles.row}>
                <label className={styles.label} htmlFor="widget-limit">Limite</label>
                <input
                  id="widget-limit"
                  className={styles.input}
                  type="number"
                  min={1}
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                />
              </div>
            </section>
          </>
        ) : null}

        {activeTab === "aparencia" ? (
          <>
            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>Aparencia</h4>
              <div className={styles.row}>
                <label className={styles.label} htmlFor="widget-title">Titulo</label>
                <input
                  id="widget-title"
                  className={styles.input}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Titulo do widget"
                />
              </div>
              <div className={styles.row}>
                <label className={styles.label} htmlFor="widget-color">Cor principal</label>
                <input
                  id="widget-color"
                  className={styles.input}
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>
              {type === "kpi" ? (
                <div className={styles.row}>
                  <label className={styles.label} htmlFor="widget-kpi-template">Template do Card</label>
                  <select
                    id="widget-kpi-template"
                    className={styles.select}
                    value={kpiTemplate}
                    onChange={(e) => setKpiTemplate(e.target.value as NonNullable<WidgetStyle["kpi_template"]>)}
                  >
                    <option value="bordered-left">bordered-left</option>
                    <option value="gradient">gradient</option>
                    <option value="minimal">minimal</option>
                    <option value="colored">colored</option>
                  </select>
                </div>
              ) : null}
            </section>

            {canConfigureChartOptions ? (
              <section className={styles.section}>
                <h4 className={styles.sectionTitle}>Opcoes do Grafico</h4>

                <div className={styles.row}>
                  <label className={styles.label} htmlFor="chart-title-style">Titulo do grafico</label>
                  <input
                    id="chart-title-style"
                    className={styles.input}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Titulo do grafico"
                  />
                </div>

                <div className={styles.rowInline}>
                  <div className={styles.row}>
                    <label className={styles.label} htmlFor="chart-bg-color">Cor de fundo do card</label>
                    <input
                      id="chart-bg-color"
                      className={styles.input}
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                    />
                  </div>
                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={showBorder}
                      onChange={(e) => setShowBorder(e.target.checked)}
                    />
                    Mostrar borda do card
                  </label>
                </div>

                <div className={styles.subSection}>
                  <strong className={styles.label}>Linhas de grade</strong>
                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={showGridHorizontal}
                      onChange={(e) => setShowGridHorizontal(e.target.checked)}
                    />
                    Mostrar linhas horizontais
                  </label>
                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={showGridVertical}
                      onChange={(e) => setShowGridVertical(e.target.checked)}
                    />
                    Mostrar linhas verticais
                  </label>
                  <div className={styles.row}>
                    <label className={styles.label} htmlFor="grid-color">Cor das linhas de grade</label>
                    <input
                      id="grid-color"
                      className={styles.input}
                      type="color"
                      value={gridColor}
                      onChange={(e) => setGridColor(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.subSection}>
                  <strong className={styles.label}>Legenda</strong>
                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={showLegend}
                      onChange={(e) => setShowLegend(e.target.checked)}
                    />
                    Mostrar legenda
                  </label>
                  <div className={styles.row}>
                    <label className={styles.label} htmlFor="legend-position">Posicao da legenda</label>
                    <select
                      id="legend-position"
                      className={styles.select}
                      value={legendPosition}
                      onChange={(e) => setLegendPosition(e.target.value as NonNullable<WidgetStyle["legend_position"]>)}
                    >
                      <option value="top">top</option>
                      <option value="bottom">bottom</option>
                      <option value="left">left</option>
                      <option value="right">right</option>
                    </select>
                  </div>
                </div>

                <div className={styles.subSection}>
                  <strong className={styles.label}>Eixos</strong>
                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={showAxisX}
                      onChange={(e) => setShowAxisX(e.target.checked)}
                    />
                    Mostrar label eixo X
                  </label>
                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={showAxisY}
                      onChange={(e) => setShowAxisY(e.target.checked)}
                    />
                    Mostrar label eixo Y
                  </label>
                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={formatDatesX}
                      onChange={(e) => setFormatDatesX(e.target.checked)}
                    />
                    Formatar datas no eixo X
                  </label>
                </div>

                <div className={styles.subSection}>
                  <strong className={styles.label}>Paleta de cores</strong>
                  <div className={styles.paletteList}>
                    {colorPalette.map((paletteColor, index) => (
                      <div key={`${paletteColor}-${index}`} className={styles.paletteItem}>
                        <input
                          className={styles.input}
                          type="color"
                          value={paletteColor}
                          onChange={(e) => updatePaletteColor(index, e.target.value)}
                        />
                        <button
                          type="button"
                          className={styles.smallBtn}
                          onClick={() => removePaletteColor(index)}
                          disabled={colorPalette.length <= 1}
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className={styles.button}
                    onClick={addPaletteColor}
                    disabled={colorPalette.length >= 8}
                  >
                    + Adicionar cor
                  </button>
                </div>
              </section>
            ) : null}
          </>
        ) : null}

        {activeTab === "layout" ? (
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Layout</h4>
            <div className={styles.row}>
              <label className={styles.label} htmlFor="widget-width">Largura (colunas)</label>
              <select
                id="widget-width"
                className={styles.select}
                value={w}
                onChange={(e) => setW(Number(e.target.value))}
              >
                {[3, 4, 6, 8, 12].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.row}>
              <label className={styles.label} htmlFor="widget-height">Altura (linhas)</label>
              <select
                id="widget-height"
                className={styles.select}
                value={h}
                onChange={(e) => setH(Number(e.target.value))}
              >
                {[2, 3, 4, 6].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </section>
        ) : null}

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar Widget"}
          </button>
          <button type="button" className={styles.button} onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </aside>
  );
}
