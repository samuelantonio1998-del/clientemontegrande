import { useLanguage } from "@/contexts/LanguageContext";

interface StampOverlayProps {
  pointsGained: number;
}

const StampOverlay = ({ pointsGained }: StampOverlayProps) => {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 bg-foreground/80 flex items-center justify-center">
      <div className="animate-stamp-down flex flex-col items-center">
        <div className="border-2 border-primary px-10 py-8 bg-background rotate-[-3deg]">
          <span className="font-display text-6xl text-primary leading-none">
            +{pointsGained}
          </span>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-2 text-center">
            {t.pointsLabel as string}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StampOverlay;
