import axios from "axios";

export interface Dataset {
  id: string;
  connection_id: string;
  name: string;
  description: string;
  base_sql: string;
  overrides: Record<string, any>;
  created_at: string;
}

export interface DatasetPayload {
  connection_id: string;
  name: string;
  description: string;
  base_sql: string;
  overrides: Record<string, any>;
}

const api = axios.create({
  baseURL: "http://localhost:8000",
});

export async function listDatasets(): Promise<Dataset[]> {
  const { data } = await api.get<Dataset[]>("/datasets");
  return data;
}

export async function getDataset(id: string): Promise<Dataset> {
  const { data } = await api.get<Dataset>(`/datasets/${id}`);
  return data;
}

export async function createDataset(data: DatasetPayload): Promise<Dataset> {
  const { data: created } = await api.post<Dataset>("/datasets", data);
  return created;
}

export async function updateDataset(id: string, data: DatasetPayload): Promise<Dataset> {
  const { data: updated } = await api.put<Dataset>(`/datasets/${id}`, data);
  return updated;
}

export async function deleteDataset(id: string): Promise<void> {
  await api.delete(`/datasets/${id}`);
}
