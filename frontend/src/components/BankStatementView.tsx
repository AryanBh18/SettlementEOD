import { useState, useEffect } from "react";
import { getBankStatements, getBankStatementPdfUrl, type BankStatementsList } from "../api/client";

interface Props { eodDate: string; refreshKey: number; }

export default function BankStatementView({ eodDate, refreshKey }: Props) {
  const [data, setData] = useState<BankStatementsList | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedBank, setExpandedBank] = useState<number | null>(null);

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

  function downloadPdf(bankCode: string, bankName: string) {
    const token = sessionStorage.getItem("token");
    const url = getBankStatementPdfUrl(eodDate, bankCode);
    fetch(url, { headers: { Authorization: `Bearer ${token ?? ""}` } })
      .then((res) => { if (!res.ok) throw new Error("Download failed"); return res.blob(); })
      .then((blob) => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `settlement_statement_${bankCode}_${eodDate}.pdf`; a.click(); URL.revokeObjectURL(a.href); })
      .catch(() => alert(`Failed to download PDF for ${bankName}`));
  }

  const initials = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="bg-white rounded-xl border border-[--color-outline-variant] shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[--color-outline-variant]">
        <span className="material-symbols-outlined text-[--color-outline]">receipt_long</span>
        <h3 className="font-display font-semibold text-[--color-on-surface] text-base">Per-Bank Clearing &amp; Settlement Statements</h3>
        {data && <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-[--color-surface-container] text-[--color-on-surface-variant]">{data.total_banks} banks</span>}
      </div>
      {loading && <p className="text-[--color-outline] text-sm px-6 py-8 text-center">Loading bank statements...</p>}
      {!loading && (!data || data.statements.length === 0) && (
        <p className="text-[--color-outline] text-sm px-6 py-8 text-center">No statement data available</p>
      )}
      {!loading && data && data.statements.length > 0 && (
        <div className="divide-y divide-[--color-surface-container]">
          {data.statements.map((s) => {
            const net = parseFloat(s.net_position);
            const isExpanded = expandedBank === s.bank_id;
            return (
              <div key={s.bank_id}>
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-[--color-surface-low] transition-colors"
                  onClick={() => setExpandedBank(isExpanded ? null : s.bank_id)}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: "linear-gradient(135deg, #0046c3, #0035a0)" }}>
                    {initials(s.bank_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[--color-on-surface] text-sm">{s.bank_code}</div>
                    <div className="text-[--color-outline] text-xs">{s.bank_name}</div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-[--color-primary]">DR {fmt(s.total_debit)}</span>
                    <span className="text-[--color-tertiary]">CR {fmt(s.total_credit)}</span>
                    <span className={`font-bold ${net > 0 ? "text-[--color-tertiary]" : net < 0 ? "text-[--color-primary]" : "text-[--color-on-surface-variant]"}`}>
                      Net {net > 0 ? "+" : ""}{fmt(s.net_position)}
                    </span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); downloadPdf(s.bank_code, s.bank_name); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[--color-primary] bg-[--color-primary-light] hover:bg-[--color-primary]/10 transition-colors"
                    title={`Download PDF for ${s.bank_code}`}>
                    <span className="material-symbols-outlined text-sm">picture_as_pdf</span>PDF
                  </button>
                  <span className="material-symbols-outlined text-[--color-outline] text-base">{isExpanded ? "expand_less" : "expand_more"}</span>
                </div>
                {isExpanded && (
                  <div className="border-t border-[--color-surface-container] bg-[--color-surface-low]">
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          <th className="text-left px-6 py-2 font-semibold text-[--color-on-surface-variant] uppercase tracking-wider text-[10px]">Counterparty</th>
                          <th className="text-right px-6 py-2 font-semibold text-[--color-on-surface-variant] uppercase tracking-wider text-[10px]">Gross Payable</th>
                          <th className="text-right px-6 py-2 font-semibold text-[--color-on-surface-variant] uppercase tracking-wider text-[10px]">Gross Receivable</th>
                          <th className="text-right px-6 py-2 font-semibold text-[--color-on-surface-variant] uppercase tracking-wider text-[10px]">Net</th>
                          <th className="text-left px-6 py-2 font-semibold text-[--color-on-surface-variant] uppercase tracking-wider text-[10px]">Direction</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[--color-surface-container]">
                        {s.breakdown.map((b) => (
                          <tr key={b.bank_id} className="hover:bg-white transition-colors">
                            <td className="px-6 py-2.5">
                              <span className="font-semibold text-[--color-on-surface]">{b.bank_code}</span>
                              <span className="text-[--color-outline] ml-2">{b.bank_name}</span>
                            </td>
                            <td className="px-6 py-2.5 text-right font-mono text-[--color-on-surface]">{fmt(b.gross_payable)}</td>
                            <td className="px-6 py-2.5 text-right font-mono text-[--color-on-surface]">{fmt(b.gross_receivable)}</td>
                            <td className="px-6 py-2.5 text-right font-mono font-semibold text-[--color-on-surface]">{fmt(b.net_amount)}</td>
                            <td className="px-6 py-2.5">
                              {b.net_direction === "ZERO" ? <span className="text-[--color-outline]">Even</span>
                               : b.net_direction === "PAY" ? <span className="text-[--color-primary] font-bold">PAY</span>
                               : <span className="text-[--color-tertiary] font-bold">RECEIVE</span>}
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

