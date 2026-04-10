import { useState } from "react";
import { runEOD, type EODRunResponse } from "../api/client";

interface Props {
  selectedDate: string;
  onRunComplete: () => void;
  currentStatus: string;
}

export default function EODRunPanel({
  selectedDate,
  onRunComplete,
  currentStatus,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forceRerun, setForceRerun] = useState(false);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    try {
      await runEOD(selectedDate, forceRerun);
      onRunComplete();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "EOD run failed");
    } finally {
      setLoading(false);
    }
  };

  const statusColor = () => {
    switch (currentStatus) {
      case "SUCCESS":
        return "#059669";
      case "FAILED":
        return "#dc2626";
      case "NOT_RUN":
        return "#9ca3af";
      default:
        return "#6b7280";
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.row}>
        <div>
          <h2 style={styles.title}>EOD Settlement Run</h2>
          <p style={styles.subtitle}>
            Date: <strong>{selectedDate}</strong> &nbsp;|&nbsp; Status:{" "}
            <span style={{ color: statusColor(), fontWeight: 700 }}>
              {loading ? "RUNNING..." : currentStatus}
            </span>
          </p>
        </div>
        <div style={styles.actions}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={forceRerun}
              onChange={(e) => setForceRerun(e.target.checked)}
            />
            Force Re-run
          </label>
          <button
            onClick={handleRun}
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Processing..." : "Run EOD"}
          </button>
        </div>
      </div>
      {error && <div style={styles.error}>{error}</div>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: "#fff",
    borderRadius: 8,
    padding: "20px 24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  title: { margin: 0, fontSize: 20, fontWeight: 700 },
  subtitle: { margin: "4px 0 0", fontSize: 14, color: "#6b7280" },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  checkboxLabel: { fontSize: 13, color: "#374151", cursor: "pointer" },
  button: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "10px 24px",
    fontSize: 14,
    fontWeight: 600,
  },
  error: {
    marginTop: 12,
    padding: "8px 12px",
    background: "#fef2f2",
    color: "#dc2626",
    borderRadius: 6,
    fontSize: 13,
  },
};
