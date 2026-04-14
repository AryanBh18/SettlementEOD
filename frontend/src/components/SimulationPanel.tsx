import { useState } from "react";
import { simulateTransactions, type SimulationResult } from "../api/client";

interface Props {
  selectedDate: string;
  onSimulationComplete: () => void;
}

export default function SimulationPanel({ selectedDate, onSimulationComplete }: Props) {
  const [count, setCount] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const handleSimulate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await simulateTransactions(count, selectedDate);
      setResult(res);
      onSimulationComplete();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Simulation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Transaction Simulation</h3>
      <p style={styles.subtitle}>Generate guest banking transactions (ATM/POS) for testing</p>
      <div style={styles.row}>
        <label style={styles.label}>
          Count:
          <input
            type="number"
            min={1}
            max={10000}
            value={count}
            onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
            style={styles.input}
          />
        </label>
        <button
          onClick={handleSimulate}
          disabled={loading}
          style={{ ...styles.button, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Simulating..." : "Simulate Transactions"}
        </button>
      </div>
      {error && <div style={styles.error}>{error}</div>}
      {result && (
        <div style={styles.success}>
          Inserted <strong>{result.inserted}</strong> guest transactions for {result.date}
        </div>
      )}
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
  title: { margin: "0 0 4px 0", fontSize: 16, fontWeight: 600 },
  subtitle: { margin: "0 0 12px 0", fontSize: 13, color: "#6b7280" },
  row: { display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" as const },
  label: { fontSize: 13, color: "#374151", display: "flex", alignItems: "center", gap: 8 },
  input: {
    width: 80,
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    fontSize: 14,
  },
  button: {
    background: "#7c3aed",
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
  success: {
    marginTop: 10,
    padding: "8px 12px",
    background: "#f0fdf4",
    color: "#059669",
    borderRadius: 6,
    fontSize: 13,
  },
};
