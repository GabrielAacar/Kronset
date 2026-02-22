type HeaderConfig = {
  enabled: boolean;
  logo_url: string;
  title: string;
  show_updated_at: boolean;
  background_color: string;
  text_color: string;
};

type Props = {
  config: HeaderConfig;
  updatedAt?: string;
};

function LogoRenderer({ value, textColor }: { value: string; textColor: string }) {
  if (!value?.trim()) return null;

  const trimmed = value.trim();

  if (trimmed.startsWith("<svg")) {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: trimmed }}
        style={{ height: 36, display: "flex", alignItems: "center" }}
      />
    );
  }

  if (trimmed.startsWith("http") || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(trimmed)) {
    return <img src={trimmed} alt="logo" style={{ height: 36, objectFit: "contain" }} />;
  }

  return (
    <h1 style={{ color: textColor, margin: 0, fontSize: 20, fontWeight: 700, lineHeight: 1.1 }}>
      {trimmed}
    </h1>
  );
}

export default function DashboardHeader({ config, updatedAt }: Props) {
  if (!config.enabled) return null;

  const formattedNow = (() => {
    if (!updatedAt) return new Date().toLocaleString("pt-BR");
    const parsed = new Date(updatedAt);
    return Number.isNaN(parsed.getTime()) ? new Date().toLocaleString("pt-BR") : parsed.toLocaleString("pt-BR");
  })();

  return (
    <header
      style={{
        backgroundColor: config.background_color || "#1a3a4f",
        color: config.text_color || "#ffffff",
        padding: "0 24px",
        minHeight: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ minWidth: 0, display: "flex", alignItems: "center", flex: "0 1 240px" }}>
        <LogoRenderer value={config.logo_url} textColor={config.text_color || "#ffffff"} />
      </div>

      <span
        style={{
          color: config.text_color || "#ffffff",
          margin: 0,
          fontSize: 18,
          fontWeight: 700,
          flex: 1,
          textAlign: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {config.title || "Dashboard"}
      </span>

      <div
        style={{
          color: config.text_color || "#ffffff",
          fontSize: 13,
          minWidth: 180,
          textAlign: "right",
        }}
      >
        {config.show_updated_at ? `Atualizado: ${formattedNow}` : null}
      </div>
    </header>
  );
}

