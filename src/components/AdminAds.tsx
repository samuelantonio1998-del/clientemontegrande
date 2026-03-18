import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Plus, Trash2, ExternalLink, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const ADS_PIN = "1234";

interface Ad {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  active: boolean;
  display_order: number;
  click_count?: number;
}

type PendingAction =
  | { type: "upload"; file: File }
  | { type: "toggle"; ad: Ad }
  | { type: "delete"; ad: Ad };

const AdminAds = () => {
  const { t } = useLanguage();
  const [ads, setAds] = useState<Ad[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newLink, setNewLink] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState(false);
  const pendingAction = useRef<PendingAction | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAds = async () => {
    const { data } = await supabase
      .from("ads")
      .select("*")
      .order("display_order", { ascending: true });
    if (data) setAds(data as Ad[]);
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const requestPin = (action: PendingAction) => {
    pendingAction.current = action;
    setPinValue("");
    setPinError(false);
    setPinDialogOpen(true);
  };

  const confirmPin = async () => {
    if (pinValue !== ADS_PIN) {
      setPinError(true);
      return;
    }
    setPinDialogOpen(false);
    const action = pendingAction.current;
    pendingAction.current = null;
    if (!action) return;

    switch (action.type) {
      case "upload":
        await executeUpload(action.file);
        break;
      case "toggle":
        await executeToggle(action.ad);
        break;
      case "delete":
        await executeDelete(action.ad);
        break;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t.followInvalidFile as string);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t.followFileTooLarge as string);
      return;
    }

    requestPin({ type: "upload", file });
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const executeUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("ads")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("ads")
        .getPublicUrl(fileName);

      await supabase.from("ads").insert({
        title: newTitle || "",
        image_url: publicUrl,
        link_url: newLink || null,
        display_order: ads.length,
      } as any);

      setNewTitle("");
      setNewLink("");
      await fetchAds();
      toast.success(t.adsAdded as string);
    } catch {
      toast.error(t.adsUploadError as string);
    } finally {
      setUploading(false);
    }
  };

  const executeToggle = async (ad: Ad) => {
    await supabase
      .from("ads")
      .update({ active: !ad.active } as any)
      .eq("id", ad.id);
    await fetchAds();
  };

  const executeDelete = async (ad: Ad) => {
    const urlParts = ad.image_url.split("/");
    const fileName = urlParts[urlParts.length - 1];

    await supabase.storage.from("ads").remove([fileName]);
    await supabase.from("ads").delete().eq("id", ad.id);
    await fetchAds();
    toast.success(t.adsDeleted as string);
  };

  return (
    <section className="border border-border p-6 bg-card mt-6">
      <h2 className="font-display text-xl text-foreground mb-4">
        {t.adsManage as string}
      </h2>

      {/* Add new ad */}
      <div className="space-y-2 mb-4">
        <input
          type="text"
          placeholder={t.adsTitle as string}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
        />
        <input
          type="url"
          placeholder={t.adsLinkPlaceholder as string}
          value={newLink}
          onChange={(e) => setNewLink(e.target.value)}
          className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
        />
        <label className="w-full py-3 flex items-center justify-center gap-2 border border-border text-foreground text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors cursor-pointer">
          <Plus className="w-4 h-4" />
          {uploading ? (t.followUploading as string) : (t.adsUploadImage as string)}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {/* Existing ads */}
      <div className="space-y-3">
        {ads.map((ad) => (
          <div
            key={ad.id}
            className={`border border-border p-3 flex items-center gap-3 ${!ad.active ? "opacity-50" : ""}`}
          >
            <img
              src={ad.image_url}
              alt={ad.title}
              className="w-16 h-12 object-cover border border-border flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">{ad.title || "—"}</p>
              {ad.link_url && (
                <a
                  href={ad.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground truncate flex items-center gap-1 hover:text-foreground"
                >
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{ad.link_url}</span>
                </a>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => requestPin({ type: "toggle", ad })}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                title={ad.active ? "Desativar" : "Ativar"}
              >
                {ad.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => requestPin({ type: "delete", ad })}
                className="p-2 text-destructive hover:text-destructive/80 transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {ads.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            {t.adsEmpty as string}
          </p>
        )}
      </div>

      {/* PIN confirmation dialog */}
      {pinDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPinDialogOpen(false)}>
          <div
            className="bg-card border border-border p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg text-foreground mb-2">
              {t.adsEnterPin as string}
            </h3>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pinValue}
              onChange={(e) => {
                setPinValue(e.target.value.replace(/\D/g, ""));
                setPinError(false);
              }}
              autoFocus
              className="w-full bg-background border border-border px-4 py-3 text-sm text-foreground text-center tracking-[0.5em] focus:outline-none focus:border-foreground transition-colors"
              onKeyDown={(e) => e.key === "Enter" && confirmPin()}
            />
            {pinError && (
              <p className="text-xs text-destructive mt-2 text-center">
                {t.adsInvalidPin as string}
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setPinDialogOpen(false)}
                className="flex-1 py-2 border border-border text-xs uppercase tracking-widest text-foreground hover:bg-muted transition-colors"
              >
                {t.cancel as string}
              </button>
              <button
                onClick={confirmPin}
                className="flex-1 py-2 bg-primary text-primary-foreground text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                {t.confirm as string}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminAds;
