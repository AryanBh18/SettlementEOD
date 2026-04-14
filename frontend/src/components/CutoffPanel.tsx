import { useState, useEffect } from "react";
import { triggerCutoff, getCutoffStatus, type CutoffStatus } from "../api/client";

interface Props {
  selectedDate: string;
  onCutoffComplete: () => void;
}

export default function CutoffPanel({ selectedDate, onCutoffComplete }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cutoff, setCutoff] = useState<CutoffStatus | null>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      setFetching(true);
      try {
        const status = await getCutoffStatus(selectedDate);
        setCutoff(status);
      } catch {
        setCutoff(null);
      } finally {
        setFetching(false);
      }
    };
    fetchStatus();
  }, [selectedDate]);

  const handleTrigger = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await triggerCutoff(selectedDate);
      setCutoff(result);
      onCutoffComplete();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Cutoff failed");
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (ts: string) => {
    return new Date(ts).toLocaleString();
  };

  return (
    <div style={styles.container}>
      <div style={styles.row}>
        <div>
          <h3 style={styles.title}>Cutoff Control</h3>
          {fetching ? (
            <p style={styles.subtitle}>Loading cutoff status...</p>
          ) : cutoff ? (
            <p style={styles.subtitle}>
              Cutoff active for {selectedDate} at{" "}
              <strong>{formatTimestamp(cutoff.cutoff_timestamp)}</strong>
            </p>
          ) : (
            <p style={styles.subtitle}>No cutoff set for {selectedDate}</p>
          )}
        </div>
        <button
          onClick={handleTrigger}
          disabled={loading || !!cutoff}
          style={{
            ...styles.button,
            opacity: loading || cutoff ? 0.6 : 1,
            cursor: loading || cutoff ? "not-allowed" : "pointer",
            background: cutoff ? "#9ca3af" : "#f59e0b",
          }}
        >
          {loading ? "Triggering..." : cutoff ? "Cutoff Set" : "Trigger Cutoff"}
        </button>
      </div>
      {error && <div style={styles.error}>{error}</div>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: "#fff",
    borderRadius: 8,
    padding: "16px 20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap" as const,
    gap: 12,
  },
  title: { margin: 0, fontSize: 16, fontWeight: 600 },
  subtitle: { margin: "4px 0 0", fontSize: 13, color: "#6b7280" },
  button: {
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "8px 20px",
    fontSize: 13,
    fontWeight: 600,
  },
  error: {
    marginTop: 10,
    padding: "8px 12px",
    background: "#fef2f2",
    color: "#dc2626",
    borderRadius: 6,
    fontSize: 13,
  },
};
