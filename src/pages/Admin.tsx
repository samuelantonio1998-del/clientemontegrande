import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Search, ScanLine } from "lucide-react";
import AdminClientCard from "@/components/AdminClientCard";
import QRScanner from "@/components/QRScanner";
import ConfirmDialog from "@/components/ConfirmDialog";
import AdminActionHistory from "@/components/AdminActionHistory";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [peopleCount, setPeopleCount] = useState(1);
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

  const openMealDialog = () => {
    setPeopleCount(1);
    setShowConfirmMeal(true);
  };

  const confirmMeal = () => {
    setShowConfirmMeal(false);
    registerWeekdayMeal(peopleCount);
  };

  const registerWeekdayMeal = async (people: number) => {
    if (!clientProfile || actionLock.current) return;
    actionLock.current = true;
    setActionLoading(true);

    try {
      const { data } = await supabase.functions.invoke("register-meal", {
        body: { client_user_id: clientProfile.user_id, people_count: people },
      });

      if (data?.error === "cooldown_active") {
        setFeedback(t.dailyMealLimit as string);
      } else if (data?.error) {
        logger.error("register-meal error:", data);
        setFeedback("Erro ao registar refeição");
      } else if (data?.success) {
        setFeedback(
          data.reachedDiscount
            ? `+10 ${t.points as string} · ${t.discountUnlocked as string}`
            : `+10 ${t.points as string} · ${(t.mealRegistered as (n: number) => string)(data.meals)}`
        );
      } else {
        setFeedback("Erro inesperado");
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

      if (error) {
        logger.error("redeem-benefit invoke error:", error);
        setFeedback(`Erro: ${error.message || "falha de rede"}`);
      } else if (data?.error) {
        const msg = data.error === "discount_not_available" ? "Desconto não disponível"
          : data.error === "must_return_first" ? "O desconto só pode ser usado numa próxima visita"
          : data.error === "Forbidden" ? "Sem permissão (não é admin)"
          : data.error === "Unauthorized" ? "Sessão expirada — faça login novamente"
          : data.error === "Client not found" ? "Cliente não encontrado"
          : `Erro: ${data.error}`;
        setFeedback(msg);
      } else if (data?.success) {
        setFeedback(t.discountRedeemed as string);
      } else {
        logger.error("redeem-benefit unexpected response:", data);
        setFeedback("Resposta inesperada do servidor");
      }
    } catch (err) {
      logger.error("redeem-benefit exception:", err);
      setFeedback(`Erro inesperado: ${(err as Error)?.message || "desconhecido"}`);
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

      if (error) {
        logger.error("redeem-benefit invoke error:", error);
        setFeedback(`Erro: ${error.message || "falha de rede"}`);
      } else if (data?.error) {
        const msg = data.error === "buffet_not_available" ? "Buffet não disponível"
          : data.error === "insufficient_points" ? "Pontos insuficientes"
          : data.error === "must_return_first" ? "O buffet só pode ser usado numa próxima visita"
          : data.error === "Forbidden" ? "Sem permissão (não é admin)"
          : data.error === "Unauthorized" ? "Sessão expirada — faça login novamente"
          : `Erro: ${data.error}`;
        setFeedback(msg);
      } else if (data?.success) {
        setFeedback(t.buffetRedeemed as string);
      } else {
        logger.error("redeem-benefit unexpected response:", data);
        setFeedback("Resposta inesperada do servidor");
      }
    } catch (err) {
      logger.error("redeem-benefit exception:", err);
      setFeedback(`Erro inesperado: ${(err as Error)?.message || "desconhecido"}`);
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

      <Dialog open={showConfirmMeal} onOpenChange={setShowConfirmMeal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-center">
              {t.howManyPeople as string}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t.howManyPeopleMsg as string}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center gap-3 py-2">
            <button
              type="button"
              onClick={() => setPeopleCount((n) => Math.max(1, n - 1))}
              className="w-12 h-12 border border-border text-2xl text-foreground hover:bg-muted"
              aria-label="-1"
            >
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              step={1}
              value={peopleCount}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setPeopleCount(Number.isNaN(v) ? 1 : Math.min(20, Math.max(1, v)));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmMeal();
              }}
              aria-label={t.howManyPeople as string}
              className="w-24 h-16 text-center text-4xl font-semibold bg-background border border-border text-foreground focus:outline-none focus:border-foreground"
            />
            <button
              type="button"
              onClick={() => setPeopleCount((n) => Math.min(20, n + 1))}
              className="w-12 h-12 border border-border text-2xl text-foreground hover:bg-muted"
              aria-label="+1"
            >
              +
            </button>
          </div>
          <DialogFooter className="flex-row gap-2 sm:justify-center">
            <Button variant="outline" className="flex-1" onClick={() => setShowConfirmMeal(false)}>
              {t.cancel as string}
            </Button>
            <Button className="flex-1" onClick={confirmMeal} autoFocus>
              {t.confirm as string}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
