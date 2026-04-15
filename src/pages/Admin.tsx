import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Search, ScanLine } from "lucide-react";
import AdminClientCard from "@/components/AdminClientCard";
import QRScanner from "@/components/QRScanner";
import ConfirmDialog from "@/components/ConfirmDialog";
import AdminActionHistory from "@/components/AdminActionHistory";

const Admin = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
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

      // Parse response - edge function may return 4xx which puts body in error
      let result = data;
      if (error && !data) {
        try {
          const context = (error as any)?.context;
          if (context && typeof context.json === 'function') {
            result = await context.json();
          }
        } catch {
          // ignore parse errors
        }
      }

      if (!result) {
        setFeedback("Erro inesperado");
        actionLock.current = false;
        setActionLoading(false);
        return;
      }

      if (result.error === "weekday_only") {
        setFeedback(t.weekdayOnly as string);
      } else if (result.error === "cooldown_active") {
        setFeedback(t.dailyMealLimit as string);
      } else if (result.error) {
        setFeedback(result.error);
      } else if (result.success) {
        setFeedback(
          result.reachedDiscount
            ? `+10 ${t.points as string} · ${t.discountUnlocked as string}`
            : `+10 ${t.points as string} · ${(t.mealRegistered as (n: number) => string)(result.meals)}`
        );
      }

      await refreshClient();
      setHistoryRefreshKey((k) => k + 1);
    } catch {
      setFeedback("Erro inesperado");
    }

    actionLock.current = false;
    setActionLoading(false);
  };

  const redeemDiscount = async () => {
    if (!clientProfile || actionLock.current) return;
    actionLock.current = true;
    setActionLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("redeem-benefit", {
        body: { benefit_type: "discount", client_user_id: clientProfile.user_id },
      });

      if (error || data?.error) {
        const msg = data?.error === "discount_not_available" ? "Desconto não disponível"
          : data?.error === "must_return_first" ? "O desconto só pode ser usado numa próxima visita"
          : "Erro inesperado";
        setFeedback(msg);
      } else {
        setFeedback(t.discountRedeemed as string);
      }
    } catch {
      setFeedback("Erro inesperado");
    }

    await refreshClient();
    setHistoryRefreshKey((k) => k + 1);
    actionLock.current = false;
    setActionLoading(false);
  };

  const redeemBuffet = async () => {
    if (!clientProfile || actionLock.current) return;
    actionLock.current = true;
    setActionLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("redeem-benefit", {
        body: { benefit_type: "buffet", client_user_id: clientProfile.user_id },
      });

      if (error || data?.error) {
        const msg = data?.error === "buffet_not_available" ? "Buffet não disponível"
          : data?.error === "insufficient_points" ? "Pontos insuficientes"
          : data?.error === "must_return_first" ? "O buffet só pode ser usado numa próxima visita"
          : "Erro inesperado";
        setFeedback(msg);
      } else {
        setFeedback(t.buffetRedeemed as string);
      }
    } catch {
      setFeedback("Erro inesperado");
    }

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

  return (
    <div className="w-full max-w-md mx-auto">
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
  );
};

export default Admin;
