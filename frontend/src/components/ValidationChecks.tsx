import type { ValidationCheck } from "../api/client";

interface Props {
  checks: ValidationCheck[];
}

export default function ValidationChecks({ checks }: Props) {
  if (checks.length === 0) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>Validation Checks</h3>
        <p style={styles.empty}>No validation results yet</p>
      </div>
    );
  }

  const allPassed = checks.every((c) => c.status === "PASS");

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>
        Validation Checks
        <span
          style={{
            ...styles.badge,
            backgroundColor: allPassed ? "#059669" : "#dc2626",
          }}
        >
          {allPassed ? "ALL PASSED" : "HAS FAILURES"}
        </span>
      </h3>
      <div style={styles.list}>
        {checks.map((check, i) => (
          <div
            key={i}
            style={{
              ...styles.item,
              borderLeft: `4px solid ${check.status === "PASS" ? "#059669" : "#dc2626"}`,
            }}
          >
            <div style={styles.itemHeader}>
              <span style={styles.icon}>
                {check.status === "PASS" ? "✓" : "✗"}
              </span>
              <span style={styles.checkName}>{check.check_name}</span>
              <span
                style={{
                  ...styles.statusPill,
                  backgroundColor:
                    check.status === "PASS"
                      ? "rgba(5,150,105,0.1)"
                      : "rgba(220,38,38,0.1)",
                  color: check.status === "PASS" ? "#059669" : "#dc2626",
                }}
              >
                {check.status}
              </span>
            </div>
            {check.message && (
              <p style={styles.message}>{check.message}</p>
            )}
          </div>
        ))}
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
  title: {
    margin: "0 0 16px 0",
    fontSize: 16,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  badge: {
    fontSize: 11,
    color: "#fff",
    padding: "2px 8px",
    borderRadius: 10,
    fontWeight: 500,
  },
  empty: { color: "#9ca3af", fontSize: 14 },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  item: {
    padding: "10px 14px",
    backgroundColor: "#f9fafb",
    borderRadius: 6,
  },
  itemHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  icon: { fontSize: 16, fontWeight: 700 },
  checkName: { fontWeight: 600, fontSize: 13, fontFamily: "monospace" },
  statusPill: {
    marginLeft: "auto",
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 8,
  },
  message: {
    margin: "6px 0 0 24px",
    fontSize: 12,
    color: "#6b7280",
  },
};
