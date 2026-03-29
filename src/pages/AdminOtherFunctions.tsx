import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Download, Lock } from "lucide-react";
import AdminAds from "@/components/AdminAds";
import AdminReviews from "@/components/AdminReviews";
import AdminReports from "@/components/AdminReports";
import AdminInactiveUsers from "@/components/AdminInactiveUsers";
import ConfirmDialog from "@/components/ConfirmDialog";

const ADMIN_PIN = "0866";

const AdminOtherFunctions = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [exportingEmails, setExportingEmails] = useState(false);
  const [showExportPin, setShowExportPin] = useState(false);
  const [exportPin, setExportPin] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleUnlock = () => {
    if (pinInput === ADMIN_PIN) {
      setUnlocked(true);
      setPinError("");
    } else {
      setPinError("PIN incorreto");
      setPinInput("");
    }
  };

  if (!unlocked) {
    return (
      <div className="w-full max-w-sm mx-auto mt-12">
        <section className="border border-border p-8 bg-card rounded-2xl text-center">
          <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-display text-xl text-foreground mb-2">
            {t.otherFunctions as string}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Introduza o PIN para aceder
          </p>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            className="w-32 mx-auto block bg-background border border-border px-4 py-3 text-sm text-foreground text-center tracking-[0.5em] focus:outline-none focus:border-foreground transition-colors rounded-xl"
            placeholder="····"
            autoFocus
          />
          {pinError && (
            <p className="text-xs text-destructive mt-2">{pinError}</p>
          )}
          <button
            onClick={handleUnlock}
            className="mt-4 px-8 py-3 bg-foreground text-background text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-full"
          >
            {t.enter as string}
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <AdminAds />
      <AdminReports />
      <AdminInactiveUsers />
      <AdminReviews />

      <section className="border border-border p-6 bg-card mt-6 rounded-2xl">
        <h2 className="font-display text-xl text-foreground mb-4 text-center">
          {t.exportEmails as string}
        </h2>
        {feedback && (
          <p className="text-xs text-center text-muted-foreground mb-3">{feedback}</p>
        )}
        <button
          onClick={() => { setShowExportPin(true); setExportPin(""); }}
          disabled={exportingEmails}
          className="w-full py-4 flex items-center justify-center gap-2 border border-border text-foreground text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors rounded-xl disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {exportingEmails ? t.exportingEmails as string : t.exportEmails as string}
        </button>
      </section>

      <ConfirmDialog
        open={showExportPin}
        title="PIN de Segurança"
        message="Introduza o PIN para exportar os emails."
        onConfirm={async () => {
          setShowExportPin(false);
          setExportingEmails(true);
          try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-emails`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${session?.access_token}`,
                  apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ pin: exportPin }),
              }
            );
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              if (err?.error === "invalid_pin") {
                setFeedback("PIN inválido");
              } else {
                setFeedback(t.exportError as string);
              }
              setExportingEmails(false);
              return;
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "utilizadores.csv";
            a.style.display = "none";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          } catch {
            setFeedback(t.exportError as string);
          }
          setExportingEmails(false);
        }}
        onCancel={() => setShowExportPin(false)}
        pinInput={exportPin}
        onPinChange={setExportPin}
      />
    </div>
  );
};

export default AdminOtherFunctions;
