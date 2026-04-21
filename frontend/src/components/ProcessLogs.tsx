import type { ProcessLog } from "../api/client";

interface Props {
  logs: ProcessLog[];
}

const statusConfig: Record<string, { cls: string; icon: string }> = {
  SUCCESS: { cls: "text-[--color-success]", icon: "check_circle" },
  FAILED: { cls: "text-[--color-error]", icon: "error" },
  ERROR: { cls: "text-[--color-error]", icon: "error" },
  INFO: { cls: "text-[--color-tertiary]", icon: "info" },
};

export default function ProcessLogs({ logs }: Props) {
  return (
    <div className="bg-white rounded-xl border border-[--color-outline-variant] shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[--color-outline-variant]">
        <span className="material-symbols-outlined text-[--color-outline]">terminal</span>
        <h3 className="font-display font-semibold text-[--color-on-surface] text-base">Process Logs</h3>
        {logs.length > 0 && (
          <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-[--color-surface-container] text-[--color-on-surface-variant]">{logs.length}</span>
        )}
      </div>
      {logs.length === 0 ? (
        <p className="text-[--color-outline] text-sm px-6 py-8 text-center">No process logs yet</p>
      ) : (
        <div className="divide-y divide-[--color-surface-container] max-h-80 overflow-y-auto">
          {logs.map((log) => {
            const cfg = statusConfig[log.status] ?? { cls: "text-[--color-outline]", icon: "circle" };
            return (
              <div key={log.id} className="flex items-start gap-3 px-6 py-3 hover:bg-[--color-surface-low] transition-colors">
                <span className={`material-symbols-outlined text-base mt-0.5 shrink-0 filled ${cfg.cls}`}>{cfg.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[--color-on-surface] text-xs">{log.process_name}</span>
                    <span className="text-[--color-outline] text-[10px] font-mono ml-auto shrink-0">{new Date(log.created_at).toLocaleTimeString()}</span>
                  </div>
                  {log.message && <p className="text-[--color-on-surface-variant] text-xs mt-0.5 font-mono">{log.message}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
