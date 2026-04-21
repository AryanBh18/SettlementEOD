import type { BankPosition } from "../api/client";

interface Props {
  positions: BankPosition[];
}

export default function BankPositionsTable({ positions }: Props) {
  const fmt = (v: string) => parseFloat(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const initials = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="bg-white rounded-xl border border-[--color-outline-variant] shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[--color-outline-variant]">
        <span className="material-symbols-outlined text-[--color-outline]">account_balance</span>
        <h3 className="font-display font-semibold text-[--color-on-surface] text-base">Clearing Positions</h3>
      </div>
      {positions.length === 0 ? (
        <p className="text-[--color-outline] text-sm px-6 py-8 text-center">No clearing results yet</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[--color-surface-low]">
              <th className="text-left px-6 py-3 text-[10px] font-semibold text-[--color-on-surface-variant] uppercase tracking-wider">Institution</th>
              <th className="text-right px-6 py-3 text-[10px] font-semibold text-[--color-on-surface-variant] uppercase tracking-wider">As Acquirer (Incoming)</th>
              <th className="text-right px-6 py-3 text-[10px] font-semibold text-[--color-on-surface-variant] uppercase tracking-wider">As Issuer (Outgoing)</th>
              <th className="text-right px-6 py-3 text-[10px] font-semibold text-[--color-on-surface-variant] uppercase tracking-wider">Net Position</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[--color-surface-container]">
            {positions.map((p) => {
              const net = parseFloat(p.net_position);
              return (
                <tr key={p.bank_id} className="hover:bg-[--color-surface-low] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: "linear-gradient(135deg, #0046c3, #0035a0)" }}>
                        {initials(p.bank_name)}
                      </div>
                      <div>
                        <div className="font-semibold text-[--color-on-surface]">{p.bank_code}</div>
                        <div className="text-[--color-outline] text-xs">{p.bank_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-[--color-on-surface]">{fmt(p.total_incoming)}</td>
                  <td className="px-6 py-4 text-right font-mono text-[--color-on-surface]">{fmt(p.total_outgoing)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-mono font-bold text-sm ${net > 0 ? "text-[--color-tertiary]" : net < 0 ? "text-[--color-primary]" : "text-[--color-on-surface-variant]"}`}>
                      {net > 0 ? "+" : ""}{fmt(p.net_position)}
                    </span>
                    {net !== 0 && (
                      <span className={`ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${net > 0 ? "bg-[--color-tertiary-light] text-[--color-tertiary]" : "bg-[--color-primary-light] text-[--color-primary]"}`}>
                        {net > 0 ? "CR" : "DR"}
                      </span>
                    )}
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
