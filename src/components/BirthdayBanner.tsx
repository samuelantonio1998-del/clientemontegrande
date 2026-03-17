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
    <section className="mx-4 sm:mx-[100px] mt-4 border border-primary/30 bg-primary/5 p-4 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Fechar"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3">
        <Gift className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
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
