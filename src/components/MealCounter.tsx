import { useLanguage } from "@/contexts/LanguageContext";

interface MealCounterProps {
  meals: number;
  discountAvailable: boolean;
  onClaimDiscount: () => void;
}

const MealCounter = ({ meals, discountAvailable, onClaimDiscount }: MealCounterProps) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      {/* Meal counter - always visible */}
      <section className="mx-4 sm:mx-[100px] border border-border p-6 bg-card">
        <h2 className="font-display text-lg mb-6 text-foreground">
          {t.weekMeals as string}
        </h2>

        <div className="flex gap-4 justify-center mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-16 h-16 rounded-full border transition-colors ${
                i < meals
                  ? "border-foreground bg-primary"
                  : "border-border bg-transparent"
              }`}
            />
          ))}
        </div>

        <p className="text-sm text-muted-foreground text-center tracking-wide">
          {(t.mealsRemaining as (n: number) => string)(4 - meals)}
        </p>
      </section>

      {/* Discount button - shown below when available */}
      {discountAvailable && (
        <section className="mx-4 sm:mx-[100px] border border-border p-6 bg-primary">
          <h2 className="font-display text-lg mb-4 text-primary-foreground">
            {t.discountAvailable as string}
          </h2>
          <button
            onClick={onClaimDiscount}
            className="w-full py-3 text-sm uppercase tracking-widest border border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary transition-colors"
          >
            {t.useDiscount as string}
          </button>
        </section>
      )}
    </div>
  );
};

export default MealCounter;
