interface Props {
  totalTransactions: number;
  totalDebit: string;
  totalCredit: string;
  status: string;
}

export default function SummaryCard({
  totalTransactions,
  totalDebit,
  totalCredit,
  status,
}: Props) {
  const fmt = (v: string) =>
    parseFloat(v).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const debit = parseFloat(totalDebit);
  const credit = parseFloat(totalCredit);
  const balanced = Math.abs(debit - credit) < 0.001;

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Summary</h3>
      <div style={styles.grid}>
        <div style={styles.card}>
          <span style={styles.cardLabel}>Transactions</span>
          <span style={styles.cardValue}>{totalTransactions}</span>
        </div>
        <div style={styles.card}>
          <span style={styles.cardLabel}>Total Debit</span>
          <span style={{ ...styles.cardValue, color: "#dc2626" }}>
            {fmt(totalDebit)}
          </span>
        </div>
        <div style={styles.card}>
          <span style={styles.cardLabel}>Total Credit</span>
          <span style={{ ...styles.cardValue, color: "#059669" }}>
            {fmt(totalCredit)}
          </span>
        </div>
        <div style={styles.card}>
          <span style={styles.cardLabel}>Net Zero</span>
          <span
            style={{
              ...styles.cardValue,
              color: balanced ? "#059669" : "#dc2626",
            }}
          >
            {balanced ? "BALANCED ✓" : "UNBALANCED ✗"}
          </span>
        </div>
      </div>
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
  title: { margin: "0 0 16px", fontSize: 16, fontWeight: 600 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 12,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "12px",
    backgroundColor: "#f9fafb",
    borderRadius: 6,
  },
  cardLabel: {
    fontSize: 11,
    color: "#6b7280",
    textTransform: "uppercase",
    fontWeight: 600,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 700,
    color: "#111827",
    fontFamily: "monospace",
  },
};
