import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import MealCounter from "@/components/MealCounter";
import PointsBalance from "@/components/PointsBalance";
import ScanButton from "@/components/ScanButton";
import StampOverlay from "@/components/StampOverlay";
import { LogOut } from "lucide-react";

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  points: number;
  description: string;
}

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [meals, setMeals] = useState(0);
  const [points, setPoints] = useState(0);
  const [discountAvailable, setDiscountAvailable] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showStamp, setShowStamp] = useState(false);
  const [lastPointsGained, setLastPointsGained] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const fetchData = useCallback(async () => {
    if (!user) return;

    const [profileRes, txRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);

    if (profileRes.data) {
      setPoints(profileRes.data.total_points);
      setMeals(profileRes.data.consecutive_meals);
      setDiscountAvailable(profileRes.data.discount_available);
    }

    if (txRes.data) {
      setTransactions(
        txRes.data.map((t) => ({
          id: t.id,
          date: t.created_at.split("T")[0],
          amount: Number(t.amount),
          points: t.points_earned,
          description: t.description,
        }))
      );
    }

    setDataLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleScan = async () => {
    if (!user) return;

    const newAmount = Math.floor(Math.random() * 40) + 15;
    const newPoints = Math.round(newAmount);
    setLastPointsGained(newPoints);
    setShowStamp(true);

    // Calculate new meal count
    const newMeals = meals + 1;
    const reachedDiscount = newMeals >= 4;

    // Insert transaction
    await supabase.from("transactions").insert({
      user_id: user.id,
      amount: newAmount,
      points_earned: newPoints,
      description: "Refeição",
    });

    // Update profile
    await supabase
      .from("profiles")
      .update({
        total_points: points + newPoints,
        consecutive_meals: reachedDiscount ? 0 : newMeals,
        discount_available: reachedDiscount,
      })
      .eq("user_id", user.id);

    setTimeout(() => {
      fetchData();
    }, 600);

    setTimeout(() => setShowStamp(false), 1800);
  };

  const handleClaimDiscount = async () => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ discount_available: false })
      .eq("user_id", user.id);
    setDiscountAvailable(false);
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-[0.3em]">
          A carregar...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <header className="px-6 pt-8 pb-4 flex items-center justify-between">
        <p className="font-mono text-xs tracking-[0.3em] uppercase text-muted-foreground">
          programa de fidelidade
        </p>
        <button
          onClick={signOut}
          className="text-muted-foreground hover:text-foreground transition-colors duration-0"
          aria-label="Sair"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      <MealCounter
        meals={meals}
        discountAvailable={discountAvailable}
        onClaimDiscount={handleClaimDiscount}
      />

      <div className="relative h-0 z-20">
        <ScanButton onScan={handleScan} />
      </div>

      <PointsBalance points={points} transactions={transactions} />

      {showStamp && <StampOverlay pointsGained={lastPointsGained} />}
    </div>
  );
};

export default Index;
