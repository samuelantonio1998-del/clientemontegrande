import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { LogOut, Search, ArrowLeft, ScanLine } from "lucide-react";
import AdminClientCard from "@/components/AdminClientCard";
import QRScanner from "@/components/QRScanner";

const Admin = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [clientCode, setClientCode] = useState("");
  const [clientProfile, setClientProfile] = useState<any>(null);
  const [searchError, setSearchError] = useState("");
  const [mealAmount, setMealAmount] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      checkAdmin();
    }
  }, [user, authLoading]);

  const checkAdmin = async () => {
    if (!user) return;
    const { data } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    setIsAdmin(!!data);
    setChecking(false);
    if (!data) navigate("/");
  };

  const handleQRScan = useCallback((code: string) => {
    setClientCode(code);
    setShowScanner(false);
    // Auto-search
    searchClientByCode(code);
  }, []);

  const searchClientByCode = async (code: string) => {
    setSearchError("");
    setClientProfile(null);
    setFeedback("");
    if (code.length !== 6) {
      setSearchError("O código deve ter 6 dígitos");
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("client_code", code)
      .single();

    if (error || !data) {
      setSearchError("Cliente não encontrado");
    } else {
      setClientProfile(data);
    }
  };

  const searchClient = async () => {
    await searchClientByCode(clientCode.trim());
  };

  const registerMealPoints = async () => {
    if (!clientProfile || !mealAmount) return;
    const amount = parseFloat(mealAmount);
    if (isNaN(amount) || amount <= 0) return;

    setActionLoading(true);
    const pointsEarned = Math.round(amount);

    await supabase.from("transactions").insert({
      user_id: clientProfile.user_id,
      amount,
      points_earned: pointsEarned,
      description: "Refeição — pontos",
      type: "points",
    });

    await supabase
      .from("profiles")
      .update({ total_points: clientProfile.total_points + pointsEarned })
      .eq("user_id", clientProfile.user_id);

    setFeedback(`+${pointsEarned} pontos atribuídos`);
    setMealAmount("");
    await refreshClient();
    setActionLoading(false);
  };

  const registerWeekdayMeal = async () => {
    if (!clientProfile) return;
    setActionLoading(true);

    const today = new Date();
    const dayOfWeek = today.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      setFeedback("Refeições de desconto só contam em dias úteis");
      setActionLoading(false);
      return;
    }

    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek - 1));
    const mondayStr = monday.toISOString().split("T")[0];

    let newMeals = clientProfile.consecutive_meals;
    const currentWeek = clientProfile.current_week_start;

    if (currentWeek !== mondayStr) {
      newMeals = 1;
    } else {
      newMeals += 1;
    }

    const reachedDiscount = newMeals >= 4;

    await supabase.from("transactions").insert({
      user_id: clientProfile.user_id,
      amount: 0,
      points_earned: 0,
      description: reachedDiscount
        ? "4ª refeição — desconto 10€ desbloqueado"
        : `Refeição ${newMeals}/4 (semana)`,
      type: "meal",
    });

    await supabase
      .from("profiles")
      .update({
        consecutive_meals: reachedDiscount ? 0 : newMeals,
        current_week_start: mondayStr,
        discount_available: reachedDiscount,
      })
      .eq("user_id", clientProfile.user_id);

    setFeedback(
      reachedDiscount
        ? "Desconto de 10€ desbloqueado!"
        : `Refeição ${newMeals}/4 registada`
    );
    await refreshClient();
    setActionLoading(false);
  };

  const refreshClient = async () => {
    if (!clientProfile) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("client_code", clientProfile.client_code)
      .single();
    if (data) setClientProfile(data);
  };

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground tracking-wide">
          A verificar...
        </p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 pt-8 pb-4 flex items-center justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase text-muted-foreground">
            administração
          </p>
        </div>
        <button onClick={signOut} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Sair">
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center px-4 pb-8">
        <div className="w-full max-w-md">
          {/* Search */}
          <section className="border border-border p-6 bg-card">
            <h1 className="font-display text-3xl text-foreground mb-4 text-center">
              Registar Refeição
            </h1>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                placeholder="Código cliente"
                value={clientCode}
                onChange={(e) => setClientCode(e.target.value.replace(/\D/g, ""))}
                className="flex-1 bg-background border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-foreground tracking-widest text-center transition-colors"
              />
              <button
                onClick={searchClient}
                className="px-4 py-3 bg-foreground text-background border border-foreground hover:opacity-90 transition-opacity"
                aria-label="Pesquisar"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setShowScanner(true)}
              className="w-full mt-3 py-3 flex items-center justify-center gap-2 border border-border text-foreground text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
            >
              <ScanLine className="w-4 h-4" />
              Ler Código QR
            </button>
            {searchError && (
              <p className="text-xs text-destructive mt-2 text-center">{searchError}</p>
            )}
          </section>

          {showScanner && (
            <QRScanner
              onScan={handleQRScan}
              onClose={() => setShowScanner(false)}
            />
          )}

          {clientProfile && (
            <AdminClientCard
              profile={clientProfile}
              mealAmount={mealAmount}
              onMealAmountChange={setMealAmount}
              onRegisterPoints={registerMealPoints}
              onRegisterWeekdayMeal={registerWeekdayMeal}
              actionLoading={actionLoading}
              feedback={feedback}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
