import { useEffect, useState, useCallback } from "react";
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
  const [ads, setAds] = useState<Ad[]>([]);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  // Auto-rotate every 10 seconds
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
      <div className="mx-4 sm:mx-[100px] mt-4">
        <div
          className="border border-border overflow-hidden bg-card cursor-pointer hover:opacity-90 transition-opacity relative"
          onClick={() => setSelectedAd(currentAd)}
        >
          {/* Navigation arrows */}
          {ads.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-primary hover:text-primary/70 transition-colors"
                aria-label="Anúncio anterior"
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-primary hover:text-primary/70 transition-colors"
                aria-label="Próximo anúncio"
              >
                <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </>
          )}

          <img
            src={currentAd.image_url}
            alt={currentAd.title || "Anúncio"}
            className="w-full h-auto block"
            loading="lazy"
          />

          {/* Label bar */}
          <div className="flex items-center justify-between px-2 py-1">
            <span className="bg-primary text-primary-foreground text-[10px] uppercase tracking-widest px-2 py-0.5 font-medium">
              Anúncio
            </span>
            {currentAd.title && (
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                {currentAd.title}
              </span>
            )}
          </div>
        </div>

        {/* Dots indicator */}
        {ads.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-2">
            {ads.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === currentIndex ? "bg-primary" : "bg-muted-foreground/30"
                }`}
                aria-label={`Ir para anúncio ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedAd} onOpenChange={(open) => !open && setSelectedAd(null)}>
        <DialogContent className="max-w-sm">
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
