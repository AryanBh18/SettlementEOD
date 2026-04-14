import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getEODStatus, type EODStatusResponse } from "../api/client";
import { useAuth } from "../context/AuthContext";
import EODRunPanel from "../components/EODRunPanel";
import SummaryCard from "../components/SummaryCard";
import ValidationChecks from "../components/ValidationChecks";
import BankPositionsTable from "../components/BankPositionsTable";
import ProcessLogs from "../components/ProcessLogs";
import FileDownload from "../components/FileDownload";
import CSVUpload from "../components/CSVUpload";
import AuditLog from "../components/AuditLog";
import ReportExport from "../components/ReportExport";
import SimulationPanel from "../components/SimulationPanel";
import CutoffPanel from "../components/CutoffPanel";
import BilateralSettlementsTable from "../components/BilateralSettlementsTable";
import BankStatementView from "../components/BankStatementView";

export default function Dashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user, logout, isAdmin, isOperator } = useAuth();

  const { data, isLoading, isError, error } = useQuery<EODStatusResponse>({
    queryKey: ["eodStatus", selectedDate, refreshKey],
    queryFn: () => getEODStatus(selectedDate),
    refetchInterval: false,
  });

  const handleRunComplete = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>EOD Settlement Dashboard</h1>
        <div style={styles.dateSelector}>
          <label style={styles.dateLabel}>Settlement Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={styles.dateInput}
          />
          <span style={{ fontSize: 13, opacity: 0.8, marginLeft: 12 }}>
            {user?.username} ({user?.role})
          </span>
          <button onClick={logout} style={{ padding: "4px 10px", cursor: "pointer", background: "#ef4444", color: "#fff", border: "none", borderRadius: 4, marginLeft: 8 }}>
            Logout
          </button>
        </div>
      </header>

      <main style={styles.main}>
        {/* Row 0: Simulation + Cutoff (admin/operator only) */}
        {(isAdmin || isOperator) && (
          <div style={styles.twoCol}>
            <SimulationPanel
              selectedDate={selectedDate}
              onSimulationComplete={handleRunComplete}
            />
            <CutoffPanel
              selectedDate={selectedDate}
              onCutoffComplete={handleRunComplete}
            />
          </div>
        )}

        {/* Row 1: Run Panel */}
        <EODRunPanel
          selectedDate={selectedDate}
          onRunComplete={handleRunComplete}
          currentStatus={data?.status ?? "NOT_RUN"}
        />

        {isLoading && <p style={styles.loading}>Loading status...</p>}
        {isError && (
          <p style={styles.errorMsg}>
            Error loading status: {(error as Error).message}
          </p>
        )}

        {data && (
          <>
            {/* Row 2: Summary */}
            <SummaryCard
              totalTransactions={data.total_transactions}
              totalDebit={data.total_debit}
              totalCredit={data.total_credit}
              status={data.status}
            />

            {/* Row 3: Validation + File */}
            <div style={styles.twoCol}>
              <div style={styles.col}>
                <ValidationChecks checks={data.validation_results} />
              </div>
              <div style={styles.colSmall}>
                <FileDownload
                  fileInfo={data.file_info}
                  eodDate={selectedDate}
                />
              </div>
            </div>

            {/* Row 4: Bank positions */}
            <BankPositionsTable positions={data.bank_positions} />

            {/* Row 5: Bilateral Settlements */}
            <BilateralSettlementsTable eodDate={selectedDate} refreshKey={refreshKey} />

            {/* Row 6: Per-Bank Statements */}
            <BankStatementView eodDate={selectedDate} refreshKey={refreshKey} />

            {/* Row 7: Logs */}
            <ProcessLogs logs={data.process_logs} />

            {/* Report Export */}
            <div style={{ display: "flex", gap: 12 }}>
              <ReportExport eodDate={selectedDate} />
            </div>
          </>
        )}

        {/* CSV Upload (admin/operator only) */}
        {(isAdmin || isOperator) && <CSVUpload />}

        {/* Audit Log (admin only) */}
        {isAdmin && <AuditLog />}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "100vh",
    background: "#f3f4f6",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 32px",
    background: "#1e293b",
    color: "#fff",
    flexWrap: "wrap",
    gap: 12,
  },
  headerTitle: { margin: 0, fontSize: 20, fontWeight: 700 },
  dateSelector: { display: "flex", alignItems: "center", gap: 8 },
  dateLabel: { fontSize: 14 },
  dateInput: {
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid #475569",
    background: "#334155",
    color: "#fff",
    fontSize: 14,
  },
  main: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "24px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 20,
  },
  col: { minWidth: 0 },
  colSmall: { minWidth: 0 },
  loading: {
    textAlign: "center",
    color: "#6b7280",
    padding: 32,
    fontSize: 14,
  },
  errorMsg: {
    textAlign: "center",
    color: "#dc2626",
    padding: 16,
    background: "#fef2f2",
    borderRadius: 8,
    fontSize: 14,
  },
};
