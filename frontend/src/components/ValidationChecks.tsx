import type { ValidationCheck } from "../api/client";

interface Props {
  checks: ValidationCheck[];
}

export default function ValidationChecks({ checks }: Props) {
  if (checks.length === 0) {
    return (
      <div className="bg-white border border-outline-variant shadow-[0_40px_40px_rgba(25,28,29,0.04)] p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-outline">fact_check</span>
          <h3 className="font-display font-bold text-on-surface text-sm uppercase tracking-widest">Validation Checks</h3>
        </div>
        <p className="text-outline text-sm">No validation results yet</p>
      </div>
    );
  }

  const allPassed = checks.every((c) => c.status === "PASS");

  return (
    <div className="bg-white border border-outline-variant shadow-[0_40px_40px_rgba(25,28,29,0.04)] overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-outline">fact_check</span>
          <h3 className="font-display font-bold text-on-surface text-sm uppercase tracking-widest">Validation Checks</h3>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-sm uppercase tracking-widest ${allPassed ? "bg-success-light text-success" : "bg-error-light text-error"}`}>
          {allPassed ? "All Passed" : "Has Failures"}
        </span>
      </div>
      <div className="divide-y divide-outline-variant/30">
        {checks.map((check, i) => (
          <div key={i} className={`flex items-start gap-4 px-6 py-3.5 transition-colors hover:bg-surface-container-lowest ${i % 2 === 0 ? "bg-white" : "bg-surface-container-lowest/50"}`}>
            <span className={`material-symbols-outlined text-base mt-0.5 filled shrink-0 ${check.status === "PASS" ? "text-success" : "text-error"}`}>
              {check.status === "PASS" ? "check_circle" : "cancel"}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-on-surface tracking-wide">{check.check_name}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-widest ${check.status === "PASS" ? "bg-success-light text-success" : "bg-error-light text-error"}`}>
                  {check.status}
                </span>
                {check.username && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-surface-container text-on-surface-variant font-mono rounded-sm">
                    by {check.username}
                  </span>
                )}
                {check.created_at && (
                  <span className="text-outline text-[10px] font-mono ml-auto shrink-0">
                    {new Date(check.created_at).toLocaleString(undefined, {
                      year: "numeric", month: "short", day: "2-digit",
                      hour: "2-digit", minute: "2-digit", second: "2-digit",
                    })}
                  </span>
                )}
              </div>
              {check.message && <p className="text-outline text-xs mt-0.5 font-mono">{check.message}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
