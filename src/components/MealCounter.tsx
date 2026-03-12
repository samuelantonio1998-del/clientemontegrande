interface MealCounterProps {
  meals: number;
  discountAvailable: boolean;
  onClaimDiscount: () => void;
}

const MealCounter = ({ meals, discountAvailable, onClaimDiscount }: MealCounterProps) => {
  return (
    <section
      className={`mx-6 border border-border p-6 transition-colors ${
        discountAvailable ? "bg-primary" : "bg-card"
      }`}
    >
      <h2
        className={`font-display text-lg mb-6 ${
          discountAvailable ? "text-primary-foreground" : "text-foreground"
        }`}
      >
        {discountAvailable ? "Desconto 10€ Disponível" : "Refeições da Semana"}
      </h2>

      <div className="flex gap-4 justify-center mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-14 h-14 rounded-full border transition-colors ${
              discountAvailable
                ? "border-primary-foreground/50 bg-primary-foreground"
                : i < meals
                ? "border-foreground bg-primary"
                : "border-border bg-transparent"
            }`}
          />
        ))}
      </div>

      {discountAvailable ? (
        <button
          onClick={onClaimDiscount}
          className="w-full py-3 text-sm uppercase tracking-widest border border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary transition-colors"
        >
          Usar Desconto 10€
        </button>
      ) : (
        <p className="text-sm text-muted-foreground text-center tracking-wide">
          {4 - meals} {4 - meals !== 1 ? "refeições" : "refeição"} para desconto de 10€
        </p>
      )}
    </section>
  );
};

export default MealCounter;
