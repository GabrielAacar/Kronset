import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./ColorPicker.module.css";

type Props = {
  value: string;
  onChange: (color: string) => void;
  label?: string;
};

function normalizeHex(input: string): string {
  return input.trim();
}

function isValidHex(input: string): boolean {
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(input.trim());
}

function expandHexToSix(input: string): string {
  const value = input.trim();
  if (!/^#[0-9a-fA-F]{3}$/.test(value)) return value;
  return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
}

export default function ColorPicker({ value, onChange, label }: Props) {
  const colorInputRef = useRef<HTMLInputElement | null>(null);
  const [textValue, setTextValue] = useState(value || "#000000");
  const [lastValidValue, setLastValidValue] = useState(value || "#000000");

  useEffect(() => {
    const next = value || "#000000";
    setTextValue(next);
    if (isValidHex(next)) {
      setLastValidValue(next);
    }
  }, [value]);

  const invalid = useMemo(() => !isValidHex(textValue), [textValue]);
  const swatchColor = isValidHex(textValue) ? expandHexToSix(textValue) : expandHexToSix(lastValidValue);

  function commitTextValue(raw: string) {
    const normalized = normalizeHex(raw);
    setTextValue(normalized);
    if (!isValidHex(normalized)) return;
    const next = expandHexToSix(normalized);
    setLastValidValue(next);
    onChange(next);
  }

  function handleBlur() {
    if (isValidHex(textValue)) {
      const next = expandHexToSix(textValue);
      setTextValue(next);
      setLastValidValue(next);
      onChange(next);
      return;
    }
    setTextValue(lastValidValue);
  }

  return (
    <div className={styles.wrapper}>
      {label ? <label className={styles.label}>{label}</label> : null}
      <div className={styles.row}>
        <button
          type="button"
          className={styles.swatch}
          style={{ background: swatchColor }}
          onClick={() => colorInputRef.current?.click()}
          aria-label={label ? `Selecionar cor: ${label}` : "Selecionar cor"}
        />

        <input
          ref={colorInputRef}
          className={styles.nativeInput}
          type="color"
          value={isValidHex(swatchColor) ? expandHexToSix(swatchColor) : "#000000"}
          onChange={(e) => {
            const next = e.target.value;
            setTextValue(next);
            setLastValidValue(next);
            onChange(next);
          }}
          tabIndex={-1}
          aria-hidden="true"
        />

        <input
          className={`${styles.textInput} ${invalid ? styles.textInputInvalid : ""}`}
          value={textValue}
          onChange={(e) => commitTextValue(e.target.value)}
          onBlur={handleBlur}
          placeholder="#1a3a4f"
          spellCheck={false}
        />
      </div>
    </div>
  );
}

