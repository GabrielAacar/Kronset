import axios from "axios";

export type DbType = "postgres" | "oracle" | "sqlserver" | "mysql";

export interface ConnectionCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface Connection {
  id: string;
  name: string;
  db_type: DbType;
  credentials: ConnectionCredentials;
  is_enabled: boolean;
  created_at: string;
}

export interface ConnectionPayload {
  name: string;
  db_type: DbType;
  credentials: ConnectionCredentials;
  is_enabled: boolean;
}

export interface ConnectionTestResult {
  success: boolean;
  error?: string;
}

const api = axios.create({
  baseURL: "http://localhost:8000",
});

export async function listConnections(): Promise<Connection[]> {
  const { data } = await api.get<Connection[]>("/connections");
  return data;
}

export async function getConnection(id: string): Promise<Connection> {
  const { data } = await api.get<Connection>(`/connections/${id}`);
  return data;
}

export async function createConnection(data: ConnectionPayload): Promise<Connection> {
  const { data: created } = await api.post<Connection>("/connections", data);
  return created;
}

export async function updateConnection(id: string, data: ConnectionPayload): Promise<Connection> {
  const { data: updated } = await api.put<Connection>(`/connections/${id}`, data);
  return updated;
}

export async function deleteConnection(id: string): Promise<void> {
  await api.delete(`/connections/${id}`);
}

export async function testConnection(id: string): Promise<ConnectionTestResult> {
  const { data } = await api.post<ConnectionTestResult>(`/connections/${id}/test`);
  return data;
}
