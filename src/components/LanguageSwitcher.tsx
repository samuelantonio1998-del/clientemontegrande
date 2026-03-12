import { useLanguage } from "@/contexts/LanguageContext";

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === "pt" ? "en" : "pt")}
      className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors font-mono"
      aria-label="Change language"
    >
      {language === "pt" ? "EN" : "PT"}
    </button>
  );
};

export default LanguageSwitcher;
