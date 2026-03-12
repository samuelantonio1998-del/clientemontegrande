import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Transaction } from "@/pages/Index";

interface PointsBalanceProps {
  points: number;
  transactions: Transaction[];
}

const PointsBalance = ({ points, transactions }: PointsBalanceProps) => {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLanguage();
  const visible = expanded ? transactions : transactions.slice(0, 4);

  return (
    <section className="mx-6 mt-0 border border-t-0 border-border p-6 bg-card">
      <h2 className="font-display text-lg mb-2 text-foreground">
        {t.points as string}
      </h2>

      <div className="mb-8">
        <span className="font-display text-7xl leading-none text-foreground">
          {points}
        </span>
        <span className="text-sm text-muted-foreground ml-2 tracking-wide">
          {t.pts as string}
        </span>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
          {t.history as string}
        </h3>

        <div className="space-y-0">
          {visible.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between py-3 border-b border-border text-sm"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-foreground">{tx.description}</span>
                <span className="text-muted-foreground text-xs">{tx.date}</span>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                {tx.type === "points" ? (
                  <>
                    <span className="text-foreground">{tx.amount.toFixed(2)}€</span>
                    <span className="text-primary font-semibold">+{tx.points} {t.pts as string}</span>
                  </>
                ) : (
                  <span className="text-primary font-semibold">{t.meal as string}</span>
                )}
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <p className="text-muted-foreground py-3 text-sm">{t.noTransactions as string}</p>
          )}
        </div>

        {!expanded && transactions.length > 4 && (
          <button
            onClick={() => setExpanded(true)}
            className="w-full flex justify-center pt-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Ver mais"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        )}
      </div>
    </section>
  );
};

export default PointsBalance;
