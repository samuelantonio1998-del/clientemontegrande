import { useLanguage } from "@/contexts/LanguageContext";
import { Gift } from "lucide-react";

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
        <h2 className="font-display text-lg text-foreground mb-2">
          {t.weekMeals as string}
        </h2>
        <p className="text-xs text-muted-foreground text-center mb-4">
          {t.weekMealsSubtitle as string}
        </p>

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
      <div className="mx-4 mt-3">
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          {t.discountRulesInfo as string}
        </p>
      </div>
    </div>
  );
};

export default MealCounter;
