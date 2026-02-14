import React from "react";

export default function CardWidget({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div style={{ padding: 16, borderRadius: 14, border: "1px solid #e8e8e8", background: "#fff" }}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
      <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8 }}>{value}</div>
      {subtitle ? <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>{subtitle}</div> : null}
    </div>
  );
}
