export type SeriesType = "line" | "bar" | "scatter" | "area";
export type ChartType = "combined" | "pie" | "heatmap";

export type WidgetSeries = {
  id: string;
  metric: string;       // nome da métrica cadastrada
  type: SeriesType;     // tipo da série
  name?: string;        // label opcional
};

export type WidgetChart = {
  id: string;
  type: "chart";
  title: string;
  chartType: ChartType;

  // MVP: 1 dimensão principal (x-axis)
  dimension: string;

  // combined/pie: séries; para pie vamos usar a 1ª série
  series: WidgetSeries[];

  limit: number;
};

export type CalcType = "sum" | "avg" | "min" | "max" | "count" | "count_distinct";

export type AdhocMetric = {
  alias: string;         // nome no resultado
  calc_type: CalcType;
  field?: string;        // necessário para sum/avg/min/max/count_distinct
};

export type WidgetCard = {
  id: string;
  type: "card";
  title: string;

  // opção A: métrica cadastrada
  metric?: string;

  // opção B: ad-hoc
  adhoc?: AdhocMetric;

  limit?: number; // card normalmente 1
};

export type Widget = WidgetChart | WidgetCard;

export type PageModel = {
  id: string;
  name: string;
  datasetId: string;
  widgets: Widget[];
};
