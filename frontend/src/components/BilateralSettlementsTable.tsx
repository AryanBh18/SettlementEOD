import { useState, useEffect } from "react";
import { getBilateralSettlements, type BilateralSettlementList } from "../api/client";

interface Props { eodDate: string; refreshKey: number; }

export default function BilateralSettlementsTable({ eodDate, refreshKey }: Props) {
  const [data, setData] = useState<BilateralSettlementList | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try { const res = await getBilateralSettlements(eodDate); setData(res); }
      catch { setData(null); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [eodDate, refreshKey]);

  const fmt = (v: string) => parseFloat(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="bg-white border border-outline-variant shadow-[0_40px_40px_rgba(25,28,29,0.04)] overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-outline-variant">
        <span className="material-symbols-outlined text-outline">swap_horiz</span>
        <h3 className="font-display font-bold text-on-surface text-sm uppercase tracking-widest">Bilateral Netting</h3>
        {data && (
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 bg-surface-container text-on-surface-variant uppercase tracking-widest">
            {data.total_pairs} pairs
          </span>
        )}
      </div>
      {loading && <p className="text-outline text-sm px-6 py-10 text-center">Loading bilateral settlements...</p>}
      {!loading && (!data || data.settlements.length === 0) && (
        <p className="text-outline text-sm px-6 py-10 text-center">No bilateral netting data available</p>
      )}
      {!loading && data && data.settlements.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface border-b border-outline-variant">
              <th className="text-left px-6 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Bank A</th>
              <th className="text-left px-6 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Bank B</th>
              <th className="text-right px-6 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">A Owes B</th>
              <th className="text-right px-6 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">B Owes A</th>
              <th className="text-right px-6 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Net Amount</th>
              <th className="text-left px-6 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Direction</th>
            </tr>
          </thead>
          <tbody>
            {data.settlements.map((s, i) => {
              const net = parseFloat(s.net_amount);
              return (
                <tr key={i}
                  className={`border-b border-outline-variant/40 transition-colors hover:bg-primary-light/30 ${i % 2 === 0 ? "bg-white" : "bg-surface-container-lowest"}`}>
                  <td className="px-6 py-3">
                    <div className="font-bold text-on-surface text-xs tracking-wide">{s.bank_a_code}</div>
                    <div className="text-outline text-[10px]">{s.bank_a_name}</div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="font-bold text-on-surface text-xs tracking-wide">{s.bank_b_code}</div>
                    <div className="text-outline text-[10px]">{s.bank_b_name}</div>
                  </td>
                  <td className="px-6 py-3 text-right font-mono text-xs text-on-surface">{fmt(s.bank_a_owes_b)}</td>
                  <td className="px-6 py-3 text-right font-mono text-xs text-on-surface">{fmt(s.bank_b_owes_a)}</td>
                  <td className={`px-6 py-3 text-right font-mono font-bold text-xs ${net > 0 ? "text-tertiary" : "text-on-surface-variant"}`}>
                    {fmt(s.net_amount)}
                  </td>
                  <td className="px-6 py-3 text-xs text-on-surface-variant">
                    {s.net_direction === "ZERO"
                      ? <span className="text-outline font-semibold">Even</span>
                      : s.net_direction === "A_TO_B"
                      ? <span className="font-bold text-primary">{s.bank_a_code} → {s.bank_b_code}</span>
                      : <span className="font-bold text-primary">{s.bank_b_code} → {s.bank_a_code}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
