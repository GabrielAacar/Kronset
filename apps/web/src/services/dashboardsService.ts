import axios from "axios";

export type WidgetType = "kpi" | "line" | "bar" | "area" | "pie" | "table";
export type DashboardTemplate = "sidebar-left" | "full-width" | "minimal";

export type DashboardLayoutFilterType = "select" | "daterange";

export interface DashboardLayoutFilterConfig {
  id: string;
  label: string;
  type: DashboardLayoutFilterType;
  dimension?: string;
}

export interface DashboardLayoutHeaderConfig {
  enabled: boolean;
  logo_url: string;
  title: string;
  show_updated_at: boolean;
  background_color: string;
  text_color: string;
}

export interface DashboardLayoutAsideConfig {
  enabled: boolean;
  width: number;
  background_color: string;
  text_color?: string;
  filters: DashboardLayoutFilterConfig[];
}

export interface DashboardLayoutFooterConfig {
  enabled: boolean;
  text: string;
  background_color: string;
  text_color: string;
}

export interface DashboardLayoutContentConfig {
  background_color: string;
  background_image: string;
  padding: number;
  gap: number;
  grid_columns: number;
  row_height: number;
  grid_show_lines: boolean;
  grid_line_color: string;
  border_radius_widgets: number;
  widget_shadow: boolean;
  widget_background: string;
}

export interface DashboardLayoutConfig {
  template: DashboardTemplate;
  header: DashboardLayoutHeaderConfig;
  aside: DashboardLayoutAsideConfig;
  footer: DashboardLayoutFooterConfig;
  content: DashboardLayoutContentConfig;
}

export interface WidgetLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type WidgetSeriesType = "bar" | "line" | "area";
export type WidgetSeriesAxis = "left" | "right";

export interface WidgetSeries {
  id: string;
  metric: string;
  type: WidgetSeriesType;
  color: string;
  y_axis: WidgetSeriesAxis;
  label?: string;
}

export interface WidgetQuery {
  dataset_id: string;
  // New structure for combined-series charts
  series?: WidgetSeries[];
  dimension?: string;
  // Legacy structure (kept temporarily for backward compatibility)
  metrics?: string[];
  dimensions?: string[];
  filters: any[];
  limit: number;
}

export interface WidgetStyle {
  color?: string;
  colors?: string[];
  title?: string;
  showLegend?: boolean;
  kpi_template?: "bordered-left" | "gradient" | "minimal" | "colored";
  background_color?: string;
  show_border?: boolean;
  show_grid_horizontal?: boolean;
  show_grid_vertical?: boolean;
  grid_color?: string;
  legend_position?: "top" | "bottom" | "left" | "right";
  show_axis_x?: boolean;
  show_axis_y?: boolean;
  format_dates_x?: boolean;
}

export interface Widget {
  id: string;
  dashboard_id: string;
  type: WidgetType;
  title: string;
  query: WidgetQuery;
  style: WidgetStyle;
  layout: WidgetLayout;
  created_at: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  dataset_id: string;
  header: Record<string, any>;
  layout: DashboardLayoutConfig | Record<string, any>;
  is_published: boolean;
  slug: string;
  created_at: string;
}

export interface DashboardPayload {
  name: string;
  description: string;
  dataset_id: string;
  header: Record<string, any>;
  layout: DashboardLayoutConfig | Record<string, any>;
  slug?: string;
}

export interface DashboardUpdatePayload {
  name?: string;
  description?: string;
  header?: Record<string, any>;
  layout?: DashboardLayoutConfig | Record<string, any>;
  is_published?: boolean;
}

const api = axios.create({
  baseURL: "http://localhost:8000",
});

export async function listDashboards(): Promise<Dashboard[]> {
  const { data } = await api.get<Dashboard[]>("/dashboards");
  return data;
}

export async function getDashboard(id: string): Promise<Dashboard> {
  const { data } = await api.get<Dashboard>(`/dashboards/${id}`);
  return data;
}

export async function getDashboardBySlug(slug: string): Promise<Dashboard> {
  const { data } = await api.get<Dashboard>(`/dashboards/slug/${slug}`);
  return data;
}

export async function createDashboard(payload: DashboardPayload): Promise<Dashboard> {
  const { data } = await api.post<Dashboard>("/dashboards", payload);
  return data;
}

export async function updateDashboard(id: string, payload: DashboardUpdatePayload): Promise<Dashboard> {
  const { data } = await api.put<Dashboard>(`/dashboards/${id}`, payload);
  return data;
}

export async function deleteDashboard(id: string): Promise<void> {
  await api.delete(`/dashboards/${id}`);
}

export async function publishDashboard(id: string): Promise<void> {
  await api.post(`/dashboards/${id}/publish`);
}

export async function unpublishDashboard(id: string): Promise<void> {
  await api.post(`/dashboards/${id}/unpublish`);
}
