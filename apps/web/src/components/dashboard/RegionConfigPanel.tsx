import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { listDimensions, type Dimension } from "@/services/dimensionsService";
import ColorPicker from "@/components/shared/ColorPicker";
import type {
  DashboardLayoutAsideConfig,
  DashboardLayoutContentConfig,
  DashboardLayoutFilterConfig,
  DashboardLayoutFilterType,
  DashboardLayoutFooterConfig,
  DashboardLayoutHeaderConfig,
} from "@/services/dashboardsService";
import styles from "./RegionConfigPanel.module.css";

type Region = "header" | "aside" | "footer" | "content";

type Props = {
  region: Region;
  config:
    | DashboardLayoutHeaderConfig
    | DashboardLayoutAsideConfig
    | DashboardLayoutFooterConfig
    | DashboardLayoutContentConfig;
  datasetId: string;
  onChange: (newConfig: any) => void;
};

function LogoRenderer({ value, textColor }: { value: string; textColor: string }) {
  if (!value?.trim()) return null;

  const trimmed = value.trim();

  if (trimmed.startsWith("<svg")) {
    return (
      <div
        className={styles.logoPreviewWrap}
        dangerouslySetInnerHTML={{ __html: trimmed }}
      />
    );
  }

  if (trimmed.startsWith("http") || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(trimmed)) {
    return <img src={trimmed} alt="logo" className={styles.logoPreviewImage} />;
  }

  return (
    <h1 className={styles.logoPreviewText} style={{ color: textColor }}>
      {trimmed}
    </h1>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={styles.row}>
      <ColorPicker label={label} value={value} onChange={onChange} />
    </div>
  );
}

function HeaderPanel({
  config,
  onChange,
}: {
  config: DashboardLayoutHeaderConfig;
  onChange: (next: DashboardLayoutHeaderConfig) => void;
}) {
  return (
    <div className={styles.card}>
      <h4 className={styles.cardTitle}>Header</h4>
      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
        />
        Ativar header
      </label>

      <div className={styles.row}>
        <label className={styles.label}>Logo</label>
        <input
          className={styles.input}
          value={config.logo_url}
          onChange={(e) => onChange({ ...config, logo_url: e.target.value })}
          placeholder="URL, SVG inline ou texto"
        />
      </div>

      <div className={styles.previewBox}>
        <div
          className={styles.headerPreview}
          style={{ background: config.background_color, color: config.text_color }}
        >
          <span className={styles.headerPreviewLogo}>
            <LogoRenderer value={config.logo_url} textColor={config.text_color} />
            {!config.logo_url?.trim() ? "Logo" : null}
          </span>
          <span className={styles.headerPreviewTitle}>{config.title || "Titulo"}</span>
          <span className={styles.headerPreviewDate}>{config.show_updated_at ? "22/02/2026" : ""}</span>
        </div>
      </div>

      <div className={styles.row}>
        <label className={styles.label}>Titulo</label>
        <input
          className={styles.input}
          value={config.title}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
        />
      </div>

      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={config.show_updated_at}
          onChange={(e) => onChange({ ...config, show_updated_at: e.target.checked })}
        />
        Mostrar data de atualizacao
      </label>

      <ColorField
        label="Cor de fundo"
        value={config.background_color}
        onChange={(value) => onChange({ ...config, background_color: value })}
      />
      <ColorField
        label="Cor do texto"
        value={config.text_color}
        onChange={(value) => onChange({ ...config, text_color: value })}
      />
    </div>
  );
}

