import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { MoreHorizontal, Undo2, Clock, Loader2 } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";

interface AdminAction {
  id: string;
  admin_id: string;
  client_user_id: string;
  client_name: string | null;
  client_code: string | null;
  action_type: string;
  description: string;
  points_changed: number;
  transaction_id: string | null;
  created_at: string;
  undone: boolean;
}

interface AdminActionHistoryProps {
  refreshKey?: number;
}

const AdminActionHistory = ({ refreshKey }: AdminActionHistoryProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [undoingId, setUndoingId] = useState<string | null>(null);
  const [confirmUndo, setConfirmUndo] = useState<AdminAction | null>(null);

  const fetchActions = async () => {
    const { data } = await supabase
      .from("admin_actions")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setActions(data as AdminAction[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchActions();
  }, [refreshKey]);

  const handleUndo = async (action: AdminAction) => {
    if (!user || action.undone) return;
    setUndoingId(action.id);

    try {
      // Reverse the points on the profile
      if (action.action_type === "meal") {
        // Get current profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", action.client_user_id)
          .single();

        if (profile) {
          await supabase
            .from("profiles")
            .update({
              total_points: Math.max(0, profile.total_points - action.points_changed),
              consecutive_meals: Math.max(0, profile.consecutive_meals - 1),
            })
            .eq("user_id", action.client_user_id);
        }
      } else if (action.action_type === "redeem_discount") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", action.client_user_id)
          .single();

        if (profile) {
          await supabase
            .from("profiles")
            .update({
              discount_available: true,
              total_savings: Math.max(0, profile.total_savings - 10),
            })
            .eq("user_id", action.client_user_id);
        }
      } else if (action.action_type === "redeem_buffet") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", action.client_user_id)
          .single();

        if (profile) {
          await supabase
            .from("profiles")
            .update({
              buffet_available: true,
              total_points: profile.total_points + 200,
            })
            .eq("user_id", action.client_user_id);
        }
      }

      // Delete the related transaction if exists
      if (action.transaction_id) {
        // We can't delete transactions due to RLS, but we can mark the action as undone
        // The transaction stays but points are reversed
      }

      // Mark action as undone
      await supabase
        .from("admin_actions")
        .update({ undone: true })
        .eq("id", action.id);

      await fetchActions();
    } finally {
      setUndoingId(null);
      setConfirmUndo(null);
    }
  };

  const visible = expanded ? actions : actions.slice(0, 6);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);

    if (diffMin < 1) return "agora";
    if (diffMin < 60) return `${diffMin}m`;
    if (diffH < 24) return `${diffH}h`;
    return `${Math.floor(diffH / 24)}d`;
  };

  const getActionLabel = (action: AdminAction) => {
    const labels: Record<string, string> = {
      meal: t.weekdayMeal as string,
      redeem_discount: t.redeemDiscount as string,
      redeem_buffet: t.redeemBuffet as string,
    };
    return labels[action.action_type] || action.action_type;
  };

  if (loading) return null;
  if (actions.length === 0) return null;

  return (
    <section className="mt-4 border border-border p-6 bg-card">
      <h2 className="font-display text-lg text-foreground mb-4">
        {t.actionHistory as string}
      </h2>

      <div className="space-y-0">
        {visible.map((action) => (
          <div
            key={action.id}
            className={`flex items-center py-3 border-b border-border text-sm gap-3 ${action.undone ? "opacity-40" : ""}`}
          >
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <span className="text-foreground truncate">
                {action.client_name || action.client_code || "—"}{" "}
                <span className="text-muted-foreground">· {getActionLabel(action)}</span>
              </span>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{formatTime(action.created_at)}</span>
                {action.undone && (
                  <span className="text-destructive ml-1">({t.undone as string})</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {action.points_changed !== 0 && (
                <span className={`text-sm font-semibold ${action.points_changed > 0 ? "text-primary" : "text-destructive"}`}>
                  {action.points_changed > 0 ? "+" : ""}{action.points_changed} {t.pts as string}
                </span>
              )}

              {!action.undone && (
                <button
                  onClick={() => setConfirmUndo(action)}
                  disabled={!!undoingId}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                  aria-label={t.undoAction as string}
                >
                  {undoingId === action.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Undo2 className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!expanded && actions.length > 6 && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex justify-center pt-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      )}

      <ConfirmDialog
        open={!!confirmUndo}
        title={t.confirmUndoTitle as string}
        message={t.confirmUndoMsg as string}
        onConfirm={() => confirmUndo && handleUndo(confirmUndo)}
        onCancel={() => setConfirmUndo(null)}
      />
    </section>
  );
};

export default AdminActionHistory;
