import axios from "axios";
import type { Widget, WidgetLayout, WidgetQuery, WidgetStyle, WidgetType } from "@/services/dashboardsService";

export interface WidgetPayload {
  dashboard_id: string;
  type: WidgetType;
  title: string;
  query: WidgetQuery;
  style: WidgetStyle;
  layout: WidgetLayout;
}

export interface WidgetUpdatePayload {
  title?: string;
  query?: WidgetQuery;
  style?: WidgetStyle;
  layout?: WidgetLayout;
}

const api = axios.create({
  baseURL: "http://localhost:8000",
});

export async function listWidgets(dashboardId: string): Promise<Widget[]> {
  const { data } = await api.get<Widget[]>("/widgets", {
    params: { dashboard_id: dashboardId },
  });
  return data;
}

export async function createWidget(payload: WidgetPayload): Promise<Widget> {
  const { data } = await api.post<Widget>("/widgets", payload);
  return data;
}

export async function updateWidget(id: string, payload: WidgetUpdatePayload): Promise<Widget> {
  const { data } = await api.put<Widget>(`/widgets/${id}`, payload);
  return data;
}

export async function deleteWidget(id: string): Promise<void> {
  await api.delete(`/widgets/${id}`);
}
