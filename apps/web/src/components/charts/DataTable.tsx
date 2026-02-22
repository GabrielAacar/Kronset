type Props = {
  title: string;
  data: Record<string, any>[];
};

export default function DataTable({ title, data }: Props) {
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: 12,
      }}
    >
      <h4 style={{ margin: "0 0 10px", fontSize: 14, color: "#0f172a" }}>{title}</h4>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 520 }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #e2e8f0",
                    padding: "8px 10px",
                    fontSize: 12,
                    color: "#475569",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col) => (
                  <td
                    key={col}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      padding: "8px 10px",
                      fontSize: 13,
                      color: "#0f172a",
                    }}
                  >
                    {String(row[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
