import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import logo from "@/assets/logo-mg-horizontal-bege.svg";
import { checkRateLimit } from "@/lib/rateLimit";

const MAX_ATTEMPTS = 5;

const BirthDateInput = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => {
  const parts = value ? value.split("-") : ["", "", ""];
  const [year, month, day] = [parts[0] || "", parts[1] || "", parts[2] || ""];

  const update = (d: string, m: string, y: string) => {
    const dd = d.replace(/\D/g, "").slice(0, 2);
    const mm = m.replace(/\D/g, "").slice(0, 2);
    const yy = y.replace(/\D/g, "").slice(0, 4);
    if (dd && mm && yy.length === 4) {
      onChange(`${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`);
    } else {
      onChange(`${yy}-${mm}-${dd}`);
    }
  };

  const inputClass = "bg-card border border-border rounded-xl px-2 py-3 text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200";

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        inputMode="numeric"
        placeholder="DD"
        maxLength={2}
        value={day}
        onChange={(e) => update(e.target.value, month, year)}
        className={`${inputClass} w-14`}
        required
      />
      <span className="text-muted-foreground">/</span>
      <input
        type="text"
        inputMode="numeric"
        placeholder="MM"
        maxLength={2}
        value={month}
        onChange={(e) => update(day, e.target.value, year)}
        className={`${inputClass} w-14`}
        required
      />
      <span className="text-muted-foreground">/</span>
      <input
        type="text"
        inputMode="numeric"
        placeholder="AAAA"
        maxLength={4}
        value={year}
        onChange={(e) => update(day, month, e.target.value)}
        className={`${inputClass} w-20`}
        required
      />
    </div>
  );
};
const LOCKOUT_MS = 60_000;

