import type { BankPosition } from "../api/client";

interface Props {
  positions: BankPosition[];
}

export default function BankPositionsTable({ positions }: Props) {
  if (positions.length === 0) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>Bank Positions</h3>
        <p style={styles.empty}>No clearing results yet</p>
      </div>
    );
  }

  const fmt = (v: string) => {
    const n = parseFloat(v);
    return n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Bank Positions</h3>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Bank</th>
            <th style={styles.thRight}>Incoming</th>
            <th style={styles.thRight}>Outgoing</th>
            <th style={styles.thRight}>Net Position</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => {
            const net = parseFloat(p.net_position);
            return (
              <tr key={p.bank_id} style={styles.row}>
                <td style={styles.td}>
                  <strong>{p.bank_code}</strong>
                  <br />
                  <span style={{ color: "#6b7280", fontSize: 12 }}>
                    {p.bank_name}
                  </span>
                </td>
                <td style={styles.tdRight}>{fmt(p.total_incoming)}</td>
                <td style={styles.tdRight}>{fmt(p.total_outgoing)}</td>
                <td
                  style={{
                    ...styles.tdRight,
                    fontWeight: 700,
                    color:
                      net > 0 ? "#059669" : net < 0 ? "#dc2626" : "#374151",
                  }}
                >
                  {net > 0 ? "+" : ""}
                  {fmt(p.net_position)}
                  <span style={{ fontSize: 11, marginLeft: 4, fontWeight: 400 }}>
                    {net > 0 ? "(CR)" : net < 0 ? "(DR)" : ""}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: "#fff",
    borderRadius: 8,
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  title: { margin: "0 0 16px 0", fontSize: 16, fontWeight: 600 },
  empty: { color: "#9ca3af", fontSize: 14 },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },
  th: {
    textAlign: "left",
    padding: "8px 12px",
    borderBottom: "2px solid #e5e7eb",
    fontSize: 12,
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase",
  },
  thRight: {
    textAlign: "right",
    padding: "8px 12px",
    borderBottom: "2px solid #e5e7eb",
    fontSize: 12,
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase",
  },
  row: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "10px 12px" },
  tdRight: { padding: "10px 12px", textAlign: "right", fontFamily: "monospace" },
};
