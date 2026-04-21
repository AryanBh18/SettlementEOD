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
    <div className="bg-white rounded-xl border border-[--color-outline-variant] shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[--color-outline-variant]">
        <span className="material-symbols-outlined text-[--color-outline]">swap_horiz</span>
        <h3 className="font-display font-semibold text-[--color-on-surface] text-base">Bilateral Netting</h3>
        {data && <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-[--color-surface-container] text-[--color-on-surface-variant]">{data.total_pairs} pairs</span>}
      </div>
      {loading && <p className="text-[--color-outline] text-sm px-6 py-8 text-center">Loading...</p>}
      {!loading && (!data || data.settlements.length === 0) && (
        <p className="text-[--color-outline] text-sm px-6 py-8 text-center">No bilateral netting data available</p>
      )}
      {!loading && data && data.settlements.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[--color-surface-low]">
              <th className="text-left px-6 py-3 text-[10px] font-semibold text-[--color-on-surface-variant] uppercase tracking-wider">Bank A</th>
              <th className="text-left px-6 py-3 text-[10px] font-semibold text-[--color-on-surface-variant] uppercase tracking-wider">Bank B</th>
              <th className="text-right px-6 py-3 text-[10px] font-semibold text-[--color-on-surface-variant] uppercase tracking-wider">A Owes B</th>
              <th className="text-right px-6 py-3 text-[10px] font-semibold text-[--color-on-surface-variant] uppercase tracking-wider">B Owes A</th>
              <th className="text-right px-6 py-3 text-[10px] font-semibold text-[--color-on-surface-variant] uppercase tracking-wider">Net Amount</th>
              <th className="text-left px-6 py-3 text-[10px] font-semibold text-[--color-on-surface-variant] uppercase tracking-wider">Net Direction</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[--color-surface-container]">
            {data.settlements.map((s, i) => {
              const net = parseFloat(s.net_amount);
              return (
                <tr key={i} className="hover:bg-[--color-surface-low] transition-colors">
                  <td className="px-6 py-3">
                    <div className="font-semibold text-[--color-on-surface] text-xs">{s.bank_a_code}</div>
                    <div className="text-[--color-outline] text-[10px]">{s.bank_a_name}</div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="font-semibold text-[--color-on-surface] text-xs">{s.bank_b_code}</div>
                    <div className="text-[--color-outline] text-[10px]">{s.bank_b_name}</div>
                  </td>
                  <td className="px-6 py-3 text-right font-mono text-xs text-[--color-on-surface]">{fmt(s.bank_a_owes_b)}</td>
                  <td className="px-6 py-3 text-right font-mono text-xs text-[--color-on-surface]">{fmt(s.bank_b_owes_a)}</td>
                  <td className={`px-6 py-3 text-right font-mono font-bold text-xs ${net > 0 ? "text-[--color-tertiary]" : "text-[--color-on-surface-variant]"}`}>{fmt(s.net_amount)}</td>
                  <td className="px-6 py-3 text-xs text-[--color-on-surface-variant]">
                    {s.net_direction === "ZERO" ? <span className="text-[--color-outline]">Even</span>
                     : s.net_direction === "A_TO_B" ? <span className="font-semibold">{s.bank_a_code} → {s.bank_b_code}</span>
                     : <span className="font-semibold">{s.bank_b_code} → {s.bank_a_code}</span>}
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
