import type { Transaction } from "@/pages/Index";

interface PointsBalanceProps {
  points: number;
  transactions: Transaction[];
}

const PointsBalance = ({ points, transactions }: PointsBalanceProps) => {
  return (
    <section className="mx-6 mt-0 border-2 border-t-0 border-foreground p-6 bg-card">
      <h2 className="font-display text-sm uppercase tracking-[0.2em] mb-2 text-foreground">
        Pontos
      </h2>

      <div className="mb-8">
        <span className="font-display text-8xl leading-none text-foreground">
          {points}
        </span>
        <span className="font-mono text-xs text-muted-foreground ml-2 uppercase tracking-wider">
          pts
        </span>
      </div>

      <div className="border-t-2 border-foreground pt-4">
        <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
          Histórico
        </h3>

        <div className="space-y-0">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between py-3 border-b border-border font-mono text-xs"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-foreground">{tx.description}</span>
                <span className="text-muted-foreground">{tx.date}</span>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-foreground">{tx.amount.toFixed(2)}€</span>
                <span className="text-signal-orange font-bold">+{tx.points} pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PointsBalance;
