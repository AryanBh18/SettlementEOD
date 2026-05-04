import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "../api/client";

export default function AuditLog() {
  const { data: logs, isLoading, error } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: () => getAuditLogs({ limit: 50 }),
  });

  return (
    <div className="bg-white rounded-xl border border-[--color-outline-variant] shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[--color-outline-variant]">
        <span className="material-symbols-outlined text-[--color-outline]">manage_history</span>
        <h3 className="font-display font-semibold text-[--color-on-surface] text-base">Audit Log</h3>
      </div>
      {isLoading && <p className="text-[--color-outline] text-sm px-6 py-8 text-center">Loading audit logs...</p>}
      {error && <p className="text-[--color-error] text-sm px-6 py-4">Failed to load audit logs (admin only)</p>}
      {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[--color-surface-low]">
                {["Time", "User", "Action", "Resource", "Details"].map((h) => (
                  <th key={h} className="text-left px-6 py-3 font-semibold text-[--color-on-surface-variant] uppercase tracking-wider text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[--color-surface-container]">
              {logs?.map((log) => (
                <tr key={log.id} className="hover:bg-[--color-surface-low] transition-colors">
                  <td className="px-6 py-3 font-mono text-[--color-on-surface-variant] whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-6 py-3 text-[--color-on-surface]">{log.username ?? log.user_id ?? "-"}</td>
                  <td className="px-6 py-3 font-semibold text-[--color-on-surface]">{log.action}</td>
                  <td className="px-6 py-3 text-[--color-on-surface-variant]">{log.resource ?? "-"}</td>
                  <td className="px-6 py-3 font-mono text-[--color-outline] max-w-xs truncate">{log.details ? JSON.stringify(log.details) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!logs || logs.length === 0) && <p className="text-[--color-outline] text-sm px-6 py-8 text-center">No audit logs yet.</p>}
        </div>
      )}
    </div>
  );
}
