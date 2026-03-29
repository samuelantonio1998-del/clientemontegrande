import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import logo from "@/assets/logo-mg-horizontal-bege.svg";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import MealCounter from "@/components/MealCounter";
import PointsBalance from "@/components/PointsBalance";
import StampOverlay from "@/components/StampOverlay";
import DiscountCelebration from "@/components/DiscountCelebration";
import ClientQRCode from "@/components/ClientQRCode";
import ReferralButton from "@/components/ReferralButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import BirthdayBanner from "@/components/BirthdayBanner";
import FollowUsCard from "@/components/FollowUsCard";
import GoogleReviewCard from "@/components/GoogleReviewCard";
import AdBanner from "@/components/AdBanner";
import ConfirmDialog from "@/components/ConfirmDialog";
import ReportProblemButton from "@/components/ReportProblemButton";
import { LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  points: number;
  description: string;
  type: string;
  expires_at?: string | null;
  expired?: boolean;
}

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [meals, setMeals] = useState(0);
  const [points, setPoints] = useState(0);
  const [discountAvailable, setDiscountAvailable] = useState(false);
  const [buffetAvailable, setBuffetAvailable] = useState(false);
  const [clientCode, setClientCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showStamp, setShowStamp] = useState(false);
  const [lastPointsGained, setLastPointsGained] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [totalSavings, setTotalSavings] = useState(0);
  
  const [showCelebration, setShowCelebration] = useState(false);
  const prevDiscountRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const codeRotated = useRef(false);

  const fetchData = useCallback(async () => {
    if (!user) return;

    const adminRes = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" as const });
    if (!!adminRes.data) {
      navigate("/admin");
      return;
    }

    // Rotate client code once per session
    if (!codeRotated.current) {
      codeRotated.current = true;
      const { data: newCode } = await supabase.rpc("generate_client_code");
      if (newCode) {
        await supabase
          .from("profiles")
          .update({ client_code: newCode })
          .eq("user_id", user.id);
      }
    }

    const [profileRes, txRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (profileRes.data) {
      setPoints(profileRes.data.total_points);
      setMeals(profileRes.data.consecutive_meals);
      const newDiscount = profileRes.data.discount_available;
      if (newDiscount && !prevDiscountRef.current) {
        setShowCelebration(true);
      }
      prevDiscountRef.current = newDiscount;
      setDiscountAvailable(newDiscount);
      setBuffetAvailable(profileRes.data.buffet_available);
      setClientCode(profileRes.data.client_code || "");
      setDisplayName(profileRes.data.display_name || "");
      setReferralCode(profileRes.data.referral_code || "");
      setBirthDate(profileRes.data.birth_date || null);
      setTotalSavings(Number(profileRes.data.total_savings) || 0);
    }

    if (txRes.data) {
      setTransactions(
        txRes.data
          .filter((tx: any) => tx.type !== "follow" && tx.type !== "google_review")
          .map((tx: any) => ({
            id: tx.id,
            date: tx.created_at.split("T")[0],
            amount: Number(tx.amount),
            points: tx.points_earned,
            description: tx.description,
            type: tx.type,
            expires_at: tx.expires_at,
            expired: tx.expired,
          })),
      );
    }

    setDataLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime: re-fetch when admin updates profile or transactions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("user-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchData]);

  // Discount is now redeemed by admin only

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground tracking-wide">{t.loading as string}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="max-w-lg mx-auto">
        <header className="relative mb-4">
          <div className="w-full py-[40px] bg-primary rounded-b-[32px] relative shadow-elevated">
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10">
              <img src={logo} alt="Monte Grande" className="w-[260px]" width={260} height={137} />
            </div>
          </div>
          <div className="px-6 pt-4 pb-2 flex items-center justify-between">
            <div>
              {displayName && (
                <p className="font-display text-lg text-foreground">{(t.welcome as (name: string) => string)(displayName)}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <button
                onClick={signOut}
                className="text-muted-foreground hover:text-foreground transition-colors w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center"
                aria-label="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <ReferralButton referralCode={referralCode} />
        </motion.div>

        <BirthdayBanner birthDate={birthDate} />

        <motion.div
          className="mx-4 mt-4 rounded-2xl bg-card shadow-card overflow-hidden"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          <ClientQRCode clientCode={clientCode} />
          <MealCounter meals={meals} discountAvailable={discountAvailable} buffetAvailable={buffetAvailable} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        >
          <AdBanner />
        </motion.div>

        {totalSavings > 0 && (
          <motion.section
            className="mx-4 mt-4 rounded-2xl p-5 bg-card shadow-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
          >
            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">{t.totalSavings as string}</p>
            <p className="font-display text-2xl text-primary">{(t.savedAmount as (n: number) => string)(totalSavings)}</p>
          </motion.section>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        >
          <FollowUsCard />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.32, ease: "easeOut" }}
        >
          <GoogleReviewCard />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
        >
          <PointsBalance points={points} transactions={transactions} />
        </motion.div>

        {showStamp && <StampOverlay pointsGained={lastPointsGained} />}

        <DiscountCelebration
          show={showCelebration}
          onClose={() => setShowCelebration(false)}
        />

        <DeleteAccountSection />
      </div>
    </div>
  );
};

const DeleteAccountSection = () => {
  const { t } = useLanguage();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) {
        toast.error(t.deleteAccountError as string);
      } else {
        toast.success(t.accountDeleted as string);
        await signOut();
        navigate("/login");
      }
    } catch {
      toast.error(t.deleteAccountError as string);
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <footer className="mx-4 my-8 flex flex-col items-center gap-3">
        <Link to="/privacy" className="text-xs text-muted-foreground underline hover:text-foreground transition-colors">
          {t.privacyPolicyTitle as string}
        </Link>
        <button
          onClick={() => setShowConfirm(true)}
          className="text-xs text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          {t.deleteAccount as string}
        </button>
      </footer>
      <ConfirmDialog
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title={t.deleteAccountTitle as string}
        message={t.deleteAccountMsg as string}
      />
    </>
  );
};

export default Index;
