import axios from "axios";

const API_BASE = "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

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
  transaction_date: string;
  created_at: string;
}

export async function runEOD(eod_date: string, force_rerun: boolean = false): Promise<EODRunResponse> {
  const res = await api.post("/eod/run", { eod_date, force_rerun });
  return res.data;
}

export async function getEODStatus(eod_date: string): Promise<EODStatusResponse> {
  const res = await api.get(`/eod/status/${eod_date}`);
  return res.data;
}

export function getFileDownloadUrl(eod_date: string): string {
  return `${API_BASE}/eod/files/${eod_date}`;
}

export async function getTransactions(eod_date: string): Promise<TransactionItem[]> {
  const res = await api.get(`/transactions/${eod_date}`);
  return res.data;
}

export default api;
