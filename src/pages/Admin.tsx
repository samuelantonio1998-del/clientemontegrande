import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { LogOut, Search, ArrowLeft } from "lucide-react";
import AdminClientCard from "@/components/AdminClientCard";

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

  const searchClient = async () => {
    setSearchError("");
    setClientProfile(null);
    setFeedback("");
    const code = clientCode.trim();
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
    const dayOfWeek = today.getDay(); // 0=Sun, 6=Sat

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      setFeedback("Refeições de desconto só contam em dias úteis");
      setActionLoading(false);
      return;
    }

    // Get Monday of current week
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek - 1));
    const mondayStr = monday.toISOString().split("T")[0];

    let newMeals = clientProfile.consecutive_meals;
    const currentWeek = clientProfile.current_week_start;

    // If different week, reset counter
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
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-[0.3em]">
          A verificar...
        </p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors duration-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <p className="font-mono text-xs tracking-[0.3em] uppercase text-muted-foreground">
            administração
          </p>
        </div>
        <button onClick={signOut} className="text-muted-foreground hover:text-foreground transition-colors duration-0" aria-label="Sair">
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Search */}
      <section className="mx-6 border-2 border-foreground p-6 bg-card mb-0">
        <h1 className="font-display text-2xl text-foreground mb-4 uppercase">
          Registar Refeição
        </h1>
        <div className="flex gap-2">
          <input
            type="text"
            maxLength={6}
            placeholder="Código cliente"
            value={clientCode}
            onChange={(e) => setClientCode(e.target.value.replace(/\D/g, ""))}
            className="flex-1 bg-background border-2 border-foreground px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-signal-orange tracking-[0.3em] text-center"
          />
          <button
            onClick={searchClient}
            className="px-4 py-2 bg-foreground text-background border-2 border-foreground"
            aria-label="Pesquisar"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
        {searchError && (
          <p className="font-mono text-xs text-destructive mt-2">{searchError}</p>
        )}
      </section>

      {/* Client info + actions */}
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
  );
};

export default Admin;
