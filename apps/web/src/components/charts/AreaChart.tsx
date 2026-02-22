import ReactECharts from "echarts-for-react";
import type { WidgetStyle } from "@/services/dashboardsService";

type Props = {
  title: string;
  data: Record<string, any>[];
  metrics: string[];
  dimension: string;
  colors?: string[];
  style?: WidgetStyle;
};

function formatXAxisValue(value: string, formatDates?: boolean) {
  if (!formatDates) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
}

function legendConfig(style?: WidgetStyle) {
  if (style?.showLegend === false) return undefined;
  const position = style?.legend_position || "bottom";
  const base: Record<string, any> = {
    orient: position === "left" || position === "right" ? "vertical" : "horizontal",
  };
  base[position] = 0;
  return base;
}

export default function AreaChart({ title, data, metrics, dimension, colors, style }: Props) {
  const palette = style?.colors?.length ? style.colors : (colors?.length ? colors : ["#1a3a4f", "#2e86ab", "#a23b72"]);
  const titleText = style?.title || title;
  const option = {
    backgroundColor: style?.background_color || "#ffffff",
    color: palette,
    title: titleText ? { text: titleText, left: "center", textStyle: { fontSize: 14, fontWeight: 600 } } : undefined,
    tooltip: { trigger: "axis" },
    legend: legendConfig(style),
    grid: {
      containLabel: true,
      left: 16,
      right: 16,
      top: titleText ? 40 : 16,
      bottom: 16,
    },
    xAxis: {
      show: style?.show_axis_x !== false,
      type: "category",
      data: data.map((row) => String(row[dimension] ?? "")),
      axisLabel: {
        formatter: (val: string) => formatXAxisValue(val, style?.format_dates_x),
      },
      splitLine: {
        show: style?.show_grid_vertical || false,
        lineStyle: { color: style?.grid_color || "#e0e0e0" },
      },
    },
    yAxis: {
      show: style?.show_axis_y !== false,
      type: "value",
      splitLine: {
        show: style?.show_grid_horizontal !== false,
        lineStyle: { color: style?.grid_color || "#e0e0e0" },
      },
    },
    series: metrics.map((metric) => ({
      name: metric,
      type: "line",
      smooth: true,
      areaStyle: { opacity: 0.22 },
      data: data.map((row) => Number(row[metric] ?? 0)),
    })),
  };

  return (
    <div
      style={{
        background: style?.background_color || "#ffffff",
        border: style?.show_border === false ? "none" : "1px solid #e0e0e0",
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}
    >
      <ReactECharts option={option} style={{ height: 300 }} />
    </div>
  );
}