function AsidePanel({
  config,
  datasetId,
  onChange,
}: {
  config: DashboardLayoutAsideConfig;
  datasetId: string;
  onChange: (next: DashboardLayoutAsideConfig) => void;
}) {
  const [dimensions, setDimensions] = useState<Dimension[]>([]);

  useEffect(() => {
    if (!datasetId) return;
    let active = true;
    async function load() {
      try {
        const rows = await listDimensions(datasetId);
        if (active) setDimensions(rows);
      } catch {
        if (active) setDimensions([]);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [datasetId]);

  const dimensionNames = useMemo(() => dimensions.map((d) => d.name), [dimensions]);

  function addFilter() {
    const next: DashboardLayoutFilterConfig = {
      id: `f${Date.now()}`,
      label: "Novo filtro",
      type: "select",
      dimension: dimensionNames[0] || "",
    };
    onChange({ ...config, filters: [...config.filters, next] });
  }

  function updateFilter(id: string, updates: Partial<DashboardLayoutFilterConfig>) {
    onChange({
      ...config,
      filters: config.filters.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    });
  }

  function removeFilter(id: string) {
    onChange({
      ...config,
      filters: config.filters.filter((f) => f.id !== id),
    });
  }

  return (
    <div className={styles.card}>
      <h4 className={styles.cardTitle}>Aside</h4>
      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
        />
        Ativar aside
      </label>

      <div className={styles.rowInline}>
        <div className={styles.row}>
          <label className={styles.label}>Largura</label>
          <div className={styles.inlineField}>
            <input
              className={styles.input}
              type="number"
              value={config.width}
              onChange={(e) => onChange({ ...config, width: Number(e.target.value) || 220 })}
            />
            <span className={styles.suffix}>px</span>
          </div>
        </div>
      </div>

      <ColorField
        label="Cor de fundo"
        value={config.background_color}
        onChange={(value) => onChange({ ...config, background_color: value })}
      />
      <ColorField
        label="Cor do texto"
        value={config.text_color || "#000000"}
        onChange={(value) => onChange({ ...config, text_color: value })}
      />

      <div className={styles.filtersBlock}>
        <div className={styles.filtersHead}>
          <span className={styles.subTitle}>Filtros</span>
          <button type="button" className={styles.button} onClick={addFilter}>
            + Adicionar Filtro
          </button>
        </div>

        <div className={styles.filtersList}>
          {config.filters.map((filter) => (
            <div key={filter.id} className={styles.filterRow}>
              <div className={styles.filterMeta}>
                <span className={styles.dot} />
                <input
                  className={styles.input}
                  value={filter.label}
                  onChange={(e) => updateFilter(filter.id, { label: e.target.value })}
                  placeholder="Label"
                />
              </div>
              <select
                className={styles.select}
                value={filter.type}
                onChange={(e) => updateFilter(filter.id, { type: e.target.value as DashboardLayoutFilterType })}
              >
                <option value="select">select</option>
                <option value="daterange">daterange</option>
              </select>
              <button type="button" className={styles.iconBtn} onClick={() => removeFilter(filter.id)}>
                x
              </button>

              {filter.type === "select" ? (
                <select
                  className={`${styles.select} ${styles.filterDimensionSelect}`}
                  value={filter.dimension || ""}
                  onChange={(e) => updateFilter(filter.id, { dimension: e.target.value })}
                >
                  <option value="">Dimensao</option>
                  {dimensionNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
          ))}

          {config.filters.length === 0 ? <p className={styles.empty}>Nenhum filtro configurado.</p> : null}
        </div>
      </div>
    </div>
  );
}

function FooterPanel({
  config,
  onChange,
}: {
  config: DashboardLayoutFooterConfig;
  onChange: (next: DashboardLayoutFooterConfig) => void;
}) {
  return (
    <div className={styles.card}>
      <h4 className={styles.cardTitle}>Footer</h4>
      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
        />
        Ativar footer
      </label>

      <div className={styles.row}>
        <label className={styles.label}>Texto</label>
        <input
          className={styles.input}
          value={config.text}
          onChange={(e) => onChange({ ...config, text: e.target.value })}
        />
      </div>

      <ColorField
        label="Cor de fundo"
        value={config.background_color}
        onChange={(value) => onChange({ ...config, background_color: value })}
      />
      <ColorField
        label="Cor do texto"
        value={config.text_color}
        onChange={(value) => onChange({ ...config, text_color: value })}
      />
    </div>
  );
}

function LabeledSlider({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "px",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className={styles.row}>
      <div className={styles.sliderHead}>
        <label className={styles.label}>{label}</label>
        <span className={styles.sliderValue}>{value}{suffix}</span>
      </div>
      <input
        className={styles.slider}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function ContentPanel({
  config,
  onChange,
}: {
  config: DashboardLayoutContentConfig;
  onChange: (next: DashboardLayoutContentConfig) => void;
}) {
  const previewBg = config.background_color || "#f5f5f5";
  const previewWidgetBg = config.widget_background || "#ffffff";
  const previewRadius = config.border_radius_widgets ?? 12;
  const previewGap = Math.max(0, Math.min(24, config.gap ?? 16));
  const previewPadding = Math.max(0, Math.min(24, config.padding ?? 24));
  const previewColumns = config.grid_columns || 12;

  const previewBackgroundImage = config.grid_show_lines
    ? `linear-gradient(to right, ${config.grid_line_color || "#e0e0e0"} 1px, transparent 1px)`
    : undefined;

  return (
    <div className={styles.card}>
      <h4 className={styles.cardTitle}>Content</h4>

      <div className={styles.sectionBlock}>
        <div className={styles.subTitle}>Fundo</div>
        <ColorField
          label="Cor de fundo"
          value={config.background_color}
          onChange={(value) => onChange({ ...config, background_color: value })}
        />
        <div className={styles.row}>
          <label className={styles.label}>Imagem de fundo (URL)</label>
          <div className={styles.imageField}>
            <input
              className={styles.input}
              value={config.background_image || ""}
              onChange={(e) => onChange({ ...config, background_image: e.target.value })}
              placeholder="https://..."
            />
            {config.background_image ? (
              <div
                className={styles.thumbPreview}
                style={{ backgroundImage: `url(${config.background_image})` }}
                title="Preview"
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className={styles.sectionBlock}>
        <div className={styles.subTitle}>Espacamento</div>
        <LabeledSlider
          label="Padding interno"
          value={config.padding}
          min={0}
          max={64}
          onChange={(value) => onChange({ ...config, padding: value })}
        />
        <LabeledSlider
          label="Espaco entre widgets"
          value={config.gap}
          min={0}
          max={48}
          onChange={(value) => onChange({ ...config, gap: value })}
        />
      </div>

      <div className={styles.sectionBlock}>
        <div className={styles.subTitle}>Grid</div>
        <div className={styles.row}>
          <label className={styles.label}>Colunas do grid</label>
          <select
            className={styles.select}
            value={config.grid_columns}
            onChange={(e) => onChange({ ...config, grid_columns: Number(e.target.value) })}
          >
            {[6, 8, 10, 12].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <LabeledSlider
          label="Altura por linha"
          value={config.row_height}
          min={40}
          max={200}
          step={8}
          onChange={(value) => onChange({ ...config, row_height: value })}
        />
        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={config.grid_show_lines}
            onChange={(e) => onChange({ ...config, grid_show_lines: e.target.checked })}
          />
          Mostrar linhas de grade
        </label>
        {config.grid_show_lines ? (
          <ColorField
            label="Cor das linhas"
            value={config.grid_line_color}
            onChange={(value) => onChange({ ...config, grid_line_color: value })}
          />
        ) : null}
      </div>

      <div className={styles.sectionBlock}>
        <div className={styles.subTitle}>Widgets</div>
        <ColorField
          label="Cor de fundo dos widgets"
          value={config.widget_background}
          onChange={(value) => onChange({ ...config, widget_background: value })}
        />
        <LabeledSlider
          label="Border radius"
          value={config.border_radius_widgets}
          min={0}
          max={24}
          onChange={(value) => onChange({ ...config, border_radius_widgets: value })}
        />
        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={config.widget_shadow}
            onChange={(e) => onChange({ ...config, widget_shadow: e.target.checked })}
          />
          Mostrar sombra nos widgets
        </label>
      </div>

      <div className={styles.sectionBlock}>
        <div className={styles.subTitle}>Preview</div>
        <div
          className={styles.contentPreview}
          style={{
            backgroundColor: previewBg,
            backgroundImage: config.background_image
              ? `url(${config.background_image})`
              : previewBackgroundImage,
            backgroundSize: config.background_image
              ? "cover"
              : config.grid_show_lines
                ? `calc(100% / ${previewColumns}) 100%`
                : undefined,
            backgroundPosition: "center",
            padding: previewPadding,
            gap: previewGap,
          }}
        >
          <div
            className={styles.contentPreviewWidget}
            style={{
              background: previewWidgetBg,
              borderRadius: previewRadius,
              boxShadow: config.widget_shadow ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
              gridColumn: "span 5",
            }}
          />
          <div
            className={styles.contentPreviewWidget}
            style={{
              background: previewWidgetBg,
              borderRadius: previewRadius,
              boxShadow: config.widget_shadow ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
              gridColumn: "span 7",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function RegionConfigPanel({ region, config, datasetId, onChange }: Props) {
  const wrap = (node: ReactNode) => <div className={styles.panelContent}>{node}</div>;
  if (region === "header") {
    return wrap(<HeaderPanel config={config as DashboardLayoutHeaderConfig} onChange={onChange} />);
  }
  if (region === "aside") {
    return wrap(<AsidePanel config={config as DashboardLayoutAsideConfig} datasetId={datasetId} onChange={onChange} />);
  }
  if (region === "content") {
    return wrap(<ContentPanel config={config as DashboardLayoutContentConfig} onChange={onChange} />);
  }
  return wrap(<FooterPanel config={config as DashboardLayoutFooterConfig} onChange={onChange} />);
}
