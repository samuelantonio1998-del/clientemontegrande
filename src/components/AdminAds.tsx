import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Plus, Trash2, ExternalLink, Eye, EyeOff, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface Ad {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  active: boolean;
  display_order: number;
}

const AdminAds = () => {
  const { t } = useLanguage();
  const [ads, setAds] = useState<Ad[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newLink, setNewLink] = useState("");
  const [newTitle, setNewTitle] = useState("");

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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const toggleActive = async (ad: Ad) => {
    await supabase
      .from("ads")
      .update({ active: !ad.active } as any)
      .eq("id", ad.id);
    await fetchAds();
  };

  const deleteAd = async (ad: Ad) => {
    // Extract filename from URL
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
            type="file"
            accept="image/*"
            onChange={handleUpload}
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
                onClick={() => toggleActive(ad)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                title={ad.active ? "Desativar" : "Ativar"}
              >
                {ad.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => deleteAd(ad)}
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
    </section>
  );
};

export default AdminAds;
