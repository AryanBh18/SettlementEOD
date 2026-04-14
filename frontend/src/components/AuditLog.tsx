import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "../api/client";

export default function AuditLog() {
  const { data: logs, isLoading, error } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: () => getAuditLogs({ limit: 50 }),
  });

  if (isLoading) return <p>Loading audit logs...</p>;
  if (error) return <p style={{ color: "#c00" }}>Failed to load audit logs (admin only)</p>;

  return (
    <div style={{ background: "#fff", padding: "1rem", borderRadius: 8, border: "1px solid #e0e0e0" }}>
      <h3 style={{ marginTop: 0 }}>Audit Log</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
        <thead>
          <tr style={{ background: "#f9f9f9" }}>
            <th style={{ padding: 6, textAlign: "left", borderBottom: "1px solid #ddd" }}>Time</th>
            <th style={{ padding: 6, textAlign: "left", borderBottom: "1px solid #ddd" }}>User</th>
            <th style={{ padding: 6, textAlign: "left", borderBottom: "1px solid #ddd" }}>Action</th>
            <th style={{ padding: 6, textAlign: "left", borderBottom: "1px solid #ddd" }}>Resource</th>
            <th style={{ padding: 6, textAlign: "left", borderBottom: "1px solid #ddd" }}>Details</th>
          </tr>
        </thead>
        <tbody>
          {logs?.map((log) => (
            <tr key={log.id}>
              <td style={{ padding: 6, borderBottom: "1px solid #eee" }}>
                {new Date(log.created_at).toLocaleString()}
              </td>
              <td style={{ padding: 6, borderBottom: "1px solid #eee" }}>{log.user_id ?? "-"}</td>
              <td style={{ padding: 6, borderBottom: "1px solid #eee" }}>{log.action}</td>
              <td style={{ padding: 6, borderBottom: "1px solid #eee" }}>{log.resource ?? "-"}</td>
              <td style={{ padding: 6, borderBottom: "1px solid #eee" }}>
                {log.details ? JSON.stringify(log.details) : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(!logs || logs.length === 0) && <p style={{ color: "#888" }}>No audit logs yet.</p>}
    </div>
  );
}
