import ReactECharts from "echarts-for-react";
import type { WidgetStyle } from "@/services/dashboardsService";

type Props = {
  title: string;
  data: Record<string, any>[];
  dimension: string;
  metric: string;
  colors?: string[];
  style?: WidgetStyle;
};

function legendConfig(style?: WidgetStyle) {
  if (style?.showLegend === false) return undefined;
  const position = style?.legend_position || "bottom";
  const base: Record<string, any> = {
    orient: position === "left" || position === "right" ? "vertical" : "horizontal",
  };
  base[position] = 0;
  return base;
}

export default function PieChart({ title, data, dimension, metric, colors, style }: Props) {
  const palette = style?.colors?.length ? style.colors : (colors?.length ? colors : ["#1a3a4f", "#2e86ab", "#a23b72"]);
  const titleText = style?.title || title;
  const option = {
    backgroundColor: style?.background_color || "#ffffff",
    color: palette,
    title: titleText ? { text: titleText, left: "center", textStyle: { fontSize: 14, fontWeight: 600 } } : undefined,
    tooltip: { trigger: "item" },
    legend: legendConfig(style),
    series: [
      {
        type: "pie",
        radius: ["40%", "70%"],
        center: ["50%", "58%"],
        itemStyle: { borderRadius: 4, borderColor: "#fff", borderWidth: 2 },
        label: { formatter: "{b}: {d}%" },
        data: data.map((row) => ({
          name: String(row[dimension] ?? ""),
          value: Number(row[metric] ?? 0),
        })),
      },
    ],
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
