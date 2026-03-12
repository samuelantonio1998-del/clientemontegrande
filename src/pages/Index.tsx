import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import MealCounter from "@/components/MealCounter";
import PointsBalance from "@/components/PointsBalance";
import StampOverlay from "@/components/StampOverlay";
import ClientQRCode from "@/components/ClientQRCode";
import { LogOut } from "lucide-react";

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  points: number;
  description: string;
  type: string;
}

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [meals, setMeals] = useState(0);
  const [points, setPoints] = useState(0);
  const [discountAvailable, setDiscountAvailable] = useState(false);
  const [clientCode, setClientCode] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showStamp, setShowStamp] = useState(false);
  const [lastPointsGained, setLastPointsGained] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  
  const [totalSavings, setTotalSavings] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const fetchData = useCallback(async () => {
    if (!user) return;

    // Check admin first
    const adminRes = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" as const });
    if (!!adminRes.data) {
      navigate("/admin");
      return;
    }

    const [profileRes, txRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);

    if (profileRes.data) {
      setPoints(profileRes.data.total_points);
      setMeals(profileRes.data.consecutive_meals);
      setDiscountAvailable(profileRes.data.discount_available);
      setClientCode(profileRes.data.client_code || "");
      setTotalSavings(Number(profileRes.data.total_savings) || 0);
    }

    if (txRes.data) {
      setTransactions(
        txRes.data.map((t) => ({
          id: t.id,
          date: t.created_at.split("T")[0],
          amount: Number(t.amount),
          points: t.points_earned,
          description: t.description,
          type: t.type,
        }))
      );
    }

    setDataLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClaimDiscount = async () => {
    if (!user) return;
    const newSavings = totalSavings + 10;
    await supabase
      .from("profiles")
      .update({ discount_available: false, total_savings: newSavings })
      .eq("user_id", user.id);
    setDiscountAvailable(false);
    setTotalSavings(newSavings);
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground tracking-wide">
          A carregar...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <header className="px-6 pt-8 pb-4 flex items-center justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase text-muted-foreground">
            programa de fidelidade
          </p>
          {clientCode && (
            <p className="text-xs text-muted-foreground mt-1">
              Código: <span className="text-foreground tracking-widest font-semibold">{clientCode}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={signOut}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <ClientQRCode clientCode={clientCode} />

      <MealCounter
        meals={meals}
        discountAvailable={discountAvailable}
        onClaimDiscount={handleClaimDiscount}
      />

      {totalSavings > 0 && (
        <section className="mx-6 mt-4 border border-border p-4 bg-card">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">
            poupança total
          </p>
          <p className="font-display text-2xl text-primary">
            Já economizou {totalSavings}€
          </p>
        </section>
      )}

      <PointsBalance points={points} transactions={transactions} />

      {showStamp && <StampOverlay pointsGained={lastPointsGained} />}
    </div>
  );
};

export default Index;
