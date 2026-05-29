import { useState } from "react";
import { simulateTransactions, clearAllTransactions, getErrorMessage, type SimulationResult } from "../api/client";

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
    catch (err) { setError(getErrorMessage(err, "Simulation failed")); }
    finally { setLoading(false); }
  };

  const handleClearAll = async () => {
    if (!window.confirm("This will permanently delete ALL transactions from the database. Are you sure?")) return;
    setClearLoading(true); setClearError(null); setClearResult(null);
    try { const res = await clearAllTransactions(); setClearResult(res); onClearComplete(); }
    catch (err) { setClearError(getErrorMessage(err, "Clear failed")); }
    finally { setClearLoading(false); }
  };

  return (
    <div className="bg-white border border-outline-variant shadow-[0_40px_40px_rgba(25,28,29,0.04)] p-6">
      <div className="flex items-center gap-3 mb-1">
        <span className="material-symbols-outlined text-outline">science</span>
        <h3 className="font-display font-bold text-on-surface text-sm uppercase tracking-widest">Transaction Simulation</h3>
      </div>
      <p className="text-outline text-xs mb-5">Generate inter-bank transactions where the issuer (source bank) and acquirer (destination bank) differ</p>

      <div className="flex items-center gap-3 flex-wrap mb-3">
        <label className="flex items-center gap-2 text-sm text-on-surface-variant">
          <span>Count:</span>
          <input type="number" min={1} max={10000} value={count}
            onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 px-3 py-1.5 rounded-sm border border-outline-variant text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary" />
        </label>
        <button onClick={handleSimulate} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest text-white disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #0046c3, #0035a0)" }}>
          <span className="material-symbols-outlined text-base">play_arrow</span>
          {loading ? "Simulating..." : "Simulate Transactions"}
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-2 bg-error-light text-error text-xs px-4 py-2.5 rounded-sm border border-error/20 mb-3">
          <span className="material-symbols-outlined text-sm">error</span>{error}
        </div>
      )}
      {result && (
        <div className="flex items-center gap-2 bg-success-light text-success text-xs px-4 py-2.5 rounded-sm mb-3">
          <span className="material-symbols-outlined text-sm filled">check_circle</span>
          Inserted <strong className="mx-1">{result.inserted}</strong> transactions for {result.date}
        </div>
      )}

      <div className="border-t border-outline-variant my-4" />
      <p className="text-[10px] font-bold uppercase tracking-widest text-error mb-1">Danger Zone</p>
      <p className="text-outline text-xs mb-3">Permanently removes all transactions from the database</p>
      <button onClick={handleClearAll} disabled={clearLoading}
        className="flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest text-white disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: "#a60b00" }}>
        <span className="material-symbols-outlined text-base">delete_forever</span>
        {clearLoading ? "Clearing..." : "Clear All Transactions"}
      </button>
      {clearError && (
        <div className="flex items-center gap-2 bg-error-light text-error text-xs px-4 py-2.5 rounded-sm border border-error/20 mt-3">
          <span className="material-symbols-outlined text-sm">error</span>{clearError}
        </div>
      )}
      {clearResult && (
        <div className="flex items-center gap-2 bg-success-light text-success text-xs px-4 py-2.5 rounded-sm mt-3">
          <span className="material-symbols-outlined text-sm filled">check_circle</span>
          Deleted <strong className="mx-1">{clearResult.deleted}</strong> transaction{clearResult.deleted !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
