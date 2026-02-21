import axios from "axios";

export type MetricType = "sum" | "count" | "count_distinct" | "avg" | "ratio";

export interface Metric {
  id: string;
  dataset_id: string;
  name: string;
  description: string;
  metric_type: MetricType;
  config: Record<string, any>;
  format: string;
  created_at: string;
}

export interface MetricPayload {
  dataset_id: string;
  name: string;
  description: string;
  metric_type: MetricType;
  config: Record<string, any>;
  format: string;
}

const api = axios.create({
  baseURL: "http://localhost:8000",
});

export async function listMetrics(datasetId: string): Promise<Metric[]> {
  const { data } = await api.get<Metric[]>("/metrics", {
    params: { dataset_id: datasetId },
  });
  return data;
}

export async function getMetric(id: string): Promise<Metric> {
  const { data } = await api.get<Metric>(`/metrics/${id}`);
  return data;
}

export async function createMetric(payload: MetricPayload): Promise<Metric> {
  const { data } = await api.post<Metric>("/metrics", payload);
  return data;
}

export async function updateMetric(id: string, payload: MetricPayload): Promise<Metric> {
  const { data } = await api.put<Metric>(`/metrics/${id}`, payload);
  return data;
}

export async function deleteMetric(id: string): Promise<void> {
  await api.delete(`/metrics/${id}`);
}
