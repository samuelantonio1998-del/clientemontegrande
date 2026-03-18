import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, ChevronLeft, ChevronRight } from "lucide-react";

interface Ad {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
}

const AdBanner = () => {
  const { t } = useLanguage();
  const [ads, setAds] = useState<Ad[]>([]);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchAds = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("ads")
        .select("id, title, image_url, link_url, start_date, end_date")
        .eq("active", true)
        .order("display_order", { ascending: true });
      if (data) {
        const filtered = (data as any[]).filter((ad) => {
          if (ad.start_date && ad.start_date > today) return false;
          if (ad.end_date && ad.end_date < today) return false;
          return true;
        });
        setAds(filtered);
      }
    };
    fetchAds();
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [ads.length]);

  const goToPrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
  }, [ads.length]);

  const goToNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  }, [ads.length]);

  if (ads.length === 0) return null;

  const currentAd = ads[currentIndex];

  return (
    <>
      <div className="mx-4 mt-4">
        <div
          className="rounded-2xl overflow-hidden bg-card cursor-pointer hover:shadow-elevated transition-all duration-300 shadow-card relative"
          onClick={() => setSelectedAd(currentAd)}
        >
          {ads.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-primary hover:bg-card transition-colors"
                aria-label="Anúncio anterior"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={2} />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-primary hover:bg-card transition-colors"
                aria-label="Próximo anúncio"
              >
                <ChevronRight className="w-4 h-4" strokeWidth={2} />
              </button>
            </>
          )}

          <img
            src={currentAd.image_url}
            alt={currentAd.title || (t.adLabel as string)}
            className="w-full h-auto block"
            loading="lazy"
          />

          <div className="flex items-center justify-between px-4 py-2">
            <span className="bg-primary text-primary-foreground text-[10px] uppercase tracking-widest px-3 py-1 font-medium rounded-full">
              {t.adLabel as string}
            </span>
            {currentAd.title && (
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                {currentAd.title}
              </span>
            )}
          </div>
        </div>

        {ads.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {ads.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex ? "bg-primary w-4" : "bg-muted-foreground/30 w-1.5"
                }`}
                aria-label={`Ir para anúncio ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedAd} onOpenChange={(open) => !open && setSelectedAd(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Entrar em contacto</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {selectedAd?.title || "Anúncio"}
          </p>
          <DialogFooter>
            {selectedAd?.link_url && (
              <Button asChild>
                <a
                  href={selectedAd.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5"
                  onClick={() => {
                    if (selectedAd) {
                      supabase.from("ad_clicks").insert({ ad_id: selectedAd.id }).then();
                    }
                  }}
                >
                  <Mail className="w-4 h-4" />
                  Enviar email
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
