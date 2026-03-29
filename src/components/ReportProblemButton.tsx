import { useState } from "react";
import { MessageCircleWarning, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ReportProblemButton = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!user || !message.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase
        .from("problem_reports" as any)
        .insert({ user_id: user.id, message: message.trim() } as any);
      if (error) throw error;
      toast.success(t.reportSent as string);
      setMessage("");
      setOpen(false);
    } catch {
      toast.error(t.reportError as string);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-elevated flex items-center justify-center hover:opacity-90 transition-opacity"
        aria-label={t.reportProblem as string}
      >
        <MessageCircleWarning className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-card rounded-2xl shadow-elevated p-6 animate-in slide-in-from-bottom-4 duration-300">
            <h3 className="font-display text-lg text-foreground mb-1">
              {t.reportProblem as string}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {t.reportProblemDesc as string}
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 500))}
              placeholder={t.reportPlaceholder as string}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors resize-none min-h-[100px]"
              rows={4}
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-right mt-1 mb-3">
              {message.length}/500
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-3 text-xs uppercase tracking-widest border border-border rounded-full hover:bg-muted transition-colors"
              >
                {t.cancel as string}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!message.trim() || sending}
                className="flex-1 py-3 text-xs uppercase tracking-widest bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                {sending ? t.loading as string : t.reportSend as string}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportProblemButton;