const Auth = () => {
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref");
  const [isLogin, setIsLogin] = useState(!refCode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        navigate("/");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateInputs = (): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError(t.invalidEmail as string);
      return false;
    }
    if (password.length < 6) {
      setError(t.passwordMinLength as string);
      return false;
    }
    if (!isLogin) {
      if (!displayName.trim()) {
        setError(t.nameRequired as string);
        return false;
      }
      if (displayName.trim().length > 100) {
        setError(t.nameTooLong as string);
        return false;
      }
      if (!birthDate) {
        setError(t.birthdayRequired as string);
        return false;
      }
      if (!privacyAccepted) {
        setError(t.privacyRequired as string);
        return false;
      }
    }
    return true;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const rateCheck = await checkRateLimit("reset", email.trim().toLowerCase());
    if (!rateCheck.allowed) {
      setError(t.tooManyAttempts as string);
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (Date.now() < lockedUntil) {
      setError(t.tooManyAttempts as string);
      return;
    }

    if (!validateInputs()) return;

    setLoading(true);

    // Server-side rate limit check
    const action = isLogin ? "login" : "signup";
    const rateCheck = await checkRateLimit(action, email.trim().toLowerCase());
    if (!rateCheck.allowed) {
      setError(t.tooManyAttempts as string);
      setLoading(false);
      return;
    }

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= MAX_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCKOUT_MS);
          setAttempts(0);
          setError(t.tooManyAttempts as string);
        } else {
          setError(error.message);
        }
      } else {
        setAttempts(0);
        navigate("/");
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName.trim(),
            birth_date: birthDate,
            ...(refCode ? { referral_code: refCode } : {}),
          },
          emailRedirectTo: window.location.origin
        }
      });
      if (error) {
        setError(error.message);
      } else {
        setSignUpSuccess(true);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="relative">
        <div className="w-full h-2 mx-0 my-0 px-0 py-[40px] bg-primary rounded-b-[32px] shadow-elevated" />
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10">
          <img src={logo} alt="Monte Grande" className="w-[260px]" width={260} height={137} fetchPriority="high" />
        </div>
      </header>
      <nav className="flex justify-end px-4 pt-2">
        <LanguageSwitcher />
      </nav>
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          {signUpSuccess ?
          <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center shadow-card">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-foreground">{t.accountCreated as string}</p>
              <p className="text-sm text-muted-foreground">{t.checkEmailVerification as string}</p>
              <button
              onClick={() => {
                setSignUpSuccess(false);
                setIsLogin(true);
              }}
              className="mt-4 underline text-sm text-secondary-foreground">
                {t.backToLogin as string}
              </button>
            </div> :

          <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
            <h2 className="text-2xl font-display font-bold text-foreground mb-1">
              {forgotPassword ? (t.recoverPassword as string) : isLogin ? (t.welcomeBack as string) : (t.createAccount as string)}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {forgotPassword ? (t.enterEmail as string) : isLogin ? (t.loginSubtitle as string) : (t.signupSubtitle as string)}
            </p>

          {forgotPassword ?
            resetSent ?
            <p className="text-sm text-foreground">{t.emailSent as string}</p> :

            <form onSubmit={handleForgotPassword} className="space-y-4 w-full">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">{t.email as string}</label>
                   <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
                  required />
              
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-primary text-primary-foreground text-sm uppercase tracking-widest disabled:opacity-50 hover:bg-primary/90 transition-all duration-200 shadow-button">
              
                  {loading ? "..." : t.sendEmail as string}
                </button>
              </form> :


            <form onSubmit={handleSubmit} className="space-y-4 w-full">
              {!isLogin &&
              <>
              <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">{t.name as string}</label>
                  <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
                  required />
                </div>
              <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">{t.birthday as string}</label>
                  <BirthDateInput value={birthDate} onChange={setBirthDate} />
                </div>
              </>
              }
              <div>
                <label htmlFor="auth-email" className="text-xs uppercase tracking-wider block mb-1 text-secondary-foreground">{t.email as string}</label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 text-center"
                  required />
              
              </div>
              <div>
                <label htmlFor="auth-password" className="text-xs uppercase tracking-wider block mb-1 text-secondary-foreground">{t.password as string}</label>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 pr-12 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
                    required
                    minLength={6} />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-3"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="mt-1 accent-primary"
                  />
                  <span className="text-sm text-secondary-foreground">
                    {t.privacyConsent as string}{" "}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline text-sm text-secondary-foreground hover:text-foreground transition-colors">
                      {t.privacyPolicyLink as string}
                    </a>
                  </span>
                </label>
              )}

              {error && <p className="text-xs text-destructive">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full text-primary-foreground text-sm uppercase tracking-widest disabled:opacity-50 hover:bg-primary/90 transition-all duration-200 bg-primary shadow-button">
              
                {loading ? "..." : isLogin ? t.enter as string : t.register as string}
              </button>
            </form>
            }

          {!forgotPassword &&
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs uppercase tracking-wider text-secondary-foreground">{t.or as string}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <button
                onClick={async () => {
                  const { error } = await lovable.auth.signInWithOAuth("google", {
                    redirect_uri: window.location.origin
                  });
                  if (error) setError(error.message);
                }}
                className="w-full py-3 rounded-full bg-card text-foreground text-sm uppercase tracking-wider border border-border flex items-center justify-center gap-2 hover:bg-muted transition-all duration-200 shadow-card">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {t.loginGoogle as string}
              </button>

              <button
                onClick={async () => {
                  const { error } = await lovable.auth.signInWithOAuth("apple", {
                    redirect_uri: window.location.origin
                  });
                  if (error) setError(error.message);
                }}
                className="w-full py-3 rounded-full bg-card text-foreground text-sm uppercase tracking-wider border border-border flex items-center justify-center gap-2 hover:bg-muted transition-all duration-200 shadow-card mt-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                {t.loginApple as string}
              </button>
            </>
          }

          {isLogin &&
            <button
              onClick={() => {
                setForgotPassword(true);
                setError("");
              }}
              className="mt-4 underline block mx-auto transition-colors text-secondary-foreground my-px text-sm">
              {t.recoverPassword as string}
            </button>
          }

          <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setForgotPassword(false);
                setResetSent(false);
              }}
              className="mt-2 underline block mx-auto transition-colors text-sm text-secondary-foreground">
            {isLogin ? t.createAccount as string : t.haveAccount as string}
          </button>
          </div>
          }
        </div>
      </main>
    </div>);

};

export default Auth;