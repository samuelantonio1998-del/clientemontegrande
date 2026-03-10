interface MealCounterProps {
  meals: number;
  discountAvailable: boolean;
  onClaimDiscount: () => void;
}

const MealCounter = ({ meals, discountAvailable, onClaimDiscount }: MealCounterProps) => {
  return (
    <section
      className={`mx-6 border-2 border-foreground p-6 transition-colors duration-0 ${
        discountAvailable ? "bg-reward-blue" : "bg-card"
      }`}
    >
      <h2
        className={`font-display text-sm uppercase tracking-[0.2em] mb-6 ${
          discountAvailable ? "text-secondary-foreground" : "text-foreground"
        }`}
      >
        {discountAvailable ? "Desconto Disponível" : "Refeições"}
      </h2>

      <div className="flex gap-4 justify-center mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-14 h-14 border-2 transition-colors duration-0 ${
              discountAvailable
                ? "border-secondary-foreground bg-secondary-foreground"
                : i < meals
                ? "border-foreground bg-signal-orange"
                : "border-foreground bg-transparent"
            }`}
          />
        ))}
      </div>

      {discountAvailable ? (
        <button
          onClick={onClaimDiscount}
          className="w-full py-3 font-mono text-xs uppercase tracking-[0.3em] border-2 border-secondary-foreground text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary transition-colors duration-0"
        >
          Usar Desconto
        </button>
      ) : (
        <p className="font-mono text-xs text-muted-foreground text-center tracking-wider">
          {4 - meals} refeição{4 - meals !== 1 ? "ões" : ""} para desconto
        </p>
      )}
    </section>
  );
};

export default MealCounter;
