import { useState, useEffect, useRef } from "react";
import { Star, Upload, CheckCircle, Clock, XCircle, Loader2, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const GOOGLE_REVIEW_URL =
  "https://www.google.com/maps/place/Monte+Grande/@39.7495894,-8.9450632,17z/data=!4m8!3m7!1s0x2400989f95a5a593:0x641d8cc554636d30!8m2!3d39.7495894!4d-8.9450632!9m1!1b1!16s";

type ClaimStatus = "none" | "pending" | "approved" | "rejected" | "verifying";

const GoogleReviewCard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [status, setStatus] = useState<ClaimStatus>("none");
  const [uploading, setUploading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchClaimAndProfile();
  }, [user]);

  const fetchClaimAndProfile = async () => {
    if (!user) return;
    const [claimRes, profileRes] = await Promise.all([
      supabase
        .from("follow_claims")
        .select("status")
        .eq("user_id", user.id)
        .eq("platform", "google_review")
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single(),
    ]);

    if (claimRes.data) {
      setStatus(claimRes.data.status as ClaimStatus);
    }
    if (profileRes.data) {
      setDisplayName(profileRes.data.display_name || "");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t.followInvalidFile as string);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t.followFileTooLarge as string);
      return;
    }

    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${user.id}/google-review.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("follow-screenshots")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error(t.followUploadError as string);
      setUploading(false);
      return;
    }

    const { data: claimData, error: claimError } = await supabase
      .from("follow_claims")
      .upsert(
        {
          user_id: user.id,
          platform: "google_review",
          screenshot_url: path,
          status: "pending",
        },
        { onConflict: "user_id,platform" }
      )
      .select("id")
      .single();

    if (claimError || !claimData) {
      toast.error(t.followUploadError as string);
      setUploading(false);
      return;
    }

    setStatus("verifying");
    setUploading(false);

    try {
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
        "verify-google-review",
        {
          body: { screenshot_url: path, claim_id: claimData.id, display_name: displayName },
        }
      );

      if (verifyError) throw verifyError;

      if (verifyData?.status === "approved") {
        setStatus("approved");
        toast.success(t.googleReviewApproved as string);
      } else if (verifyData?.status === "rejected") {
        setStatus("rejected");
        toast.error(t.googleReviewRejected as string);
      } else {
        setStatus("pending");
        toast.success(t.followSubmitted as string);
      }
    } catch (err) {
      console.error("Google review verification error:", err);
      setStatus("pending");
      toast.success(t.followSubmitted as string);
    }
  };

  if (status === "approved") {
    return null;
  }

  const statusIcon: Record<string, JSX.Element> = {
    verifying: <Loader2 className="w-4 h-4 text-primary animate-spin" />,
    pending: <Clock className="w-4 h-4 text-muted-foreground" />,
    rejected: <XCircle className="w-4 h-4 text-destructive" />,
  };

  const statusTextMap: Record<string, string> = {
    verifying: t.loading as string,
    pending: t.followPending as string,
    rejected: t.googleReviewRejectedRetry as string,
  };

  return (
    <section className="mx-4 mt-4 rounded-2xl p-5 bg-card shadow-card">
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-5 h-5 text-primary" />
        <p className="text-xs tracking-widest uppercase text-muted-foreground font-display">
          {t.googleReviewTitle as string}
        </p>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {t.googleReviewDescription as string}
      </p>

      <a
        href={GOOGLE_REVIEW_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full mb-3 py-3 rounded-full flex items-center justify-center gap-2 bg-foreground text-background text-xs uppercase tracking-widest hover:bg-foreground/90 transition-all duration-200"
      >
        <ExternalLink className="w-4 h-4" />
        {t.googleReviewOpen as string}
      </a>

      {status === "none" || status === "rejected" ? (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full py-3 rounded-full flex items-center justify-center gap-2 border-2 border-primary text-primary text-xs uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all duration-200 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? (t.followUploading as string) : (t.followUploadScreenshot as string)}
          </button>
          <p className="text-[10px] text-muted-foreground/70 italic mt-2 text-center">
            {t.googleReviewHint as string}
          </p>
          {status === "rejected" && (
            <p className="text-xs text-destructive mt-2 text-center flex items-center justify-center gap-1">
              {statusIcon.rejected} {statusTextMap.rejected}
            </p>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center gap-2 py-3 text-sm">
          {statusIcon[status]}
          <span className="text-muted-foreground">{statusTextMap[status]}</span>
        </div>
      )}
    </section>
  );
};

export default GoogleReviewCard;
