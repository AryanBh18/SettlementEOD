import { useState, useEffect } from "react";
import { getBankStatements, getBankStatementPdfUrl, type BankStatementsList } from "../api/client";

interface Props { eodDate: string; refreshKey: number; }

export default function BankStatementView({ eodDate, refreshKey }: Props) {
  const [data, setData] = useState<BankStatementsList | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedBank, setExpandedBank] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try { const res = await getBankStatements(eodDate); setData(res); }
      catch { setData(null); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [eodDate, refreshKey]);

  const fmt = (v: string) => parseFloat(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  async function downloadPdf(bankCode: string, bankName: string) {
    setDownloadError(null);
    try {
      const token = sessionStorage.getItem("token");
      const url = getBankStatementPdfUrl(eodDate, bankCode);
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token ?? ""}` } });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `settlement_statement_${bankCode}_${eodDate}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      setDownloadError(
        `Failed to download PDF for ${bankName}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  const initials = (name: string) =>
    name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();

  return (
    <div className="bg-white border border-outline-variant shadow-[0_40px_40px_rgba(25,28,29,0.04)] overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-outline-variant">
        <span className="material-symbols-outlined text-outline">receipt_long</span>
        <h3 className="font-display font-bold text-on-surface text-sm uppercase tracking-widest">Per-Bank Clearing &amp; Settlement Statements</h3>
        {data && (
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 bg-surface-container text-on-surface-variant uppercase tracking-widest">
            {data.total_banks} banks
          </span>
        )}
      </div>
      {loading && <p className="text-outline text-sm px-6 py-10 text-center">Loading bank statements...</p>}
      {!loading && (!data || data.statements.length === 0) && (
        <p className="text-outline text-sm px-6 py-10 text-center">No statement data available</p>
      )}
      {downloadError && (
        <div className="flex items-center gap-2 bg-error-light text-error text-xs px-6 py-2.5 border-b border-error/20">
          <span className="material-symbols-outlined text-sm">error</span>
          {downloadError}
        </div>
      )}
      {!loading && data && data.statements.length > 0 && (
        <div className="divide-y divide-outline-variant/30">
          {data.statements.map((s, idx) => {
            const net = parseFloat(s.net_position);
            const isExpanded = expandedBank === s.bank_id;
            return (
              <div key={s.bank_id} className={idx % 2 === 0 ? "bg-white" : "bg-surface-container-lowest"}>
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-primary-light/20 transition-colors"
                  onClick={() => setExpandedBank(isExpanded ? null : s.bank_id)}>
                  <div className="w-9 h-9 rounded-sm flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: "linear-gradient(135deg, #0046c3, #0035a0)" }}>
                    {initials(s.bank_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-on-surface text-xs tracking-wide uppercase">{s.bank_code}</div>
                    <div className="text-outline text-[11px]">{s.bank_name}</div>
                  </div>
                  <div className="flex items-center gap-5 text-xs font-mono">
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-0.5">DR</div>
                      <div className="font-bold text-primary">{fmt(s.total_debit)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-0.5">CR</div>
                      <div className="font-bold text-tertiary">{fmt(s.total_credit)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-0.5">NET</div>
                      <div className={`font-extrabold ${net > 0 ? "text-tertiary" : net < 0 ? "text-primary" : "text-on-surface-variant"}`}>
                        {net > 0 ? "+" : ""}{fmt(s.net_position)}
                      </div>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); downloadPdf(s.bank_code, s.bank_name); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest text-primary bg-primary-light hover:bg-primary/10 transition-colors"
                    title={`Download PDF for ${s.bank_code}`}>
                    <span className="material-symbols-outlined text-sm">picture_as_pdf</span>PDF
                  </button>
                  <span className="material-symbols-outlined text-outline text-base">{isExpanded ? "expand_less" : "expand_more"}</span>
                </div>
                {isExpanded && (
                  <div className="border-t border-outline-variant/40 bg-surface">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-surface-container border-b border-outline-variant/40">
                          <th className="text-left px-6 py-2.5 font-bold text-on-surface-variant uppercase tracking-widest text-[10px]">Counterparty</th>
                          <th className="text-right px-6 py-2.5 font-bold text-on-surface-variant uppercase tracking-widest text-[10px]">Gross Payable</th>
                          <th className="text-right px-6 py-2.5 font-bold text-on-surface-variant uppercase tracking-widest text-[10px]">Gross Receivable</th>
                          <th className="text-right px-6 py-2.5 font-bold text-on-surface-variant uppercase tracking-widest text-[10px]">Net</th>
                          <th className="text-left px-6 py-2.5 font-bold text-on-surface-variant uppercase tracking-widest text-[10px]">Direction</th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.breakdown.map((b, bi) => (
                          <tr key={b.bank_id}
                            className={`border-b border-outline-variant/20 hover:bg-white transition-colors ${bi % 2 === 0 ? "bg-surface" : "bg-surface-container-lowest"}`}>
                            <td className="px-6 py-2.5">
                              <span className="font-bold text-on-surface tracking-wide">{b.bank_code}</span>
                              <span className="text-outline ml-2 text-[10px]">{b.bank_name}</span>
                            </td>
                            <td className="px-6 py-2.5 text-right font-mono text-on-surface">{fmt(b.gross_payable)}</td>
                            <td className="px-6 py-2.5 text-right font-mono text-on-surface">{fmt(b.gross_receivable)}</td>
                            <td className="px-6 py-2.5 text-right font-mono font-bold text-on-surface">{fmt(b.net_amount)}</td>
                            <td className="px-6 py-2.5">
                              {b.net_direction === "ZERO" ? <span className="text-outline">Even</span>
                               : b.net_direction === "PAY" ? <span className="text-primary font-bold uppercase tracking-wide text-[10px]">Pay</span>
                               : <span className="text-tertiary font-bold uppercase tracking-wide text-[10px]">Receive</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
