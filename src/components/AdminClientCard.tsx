import { UtensilsCrossed, Gift } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface AdminClientCardProps {
  profile: {
    display_name: string | null;
    client_code: string | null;
    total_points: number;
    consecutive_meals: number;
    discount_available: boolean;
  };
  onRegisterWeekdayMeal: () => void;
  onRedeemDiscount: () => void;
  actionLoading: boolean;
  feedback: string;
}

const AdminClientCard = ({
  profile,
  onRegisterWeekdayMeal,
  onRedeemDiscount,
  actionLoading,
  feedback,
}: AdminClientCardProps) => {
  const { t } = useLanguage();

  return (
    <section className="border border-t-0 border-border bg-card">
      <div className="p-6 border-b border-border">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          {t.client as string}
        </p>
        <p className="font-display text-2xl text-foreground">
          {profile.display_name || (t.noName as string)}
        </p>
        <div className="flex gap-6 mt-3">
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider block">
              {t.points as string}
            </span>
            <span className="font-display text-2xl text-foreground">
              {profile.total_points}
            </span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider block">
              {t.weekMealsAdmin as string}
            </span>
            <span className="font-display text-2xl text-foreground">
              {profile.consecutive_meals}/4
            </span>
          </div>
        </div>
      </div>

      {/* Redeem discount section */}
      {profile.discount_available && (
        <div className="p-6 border-b border-border bg-primary/5">
          <h3 className="text-xs uppercase tracking-widest mb-3 flex items-center gap-2 text-primary font-semibold">
            <Gift className="w-3 h-3" /> {t.discount10Active as string}
          </h3>
          <button
            onClick={onRedeemDiscount}
            disabled={actionLoading}
            className="w-full py-3 bg-primary text-primary-foreground text-xs uppercase tracking-widest disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {t.redeemDiscount as string}
          </button>
        </div>
      )}

      <div className="p-6">
        <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <UtensilsCrossed className="w-3 h-3" /> {t.registerMealBtn as string}
        </h3>
        <button
          onClick={onRegisterWeekdayMeal}
          disabled={actionLoading}
          className="w-full py-3 bg-foreground text-background text-xs uppercase tracking-widest disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {actionLoading ? "..." : (t.registerMealBtn as string)}
        </button>
        <p className="text-sm text-muted-foreground mt-1">
          {t.weekdayMealRule as string}
        </p>
      </div>

      {feedback && (
        <div className="px-6 pb-6">
          <p className="text-xs text-primary font-semibold uppercase tracking-wider">
            {feedback}
          </p>
        </div>
      )}
    </section>
  );
};

export default AdminClientCard;
