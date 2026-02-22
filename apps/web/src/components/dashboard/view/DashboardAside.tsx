import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import type { DashboardLayoutFilterConfig } from "@/services/dashboardsService";

type AsideConfig = {
  enabled: boolean;
  width: number;
  background_color: string;
  text_color?: string;
  filters: DashboardLayoutFilterConfig[];
};

type DateRangeValue = {
  from?: string;
  to?: string;
};

type Props = {
  config: AsideConfig;
  datasetId: string;
  dimensionIdByName: Record<string, string>;
  activeFilters: Record<string, any>;
  onFilterChange: (filterId: string, value: any) => void;
};

const api = axios.create({
  baseURL: "http://localhost:8000",
});

export default function DashboardAside({
  config,
  datasetId,
  dimensionIdByName,
  activeFilters,
  onFilterChange,
}: Props) {
  const [optionsByFilterId, setOptionsByFilterId] = useState<Record<string, string[]>>({});
  const textColor = config.text_color || "#0f172a";

  const selectFilters = useMemo(
    () => (config.filters || []).filter((f) => f.type === "select" && f.dimension),
    [config.filters],
  );

  useEffect(() => {
    async function loadDistinctValues() {
      if (!datasetId || selectFilters.length === 0) {
        setOptionsByFilterId({});
        return;
      }

      const entries = await Promise.all(
        selectFilters.map(async (filter) => {
          const dimensionId = filter.dimension ? dimensionIdByName[filter.dimension] : "";
          if (!dimensionId) return [filter.id, []] as const;
          try {
            const { data } = await api.get<{ values: any[] }>(`/dimensions/${dimensionId}/values`, {
              params: { dataset_id: datasetId },
            });
            return [filter.id, (data.values || []).map((v) => String(v))] as const;
          } catch {
            return [filter.id, []] as const;
          }
        }),
      );

      const next: Record<string, string[]> = {};
      entries.forEach(([id, values]) => {
        next[id] = values;
      });
      setOptionsByFilterId(next);
    }

    void loadDistinctValues();
  }, [datasetId, selectFilters, dimensionIdByName]);

  if (!config.enabled) return null;

  return (
    <aside
      style={{
        width: config.width || 220,
        background: config.background_color || "#e8f4fb",
        borderRight: "1px solid #dbeafe",
        padding: 16,
        display: "grid",
        alignContent: "start",
        gap: 14,
        color: textColor,
      }}
    >
      <h3 style={{ margin: 0, fontSize: 14, color: textColor }}>Filtros</h3>

      {(config.filters || []).length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: textColor, opacity: 0.78 }}>Nenhum filtro configurado.</p>
      ) : null}

      {(config.filters || []).map((filter) => {
        if (filter.type === "select") {
          const value = activeFilters[filter.id] ?? "";
          const options = optionsByFilterId[filter.id] || [];
          return (
            <div key={filter.id} style={{ display: "grid", gap: 6 }}>
              <label style={{ fontSize: 12, color: textColor }}>{filter.label}</label>
              <select
                value={value}
                onChange={(e) => onFilterChange(filter.id, e.target.value)}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: "8px 10px",
                  background: "#fff",
                  color: "#0f172a",
                }}
              >
                <option value="">Todos</option>
                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        const value = (activeFilters[filter.id] || {}) as DateRangeValue;
        return (
          <div key={filter.id} style={{ display: "grid", gap: 6 }}>
            <label style={{ fontSize: 12, color: textColor }}>{filter.label}</label>
            <div style={{ display: "grid", gap: 6 }}>
              <input
                type="date"
                value={value.from || ""}
                onChange={(e) => onFilterChange(filter.id, { ...value, from: e.target.value })}
                style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 10px", background: "#fff", color: "#0f172a" }}
              />
              <input
                type="date"
                value={value.to || ""}
                onChange={(e) => onFilterChange(filter.id, { ...value, to: e.target.value })}
                style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 10px", background: "#fff", color: "#0f172a" }}
              />
            </div>
          </div>
        );
      })}
    </aside>
  );
}
