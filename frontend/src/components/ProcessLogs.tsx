import type { ProcessLog } from "../api/client";

interface Props {
  logs: ProcessLog[];
}

const statusConfig: Record<string, { cls: string; icon: string }> = {
  SUCCESS: { cls: "text-success", icon: "check_circle" },
  FAILED: { cls: "text-error", icon: "error" },
  ERROR: { cls: "text-error", icon: "error" },
  INFO: { cls: "text-tertiary", icon: "info" },
};

export default function ProcessLogs({ logs }: Props) {
  return (
    <div className="bg-white border border-outline-variant shadow-[0_40px_40px_rgba(25,28,29,0.04)] overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-outline-variant">
        <span className="material-symbols-outlined text-outline">terminal</span>
        <h3 className="font-display font-bold text-on-surface text-sm uppercase tracking-widest">Process Logs</h3>
        {logs.length > 0 && (
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 bg-surface-container text-on-surface-variant uppercase tracking-widest">
            {logs.length}
          </span>
        )}
      </div>
      {logs.length === 0 ? (
        <p className="text-outline text-sm px-6 py-10 text-center">No process logs yet</p>
      ) : (
        <div className="divide-y divide-outline-variant/30 max-h-80 overflow-y-auto">
          {logs.map((log, i) => {
            const cfg = statusConfig[log.status] ?? { cls: "text-outline", icon: "circle" };
            return (
              <div key={log.id}
                className={`flex items-start gap-3 px-6 py-3 transition-colors hover:bg-surface-container-lowest ${i % 2 === 0 ? "bg-white" : "bg-surface-container-lowest/50"}`}>
                <span className={`material-symbols-outlined text-base mt-0.5 shrink-0 filled ${cfg.cls}`}>{cfg.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-on-surface text-xs tracking-wide">{log.process_name}</span>
                    {log.username && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-surface-container text-on-surface-variant font-mono">
                        by {log.username}
                      </span>
                    )}
                    <span className="text-outline text-[10px] font-mono ml-auto shrink-0">
                      {new Date(log.created_at).toLocaleString(undefined, {
                        year: "numeric", month: "short", day: "2-digit",
                        hour: "2-digit", minute: "2-digit", second: "2-digit",
                      })}
                    </span>
                  </div>
                  {log.message && <p className="text-on-surface-variant text-xs mt-0.5 font-mono">{log.message}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
