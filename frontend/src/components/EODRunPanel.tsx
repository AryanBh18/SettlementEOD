import { useState } from "react";
import { runEOD, getErrorMessage } from "../api/client";

interface Props {
  selectedDate: string;
  onRunComplete: () => void;
  currentStatus: string;
  compact?: boolean;
}

export default function EODRunPanel({
  selectedDate,
  onRunComplete,
  currentStatus,
  compact = false,
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
    } catch (err) {
      setError(getErrorMessage(err, "EOD run failed"));
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-[11px] text-on-surface-variant cursor-pointer select-none whitespace-nowrap">
          <input
            type="checkbox"
            checked={forceRerun}
            onChange={(e) => setForceRerun(e.target.checked)}
            className="rounded-sm"
          />
          Force re-run
        </label>
        <button
          onClick={handleRun}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[11px] font-bold uppercase tracking-widest text-white disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
          style={{ background: "linear-gradient(135deg, #a60b00, #d31201)" }}
        >
          <span className="material-symbols-outlined text-sm">play_arrow</span>
          {loading ? "Processing..." : "Run EOD"}
        </button>
        {error && <span className="text-xs text-error">{error}</span>}
      </div>
    );
  }

  return (
    <div className="bg-white border border-outline-variant shadow-[0_40px_40px_rgba(25,28,29,0.04)] p-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="font-display font-extrabold text-on-surface text-xl tracking-tight">EOD Clearing &amp; Settlement Run</h2>
          <p className="text-outline text-sm mt-1">
            Date: <strong>{selectedDate}</strong> &nbsp;·&nbsp; Status:{" "}
            <span className={`font-bold ${currentStatus === "SUCCESS" ? "text-success" : currentStatus === "FAILED" ? "text-error" : "text-outline"}`}>
              {loading ? "RUNNING..." : currentStatus}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer select-none">
            <input
              type="checkbox"
              checked={forceRerun}
              onChange={(e) => setForceRerun(e.target.checked)}
              className="rounded-sm"
            />
            Force Re-run
          </label>
          <button
            onClick={handleRun}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest text-white disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #a60b00, #d31201)" }}
          >
            <span className="material-symbols-outlined text-base">play_arrow</span>
            {loading ? "Processing..." : "Run EOD"}
          </button>
        </div>
      </div>
      {error && (
        <div className="mt-3 flex items-center gap-2 bg-error-light text-error text-sm px-4 py-2.5 rounded-sm border border-error/20">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
        </div>
      )}
    </div>
  );
}
