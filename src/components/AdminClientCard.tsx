import { Coins, UtensilsCrossed } from "lucide-react";

interface AdminClientCardProps {
  profile: {
    display_name: string | null;
    client_code: string | null;
    total_points: number;
    consecutive_meals: number;
    discount_available: boolean;
  };
  mealAmount: string;
  onMealAmountChange: (v: string) => void;
  onRegisterPoints: () => void;
  onRegisterWeekdayMeal: () => void;
  actionLoading: boolean;
  feedback: string;
}

const AdminClientCard = ({
  profile,
  mealAmount,
  onMealAmountChange,
  onRegisterPoints,
  onRegisterWeekdayMeal,
  actionLoading,
  feedback,
}: AdminClientCardProps) => {
  return (
    <section className="border border-t-0 border-border bg-card">
      {/* Client info */}
      <div className="p-6 border-b border-border">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Cliente
        </p>
        <p className="font-display text-2xl text-foreground">
          {profile.display_name || "Sem nome"}
        </p>
        <div className="flex gap-6 mt-3">
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider block">
              Pontos
            </span>
            <span className="font-display text-2xl text-foreground">
              {profile.total_points}
            </span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider block">
              Refeições semana
            </span>
            <span className="font-display text-2xl text-foreground">
              {profile.consecutive_meals}/4
            </span>
          </div>
          {profile.discount_available && (
            <div>
              <span className="text-xs uppercase tracking-wider block text-primary font-semibold">
                Desconto 10€ ativo
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action 1: Points from meal value */}
      <div className="p-6 border-b border-border">
        <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <Coins className="w-3 h-3" /> Atribuir Pontos
        </h3>
        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Valor €"
            value={mealAmount}
            onChange={(e) => onMealAmountChange(e.target.value)}
            className="flex-1 bg-background border border-border px-4 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
          />
          <button
            onClick={onRegisterPoints}
            disabled={actionLoading || !mealAmount}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs uppercase tracking-wider disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {actionLoading ? "..." : "Pontuar"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          1€ = 1 ponto
        </p>
      </div>

      {/* Action 2: Weekday meal for discount */}
      <div className="p-6">
        <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <UtensilsCrossed className="w-3 h-3" /> Refeição Dia Útil
        </h3>
        <button
          onClick={onRegisterWeekdayMeal}
          disabled={actionLoading}
          className="w-full py-3 bg-foreground text-background text-xs uppercase tracking-widest disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {actionLoading ? "..." : "Registar Refeição"}
        </button>
        <p className="text-xs text-muted-foreground mt-1">
          4 refeições em dias úteis na mesma semana = 10€ desconto
        </p>
      </div>

      {/* Feedback */}
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
