import type { CSSProperties, ReactNode } from "react";
import type { DashboardLayoutConfig } from "@/services/dashboardsService";
import styles from "./LayoutMinimap.module.css";

type Region = "header" | "aside" | "footer" | "content";

type Props = {
  layout: DashboardLayoutConfig;
  selectedRegion: Region | null;
  onSelectRegion: (region: Region) => void;
  onToggleRegion: (region: "header" | "aside" | "footer") => void;
};

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function RegionBlock({
  name,
  label,
  enabled,
  selected,
  backgroundColor,
  onClick,
  onToggle,
  showToggle = true,
  children,
}: {
  name: Region;
  label: string;
  enabled: boolean;
  selected: boolean;
  backgroundColor?: string;
  onClick: () => void;
  onToggle?: () => void;
  showToggle?: boolean;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      className={classNames(styles.region, !enabled && styles.regionDisabled, selected && styles.regionSelected)}
      style={enabled && backgroundColor ? ({ backgroundColor } as CSSProperties) : undefined}
      onClick={onClick}
      title={`Selecionar ${label}`}
    >
      <span className={styles.regionLabel}>{label}</span>
      {!enabled ? <span className={styles.regionPlus}>+</span> : null}

      {children}

      {showToggle && onToggle ? (
        <span
          className={styles.switch}
          role="switch"
          aria-checked={enabled}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          title={enabled ? `Desativar ${label}` : `Ativar ${label}`}
        >
          <span className={classNames(styles.switchKnob, enabled && styles.switchKnobOn)} />
        </span>
      ) : null}
    </button>
  );
}

export default function LayoutMinimap({ layout, selectedRegion, onSelectRegion, onToggleRegion }: Props) {
  const template = layout.template || "sidebar-left";
  const showHeader = template !== "minimal";
  const showFooter = template !== "minimal";
  const showAside = template === "sidebar-left";
  const contentConfig = ((layout as any)?.content || {}) as { background_color?: string };
  const contentBackground = contentConfig.background_color || "#f5f5f5";

  return (
    <div className={styles.wrap}>
      <div className={styles.frame}>
        {showHeader ? (
          <div className={styles.headerRow}>
            <RegionBlock
              name="header"
              label="HEADER"
              enabled={layout.header.enabled}
              selected={selectedRegion === "header"}
              backgroundColor={layout.header.background_color}
              onClick={() => onSelectRegion("header")}
              onToggle={() => onToggleRegion("header")}
            />
          </div>
        ) : null}

        <div className={classNames(styles.bodyRow, template === "minimal" && styles.bodyRowMinimal)}>
          {showAside ? (
            <div className={styles.asideCol}>
              <RegionBlock
                name="aside"
                label="ASIDE"
                enabled={layout.aside.enabled}
                selected={selectedRegion === "aside"}
                backgroundColor={layout.aside.background_color}
                onClick={() => onSelectRegion("aside")}
                onToggle={() => onToggleRegion("aside")}
              />
            </div>
          ) : null}

          <div className={styles.contentCol}>
            <RegionBlock
              name="content"
              label="CONTENT"
              enabled
              selected={selectedRegion === "content"}
              backgroundColor={contentBackground}
              onClick={() => onSelectRegion("content")}
              showToggle={false}
            >
              <span className={styles.contentIcon} aria-hidden="true">
                ⊞
              </span>
              <div className={styles.contentGrid} aria-hidden="true">
                {Array.from({ length: 12 }).map((_, i) => (
                  <span key={i} className={styles.contentCell} />
                ))}
              </div>
            </RegionBlock>
          </div>
        </div>

        {showFooter ? (
          <div className={styles.footerRow}>
            <RegionBlock
              name="footer"
              label="FOOTER"
              enabled={layout.footer.enabled}
              selected={selectedRegion === "footer"}
              backgroundColor={layout.footer.background_color}
              onClick={() => onSelectRegion("footer")}
              onToggle={() => onToggleRegion("footer")}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
