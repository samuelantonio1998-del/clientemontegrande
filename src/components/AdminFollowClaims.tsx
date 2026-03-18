import { useState, useEffect } from "react";
import { CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface FollowClaim {
  id: string;
  user_id: string;
  platform: string;
  screenshot_url: string;
  status: string;
  created_at: string;
  display_name: string | null;
}

const AdminFollowClaims = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [claims, setClaims] = useState<FollowClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    const { data } = await supabase
      .from("follow_claims")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (data) {
      // Fetch display names
      const userIds = data.map((c) => c.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const nameMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) || []);

      setClaims(
        data.map((c) => ({
          ...c,
          display_name: nameMap.get(c.user_id) || null,
        }))
      );
    }
    setLoading(false);
  };

  const handleDecision = async (claim: FollowClaim, approved: boolean) => {
    if (!user || actionLoading) return;
    setActionLoading(claim.id);

    const pointsToAward = approved ? (claim.platform === "google_review" ? 50 : 10) : 0;

    // Update claim status
    await supabase
      .from("follow_claims")
      .update({
        status: approved ? "approved" : "rejected",
        points_awarded: pointsToAward,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq("id", claim.id);

    if (approved) {
      // Award points
      await supabase
        .from("profiles")
        .update({
          total_points: (await supabase.from("profiles").select("total_points").eq("user_id", claim.user_id).single()).data?.total_points + 10,
        })
        .eq("user_id", claim.user_id);

      // Log transaction
      const txType = claim.platform === "google_review" ? "google_review" : "follow";
      const txDesc = claim.platform === "google_review" ? "Google Review — 10 pts" : "Instagram follow — 10 pts";

      await supabase.from("transactions").insert({
        user_id: claim.user_id,
        amount: 0,
        points_earned: 10,
        type: txType,
        description: txDesc,
      });

      toast.success((t.followClaimApproved as (name: string) => string)(claim.display_name || ""));
    } else {
      toast.info((t.followClaimRejected as (name: string) => string)(claim.display_name || ""));
    }

    setClaims((prev) => prev.filter((c) => c.id !== claim.id));
    setActionLoading(null);
  };

  // Get signed URL for screenshot viewing
  const getScreenshotUrl = (claim: FollowClaim) => {
    // If it's a path (not a full URL), create a signed URL
    if (!claim.screenshot_url.startsWith("http")) {
      const { data } = supabase.storage
        .from("follow-screenshots")
        .getPublicUrl(claim.screenshot_url);
      return data.publicUrl;
    }
    return claim.screenshot_url;
  };

  if (loading) return null;

  return (
    <section className="border border-border p-4 bg-card mt-4">
      <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3 font-display">
        {t.followClaimsTitle as string} ({claims.length})
      </p>

      {claims.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">
          {"Sem pedidos pendentes"}
        </p>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => (
            <div key={claim.id} className="border border-border p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {claim.display_name || t.noName as string}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {claim.platform === "google_review" ? "Google Review" : "Instagram"}
                  </p>
                </div>
                <a
                  href={getScreenshotUrl(claim)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary flex items-center gap-1 hover:underline"
                >
                  {t.followViewScreenshot as string}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDecision(claim, true)}
                  disabled={actionLoading === claim.id}
                  className="flex-1 py-2 flex items-center justify-center gap-1 text-xs uppercase tracking-widest border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-3 h-3" />
                  {t.followApproveBtn as string}
                </button>
                <button
                  onClick={() => handleDecision(claim, false)}
                  disabled={actionLoading === claim.id}
                  className="flex-1 py-2 flex items-center justify-center gap-1 text-xs uppercase tracking-widest border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-3 h-3" />
                  {t.followRejectBtn as string}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default AdminFollowClaims;
