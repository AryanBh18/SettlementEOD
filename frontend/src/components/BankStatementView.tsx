import { useState, useEffect } from "react";
import { getBankStatements, getBankStatementPdfUrl, type BankStatementsList } from "../api/client";

interface Props {
  eodDate: string;
  refreshKey: number;
}

export default function BankStatementView({ eodDate, refreshKey }: Props) {
  const [data, setData] = useState<BankStatementsList | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedBank, setExpandedBank] = useState<number | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getBankStatements(eodDate);
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

  function downloadPdf(bankCode: string, bankName: string) {
    const token = localStorage.getItem("token");
    const url = getBankStatementPdfUrl(eodDate, bankCode);
    fetch(url, { headers: { Authorization: `Bearer ${token ?? ""}` } })
      .then((res) => {
        if (!res.ok) throw new Error("Download failed");
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `settlement_statement_${bankCode}_${eodDate}.pdf`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => alert(`Failed to download PDF for ${bankName}`));
  }

  if (loading) return <div style={styles.container}><p style={styles.empty}>Loading bank statements...</p></div>;
  if (!data || data.statements.length === 0) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>Per-Bank Settlement Statements</h3>
        <p style={styles.empty}>No statement data available</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>
        Per-Bank Settlement Statements
        <span style={styles.badge}>{data.total_banks} banks</span>
      </h3>
      {data.statements.map((s) => {
        const net = parseFloat(s.net_position);
        const isExpanded = expandedBank === s.bank_id;
        return (
          <div key={s.bank_id} style={styles.card}>
            <div
              style={styles.cardHeader}
              onClick={() => setExpandedBank(isExpanded ? null : s.bank_id)}
            >
              <div>
                <strong style={{ fontSize: 14 }}>{s.bank_code}</strong>
                <span style={{ color: "#6b7280", fontSize: 12, marginLeft: 8 }}>{s.bank_name}</span>
              </div>
              <div style={styles.totals}>
                <span style={{ color: "#dc2626" }}>DR: {fmt(s.total_debit)}</span>
                <span style={{ color: "#059669" }}>CR: {fmt(s.total_credit)}</span>
                <span style={{
                  fontWeight: 700,
                  color: net > 0 ? "#059669" : net < 0 ? "#dc2626" : "#374151",
                }}>
                  Net: {net > 0 ? "+" : ""}{fmt(s.net_position)}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); downloadPdf(s.bank_code, s.bank_name); }}
                  style={styles.pdfBtn}
                  title={`Download PDF statement for ${s.bank_code}`}
                >
                  ↓ PDF
                </button>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{isExpanded ? "▲" : "▼"}</span>
              </div>
            </div>
            {isExpanded && (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Counterparty</th>
                    <th style={styles.thRight}>Gross Payable</th>
                    <th style={styles.thRight}>Gross Receivable</th>
                    <th style={styles.thRight}>Net</th>
                    <th style={styles.th}>Direction</th>
                  </tr>
                </thead>
                <tbody>
                  {s.breakdown.map((b) => (
                    <tr key={b.bank_id} style={styles.row}>
                      <td style={styles.td}>
                        <strong>{b.bank_code}</strong>
                        <span style={{ color: "#6b7280", fontSize: 11, marginLeft: 6 }}>{b.bank_name}</span>
                      </td>
                      <td style={styles.tdRight}>{fmt(b.gross_payable)}</td>
                      <td style={styles.tdRight}>{fmt(b.gross_receivable)}</td>
                      <td style={{ ...styles.tdRight, fontWeight: 600 }}>{fmt(b.net_amount)}</td>
                      <td style={styles.td}>
                        {b.net_direction === "ZERO" ? (
                          <span style={{ color: "#9ca3af" }}>Even</span>
                        ) : b.net_direction === "PAY" ? (
                          <span style={{ color: "#dc2626", fontWeight: 600, fontSize: 12 }}>PAY</span>
                        ) : (
                          <span style={{ color: "#059669", fontWeight: 600, fontSize: 12 }}>RECEIVE</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
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
    background: "#dbeafe",
    color: "#2563eb",
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 10,
  },
  empty: { color: "#9ca3af", fontSize: 14 },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    marginBottom: 10,
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    cursor: "pointer",
    background: "#f9fafb",
    flexWrap: "wrap" as const,
    gap: 8,
  },
  totals: { display: "flex", gap: 16, fontSize: 13, alignItems: "center" },
  pdfBtn: {
    padding: "3px 10px",
    background: "#7c3aed",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
  },
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 12 },
  th: {
    textAlign: "left" as const,
    padding: "8px 16px",
    borderBottom: "1px solid #e5e7eb",
    fontSize: 11,
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase" as const,
    background: "#fff",
  },
  thRight: {
    textAlign: "right" as const,
    padding: "8px 16px",
    borderBottom: "1px solid #e5e7eb",
    fontSize: 11,
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase" as const,
    background: "#fff",
  },
  row: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "8px 16px" },
  tdRight: { padding: "8px 16px", textAlign: "right" as const, fontVariantNumeric: "tabular-nums" },
};
