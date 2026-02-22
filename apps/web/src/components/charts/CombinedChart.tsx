import ReactECharts from "echarts-for-react";
import type { WidgetSeries, WidgetStyle } from "@/services/dashboardsService";

type Props = {
  series: WidgetSeries[];
  data: Record<string, any>[];
  dimension: string;
  style?: WidgetStyle;
};

function formatXAxisValue(value: any, formatDates?: boolean) {
  if (!formatDates || value == null) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
}

function legendConfig(style?: WidgetStyle, labels?: string[]) {
  if (style?.showLegend === false) return undefined;
  const position = style?.legend_position || "bottom";
  const base: Record<string, any> = {
    data: labels || [],
    orient: position === "left" || position === "right" ? "vertical" : "horizontal",
  };
  base[position] = 0;
  return base;
}

export default function CombinedChart({ series, data, dimension, style }: Props) {
  const hasSecondaryAxis = series.some((s) => s.y_axis === "right");
  const allSameType = series.length > 0 && series.every((s) => s.type === series[0]?.type);
  const showSecondaryAxis = hasSecondaryAxis || !allSameType;
  const labels = series.map((s) => s.label || s.metric);

  const option = {
    backgroundColor: style?.background_color || "#ffffff",
    title: style?.title ? { text: style.title, left: "center", textStyle: { fontSize: 14, fontWeight: 600 } } : undefined,
    tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
    legend: legendConfig(style, labels),
    grid: {
      containLabel: true,
      left: 16,
      right: 16,
      top: style?.title ? 40 : 16,
      bottom: 40,
    },
    xAxis: {
      show: style?.show_axis_x !== false,
      type: "category",
      data: data.map((row) => {
        const val = row?.[dimension];
        return formatXAxisValue(val, style?.format_dates_x);
      }),
      splitLine: {
        show: style?.show_grid_vertical || false,
        lineStyle: { color: style?.grid_color || "#e0e0e0" },
      },
    },
    yAxis: [
      {
        show: style?.show_axis_y !== false,
        type: "value",
        name: "Primario",
        splitLine: {
          show: style?.show_grid_horizontal !== false,
          lineStyle: { color: style?.grid_color || "#e0e0e0" },
        },
      },
      {
        show: showSecondaryAxis && style?.show_axis_y !== false,
        type: "value",
        name: "Secundario",
        splitLine: { show: false },
      },
    ],
    color: style?.colors?.length ? style.colors : undefined,
    series: series.map((s) => ({
      name: s.label || s.metric,
      type: s.type === "area" ? "line" : s.type,
      yAxisIndex: s.y_axis === "right" ? 1 : 0,
      data: data.map((row) => row?.[s.metric]),
      itemStyle: { color: s.color },
      lineStyle: s.type === "line" || s.type === "area" ? { color: s.color } : undefined,
      areaStyle: s.type === "area" ? { opacity: 0.3, color: s.color } : undefined,
      smooth: s.type === "line" || s.type === "area",
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

