import { useState, useEffect } from "react";
import { MoreHorizontal, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import ReviewDialog from "@/components/ReviewDialog";
import type { Transaction } from "@/pages/Index";

interface PointsBalanceProps {
  points: number;
  transactions: Transaction[];
}

const PointsBalance = ({ points, transactions }: PointsBalanceProps) => {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLanguage();
  const visible = expanded ? transactions : transactions.slice(0, 4);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [reviewTxId, setReviewTxId] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviewed = async () => {
      const ids = transactions.map((tx) => tx.id);
      if (ids.length === 0) return;
      const { data } = await supabase
        .from("reviews")
        .select("transaction_id")
        .in("transaction_id", ids);
      if (data) {
        setReviewedIds(new Set(data.map((r: any) => r.transaction_id)));
      }
    };
    fetchReviewed();
  }, [transactions]);

  const handleReviewSubmitted = () => {
    if (reviewTxId) {
      setReviewedIds((prev) => new Set([...prev, reviewTxId]));
    }
  };

  return (
    <section className="mx-4 sm:mx-[100px] mt-0 border border-t-0 border-border p-6 bg-card">
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

        <div className="space-y-0 overflow-hidden">
          {visible.map((tx) => {
            const isReviewed = reviewedIds.has(tx.id);
            return (
              <div
                key={tx.id}
                className="flex items-center justify-between py-3 border-b border-border text-sm gap-3 min-w-0"
              >
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span className="text-foreground truncate">{tx.description}</span>
                  <span className="text-muted-foreground text-xs">{tx.date}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
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
                  {isReviewed ? (
                    <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <button
                      onClick={() => setReviewTxId(tx.id)}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors shrink-0 underline underline-offset-2"
                    >
                      {t.rate as string}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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

      <ReviewDialog
        open={!!reviewTxId}
        onClose={() => setReviewTxId(null)}
        transactionId={reviewTxId || ""}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </section>
  );
};

export default PointsBalance;
