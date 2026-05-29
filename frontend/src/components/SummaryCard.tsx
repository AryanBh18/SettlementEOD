interface Props {
  totalTransactions: number;
  totalDebit: string;
  totalCredit: string;
  status: string;
}

interface StatCardProps {
  label: string;
  value: string;
  valueClass?: string;
  accentColor: string;
  icon: string;
}

function StatCard({ label, value, valueClass, accentColor, icon }: StatCardProps) {
  return (
    <div className="relative overflow-hidden bg-white border border-outline-variant shadow-[0_40px_40px_rgba(25,28,29,0.04)]">
      <div className="h-0.5 w-full" style={{ background: accentColor }} />
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</span>
          <span className="material-symbols-outlined text-[18px] text-outline">{icon}</span>
        </div>
        <div className={`font-headline font-extrabold text-3xl tabular-nums leading-none ${valueClass ?? "text-on-surface"}`}>
          {value}
        </div>
      </div>
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
      <StatCard
        label="Transactions"
        value={String(totalTransactions)}
        accentColor="#74777b"
        icon="receipt_long"
      />
      <StatCard
        label="Total Debit (DR)"
        value={fmt(totalDebit)}
        valueClass="text-primary"
        accentColor="#a60b00"
        icon="arrow_upward"
      />
      <StatCard
        label="Total Credit (CR)"
        value={fmt(totalCredit)}
        valueClass="text-tertiary"
        accentColor="#0046c3"
        icon="arrow_downward"
      />
      <StatCard
        label="Settlement Balance"
        value={balanced ? "BALANCED" : "UNBALANCED"}
        valueClass={balanced ? "text-success text-2xl" : "text-error text-2xl"}
        accentColor={balanced ? "#1a7f4b" : "#a60b00"}
        icon={balanced ? "verified" : "warning"}
      />
    </div>
  );
}
