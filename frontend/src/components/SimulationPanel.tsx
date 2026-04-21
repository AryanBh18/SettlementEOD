import { useState } from "react";
import { simulateTransactions, clearAllTransactions, type SimulationResult } from "../api/client";

interface Props { selectedDate: string; onSimulationComplete: () => void; onClearComplete: () => void; }

export default function SimulationPanel({ selectedDate, onSimulationComplete, onClearComplete }: Props) {
  const [count, setCount] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [clearLoading, setClearLoading] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);
  const [clearResult, setClearResult] = useState<{ deleted: number } | null>(null);

  const handleSimulate = async () => {
    setLoading(true); setError(null); setResult(null);
    try { const res = await simulateTransactions(count, selectedDate); setResult(res); onSimulationComplete(); }
    catch (err: any) { setError(err.response?.data?.detail || err.message || "Simulation failed"); }
    finally { setLoading(false); }
  };

  const handleClearAll = async () => {
    if (!window.confirm("This will permanently delete ALL transactions from the database. Are you sure?")) return;
    setClearLoading(true); setClearError(null); setClearResult(null);
    try { const res = await clearAllTransactions(); setClearResult(res); onClearComplete(); }
    catch (err: any) { setClearError(err.response?.data?.detail || err.message || "Clear failed"); }
    finally { setClearLoading(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-[--color-outline-variant] shadow-sm p-6">
      <div className="flex items-center gap-3 mb-1">
        <span className="material-symbols-outlined text-[--color-outline]">science</span>
        <h3 className="font-display font-semibold text-[--color-on-surface] text-base">Transaction Simulation</h3>
      </div>
      <p className="text-[--color-outline] text-xs mb-4">Generate inter-bank transactions where the issuer (source bank) and acquirer (destination bank) differ</p>

      <div className="flex items-center gap-3 flex-wrap mb-3">
        <label className="flex items-center gap-2 text-sm text-[--color-on-surface-variant]">
          <span>Count:</span>
          <input type="number" min={1} max={10000} value={count}
            onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 px-3 py-1.5 rounded-lg border border-[--color-outline-variant] text-sm text-[--color-on-surface] focus:outline-none focus:ring-1 focus:ring-[--color-primary]" />
        </label>
        <button onClick={handleSimulate} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #0046c3, #0035a0)" }}>
          <span className="material-symbols-outlined text-base">play_arrow</span>
          {loading ? "Simulating..." : "Simulate Transactions"}
        </button>
      </div>
      {error && <div className="flex items-center gap-2 bg-[--color-error-light] text-[--color-error] text-xs px-4 py-2.5 rounded-lg mb-3"><span className="material-symbols-outlined text-sm">error</span>{error}</div>}
      {result && <div className="flex items-center gap-2 bg-[--color-success-light] text-[--color-success] text-xs px-4 py-2.5 rounded-lg mb-3"><span className="material-symbols-outlined text-sm filled">check_circle</span>Inserted <strong className="mx-1">{result.inserted}</strong> transactions for {result.date}</div>}

      <div className="border-t border-[--color-outline-variant] my-4" />
      <p className="text-[--color-outline] text-xs mb-3">Danger zone — permanently removes all transactions from the database</p>
      <button onClick={handleClearAll} disabled={clearLoading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: "#a60b00" }}>
        <span className="material-symbols-outlined text-base">delete_forever</span>
        {clearLoading ? "Clearing..." : "Clear All Transactions"}
      </button>
      {clearError && <div className="flex items-center gap-2 bg-[--color-error-light] text-[--color-error] text-xs px-4 py-2.5 rounded-lg mt-3"><span className="material-symbols-outlined text-sm">error</span>{clearError}</div>}
      {clearResult && <div className="flex items-center gap-2 bg-[--color-success-light] text-[--color-success] text-xs px-4 py-2.5 rounded-lg mt-3"><span className="material-symbols-outlined text-sm filled">check_circle</span>Deleted <strong className="mx-1">{clearResult.deleted}</strong> transaction{clearResult.deleted !== 1 ? "s" : ""}</div>}
    </div>
  );
}
