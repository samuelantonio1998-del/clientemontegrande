import { useLanguage } from "@/contexts/LanguageContext";
import { Gift, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MealCounterProps {
  meals: number;
  discountAvailable: boolean;
}

const MealCounter = ({ meals, discountAvailable }: MealCounterProps) => {
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

      {/* Discount available indicator */}
      {discountAvailable && (
        <section className="mx-4 sm:mx-[100px] border border-border p-6 bg-primary">
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
    </div>
  );
};

export default MealCounter;
