import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Gift, Info } from "lucide-react";

interface MealCounterProps {
  meals: number;
  discountAvailable: boolean;
  buffetAvailable: boolean;
}

const MealCounter = ({ meals, discountAvailable, buffetAvailable }: MealCounterProps) => {
  const { t } = useLanguage();
  const [showInfo, setShowInfo] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      {/* Meal counter */}
      <div className="border-t border-border p-6">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="font-display text-lg text-foreground">
            {t.weekMeals as string}
          </h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px] text-center rounded-xl">
                <p className="text-xs">Para obter o desconto, tem que completar as 4 refeições na mesma semana.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
        </section>
      )}
    </div>
  );
};

export default MealCounter;
