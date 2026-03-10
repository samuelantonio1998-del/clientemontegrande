import { useState } from "react";
import MealCounter from "@/components/MealCounter";
import PointsBalance from "@/components/PointsBalance";
import ScanButton from "@/components/ScanButton";
import StampOverlay from "@/components/StampOverlay";

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  points: number;
  description: string;
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "1", date: "2026-03-09", amount: 45.50, points: 46, description: "Jantar" },
  { id: "2", date: "2026-03-06", amount: 32.00, points: 32, description: "Almoço" },
  { id: "3", date: "2026-03-02", amount: 28.75, points: 29, description: "Almoço" },
  { id: "4", date: "2026-02-27", amount: 61.20, points: 61, description: "Jantar" },
  { id: "5", date: "2026-02-22", amount: 19.90, points: 20, description: "Almoço" },
];

const Index = () => {
  const [meals, setMeals] = useState(2);
  const [points, setPoints] = useState(188);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [showStamp, setShowStamp] = useState(false);
  const [lastPointsGained, setLastPointsGained] = useState(0);
  const [discountAvailable, setDiscountAvailable] = useState(false);

  const handleScan = () => {
    const newAmount = Math.floor(Math.random() * 40) + 15;
    const newPoints = Math.round(newAmount);
    setLastPointsGained(newPoints);
    setShowStamp(true);

    setTimeout(() => {
      const newMeals = meals + 1;
      if (newMeals >= 4) {
        setMeals(0);
        setDiscountAvailable(true);
      } else {
        setMeals(newMeals);
        setDiscountAvailable(false);
      }
      setPoints((p) => p + newPoints);
      setTransactions((t) => [
        {
          id: Date.now().toString(),
          date: new Date().toISOString().split("T")[0],
          amount: newAmount,
          points: newPoints,
          description: "Refeição",
        },
        ...t,
      ]);
    }, 600);

    setTimeout(() => setShowStamp(false), 1800);
  };

  const handleClaimDiscount = () => {
    setDiscountAvailable(false);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Header */}
      <header className="px-6 pt-8 pb-4">
        <p className="font-mono text-xs tracking-[0.3em] uppercase text-muted-foreground">
          programa de fidelidade
        </p>
      </header>

      {/* Meal Counter Block */}
      <MealCounter
        meals={meals}
        discountAvailable={discountAvailable}
        onClaimDiscount={handleClaimDiscount}
      />

      {/* Divider with scan button */}
      <div className="relative h-0 z-20">
        <ScanButton onScan={handleScan} />
      </div>

      {/* Points Block */}
      <PointsBalance points={points} transactions={transactions} />

      {/* Stamp Overlay */}
      {showStamp && <StampOverlay pointsGained={lastPointsGained} />}
    </div>
  );
};

export default Index;
