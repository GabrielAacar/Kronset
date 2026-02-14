import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";

type Props = {
  mode: "bar" | "line" | "heatmap";
  rows: Record<string, any>[];
  dimensions: string[];
  metric: string;
};

function toStr(v: any) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function toNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function Chart({ mode, rows, dimensions, metric }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const chart = echarts.init(ref.current);

    const dim1 = dimensions[0];
    const dim2 = dimensions[1];

    let option: echarts.EChartsOption = {};

    if (mode === "bar") {
      const x = rows.map((r) => toStr(r[dim1]));
      const y = rows.map((r) => toNum(r[metric]));

      option = {
        tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: x },
        yAxis: { type: "value" },
        series: [{ type: "bar", data: y }],
      };
    }

    if (mode === "line") {
      const x = rows.map((r) => toStr(r[dim1]));
      const y = rows.map((r) => toNum(r[metric]));

      option = {
        tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: x },
        yAxis: { type: "value" },
        series: [{ type: "line", data: y, smooth: true }],
      };
    }

    if (mode === "heatmap") {
      const xCats = Array.from(new Set(rows.map((r) => toStr(r[dim1]))));
      const yCats = Array.from(new Set(rows.map((r) => toStr(r[dim2]))));

      const xIndex = new Map(xCats.map((v, i) => [v, i]));
      const yIndex = new Map(yCats.map((v, i) => [v, i]));

      const data = rows.map((r) => [
        xIndex.get(toStr(r[dim1])) ?? 0,
        yIndex.get(toStr(r[dim2])) ?? 0,
        toNum(r[metric]),
      ]);

      option = {
        tooltip: { position: "top" },
        grid: { height: "70%", top: "10%" },
        xAxis: { type: "category", data: xCats, splitArea: { show: true } },
        yAxis: { type: "category", data: yCats, splitArea: { show: true } },
        visualMap: {
          min: 0,
          max: Math.max(...rows.map((r) => toNum(r[metric])), 1),
          calculable: true,
          orient: "horizontal",
          left: "center",
          bottom: "2%",
        },
        series: [
          {
            type: "heatmap",
            data,
            emphasis: {
              itemStyle: { shadowBlur: 10, shadowColor: "rgba(0,0,0,0.2)" },
            },
          },
        ],
      };
    }

    chart.setOption(option);
    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
    };
  }, [mode, rows, dimensions, metric]);

  return <div ref={ref} style={{ width: "100%", height: 420 }} />;
}
