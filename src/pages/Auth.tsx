import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo-mg-horizontal-bege.svg";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  // Listen for auth state changes (handles OAuth redirect return)
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
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
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        navigate("/");
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: window.location.origin
        }
      });
      if (error) {
        setError(error.message);
      } else {
        navigate("/");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="relative">
        <div className="w-full h-2 bg-primary mx-0 my-0 px-0 py-[40px]" />
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10">
          <img src={logo} alt="Monte Grande" className="w-[260px]" />
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center">
        <p className="tracking-wide mb-8 text-secondary-foreground font-mono font-light text-lg">
          {forgotPassword ? "Insere o teu email" : "Programa de Fidelidade"}
        </p>

        {forgotPassword ?
          resetSent ?
          <p className="text-sm text-foreground">
              Email enviado! Verifica a tua caixa de correio para redefinir a password.
            </p> :

          <form onSubmit={handleForgotPassword} className="space-y-4 w-full">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Email</label>
                <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-card border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
                required />
              
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground text-sm uppercase tracking-widest disabled:opacity-50 hover:opacity-90 transition-opacity">
              
                {loading ? "..." : "Enviar email"}
              </button>
            </form> :


          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin &&
            <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Nome</label>
                <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-card border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
                required />
              
              </div>
            }
            <div>
              <label className="text-xs uppercase tracking-wider block mb-1 text-secondary-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-card border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors text-center"
                required />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider block mb-1 text-secondary-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-card border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
                required
                minLength={6} />
              
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground text-sm uppercase tracking-widest disabled:opacity-50 hover:opacity-90 transition-opacity">
              
              {loading ? "..." : isLogin ? "Entrar" : "Registar"}
            </button>
          </form>
          }

        {!forgotPassword &&
          <>
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs uppercase tracking-wider text-secondary-foreground">ou</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <button
              onClick={async () => {
                const { error } = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: window.location.origin
                });
                if (error) setError(error.message);
              }}
              className="w-full py-3 bg-card text-foreground text-sm uppercase tracking-wider border border-border flex items-center justify-center gap-2 hover:bg-muted transition-colors">
              
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                
              </svg>
              Entrar com Google
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
            
            Recuperar Password
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
            
          {isLogin ? "Criar Conta" : "Já tenho conta"}
        </button>
      </div>
      </div>
    </div>);

};

export default Auth;