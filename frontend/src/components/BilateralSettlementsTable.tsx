import { useState, useEffect } from "react";
import { getBilateralSettlements, type BilateralSettlementList } from "../api/client";

interface Props {
  eodDate: string;
  refreshKey: number;
}

export default function BilateralSettlementsTable({ eodDate, refreshKey }: Props) {
  const [data, setData] = useState<BilateralSettlementList | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getBilateralSettlements(eodDate);
        setData(res);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [eodDate, refreshKey]);

  const fmt = (v: string) => {
    const n = parseFloat(v);
    return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading) return <div style={styles.container}><p style={styles.empty}>Loading bilateral settlements...</p></div>;
  if (!data || data.settlements.length === 0) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>Bilateral Settlements (Pairwise Netting)</h3>
        <p style={styles.empty}>No bilateral settlement data available</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>
        Bilateral Settlements (Pairwise Netting)
        <span style={styles.badge}>{data.total_pairs} pairs</span>
      </h3>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Bank A</th>
            <th style={styles.th}>Bank B</th>
            <th style={styles.thRight}>A Owes B</th>
            <th style={styles.thRight}>B Owes A</th>
            <th style={styles.thRight}>Net Amount</th>
            <th style={styles.th}>Net Direction</th>
          </tr>
        </thead>
        <tbody>
          {data.settlements.map((s, i) => {
            const net = parseFloat(s.net_amount);
            return (
              <tr key={i} style={styles.row}>
                <td style={styles.td}>
                  <strong>{s.bank_a_code}</strong>
                  <br /><span style={{ color: "#6b7280", fontSize: 11 }}>{s.bank_a_name}</span>
                </td>
                <td style={styles.td}>
                  <strong>{s.bank_b_code}</strong>
                  <br /><span style={{ color: "#6b7280", fontSize: 11 }}>{s.bank_b_name}</span>
                </td>
                <td style={styles.tdRight}>{fmt(s.bank_a_owes_b)}</td>
                <td style={styles.tdRight}>{fmt(s.bank_b_owes_a)}</td>
                <td style={{ ...styles.tdRight, fontWeight: 700, color: net > 0 ? "#2563eb" : "#374151" }}>
                  {fmt(s.net_amount)}
                </td>
                <td style={styles.td}>
                  {s.net_direction === "ZERO" ? (
                    <span style={{ color: "#9ca3af" }}>Even</span>
                  ) : (
                    <span style={{ fontSize: 12 }}>
                      {s.net_direction === "A_TO_B"
                        ? `${s.bank_a_code} → ${s.bank_b_code}`
                        : `${s.bank_b_code} → ${s.bank_a_code}`}
                    </span>
                  )}
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
  title: { margin: "0 0 16px 0", fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 },
  badge: {
    background: "#ede9fe",
    color: "#7c3aed",
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 10,
  },
  empty: { color: "#9ca3af", fontSize: 14 },
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  th: {
    textAlign: "left" as const,
    padding: "8px 12px",
    borderBottom: "2px solid #e5e7eb",
    fontSize: 11,
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase" as const,
  },
  thRight: {
    textAlign: "right" as const,
    padding: "8px 12px",
    borderBottom: "2px solid #e5e7eb",
    fontSize: 11,
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase" as const,
  },
  row: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "10px 12px" },
  tdRight: { padding: "10px 12px", textAlign: "right" as const, fontVariantNumeric: "tabular-nums" },
};
