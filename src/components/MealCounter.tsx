import { useLanguage } from "@/contexts/LanguageContext";
import { Gift, CheckCircle2, Info } from "lucide-react";

interface MealCounterProps {
  meals: number;
  discountAvailable: boolean;
  buffetAvailable: boolean;
}

const MealCounter = ({ meals, discountAvailable, buffetAvailable }: MealCounterProps) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      {/* Meal counter */}
      <div className="border-t border-border p-6">
        <h2 className="font-display text-lg text-foreground mb-4">
          {t.weekMeals as string}
        </h2>

        {/* Top info pills */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          <div className="flex items-start gap-3 p-3 bg-card/50 rounded-2xl border border-border/40">
            <div className="mt-0.5 shrink-0 w-5 h-5 flex items-center justify-center rounded-full border border-foreground/20">
              <CheckCircle2 className="w-3 h-3 text-foreground" strokeWidth={2.5} />
            </div>
            <p className="text-sm leading-snug text-foreground">
              <span className="font-semibold">{t.weekMealsObjetivo as string}</span>
            </p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-card/50 rounded-2xl border border-border/40">
            <div className="mt-0.5 shrink-0 w-5 h-5 flex items-center justify-center rounded-full border border-foreground/20">
              <Info className="w-3 h-3 text-foreground" strokeWidth={2} />
            </div>
            <p className="text-sm leading-snug text-muted-foreground">
              {t.weekMealsFallback as string}
            </p>
          </div>
        </div>

        <div className="flex gap-4 justify-center mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-16 h-16 rounded-full border-2 transition-all duration-300 ${
                i < meals
                  ? "border-primary bg-primary shadow-button scale-105"
                  : "border-border bg-transparent"
              }`}
            />
          ))}
        </div>

        <p className="text-xs uppercase tracking-widest text-muted-foreground text-center font-medium">
          {(t.mealsRemaining as (n: number) => string)(4 - meals)}
        </p>
      </div>

      {/* Discount available */}
      {discountAvailable && (
        <section className="mx-4 rounded-2xl p-6 bg-primary shadow-elevated mt-4">
          <div className="flex items-center justify-center gap-3">
            <Gift className="w-5 h-5 text-primary-foreground" />
            <h2 className="font-display text-lg text-primary-foreground">
              {t.discountAvailable as string}
            </h2>
          </div>
          <p className="text-sm text-primary-foreground/70 text-center mt-2 tracking-wide">
            {t.discountRedeemHint as string}
          </p>
        </section>
      )}

      {buffetAvailable && (
        <section className="mx-4 rounded-2xl p-6 bg-primary shadow-elevated mt-4">
          <div className="flex items-center justify-center gap-3">
            <Gift className="w-5 h-5 text-primary-foreground" />
            <h2 className="font-display text-lg text-primary-foreground">
              {t.buffetAvailable as string}
            </h2>
          </div>
          <p className="text-sm text-primary-foreground/70 text-center mt-2 tracking-wide">
            {t.buffetRedeemHint as string}
          </p>
          <p className="text-xs text-primary-foreground/70 text-center mt-1 italic">
            {t.drinksExcluded as string}
          </p>
        </section>
      )}

      {/* Discount rules info */}
      <div className="mx-4 mt-3 relative pt-4 pb-4 px-2">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-px bg-border" />
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="mt-1.5 shrink-0 w-1 h-1 bg-muted-foreground/40 rounded-full" />
            <p className="text-[11px] leading-tight text-muted-foreground italic">
              {t.discountRule1 as string}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-1.5 shrink-0 w-1 h-1 bg-muted-foreground/40 rounded-full" />
            <p className="text-[11px] leading-tight text-muted-foreground italic">
              {t.discountRule2 as string}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealCounter;