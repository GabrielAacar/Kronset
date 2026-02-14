import React from "react";

export default function BottomDrawer({
  open,
  onToggle,
  title,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        background: "#fff",
        borderTop: "1px solid #eee",
        boxShadow: "0 -10px 30px rgba(0,0,0,0.08)",
        zIndex: 50,
        height: open ? 320 : 46,
        transition: "height 180ms ease",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 46,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 14px",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={onToggle}
            style={{
              border: "1px solid #ddd",
              background: "#fff",
              borderRadius: 10,
              padding: "6px 10px",
            }}
          >
            {open ? "↓" : "↑"}
          </button>
          <div style={{ fontSize: 12, opacity: 0.8 }}>{title}</div>
        </div>
      </div>

      <div style={{ padding: 14, height: 274, overflow: "auto" }}>{children}</div>
    </div>
  );
}
