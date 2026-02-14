import React, { useEffect, useMemo, useRef } from "react";
import * as echarts from "echarts";
import { WidgetSeries, ChartType } from "../types";

type Props = {
  chartType: ChartType;
  rows: Record<string, any>[];
  dimension: string;
  series: WidgetSeries[];
};

function toStr(v: any) {
  if (v === null || v === undefined) return "";
  return String(v);
}
function toNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function ChartWidget({ chartType, rows, dimension, series }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  const option = useMemo((): echarts.EChartsOption => {
    if (!dimension) return { title: { text: "Select a dimension" } };
    if (!series?.length) return { title: { text: "Add at least 1 series" } };

    const x = rows.map((r) => toStr(r[dimension]));

    if (chartType === "combined") {
      const echartsSeries = series.map((s) => {
        const y = rows.map((r) => toNum(r[s.metric]));
        return {
          name: s.name ?? s.metric,
          type: s.type === "area" ? "line" : s.type,
          areaStyle: s.type === "area" ? {} : undefined,
          data: y,
          smooth: s.type === "line" || s.type === "area",
        };
      });

      return {
        tooltip: { trigger: "axis" },
        legend: { top: 0 },
        grid: { top: 38, left: 40, right: 16, bottom: 40 },
        xAxis: { type: "category", data: x },
        yAxis: { type: "value" },
        series: echartsSeries as any,
      };
    }

    if (chartType === "pie") {
      const s0 = series[0];
      const data = rows.map((r) => ({ name: toStr(r[dimension]), value: toNum(r[s0.metric]) }));
      return {
        tooltip: { trigger: "item" },
        legend: { top: 0 },
        series: [{ name: s0.name ?? s0.metric, type: "pie", radius: "70%", data }],
      };
    }

    if (chartType === "heatmap") {
      return { title: { text: "Heatmap needs 2 dimensions (next step)" } };
    }

    return { title: { text: "Unsupported chart type" } };
  }, [chartType, rows, dimension, series]);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    chart.setOption(option);
    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
    };
  }, [option]);

  return <div ref={ref} style={{ width: "100%", height: 360 }} />;
}
