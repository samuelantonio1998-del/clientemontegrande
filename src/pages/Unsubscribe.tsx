import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type State = "loading" | "success" | "invalid" | "error";

const COPY: Record<Exclude<State, "loading">, { title: string; message: string }> = {
  success: { title: "Subscrição cancelada", message: "Subscrição cancelada. Já não vais receber mais emails do Monte Grande." },
  invalid: { title: "Link inválido", message: "Este link de cancelamento não é válido ou está incompleto." },
  error: { title: "Erro temporário", message: "Não foi possível processar o pedido. Tenta novamente mais tarde." },
};

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    const token = params.get("token");
    if (!token) { setState("invalid"); return; }
    supabase.functions
      .invoke("unsubscribe", { body: { token } })
      .then(({ data, error }) => {
        if (error) setState("error");
        else if (data?.success) setState("success");
        else if (data?.error === "invalid_token") setState("invalid");
        else setState("error");
      })
      .catch(() => setState("error"));
  }, [params]);

  return (
    <main className="min-h-screen bg-background text-foreground flex items-start justify-center px-4 py-10">
      <div className="max-w-lg w-full text-center">
        <img src="/email-header.png" alt="Monte Grande Restaurante" className="mx-auto mb-6 w-full max-w-[450px] h-auto" />
        {state === "loading" ? (
          <p className="text-base" role="status">A processar…</p>
        ) : (
          <>
            <h1 className="font-display text-3xl mb-3">{COPY[state].title}</h1>
            <p className="text-base leading-relaxed">{COPY[state].message}</p>
          </>
        )}
      </div>
    </main>
  );
};

export default Unsubscribe;
