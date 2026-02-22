type FooterConfig = {
  enabled: boolean;
  text: string;
  background_color: string;
  text_color: string;
};

type Props = {
  config: FooterConfig;
};

export default function DashboardFooter({ config }: Props) {
  if (!config.enabled) return null;

  return (
    <footer
      style={{
        background: config.background_color || "#1a3a4f",
        color: config.text_color || "#ffffff",
        padding: "12px 16px",
        textAlign: "center",
        fontSize: 13,
      }}
    >
      {config.text || ""}
    </footer>
  );
}
