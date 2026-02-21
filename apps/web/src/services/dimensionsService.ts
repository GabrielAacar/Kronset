import axios from "axios";

export interface Dimension {
  id: string;
  dataset_id: string;
  name: string;
  description: string;
  expression: string;
  overrides: Record<string, any>;
  data_type: string;
  created_at: string;
}

export interface DimensionPayload {
  dataset_id: string;
  name: string;
  description: string;
  expression: string;
  overrides: Record<string, any>;
  data_type: string;
}

const api = axios.create({
  baseURL: "http://localhost:8000",
});

export async function listDimensions(datasetId: string): Promise<Dimension[]> {
  const { data } = await api.get<Dimension[]>("/dimensions", {
    params: { dataset_id: datasetId },
  });
  return data;
}

export async function getDimension(id: string): Promise<Dimension> {
  const { data } = await api.get<Dimension>(`/dimensions/${id}`);
  return data;
}

export async function createDimension(payload: DimensionPayload): Promise<Dimension> {
  const { data } = await api.post<Dimension>("/dimensions", payload);
  return data;
}

export async function updateDimension(id: string, payload: DimensionPayload): Promise<Dimension> {
  const { data } = await api.put<Dimension>(`/dimensions/${id}`, payload);
  return data;
}

export async function deleteDimension(id: string): Promise<void> {
  await api.delete(`/dimensions/${id}`);
}
