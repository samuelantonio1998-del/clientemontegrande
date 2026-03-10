import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get("type") === "recovery") {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As passwords não coincidem");
      return;
    }
    if (password.length < 6) {
      setError("A password deve ter pelo menos 6 caracteres");
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

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-[0.2em]">
            Link inválido ou expirado
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="mt-4 font-mono text-xs text-muted-foreground underline"
          >
            Voltar ao login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-foreground mb-2 uppercase">
          Nova Password
        </h1>
        <p className="font-mono text-xs text-muted-foreground tracking-[0.2em] uppercase mb-8">
          Define a tua nova password
        </p>

        {success ? (
          <p className="font-mono text-xs text-foreground">
            Password alterada com sucesso! A redirecionar...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-1">
                Nova Password
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
            <div>
              <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-1">
                Confirmar Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? "..." : "Alterar Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
