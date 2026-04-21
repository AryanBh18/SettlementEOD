interface Props {
  totalTransactions: number;
  totalDebit: string;
  totalCredit: string;
  status: string;
}

function StatCard({ icon, label, value, valueClass, bgIcon }: { icon: string; label: string; value: string; valueClass?: string; bgIcon?: string }) {
  return (
    <div className="relative overflow-hidden bg-white rounded-xl p-5 border border-[--color-outline-variant] shadow-sm">
      {bgIcon && (
        <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-7xl text-[--color-surface-container] select-none filled">{bgIcon}</span>
      )}
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-[--color-outline] text-base">{icon}</span>
        <span className="text-[--color-on-surface-variant] text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className={`font-display font-bold text-2xl tabular-nums ${valueClass ?? 'text-[--color-on-surface]'}`}>{value}</div>
    </div>
  );
}

export default function SummaryCard({ totalTransactions, totalDebit, totalCredit }: Props) {
  const fmt = (v: string) =>
    parseFloat(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const debit = parseFloat(totalDebit);
  const credit = parseFloat(totalCredit);
  const balanced = Math.abs(debit - credit) < 0.001;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard icon="receipt_long" label="Transactions" value={String(totalTransactions)} bgIcon="receipt_long" />
      <StatCard icon="arrow_upward" label="Total Debit (DR)" value={fmt(totalDebit)} valueClass="text-[--color-primary]" bgIcon="arrow_upward" />
      <StatCard icon="arrow_downward" label="Total Credit (CR)" value={fmt(totalCredit)} valueClass="text-[--color-tertiary]" bgIcon="arrow_downward" />
      <StatCard
        icon={balanced ? "verified" : "warning"}
        label="Settlement Balance"
        value={balanced ? "BALANCED" : "UNBALANCED"}
        valueClass={balanced ? "text-[--color-success]" : "text-[--color-error]"}
        bgIcon={balanced ? "verified" : "warning"}
      />
    </div>
  );
}
