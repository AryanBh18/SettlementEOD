import axios from "axios";

const API_BASE = "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Auth interceptor — attach JWT token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export interface BankPosition {
  bank_id: number;
  bank_code: string;
  bank_name: string;
  total_incoming: string;
  total_outgoing: string;
  net_position: string;
}

export interface ValidationCheck {
  check_name: string;
  status: string;
  message: string | null;
}

export interface ProcessLog {
  id: number;
  process_name: string;
  status: string;
  message: string | null;
  eod_date: string;
  created_at: string;
}

export interface FileInfo {
  file_name: string;
  total_debit: string;
  total_credit: string;
  eod_date: string;
  status: string;
  created_at: string;
}

export interface EODRunResponse {
  eod_date: string;
  status: string;
  total_transactions: number;
  total_debit: string;
  total_credit: string;
  bank_positions: BankPosition[];
  validation_results: ValidationCheck[];
  file_info: FileInfo | null;
}

export interface EODStatusResponse extends EODRunResponse {
  process_logs: ProcessLog[];
}

export interface TransactionItem {
  id: number;
  reference: string | null;
  source_bank_code: string;
  source_bank_name: string;
  destination_bank_code: string;
  destination_bank_name: string;
  amount: string;
  status: string;
  transaction_type: string;
  transaction_date: string;
  created_at: string;
}

export interface AuditLogItem {
  id: number;
  user_id: number | null;
  action: string;
  resource: string | null;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface UploadResult {
  imported: number;
  skipped_duplicates: number;
  total_processed: number;
  errors: { row: number; message: string }[];
}

// --- Simulation ---
export interface SimulationResult {
  date: string;
  inserted: number;
  skipped: number;
  total_requested: number;
}

// --- Cutoff ---
export interface CutoffStatus {
  id: number;
  settlement_date: string;
  cutoff_timestamp: string;
  status: string;
  message: string | null;
}

// --- Bilateral Settlement ---
export interface BilateralSettlementItem {
  bank_a_id: number;
  bank_a_code: string;
  bank_a_name: string;
  bank_b_id: number;
  bank_b_code: string;
  bank_b_name: string;
  bank_a_owes_b: string;
  bank_b_owes_a: string;
  net_amount: string;
  net_direction: string;
}

export interface BilateralSettlementList {
  settlement_date: string;
  total_pairs: number;
  settlements: BilateralSettlementItem[];
}

export interface CounterpartyBreakdown {
  bank_id: number;
  bank_code: string;
  bank_name: string;
  gross_payable: string;
  gross_receivable: string;
  net_amount: string;
  net_direction: string;
}

export interface BankStatementItem {
  bank_id: number;
  bank_code: string;
  bank_name: string;
  total_debit: string;
  total_credit: string;
  net_position: string;
  breakdown: CounterpartyBreakdown[];
}

export interface BankStatementsList {
  settlement_date: string;
  total_banks: number;
  statements: BankStatementItem[];
}

// --- Auth ---
export async function login(username: string, password: string): Promise<{ access_token: string; token_type: string }> {
  const res = await api.post("/auth/login", { username, password });
  return res.data;
}

export async function getMe(): Promise<{ id: number; username: string; email: string | null; role: string }> {
  const res = await api.get("/auth/me");
  return res.data;
}

// --- EOD ---
export async function runEOD(eod_date: string, force_rerun: boolean = false, max_retries: number = 0): Promise<EODRunResponse> {
  const res = await api.post("/eod/run", { eod_date, force_rerun, max_retries });
  return res.data;
}

export async function getEODStatus(eod_date: string): Promise<EODStatusResponse> {
  const res = await api.get(`/eod/status/${eod_date}`);
  return res.data;
}

export function getFileDownloadUrl(eod_date: string): string {
  return `${API_BASE}/eod/files/${eod_date}`;
}

export function getReportDownloadUrl(eod_date: string): string {
  return `${API_BASE}/eod/report/${eod_date}`;
}

// --- Transactions ---
export async function getTransactions(eod_date: string): Promise<TransactionItem[]> {
  const res = await api.get(`/transactions/${eod_date}`);
  return res.data;
}

// --- Upload ---
export async function uploadCSV(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/upload/csv", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

// --- Audit ---
export async function getAuditLogs(params?: { limit?: number; action?: string }): Promise<AuditLogItem[]> {
  const res = await api.get("/audit/logs", { params });
  return res.data;
}

// --- Simulation ---
export async function simulateTransactions(count: number, target_date: string): Promise<SimulationResult> {
  const res = await api.post("/simulation/generate", { count, target_date });
  return res.data;
}

// --- Cutoff ---
export async function triggerCutoff(settlement_date: string): Promise<CutoffStatus> {
  const res = await api.post("/cutoff/trigger", { settlement_date });
  return res.data;
}

export async function getCutoffStatus(settlement_date: string): Promise<CutoffStatus | null> {
  const res = await api.get(`/cutoff/status/${settlement_date}`);
  return res.data;
}

// --- Bilateral Settlements ---
export async function getBilateralSettlements(eod_date: string): Promise<BilateralSettlementList> {
  const res = await api.get(`/eod/bilateral/${eod_date}`);
  return res.data;
}

export async function getBankStatements(eod_date: string): Promise<BankStatementsList> {
  const res = await api.get(`/eod/statements/${eod_date}`);
  return res.data;
}

export async function getBankStatement(eod_date: string, bank_code: string): Promise<BankStatementItem> {
  const res = await api.get(`/eod/statements/${eod_date}/${bank_code}`);
  return res.data;
}

export function getBankStatementPdfUrl(eod_date: string, bank_code: string): string {
  return `${API_BASE}/eod/statements/${eod_date}/${bank_code}/pdf`;
}

export default api;
