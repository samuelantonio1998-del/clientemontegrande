import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingRecovery, setCheckingRecovery] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    if (hashParams.get("type") === "recovery" || hash.includes("access_token")) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
        setCheckingRecovery(false);
      }
    });

    const timeout = setTimeout(() => setCheckingRecovery(false), 2000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (checkingRecovery && !isRecovery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-[0.3em]">
          {t.checking as string}
        </p>
      </div>
    );
  }

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-[0.2em]">
            {t.invalidLink as string}
          </p>
          <button
            onClick={() => navigate("/login")}
            className="mt-4 font-mono text-xs text-muted-foreground underline"
          >
            {t.backToLogin as string}
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t.passwordsDontMatch as string);
      return;
    }
    if (password.length < 6) {
      setError(t.passwordMinLength as string);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/"), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="absolute top-6 right-6">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-foreground mb-2 uppercase">
          {t.newPassword as string}
        </h1>
        <p className="font-mono text-xs text-muted-foreground tracking-[0.2em] uppercase mb-8">
          {t.setNewPassword as string}
        </p>

        {success ? (
          <p className="font-mono text-xs text-foreground">
            {t.passwordChanged as string}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-1">
                {t.newPassword as string}
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-card border-2 border-foreground px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-primary"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-1">
                {t.confirmPassword as string}
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-card border-2 border-foreground px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-primary"
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="font-mono text-xs text-destructive">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-[0.3em] border-2 border-foreground disabled:opacity-50"
            >
              {loading ? "..." : (t.changePassword as string)}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
