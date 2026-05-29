import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "../api/client";

export default function AuditLog() {
  const { data: logs, isLoading, error } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: () => getAuditLogs({ limit: 50 }),
  });

  return (
    <div className="bg-white border border-outline-variant shadow-[0_40px_40px_rgba(25,28,29,0.04)] overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-outline-variant">
        <span className="material-symbols-outlined text-outline">manage_history</span>
        <h3 className="font-display font-bold text-on-surface text-sm uppercase tracking-widest">Audit Log</h3>
        {logs && logs.length > 0 && (
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 bg-surface-container text-on-surface-variant uppercase tracking-widest">
            {logs.length} entries
          </span>
        )}
      </div>
      {isLoading && <p className="text-outline text-sm px-6 py-10 text-center">Loading audit logs...</p>}
      {error && <p className="text-error text-sm px-6 py-4">Failed to load audit logs (admin only)</p>}
      {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-surface border-b border-outline-variant">
                {["Time", "User", "Action", "Resource", "Details"].map((h) => (
                  <th key={h} className="text-left px-6 py-3 font-bold text-on-surface-variant uppercase tracking-widest text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs?.map((log, i) => (
                <tr key={log.id}
                  className={`border-b border-outline-variant/40 transition-colors hover:bg-primary-light/30 ${i % 2 === 0 ? "bg-white" : "bg-surface-container-lowest"}`}>
                  <td className="px-6 py-3 font-mono text-on-surface-variant whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-6 py-3 font-semibold text-on-surface">{log.username ?? log.user_id ?? "-"}</td>
                  <td className="px-6 py-3 font-bold text-on-surface uppercase tracking-wide">{log.action}</td>
                  <td className="px-6 py-3 text-on-surface-variant">{log.resource ?? "-"}</td>
                  <td className="px-6 py-3 font-mono text-outline max-w-xs truncate">{log.details ? JSON.stringify(log.details) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!logs || logs.length === 0) && <p className="text-outline text-sm px-6 py-10 text-center">No audit logs yet.</p>}
        </div>
      )}
    </div>
  );
}
