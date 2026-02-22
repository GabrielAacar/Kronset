import type { CSSProperties, ReactNode } from "react";
import AreaChart from "@/components/charts/AreaChart";
import BarChart from "@/components/charts/BarChart";
import CombinedChart from "@/components/charts/CombinedChart";
import DataTable from "@/components/charts/DataTable";
import KpiCard from "@/components/charts/KpiCard";
import LineChart from "@/components/charts/LineChart";
import PieChart from "@/components/charts/PieChart";
import type { Widget } from "@/services/dashboardsService";

type Props = {
  widget: Widget;
  data: Record<string, any>[];
  loading?: boolean;
  wrapperStyle?: CSSProperties;
};

export default function WidgetRenderer({ widget, data, loading = false, wrapperStyle }: Props) {
  const title = widget.title || widget.style?.title || "Widget";
  const metrics = widget.query?.metrics ?? [];
  const dimension = widget.query?.dimension ?? widget.query?.dimensions?.[0] ?? "";
  const querySeries = widget.query?.series ?? [];
  const isCombined = querySeries.length > 0 && (widget.type === "line" || widget.type === "bar" || widget.type === "area");
  const colors = widget.style?.colors || (widget.style?.color ? [widget.style.color] : undefined);
  const wrap = (node: ReactNode) => (wrapperStyle ? <div style={wrapperStyle}>{node}</div> : node);

  if (loading) {
    return wrap(
      <div style={boxStyle}>
        <p style={mutedStyle}>Carregando...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return wrap(
      <div style={boxStyle}>
        <p style={mutedStyle}>Sem dados</p>
      </div>
    );
  }

  if (widget.type === "kpi") {
    const metricName = metrics[0];
    const value = metricName ? data[0]?.[metricName] ?? "-" : "-";
    return wrap(
      <KpiCard
        title={title}
        value={value}
        color={widget.style?.color}
        template={widget.style?.kpi_template}
      />
    );
  }

  if (isCombined) {
    return wrap(
      <CombinedChart
        series={querySeries}
        data={data}
        dimension={dimension}
        style={widget.style}
      />
    );
  }

  if (widget.type === "line") {
    return wrap(
      <LineChart
        title={title}
        data={data}
        metrics={metrics}
        dimension={dimension}
        colors={colors}
        style={widget.style}
      />
    );
  }

  if (widget.type === "bar") {
    return wrap(
      <BarChart
        title={title}
        data={data}
        metrics={metrics}
        dimension={dimension}
        colors={colors}
        style={widget.style}
      />
    );
  }

  if (widget.type === "area") {
    return wrap(
      <AreaChart
        title={title}
        data={data}
        metrics={metrics}
        dimension={dimension}
        colors={colors}
        style={widget.style}
      />
    );
  }

  if (widget.type === "pie") {
    return wrap(
      <PieChart
        title={title}
        data={data}
        dimension={dimension}
        metric={metrics[0] ?? ""}
        colors={colors}
        style={widget.style}
      />
    );
  }

  return wrap(<DataTable title={title} data={data} />);
}

const boxStyle: CSSProperties = {
  height: "100%",
  minHeight: 80,
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  background: "#ffffff",
  display: "grid",
  placeItems: "center",
};

const mutedStyle: CSSProperties = {
  margin: 0,
  color: "#64748b",
  fontSize: 13,
};
