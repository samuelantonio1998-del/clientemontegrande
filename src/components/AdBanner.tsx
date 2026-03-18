import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

interface Ad {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
}

const AdBanner = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);

  useEffect(() => {
    const fetchAds = async () => {
      const { data } = await supabase
        .from("ads")
        .select("id, title, image_url, link_url")
        .eq("active", true)
        .order("display_order", { ascending: true });
      if (data) setAds(data as Ad[]);
    };
    fetchAds();
  }, []);

  if (ads.length === 0) return null;

  return (
    <>
      <div className="space-y-3 mx-4 sm:mx-[100px] mt-4">
        {ads.map((ad) => (
          <div
            key={ad.id}
            className="border border-border overflow-hidden bg-card cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setSelectedAd(ad)}
          >
            <img
              src={ad.image_url}
              alt={ad.title || "Anúncio"}
              className="w-full h-auto block"
              loading="lazy"
            />
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest px-2 py-1">
              Anúncio{ad.title ? `. ${ad.title}` : ""}
            </p>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedAd} onOpenChange={(open) => !open && setSelectedAd(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Entrar em contacto</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {selectedAd?.title || "Anúncio"}
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSelectedAd(null)}>
              Fechar
            </Button>
            {selectedAd?.link_url && (
              <Button asChild>
                <a
                  href={selectedAd.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  Visitar
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdBanner;
