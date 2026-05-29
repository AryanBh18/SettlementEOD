import { useState, useCallback, useEffect, useRef } from "react";
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

const MAIN_NAV = [
  { icon: "dashboard", label: "Overview" },
  { icon: "account_balance", label: "Clearing Positions" },
  { icon: "swap_horiz", label: "Bilateral Netting" },
  { icon: "receipt_long", label: "Statements" },
  { icon: "history", label: "Audit Log" },
];

const OPS_NAV = [
  { icon: "science", label: "Simulation" },
  { icon: "schedule", label: "Cutoff" },
  { icon: "upload_file", label: "Upload" },
];

export default function Dashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeNav, setActiveNav] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAdmin, isOperator } = useAuth();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery<EODStatusResponse>({
    queryKey: ["eodStatus", selectedDate, refreshKey],
    queryFn: () => getEODStatus(selectedDate),
    refetchInterval: false,
  });

  const handleRunComplete = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleClearComplete = useCallback(() => {
    queryClient.removeQueries({ queryKey: ["eodStatus"] });
    setRefreshKey((k) => k + 1);
  }, [queryClient]);

  const navigate = (label: string) => {
    setActiveNav(label);
    setSidebarOpen(false);
  };

  // Close sidebar on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sidebarOpen]);

  // Close sidebar on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setSidebarOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const statusColor = (s: string) => {
    switch (s) {
      case "SUCCESS": return "text-success bg-success-light";
      case "FAILED": return "text-error bg-error-light";
      default: return "text-outline bg-surface-container";
    }
  };

  const navItem = (label: string, icon: string) => (
    <button
      key={label}
      onClick={() => navigate(label)}
      className={`flex items-center gap-3 w-full px-4 py-3 text-left text-sm transition-colors ${
        activeNav === label
          ? "bg-primary-light text-primary font-bold border-l-2 border-primary"
          : "text-on-surface-variant hover:bg-surface-low hover:text-on-surface font-medium border-l-2 border-transparent"
      }`}
    >
      <span className={`material-symbols-outlined text-[18px] shrink-0 ${activeNav === label ? "filled" : ""}`}>{icon}</span>
      {label}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-surface-low">
      {/* ── Top header ── */}
      <header className="sticky top-0 z-20 bg-white border-b border-outline-variant shadow-[0_1px_4px_rgba(25,28,29,0.06)]">
        <div className="flex items-center gap-3 px-4 h-14">
          {/* Hamburger */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-low rounded-sm transition-colors shrink-0"
            aria-label="Open navigation"
          >
            <span className="material-symbols-outlined text-[22px]">{sidebarOpen ? "close" : "menu"}</span>
          </button>

          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 flex items-center justify-center rounded-sm shrink-0"
              style={{ background: "linear-gradient(135deg, #a60b00, #d31201)" }}>
              <span className="material-symbols-outlined text-white text-[15px] filled">account_balance</span>
            </div>
            <span className="font-display font-extrabold text-on-surface text-sm tracking-tight leading-none">BNETS</span>
            <span className="text-outline-variant text-sm leading-none hidden sm:block">|</span>
            <span className="text-outline text-[10px] tracking-widest uppercase font-semibold leading-none hidden sm:block">
              Clearing &amp; Settlement
            </span>
          </div>

          <div className="flex-1" />

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            {data && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest hidden sm:inline-block ${statusColor(data.status)}`}>
                {data.status}
              </span>
            )}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-sm text-xs text-on-surface font-mono border border-outline-variant bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <EODRunPanel
              selectedDate={selectedDate}
              onRunComplete={handleRunComplete}
              currentStatus={data?.status ?? "NOT_RUN"}
              compact
            />
            <div className="w-px bg-outline-variant h-6 mx-1 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-sm flex items-center justify-center text-white text-[10px] font-bold uppercase shrink-0"
                style={{ background: "linear-gradient(135deg, #a60b00, #d31201)" }}>
                {user?.username?.slice(0, 1)}
              </div>
              <div className="leading-none">
                <div className="text-on-surface text-xs font-semibold">{user?.username}</div>
                <div className="text-outline text-[9px] uppercase tracking-wide">{user?.role}</div>
              </div>
              <button onClick={logout} title="Sign out"
                className="text-outline hover:text-on-surface transition-colors ml-1">
                <span className="material-symbols-outlined text-[17px]">logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Sidebar overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-on-surface/20" aria-hidden="true" />
      )}

      {/* ── Slide-in sidebar ── */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full z-40 w-72 bg-white border-r border-outline-variant shadow-[4px_0_24px_rgba(25,28,29,0.10)] flex flex-col transition-transform duration-200 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-outline-variant shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 flex items-center justify-center rounded-sm"
              style={{ background: "linear-gradient(135deg, #a60b00, #d31201)" }}>
              <span className="material-symbols-outlined text-white text-[15px] filled">account_balance</span>
            </div>
            <span className="font-display font-extrabold text-on-surface text-sm tracking-tight">BNETS</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-8 h-8 flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-low rounded-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Settlement date */}
        <div className="px-4 py-3 border-b border-outline-variant shrink-0">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1.5">Settlement Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 rounded-sm text-sm text-on-surface font-mono border border-outline-variant bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-2">
          <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Dashboard</p>
          {MAIN_NAV.map(({ icon, label }) => navItem(label, icon))}

          {(isAdmin || isOperator) && (
            <>
              <p className="px-4 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Operations</p>
              {OPS_NAV.map(({ icon, label }) => navItem(label, icon))}
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-outline-variant shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm flex items-center justify-center text-white text-xs font-bold uppercase shrink-0"
              style={{ background: "linear-gradient(135deg, #a60b00, #d31201)" }}>
              {user?.username?.slice(0, 1)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-on-surface text-xs font-bold truncate">{user?.username}</div>
              <div className="text-outline text-[10px] uppercase tracking-wide">{user?.role}</div>
            </div>
            <button onClick={logout} title="Sign out"
              className="text-outline hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Page title bar ── */}
      <div className="bg-white border-b border-outline-variant px-6 py-3">
        <h1 className="font-display font-extrabold text-on-surface text-lg tracking-tight leading-none">{activeNav}</h1>
        <p className="text-outline text-[11px] mt-0.5 tracking-wide">
          Settlement date: <span className="font-mono font-semibold text-on-surface-variant">{selectedDate}</span>
        </p>
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 px-6 py-6 max-w-screen-2xl w-full mx-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-20 text-outline text-sm gap-2">
            <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
            Loading...
          </div>
        )}
        {isError && (
          <div className="flex items-center gap-2 bg-error-light text-error text-sm px-4 py-3 rounded-sm border border-error/20">
            <span className="material-symbols-outlined text-base">error</span>
            Error loading status: {(error as Error).message}
          </div>
        )}

        {activeNav === "Overview" && data && (
          <div className="flex flex-col gap-5">
            <SummaryCard
              totalTransactions={data.total_transactions}
              totalDebit={data.total_debit}
              totalCredit={data.total_credit}
              status={data.status}
            />
            <div className="grid grid-cols-3 gap-5">
              <div className="col-span-2 flex flex-col gap-5">
                <ValidationChecks checks={data.validation_results} />
                <ProcessLogs logs={data.process_logs} />
                <ReportExport eodDate={selectedDate} />
              </div>
              <div className="flex flex-col gap-5">
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
  );
}
