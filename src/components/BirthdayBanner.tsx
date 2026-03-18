import { useLanguage } from "@/contexts/LanguageContext";
import { Gift, X } from "lucide-react";
import { useState } from "react";

interface BirthdayBannerProps {
  birthDate: string | null;
}

const BirthdayBanner = ({ birthDate }: BirthdayBannerProps) => {
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  if (!birthDate || dismissed) return null;

  const today = new Date();
  const birth = new Date(birthDate);
  if (birth.getMonth() !== today.getMonth()) return null;

  return (
    <section className="mx-4 sm:mx-[100px] mt-4 rounded-2xl bg-primary/5 border border-primary/20 p-5 relative shadow-card">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors w-7 h-7 rounded-full bg-background/50 flex items-center justify-center"
        aria-label="Fechar"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Gift className="w-5 h-5 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="font-display text-base text-foreground font-medium">
            {t.birthdayBannerTitle as string}
          </p>
          <p className="text-sm text-muted-foreground">
            {t.birthdayBannerText18 as string}
          </p>
          <p className="text-sm text-muted-foreground">
            {t.birthdayBannerText10 as string}
          </p>
        </div>
      </div>
    </section>
  );
};

export default BirthdayBanner;
