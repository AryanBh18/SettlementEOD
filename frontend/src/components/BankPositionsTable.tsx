import type { BankPosition } from "../api/client";

interface Props {
  positions: BankPosition[];
}

export default function BankPositionsTable({ positions }: Props) {
  const fmt = (v: string) => parseFloat(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const initials = (name: string) => name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();

  return (
    <div className="bg-white border border-outline-variant shadow-[0_40px_40px_rgba(25,28,29,0.04)] overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-outline-variant">
        <span className="material-symbols-outlined text-outline">account_balance</span>
        <h3 className="font-display font-bold text-on-surface text-sm uppercase tracking-widest">Clearing Positions</h3>
        {positions.length > 0 && (
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 bg-surface-container text-on-surface-variant uppercase tracking-widest">
            {positions.length} banks
          </span>
        )}
      </div>
      {positions.length === 0 ? (
        <p className="text-outline text-sm px-6 py-10 text-center">No clearing results yet. Run EOD to populate positions.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface border-b border-outline-variant">
              <th className="text-left px-6 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Institution</th>
              <th className="text-right px-6 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">As Acquirer (Incoming)</th>
              <th className="text-right px-6 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">As Issuer (Outgoing)</th>
              <th className="text-right px-6 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Net Position</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p, i) => {
              const net = parseFloat(p.net_position);
              return (
                <tr key={p.bank_id}
                  className={`border-b border-outline-variant/40 transition-colors hover:bg-primary-light/30 ${i % 2 === 0 ? "bg-white" : "bg-surface-container-lowest"}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-sm flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: "linear-gradient(135deg, #0046c3, #0035a0)" }}>
                        {initials(p.bank_name)}
                      </div>
                      <div>
                        <div className="font-bold text-on-surface text-xs tracking-wide">{p.bank_code}</div>
                        <div className="text-outline text-[11px]">{p.bank_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-on-surface text-xs">{fmt(p.total_incoming)}</td>
                  <td className="px-6 py-4 text-right font-mono text-on-surface text-xs">{fmt(p.total_outgoing)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-mono font-bold text-sm ${net > 0 ? "text-tertiary" : net < 0 ? "text-primary" : "text-on-surface-variant"}`}>
                      {net > 0 ? "+" : ""}{fmt(p.net_position)}
                    </span>
                    {net !== 0 && (
                      <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${net > 0 ? "bg-tertiary-light text-tertiary" : "bg-primary-light text-primary"}`}>
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
