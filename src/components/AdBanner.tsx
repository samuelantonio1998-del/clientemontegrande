import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Ad {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
}

const AdBanner = () => {
  const [ads, setAds] = useState<Ad[]>([]);

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
    <div className="space-y-3 mx-4 sm:mx-[100px] mt-4">
      {ads.map((ad) => {
        const content = (
          <img
            src={ad.image_url}
            alt={ad.title || "Anúncio"}
            className="w-full h-auto block"
            loading="lazy"
          />
        );

        return ad.link_url ? (
          <a
            key={ad.id}
            href={ad.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-border overflow-hidden bg-card hover:opacity-90 transition-opacity"
          >
            {content}
          </a>
        ) : (
          <div key={ad.id} className="border border-border overflow-hidden bg-card">
            {content}
          </div>
        );
      })}
    </div>
  );
};

export default AdBanner;
