import React, { useEffect, useState } from "react";

type Health = { ok: boolean; service: string; version: string };

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  return (
    <div style={{ fontFamily: "system-ui", padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Kronset</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Open semantic analytics platform — metrics first.
      </p>

      <div style={{ marginTop: 16, padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
        <h3 style={{ marginTop: 0 }}>API health</h3>
        {health ? (
          <pre style={{ margin: 0 }}>{JSON.stringify(health, null, 2)}</pre>
        ) : (
          <p style={{ margin: 0 }}>API not reachable yet.</p>
        )}
      </div>
    </div>
  );
}
