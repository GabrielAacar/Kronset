import { useMemo, useState } from "react";
import type {
  Connection,
  ConnectionCredentials,
  ConnectionPayload,
  DbType,
} from "@/services/connectionsService";
import { testConnection } from "@/services/connectionsService";
import styles from "./ConnectionForm.module.css";

type Props = {
  initial?: Connection | null;
  onCancel?: () => void;
  onSave: (data: ConnectionPayload) => Promise<void> | void;
  showTitle?: boolean;
};

function prettyDbType(value: DbType): string {
  if (value === "postgres") return "PostgreSQL";
  if (value === "mysql") return "MySQL";
  if (value === "oracle") return "Oracle";
  return "SQL Server";
}

function defaultPortFor(dbType: DbType): number {
  if (dbType === "postgres") return 5432;
  if (dbType === "mysql") return 3306;
  if (dbType === "oracle") return 1521;
  return 1433;
}

export default function ConnectionForm({ initial, onCancel, onSave, showTitle = true }: Props) {
  const initialDbType = initial?.db_type ?? "postgres";
  const [name, setName] = useState(initial?.name ?? "");
  const [dbType, setDbType] = useState<DbType>(initialDbType);
  const [credentials, setCredentials] = useState<ConnectionCredentials>({
    host: initial?.credentials?.host ?? "",
    port: initial?.credentials?.port ?? defaultPortFor(initialDbType),
    username: initial?.credentials?.username ?? "",
    password: initial?.credentials?.password ?? "",
    database: initial?.credentials?.database ?? "",
  });
  const [isEnabled, setIsEnabled] = useState(initial?.is_enabled ?? true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState<string>("");
  const [testOk, setTestOk] = useState<boolean | null>(null);

  const canTest = useMemo(() => Boolean(initial?.id), [initial?.id]);

  function updateCredential<K extends keyof ConnectionCredentials>(key: K, value: ConnectionCredentials[K]) {
    setCredentials((prev) => ({ ...prev, [key]: value }));
  }

  function handleDbTypeChange(nextDbType: DbType) {
    setDbType(nextDbType);
    setCredentials((prev) => ({
      ...prev,
      port: defaultPortFor(nextDbType),
    }));
  }

  async function handleSave() {
    if (!name.trim()) {
      setTestOk(false);
      setTestMessage("Nome e obrigatorio.");
      return;
    }
    if (!credentials.host.trim()) {
      setTestOk(false);
      setTestMessage("Host e obrigatorio.");
      return;
    }
    if (!credentials.username.trim()) {
      setTestOk(false);
      setTestMessage("Usuario e obrigatorio.");
      return;
    }
    if (!credentials.password.trim()) {
      setTestOk(false);
      setTestMessage("Senha e obrigatoria.");
      return;
    }
    if (!credentials.database.trim()) {
      setTestOk(false);
      setTestMessage("Nome do banco e obrigatorio.");
      return;
    }

    setSaving(true);
    setTestMessage("");
    try {
      await onSave({
        name: name.trim(),
        db_type: dbType,
        is_enabled: isEnabled,
        credentials: {
          host: credentials.host.trim(),
          port: Number(credentials.port),
          username: credentials.username.trim(),
          password: credentials.password,
          database: credentials.database.trim(),
        },
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!initial?.id) return;
    setTesting(true);
    setTestMessage("");
    try {
      const result = await testConnection(initial.id);
      if (result.success) {
        setTestOk(true);
        setTestMessage("Sucesso");
      } else {
        setTestOk(false);
        setTestMessage(result.error || "Falha no teste.");
      }
    } catch (err: any) {
      setTestOk(false);
      setTestMessage(err?.message || "Erro ao testar conexao.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <section className={styles.form}>
      {showTitle ? <h3 className={styles.title}>{initial ? "Editar Conexao" : "Nova Conexao"}</h3> : null}

      <div className={styles.row}>
        <label className={styles.label} htmlFor="connection-name">Nome</label>
        <input
          id="connection-name"
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Minha conexao"
        />
      </div>

      <div className={styles.row}>
        <label className={styles.label} htmlFor="connection-db-type">Tipo do banco</label>
        <select
          id="connection-db-type"
          className={styles.select}
          value={dbType}
          onChange={(e) => handleDbTypeChange(e.target.value as DbType)}
        >
          {(["postgres", "mysql", "oracle", "sqlserver"] as DbType[]).map((opt) => (
            <option key={opt} value={opt}>{prettyDbType(opt)}</option>
          ))}
        </select>
      </div>

      <div className={styles.row}>
        <label className={styles.label} htmlFor="connection-host">Host</label>
        <input
          id="connection-host"
          className={styles.input}
          value={credentials.host}
          onChange={(e) => updateCredential("host", e.target.value)}
          placeholder="localhost"
        />
        <small className={styles.helpText}>
          Para conectar ao banco interno do Docker, use <strong>db</strong> como host, nao localhost.
        </small>
      </div>

      <div className={styles.row}>
        <label className={styles.label} htmlFor="connection-port">Porta</label>
        <input
          id="connection-port"
          className={styles.input}
          type="number"
          value={credentials.port}
          onChange={(e) => updateCredential("port", Number(e.target.value))}
        />
      </div>

      <div className={styles.row}>
        <label className={styles.label} htmlFor="connection-username">Usuario</label>
        <input
          id="connection-username"
          className={styles.input}
          value={credentials.username}
          onChange={(e) => updateCredential("username", e.target.value)}
          placeholder="usuario"
        />
      </div>

      <div className={styles.row}>
        <label className={styles.label} htmlFor="connection-password">Senha</label>
        <input
          id="connection-password"
          className={styles.input}
          type="password"
          value={credentials.password}
          onChange={(e) => updateCredential("password", e.target.value)}
          placeholder="senha"
        />
      </div>

      <div className={styles.row}>
        <label className={styles.label} htmlFor="connection-database">Nome do banco</label>
        <input
          id="connection-database"
          className={styles.input}
          value={credentials.database}
          onChange={(e) => updateCredential("database", e.target.value)}
          placeholder="database"
        />
      </div>

      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={(e) => setIsEnabled(e.target.checked)}
        />
        Is Enabled
      </label>

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>

        <button
          type="button"
          className={styles.button}
          onClick={handleTest}
          disabled={!canTest || testing}
        >
          {testing ? "Testando..." : "Testar Conexao"}
        </button>

        {onCancel ? (
          <button type="button" className={styles.button} onClick={onCancel}>
            Cancelar
          </button>
        ) : null}
      </div>

      {testMessage ? (
        <p className={`${styles.result} ${testOk ? styles.success : styles.error}`}>
          {testOk ? "✅ " : "❌ "}
          {testMessage}
        </p>
      ) : null}
    </section>
  );
}
