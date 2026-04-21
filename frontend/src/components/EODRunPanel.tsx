import { useState } from "react";
import { runEOD } from "../api/client";

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
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "EOD run failed");
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-[--color-on-surface-variant] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={forceRerun}
            onChange={(e) => setForceRerun(e.target.checked)}
            className="rounded"
          />
          Force re-run
        </label>
        <button
          onClick={handleRun}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
          style={{ background: "linear-gradient(135deg, #a60b00, #d31201)" }}
        >
          <span className="material-symbols-outlined text-base">play_arrow</span>
          {loading ? "Processing..." : "Run EOD"}
        </button>
        {error && <span className="text-xs text-[--color-error]">{error}</span>}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-[--color-outline-variant]">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="font-display font-bold text-[--color-on-surface] text-xl">EOD Clearing &amp; Settlement Run</h2>
          <p className="text-[--color-outline] text-sm mt-1">
            Date: <strong>{selectedDate}</strong> &nbsp;·&nbsp; Status:{" "}
            <span className={`font-bold ${currentStatus === "SUCCESS" ? "text-[--color-success]" : currentStatus === "FAILED" ? "text-[--color-error]" : "text-[--color-outline]"}`}>
              {loading ? "RUNNING..." : currentStatus}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-[--color-on-surface-variant] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={forceRerun}
              onChange={(e) => setForceRerun(e.target.checked)}
              className="rounded"
            />
            Force Re-run
          </label>
          <button
            onClick={handleRun}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #a60b00, #d31201)" }}
          >
            <span className="material-symbols-outlined text-base">play_arrow</span>
            {loading ? "Processing..." : "Run EOD"}
          </button>
        </div>
      </div>
      {error && (
        <div className="mt-3 flex items-center gap-2 bg-[--color-error-light] text-[--color-error] text-sm px-4 py-2.5 rounded-lg">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
        </div>
      )}
    </div>
  );
}

