import type { CSSProperties } from "react";

export type KpiTemplate = "bordered-left" | "gradient" | "minimal" | "colored";

interface KpiCardProps {
  title: string;
  value: string | number;
  color?: string;
  template?: KpiTemplate;
}

function darkenColor(hex: string, factor = 0.22): string {
  const safe = hex.replace("#", "");
  if (safe.length !== 6) return hex;
  const r = Math.max(0, Math.round(parseInt(safe.slice(0, 2), 16) * (1 - factor)));
  const g = Math.max(0, Math.round(parseInt(safe.slice(2, 4), 16) * (1 - factor)));
  const b = Math.max(0, Math.round(parseInt(safe.slice(4, 6), 16) * (1 - factor)));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export default function KpiCard({
  title,
  value,
  color = "#2563eb",
  template = "bordered-left",
}: KpiCardProps) {
  const baseStyle: CSSProperties = {
    height: "100%",
    minHeight: 120,
    borderRadius: 12,
    padding: 18,
    display: "grid",
    alignItems: "center",
    textAlign: "center",
  };

  const valueStyle: CSSProperties = {
    fontSize: 48,
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: "-0.02em",
  };

  const labelStyle: CSSProperties = {
    marginTop: 8,
    fontSize: 13,
    fontWeight: 500,
  };

  let cardStyle: CSSProperties = {};
  let valColor = "#0f172a";
  let labelColor = "#64748b";

  if (template === "bordered-left") {
    cardStyle = {
      background: "#ffffff",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      borderLeft: `4px solid ${color}`,
    };
  } else if (template === "gradient") {
    cardStyle = {
      background: `linear-gradient(135deg, ${color} 0%, ${darkenColor(color)} 100%)`,
      boxShadow: "0 8px 18px rgba(15,23,42,0.12)",
    };
    valColor = "#ffffff";
    labelColor = "rgba(255,255,255,0.9)";
  } else if (template === "minimal") {
    cardStyle = {
      background: "#ffffff",
      borderTop: `3px solid ${color}`,
    };
  } else if (template === "colored") {
    cardStyle = {
      background: color,
      boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
    };
    valColor = "#ffffff";
    labelColor = "rgba(255,255,255,0.92)";
  }

  return (
    <div style={{ ...baseStyle, ...cardStyle }}>
      <div>
        <div style={{ ...valueStyle, color: valColor }}>{value}</div>
        <div style={{ ...labelStyle, color: labelColor }}>{title}</div>
      </div>
    </div>
  );
}
