import { useLanguage } from "@/contexts/LanguageContext";

const EnFlag = () => (
  <svg width="16" height="12" viewBox="0 0 16 12" fill="none" className="inline-block">
    <rect width="16" height="12" fill="hsl(var(--muted))" />
    <path d="M0 0L16 12M16 0L0 12" stroke="hsl(var(--primary))" strokeWidth="1.5" />
    <path d="M8 0V12M0 6H16" stroke="hsl(var(--primary))" strokeWidth="2.5" />
    <path d="M8 0V12M0 6H16" stroke="hsl(var(--foreground))" strokeWidth="1" />
  </svg>
);

const PtFlag = () => (
  <svg width="16" height="12" viewBox="0 0 16 12" fill="none" className="inline-block">
    <rect width="6" height="12" fill="hsl(var(--primary))" />
    <rect x="6" width="10" height="12" fill="hsl(var(--muted))" />
    <circle cx="6" cy="6" r="2.5" stroke="hsl(var(--foreground))" strokeWidth="0.8" fill="none" />
  </svg>
);

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === "pt" ? "en" : "pt")}
      className="tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors font-mono text-sm flex items-center gap-1.5"
      aria-label="Change language">
      {language === "pt" ? <><EnFlag /> EN</> : <><PtFlag /> PT</>}
    </button>);

};

export default LanguageSwitcher;