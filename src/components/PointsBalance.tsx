import { useState, useEffect } from "react";
import { MoreHorizontal, CheckCircle, Star, ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import ReviewDialog from "@/components/ReviewDialog";
import type { Transaction } from "@/pages/Index";

interface PointsBalanceProps {
  points: number;
  transactions: Transaction[];
  section: "summary" | "history";
}

const POINTS_GOAL = 200;

const PointsBalance = ({ points, transactions, section }: PointsBalanceProps) => {
  const [expanded, setExpanded] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
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

  // Translate known backend descriptions
  const translateDescription = (desc: string, type?: string): string => {
    if (type === "redeem_discount") return t.discountRedeemedDesc as string;
    if (type === "redeem_buffet") return t.buffetRedeemedDesc as string;
    // "Refeição X/4 (semana)" → translated
    const mealMatch = desc.match(/^Refeição (\d)\/4 \(semana\)$/);
    if (mealMatch) {
      return (t.mealDescription as (reached: boolean, n: number) => string)(false, parseInt(mealMatch[1]));
    }
    // "4ª refeição — desconto 10€ desbloqueado"
    if (desc.includes("4ª refeição")) {
      return (t.mealDescription as (reached: boolean, n: number) => string)(true, 4);
    }
    // "Refeição — pontos"
    if (desc === "Refeição — pontos") {
      return t.mealPointsDesc as string;
    }
    return desc;
  };

  if (section === "summary") {
    return (
      <section className="mt-5 relative">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-body text-xs uppercase text-accent">{t.points as string}</h2>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-bold text-[44px] leading-none">{points}</span>
            <span className="text-accent text-sm">{t.pts as string}</span>
          </div>
        </div>
        <div role="progressbar" aria-label={t.points as string} aria-valuenow={points} aria-valuemin={0} aria-valuemax={POINTS_GOAL} className="h-3 rounded-full bg-secondary/25 overflow-hidden">
          <div className="h-full rounded-full bg-accent transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${Math.min(points / POINTS_GOAL, 1) * 100}%` }} />
        </div>
        <p className="mt-3 text-[10.5px] uppercase tracking-[0.18em] leading-relaxed">
          {t.pointsGoalMsg as string} <span className="text-accent font-semibold">{t.pointsGoalDiscount as string}</span>
        </p>
      </section>
    );
  }

  return (
    <section className="mx-4 mt-4 rounded-2xl p-6 bg-card shadow-card">
      <div>
        <button
          type="button"
          onClick={() => setHistoryOpen((open) => !open)}
          aria-expanded={historyOpen}
          aria-controls="points-history-list"
          className="w-full flex items-center justify-between gap-3 py-2 text-left"
        >
          <span className="font-display text-lg text-foreground">{t.history as string}</span>
          <ChevronDown
            className={`w-5 h-5 shrink-0 text-muted-foreground transition-transform duration-300 ease-out ${historyOpen ? "rotate-180" : ""}`}
          />
        </button>

        <div
          id="points-history-list"
          className={`grid transition-all duration-300 ease-out ${historyOpen ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 mt-0"}`}
        >
          <div className="overflow-hidden">



        <div className="space-y-0 overflow-hidden">
          {visible.map((tx) => {
            const isRedeem = tx.type === "redeem_discount" || tx.type === "redeem_buffet";
            const isReviewed = reviewedIds.has(tx.id);
            return (
              <div
                key={tx.id}
                className="flex items-center py-3 border-b border-border text-sm gap-3 min-w-0"
              >
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span className="text-foreground truncate">{translateDescription(tx.description, tx.type)}</span>
                  <span className="text-muted-foreground text-xs">{tx.date}</span>
                </div>
                {!isRedeem && (isReviewed ? (
                  <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                ) : (
                  <button
                    onClick={() => setReviewTxId(tx.id)}
                    className="rounded-full border border-border px-4 py-2 bg-card flex items-center gap-2 hover:bg-muted transition-all duration-200 shrink-0 whitespace-nowrap"
                  >
                    <Star className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs uppercase tracking-widest text-foreground">
                      {t.rate as string} <span className="text-primary font-semibold">+5 {t.pts as string}</span>
                    </span>
                  </button>
                ))}
                <div className="flex flex-col items-end gap-0.5 shrink-0 ml-auto">
                    {tx.type === "points" ? (
                      <>
                        <span className="text-foreground">{tx.amount.toFixed(2)}€</span>
                        <span className="text-primary font-semibold">+{tx.points} {t.pts as string}</span>
                      </>
                    ) : tx.type === "redeem_discount" ? (
                      <span className="text-primary font-semibold">-10€</span>
                    ) : tx.type === "redeem_buffet" ? (
                      <span className="text-primary font-semibold">-200 {t.pts as string}</span>
                    ) : (
                      <span className="text-primary font-semibold">{t.meal as string}</span>
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
        </div>
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
