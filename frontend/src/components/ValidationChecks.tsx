import type { ValidationCheck } from "../api/client";

interface Props {
  checks: ValidationCheck[];
}

export default function ValidationChecks({ checks }: Props) {
  if (checks.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[--color-outline-variant] shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-[--color-outline]">fact_check</span>
          <h3 className="font-display font-semibold text-[--color-on-surface] text-base">Validation Checks</h3>
        </div>
        <p className="text-[--color-outline] text-sm">No validation results yet</p>
      </div>
    );
  }

  const allPassed = checks.every((c) => c.status === "PASS");

  return (
    <div className="bg-white rounded-xl border border-[--color-outline-variant] shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[--color-outline-variant]">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[--color-outline]">fact_check</span>
          <h3 className="font-display font-semibold text-[--color-on-surface] text-base">Validation Checks</h3>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${allPassed ? "bg-[--color-success-light] text-[--color-success]" : "bg-[--color-error-light] text-[--color-error]"}`}>
          {allPassed ? "ALL PASSED" : "HAS FAILURES"}
        </span>
      </div>
      <div className="divide-y divide-[--color-surface-container]">
        {checks.map((check, i) => (
          <div key={i} className="flex items-start gap-4 px-6 py-3">
            <span className={`material-symbols-outlined text-base mt-0.5 filled ${check.status === "PASS" ? "text-[--color-success]" : "text-[--color-error]"}`}>
              {check.status === "PASS" ? "check_circle" : "cancel"}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-[--color-on-surface]">{check.check_name}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${check.status === "PASS" ? "bg-[--color-success-light] text-[--color-success]" : "bg-[--color-error-light] text-[--color-error]"}`}>
                  {check.status}
                </span>
              </div>
              {check.message && <p className="text-[--color-outline] text-xs mt-0.5">{check.message}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
