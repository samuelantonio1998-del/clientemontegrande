import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
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
          emailRedirectTo: window.location.origin,
        },
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
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-foreground mb-2 uppercase">
          {forgotPassword ? "Recuperar" : isLogin ? "Entrar" : "Criar Conta"}
        </h1>
        <p className="font-mono text-xs text-muted-foreground tracking-[0.2em] uppercase mb-8">
          {forgotPassword ? "Insere o teu email" : "Programa de Fidelidade"}
        </p>

        {forgotPassword ? (
          resetSent ? (
            <p className="font-mono text-xs text-foreground">
              Email enviado! Verifica a tua caixa de correio para redefinir a password.
            </p>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-card border-2 border-foreground px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-signal-orange"
                  required
                />
              </div>
              {error && (
                <p className="font-mono text-xs text-destructive">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-signal-orange text-primary-foreground font-mono text-xs uppercase tracking-[0.3em] border-2 border-foreground disabled:opacity-50"
              >
                {loading ? "..." : "Enviar email"}
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-card border-2 border-foreground px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-signal-orange"
                  required
                />
              </div>
            )}
            <div>
              <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-card border-2 border-foreground px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-signal-orange"
                required
              />
            </div>
            <div>
              <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-card border-2 border-foreground px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-signal-orange"
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
              className="w-full py-3 bg-signal-orange text-primary-foreground font-mono text-xs uppercase tracking-[0.3em] border-2 border-foreground disabled:opacity-50"
            >
              {loading ? "..." : isLogin ? "Entrar" : "Registar"}
            </button>
          </form>
        )}

        {isLogin && (
          <button
            onClick={() => { setForgotPassword(true); setError(""); }}
            className="mt-4 font-mono text-xs text-muted-foreground underline block mx-auto"
          >
            Esqueci a password
          </button>
        )}

        <button
          onClick={() => { setIsLogin(!isLogin); setError(""); setForgotPassword(false); setResetSent(false); }}
          className="mt-2 font-mono text-xs text-muted-foreground underline block mx-auto"
        >
          {isLogin ? "Criar conta nova" : "Já tenho conta"}
        </button>
      </div>
    </div>
  );
};

export default Auth;
