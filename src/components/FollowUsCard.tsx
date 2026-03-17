import { useState, useEffect, useRef } from "react";
import { Instagram, Upload, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const INSTAGRAM_URL = "https://www.instagram.com/restaurante_monte_grande/";

type ClaimStatus = "none" | "pending" | "approved" | "rejected" | "verifying";

const FollowUsCard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [status, setStatus] = useState<ClaimStatus>("none");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchClaim();
  }, [user]);

  const fetchClaim = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("follow_claims")
      .select("status")
      .eq("user_id", user.id)
      .eq("platform", "instagram")
      .maybeSingle();

    if (data) {
      setStatus(data.status as ClaimStatus);
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
    const path = `${user.id}/instagram-follow.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("follow-screenshots")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error(t.followUploadError as string);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("follow-screenshots")
      .getPublicUrl(path);

    const screenshotUrl = urlData.publicUrl || path;

    // Insert/upsert the claim as pending first
    const { data: claimData, error: claimError } = await supabase
      .from("follow_claims")
      .upsert(
        {
          user_id: user.id,
          platform: "instagram",
          screenshot_url: screenshotUrl,
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

    // Call AI verification
    try {
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
        "verify-follow-screenshot",
        {
          body: { screenshot_url: screenshotUrl, claim_id: claimData.id },
        }
      );

      if (verifyError) throw verifyError;

      if (verifyData?.status === "approved") {
        setStatus("approved");
        toast.success(t.followApproved as string);
      } else if (verifyData?.status === "rejected") {
        setStatus("rejected");
        toast.error(t.followRejected as string);
      } else {
        setStatus("pending");
        toast.success(t.followSubmitted as string);
      }
    } catch (err) {
      console.error("Verification error:", err);
      setStatus("pending");
      toast.success(t.followSubmitted as string);
    }
  };

  const statusIcon = {
    verifying: <Loader2 className="w-4 h-4 text-primary animate-spin" />,
    pending: <Clock className="w-4 h-4 text-yellow-500" />,
    approved: <CheckCircle className="w-4 h-4 text-green-500" />,
    rejected: <XCircle className="w-4 h-4 text-destructive" />,
  };

  const statusText = {
    pending: t.followPending as string,
    approved: t.followApproved as string,
    rejected: t.followRejected as string,
  };

  return (
    <section className="mx-4 sm:mx-[100px] mt-4 border border-border p-4 bg-card">
      <div className="flex items-center gap-2 mb-3">
        <Instagram className="w-5 h-5 text-primary" />
        <p className="text-xs tracking-widest uppercase text-muted-foreground font-display">
          {t.followUsTitle as string}
        </p>
      </div>

      <p className="text-sm text-muted-foreground mb-3">
        {t.followUsDescription as string}
      </p>

      {/* Step 1: Follow link */}
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full mb-3 py-3 flex items-center justify-center gap-2 border border-border text-foreground text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
      >
        <Instagram className="w-4 h-4" />
        {t.followOpenInstagram as string}
      </a>

      {/* Step 2: Upload or status */}
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
            className="w-full py-3 flex items-center justify-center gap-2 border border-primary text-primary text-xs uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? (t.followUploading as string) : (t.followUploadScreenshot as string)}
          </button>
          {status === "rejected" && (
            <p className="text-xs text-destructive mt-2 text-center flex items-center justify-center gap-1">
              {statusIcon.rejected} {t.followRejectedRetry as string}
            </p>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center gap-2 py-3 text-sm">
          {statusIcon[status]}
          <span className={status === "approved" ? "text-green-600" : "text-muted-foreground"}>
            {statusText[status]}
          </span>
          {status === "approved" && (
            <span className="text-primary font-display ml-1">+10 {t.pts as string}</span>
          )}
        </div>
      )}
    </section>
  );
};

export default FollowUsCard;
