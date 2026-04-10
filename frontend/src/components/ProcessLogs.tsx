import type { ProcessLog } from "../api/client";

interface Props {
  logs: ProcessLog[];
}

export default function ProcessLogs({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>Process Logs</h3>
        <p style={styles.empty}>No logs yet</p>
      </div>
    );
  }

  const statusColor = (s: string) => {
    switch (s) {
      case "SUCCESS":
        return "#059669";
      case "FAILED":
      case "ERROR":
        return "#dc2626";
      case "INFO":
        return "#2563eb";
      default:
        return "#6b7280";
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Process Logs ({logs.length})</h3>
      <div style={styles.logList}>
        {logs.map((log) => (
          <div key={log.id} style={styles.logItem}>
            <div style={styles.logHeader}>
              <span style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace" }}>
                {new Date(log.created_at).toLocaleTimeString()}
              </span>
              <span
                style={{
                  ...styles.statusDot,
                  backgroundColor: statusColor(log.status),
                }}
              />
              <span style={{ fontWeight: 600, fontSize: 13 }}>
                {log.process_name}
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 11,
                  color: statusColor(log.status),
                  fontWeight: 600,
                }}
              >
                {log.status}
              </span>
            </div>
            {log.message && (
              <p style={styles.logMessage}>{log.message}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: "#fff",
    borderRadius: 8,
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  title: { margin: "0 0 16px 0", fontSize: 16, fontWeight: 600 },
  empty: { color: "#9ca3af", fontSize: 14 },
  logList: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    maxHeight: 400,
    overflowY: "auto",
  },
  logItem: {
    padding: "8px 12px",
    backgroundColor: "#f9fafb",
    borderRadius: 6,
    fontSize: 13,
  },
  logHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
  },
  logMessage: {
    margin: "4px 0 0 30px",
    fontSize: 12,
    color: "#6b7280",
  },
};
