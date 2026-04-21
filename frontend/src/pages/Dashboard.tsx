import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

const NAV_ITEMS = [
  { icon: "dashboard", label: "Overview" },
  { icon: "account_balance", label: "Clearing Positions" },
  { icon: "swap_horiz", label: "Bilateral Netting" },
  { icon: "receipt_long", label: "Statements" },
  { icon: "history", label: "Audit Log" },
];

export default function Dashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeNav, setActiveNav] = useState("Overview");
  const { user, logout, isAdmin, isOperator } = useAuth();

  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery<EODStatusResponse>({
    queryKey: ["eodStatus", selectedDate, refreshKey],
    queryFn: () => getEODStatus(selectedDate),
    refetchInterval: false,
  });

  const handleRunComplete = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleClearComplete = useCallback(() => {
    queryClient.removeQueries({ queryKey: ["eodStatus"] });
    setRefreshKey((k) => k + 1);
  }, [queryClient]);

  const statusColor = (s: string) => {
    switch (s) {
      case "SUCCESS": return "text-[--color-success] bg-[--color-success-light]";
      case "FAILED": return "text-[--color-error] bg-[--color-error-light]";
      default: return "text-[--color-outline] bg-[--color-surface-container]";
    }
  };

  return (
    <div className="flex min-h-screen bg-[--color-surface-low]">
      {/* ── Sidebar ── */}
      <aside className="fixed inset-y-0 left-0 w-64 flex flex-col z-20"
        style={{ background: "#0d0f10", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #a60b00, #d31201)" }}>
            <span className="material-symbols-outlined text-white text-lg filled">account_balance</span>
          </div>
          <div>
            <div className="font-display font-extrabold text-white text-base tracking-wide leading-none">BNETS</div>
            <div className="text-white/40 text-[10px] mt-0.5 tracking-widest uppercase">Clearing &amp; Settlement</div>
          </div>
        </div>

        {/* Settlement Date */}
        <div className="px-5 py-4 border-b border-white/5">
          <label className="text-white/40 text-[10px] uppercase tracking-widest font-semibold block mb-1.5">Settlement Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-[--color-primary]"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
          />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ icon, label }) => (
            <button
              key={label}
              onClick={() => setActiveNav(label)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                activeNav === label
                  ? "bg-[--color-primary]/20 text-[--color-primary]"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${activeNav === label ? "filled" : ""}`}>{icon}</span>
              {label}
            </button>
          ))}

          {(isAdmin || isOperator) && (
            <>
              <div className="mt-4 mb-1 px-3 text-white/25 text-[10px] uppercase tracking-widest font-semibold">Operations</div>
              <button
                onClick={() => setActiveNav("Simulation")}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  activeNav === "Simulation" ? "bg-[--color-primary]/20 text-[--color-primary]" : "text-white/50 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">science</span>
                Simulation
              </button>
              <button
                onClick={() => setActiveNav("Cutoff")}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  activeNav === "Cutoff" ? "bg-[--color-primary]/20 text-[--color-primary]" : "text-white/50 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">schedule</span>
                Cutoff Schedule
              </button>
              <button
                onClick={() => setActiveNav("Upload")}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  activeNav === "Upload" ? "bg-[--color-primary]/20 text-[--color-primary]" : "text-white/50 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                CSV Upload
              </button>
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="px-5 py-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold uppercase shrink-0"
              style={{ background: "linear-gradient(135deg, #a60b00, #d31201)" }}>
              {user?.username?.slice(0, 1)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-semibold truncate">{user?.username}</div>
              <div className="text-white/40 text-[10px] uppercase tracking-wide">{user?.role}</div>
            </div>
            <button onClick={logout} title="Sign out"
              className="text-white/30 hover:text-white/70 transition-colors">
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        {/* Sticky top header */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 bg-white border-b border-[--color-outline-variant]">
          <div>
            <h1 className="font-display font-bold text-[--color-on-surface] text-lg leading-none">{activeNav}</h1>
            <p className="text-[--color-outline] text-xs mt-0.5">Settlement date: <span className="font-mono font-medium">{selectedDate}</span></p>
          </div>
          <div className="flex items-center gap-3">
            {data && (
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor(data.status)}`}>
                {data.status}
              </span>
            )}
            <EODRunPanel
              selectedDate={selectedDate}
              onRunComplete={handleRunComplete}
              currentStatus={data?.status ?? "NOT_RUN"}
              compact
            />
          </div>
        </header>

        <main className="flex-1 px-8 py-6">
          {isLoading && (
            <div className="flex items-center justify-center py-20 text-[--color-outline] text-sm gap-2">
              <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
              Loading...
            </div>
          )}
          {isError && (
            <div className="flex items-center gap-2 bg-[--color-error-light] text-[--color-error] text-sm px-4 py-3 rounded-lg">
              <span className="material-symbols-outlined text-base">error</span>
              Error loading status: {(error as Error).message}
            </div>
          )}

          {/* Overview */}
          {activeNav === "Overview" && data && (
            <div className="flex flex-col gap-6">
              <SummaryCard
                totalTransactions={data.total_transactions}
                totalDebit={data.total_debit}
                totalCredit={data.total_credit}
                status={data.status}
              />
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 flex flex-col gap-6">
                  <ValidationChecks checks={data.validation_results} />
                  <ProcessLogs logs={data.process_logs} />
                  <ReportExport eodDate={selectedDate} />
                </div>
                <div className="flex flex-col gap-6">
                  <FileDownload fileInfo={data.file_info} eodDate={selectedDate} />
                </div>
              </div>
            </div>
          )}

          {activeNav === "Clearing Positions" && (
            <BankPositionsTable positions={data?.bank_positions ?? []} />
          )}

          {activeNav === "Bilateral Netting" && (
            <BilateralSettlementsTable eodDate={selectedDate} refreshKey={refreshKey} />
          )}

          {activeNav === "Statements" && (
            <BankStatementView eodDate={selectedDate} refreshKey={refreshKey} />
          )}

          {activeNav === "Audit Log" && isAdmin && <AuditLog />}

          {activeNav === "Simulation" && (isAdmin || isOperator) && (
            <SimulationPanel selectedDate={selectedDate} onSimulationComplete={handleRunComplete} onClearComplete={handleClearComplete} />
          )}

          {activeNav === "Cutoff" && (isAdmin || isOperator) && (
            <CutoffPanel selectedDate={selectedDate} onCutoffComplete={handleRunComplete} />
          )}

          {activeNav === "Upload" && (isAdmin || isOperator) && <CSVUpload />}
        </main>
      </div>
    </div>
  );
}
