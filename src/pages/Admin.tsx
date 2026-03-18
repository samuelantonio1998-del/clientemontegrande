import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { LogOut, Search, ScanLine } from "lucide-react";
import AdminClientCard from "@/components/AdminClientCard";
import QRScanner from "@/components/QRScanner";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ConfirmDialog from "@/components/ConfirmDialog";

import AdminActionHistory from "@/components/AdminActionHistory";
import AdminAds from "@/components/AdminAds";

const Admin = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [clientCode, setClientCode] = useState("");
  const [clientProfile, setClientProfile] = useState<any>(null);
  const [searchError, setSearchError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const actionLock = useRef(false);
  const [showConfirmMeal, setShowConfirmMeal] = useState(false);
  const [showConfirmRedeem, setShowConfirmRedeem] = useState(false);
  const [showConfirmBuffet, setShowConfirmBuffet] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
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

  const searchClientByCode = useCallback(async (code: string) => {
    const normalizedCode = code.replace(/\D/g, "").slice(0, 6);

    setSearchError("");
    setClientProfile(null);
    setFeedback("");

    if (normalizedCode.length !== 6) {
      setSearchError(t.codeMustBe6 as string);
      return false;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("client_code", normalizedCode)
      .maybeSingle();

    if (error || !data) {
      setSearchError(t.clientNotFound as string);
      return false;
    }

    setClientProfile(data);
    return true;
  }, [t]);

  const handleQRScan = async (code: string) => {
    setClientCode(code);
    setShowScanner(false);
    await searchClientByCode(code);
  };

  const searchClient = async () => {
    await searchClientByCode(clientCode.trim());
  };
  const registerWeekdayMeal = async () => {
    if (!clientProfile || actionLock.current) return;
    actionLock.current = true;
    setActionLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("register-meal", {
        body: { client_user_id: clientProfile.user_id },
      });

      if (error) {
        setFeedback(t.genericError as string || "Erro inesperado");
        actionLock.current = false;
        setActionLoading(false);
        return;
      }

      if (data?.error === "weekday_only") {
        setFeedback(t.weekdayOnly as string);
      } else if (data?.error === "cooldown_active") {
        setFeedback(t.dailyMealLimit as string);
      } else if (data?.error) {
        setFeedback(data.error);
      } else if (data?.success) {
        setFeedback(
          data.reachedDiscount
            ? `+10 ${t.points as string} · ${t.discountUnlocked as string}`
            : `+10 ${t.points as string} · ${(t.mealRegistered as (n: number) => string)(data.meals)}`
        );
      }

      await refreshClient();
      setHistoryRefreshKey((k) => k + 1);
    } catch {
      setFeedback(t.genericError as string || "Erro inesperado");
    }

    actionLock.current = false;
    setActionLoading(false);
  };

  const redeemDiscount = async () => {
    if (!clientProfile || actionLock.current) return;
    actionLock.current = true;
    setActionLoading(true);

    const newSavings = (Number(clientProfile.total_savings) || 0) + 10;

    await supabase
      .from("profiles")
      .update({ discount_available: false, total_savings: newSavings })
      .eq("user_id", clientProfile.user_id);

    setFeedback(t.discountRedeemed as string);

    // Log admin action
    await supabase.from("admin_actions").insert({
      admin_id: user!.id,
      client_user_id: clientProfile.user_id,
      client_name: clientProfile.display_name,
      client_code: clientProfile.client_code,
      action_type: "redeem_discount",
      description: t.discountRedeemed as string,
      points_changed: 0,
    } as any);

    await refreshClient();
    setHistoryRefreshKey((k) => k + 1);
    actionLock.current = false;
    setActionLoading(false);
  };

  const redeemBuffet = async () => {
    if (!clientProfile || actionLock.current) return;
    actionLock.current = true;
    setActionLoading(true);

    const newPoints = clientProfile.total_points - 200;

    await supabase
      .from("profiles")
      .update({ buffet_available: false, total_points: newPoints })
      .eq("user_id", clientProfile.user_id);

    setFeedback(t.buffetRedeemed as string);

    // Log admin action
    await supabase.from("admin_actions").insert({
      admin_id: user!.id,
      client_user_id: clientProfile.user_id,
      client_name: clientProfile.display_name,
      client_code: clientProfile.client_code,
      action_type: "redeem_buffet",
      description: t.buffetRedeemed as string,
      points_changed: -200,
    } as any);

    await refreshClient();
    setHistoryRefreshKey((k) => k + 1);
    actionLock.current = false;
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
          {t.checking as string}
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground tracking-wide mb-3">
            {t.checking as string}
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 border border-border text-xs uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-colors"
          >
            {t.returnHome as string}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 pt-8 pb-4 flex items-center justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase text-muted-foreground">
            {t.administration as string}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <button onClick={signOut} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Sair">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center px-4 pb-8">
        <div className="w-full max-w-md">
          <section className="border border-border p-6 bg-card">
            <h1 className="font-display text-3xl text-foreground mb-4 text-center">
              {t.registerMeal as string}
            </h1>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                placeholder={t.clientCode as string}
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
              className="w-full mt-3 py-4 flex items-center justify-center gap-2 border border-border text-foreground text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
              aria-label="Ler QR Code"
            >
              <ScanLine className="w-5 h-5" />
              {t.readQR as string}
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
              onRegisterWeekdayMeal={() => setShowConfirmMeal(true)}
              onRedeemDiscount={() => setShowConfirmRedeem(true)}
              onRedeemBuffet={() => setShowConfirmBuffet(true)}
              actionLoading={actionLoading}
              feedback={feedback}
            />
          )}

          <AdminActionHistory refreshKey={historyRefreshKey} />

          <AdminAds />

          

          <ConfirmDialog
            open={showConfirmMeal}
            title={t.confirmMeal as string}
            message={t.confirmMealMsg as string}
            onConfirm={() => {
              setShowConfirmMeal(false);
              registerWeekdayMeal();
            }}
            onCancel={() => setShowConfirmMeal(false)}
          />

          <ConfirmDialog
            open={showConfirmRedeem}
            title={t.confirmRedeem as string}
            message={t.confirmRedeemMsg as string}
            onConfirm={() => {
              setShowConfirmRedeem(false);
              redeemDiscount();
            }}
            onCancel={() => setShowConfirmRedeem(false)}
          />

          <ConfirmDialog
            open={showConfirmBuffet}
            title={t.confirmBuffet as string}
            message={t.confirmBuffetMsg as string}
            onConfirm={() => {
              setShowConfirmBuffet(false);
              redeemBuffet();
            }}
            onCancel={() => setShowConfirmBuffet(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default Admin;
