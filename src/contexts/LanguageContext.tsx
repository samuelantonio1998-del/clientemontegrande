import { createContext, useContext, useState, ReactNode } from "react";

type Language = "pt" | "en";

const translations = {
  pt: {
    // Index
    loyaltyProgram: "programa de fidelidade",
    welcome: (name: string) => `Olá, ${name}`,
    code: "Código",
    loading: "A carregar...",
    totalSavings: "poupança total",
    savedAmount: (amount: number) => `Já economizou ${amount}€`,

    // MealCounter
    discountAvailable: "Desconto 10€ Disponível",
    weekMeals: "Refeições da Semana",
    useDiscount: "Usar Desconto 10€",
    mealsRemaining: (n: number) => `${n} ${n !== 1 ? "refeições" : "refeição"} para desconto de 10€`,

    // PointsBalance
    points: "Pontos",
    pts: "pts",
    history: "Histórico",
    meal: "Refeição",
    mealsLabel: "refeições",
    noTransactions: "Sem transações",

    // ClientQRCode
    yourQRCode: "o seu código qr",

    // StampOverlay
    pointsLabel: "pontos",

    // Auth
    enterEmail: "Insere o teu email",
    loyaltyProgramTitle: "Programa de Fidelidade",
    emailSent: "Email enviado! Verifica a tua caixa de correio para redefinir a password.",
    email: "Email",
    sendEmail: "Enviar email",
    name: "Nome",
    password: "Password",
    enter: "Entrar",
    register: "Registar",
    or: "ou",
    loginGoogle: "Entrar com Google",
    loginApple: "Entrar com Apple",
    recoverPassword: "Recuperar Password",
    createAccount: "Criar Conta",
    haveAccount: "Já tenho conta",

    // Admin
    administration: "administração",
    registerMeal: "Registar Refeição",
    clientCode: "Código cliente",
    readQR: "Ler Código QR",
    checking: "A verificar...",
    client: "Cliente",
    noName: "Sem nome",
    weekMealsAdmin: "Refeições semana",
    discount10Active: "Desconto 10€ ativo",
    assignPoints: "Atribuir Pontos",
    value: "Valor €",
    score: "Pontuar",
    oneEuroOnePoint: "1€ = 1 ponto",
    mealCountPlaceholder: "Nº refeições",
    tenPointsPerMeal: "10 pontos por refeição",
    weekdayMeal: "Refeição Dia Útil",
    registerMealBtn: "Registar Refeição",
    weekdayMealRule: "Cada refeição = 10 pontos · 4 refeições na semana = 10€ desconto",
    clientNotFound: "Cliente não encontrado",
    codeMustBe6: "O código deve ter 6 dígitos",
    weekdayOnly: "Refeições de desconto só contam em dias úteis",
    dailyMealLimit: "Este cliente já tem uma refeição registada hoje",
    pointsAssigned: (n: number) => `+${n} pontos atribuídos`,
    discountUnlocked: "Desconto de 10€ desbloqueado!",
    mealRegistered: (n: number) => `Refeição ${n}/4 registada`,
    mealDescription: (reached: boolean, n: number) =>
      reached ? "4ª refeição — desconto 10€ desbloqueado" : `Refeição ${n}/4 (semana)`,
    mealPointsDesc: "Refeição — pontos",

    // QRScanner
    scannerQR: "scanner qr",
    pointCamera: "Aponte a câmara para o código QR do cliente",
    cameraError: "Não foi possível aceder à câmara",

    // ResetPassword
    newPassword: "Nova Password",
    setNewPassword: "Define a tua nova password",
    passwordChanged: "Password alterada com sucesso! A redirecionar...",
    confirmPassword: "Confirmar Password",
    changePassword: "Alterar Password",
    passwordsDontMatch: "As passwords não coincidem",
    passwordMinLength: "A password deve ter pelo menos 6 caracteres",
    invalidLink: "Link inválido ou expirado",
    backToLogin: "Voltar ao login",
    accountCreated: "Conta criada com sucesso!",
    checkEmailVerification: "Verifica o teu email para ativar a tua conta.",

    // NotFound
    pageNotFound: "Página não encontrada",
    returnHome: "Voltar ao início",
  },
  en: {
    loyaltyProgram: "loyalty program",
    welcome: (name: string) => `Hello, ${name}`,
    code: "Code",
    loading: "Loading...",
    totalSavings: "total savings",
    savedAmount: (amount: number) => `You saved ${amount}€`,

    discountAvailable: "10€ Discount Available",
    weekMeals: "Meals This Week",
    useDiscount: "Use 10€ Discount",
    mealsRemaining: (n: number) => `${n} ${n !== 1 ? "meals" : "meal"} to 10€ discount`,

    points: "Points",
    pts: "pts",
    history: "History",
    meal: "Meal",
    mealsLabel: "meals",
    noTransactions: "No transactions",

    yourQRCode: "your qr code",

    pointsLabel: "points",

    enterEmail: "Enter your email",
    loyaltyProgramTitle: "Loyalty Program",
    emailSent: "Email sent! Check your inbox to reset your password.",
    email: "Email",
    sendEmail: "Send email",
    name: "Name",
    password: "Password",
    enter: "Sign In",
    register: "Sign Up",
    or: "or",
    loginGoogle: "Sign in with Google",
    loginApple: "Sign in with Apple",
    recoverPassword: "Forgot Password",
    createAccount: "Create Account",
    haveAccount: "I already have an account",

    administration: "administration",
    registerMeal: "Register Meal",
    clientCode: "Client code",
    readQR: "Scan QR Code",
    checking: "Checking...",
    client: "Client",
    noName: "No name",
    weekMealsAdmin: "Week meals",
    discount10Active: "10€ discount active",
    assignPoints: "Assign Points",
    value: "Amount €",
    score: "Score",
    oneEuroOnePoint: "1€ = 1 point",
    mealCountPlaceholder: "No. of meals",
    tenPointsPerMeal: "10 points per meal",
    weekdayMeal: "Weekday Meal",
    registerMealBtn: "Register Meal",
    weekdayMealRule: "Each meal = 10 points · 4 meals in the same week = 10€ discount",
    clientNotFound: "Client not found",
    codeMustBe6: "Code must be 6 digits",
    weekdayOnly: "Discount meals only count on weekdays",
    dailyMealLimit: "This client already has a meal registered today",
    pointsAssigned: (n: number) => `+${n} points assigned`,
    discountUnlocked: "10€ discount unlocked!",
    mealRegistered: (n: number) => `Meal ${n}/4 registered`,
    mealDescription: (reached: boolean, n: number) =>
      reached ? "4th meal — 10€ discount unlocked" : `Meal ${n}/4 (week)`,
    mealPointsDesc: "Meal — points",

    scannerQR: "qr scanner",
    pointCamera: "Point the camera at the client's QR code",
    cameraError: "Could not access camera",

    newPassword: "New Password",
    setNewPassword: "Set your new password",
    passwordChanged: "Password changed successfully! Redirecting...",
    confirmPassword: "Confirm Password",
    changePassword: "Change Password",
    passwordsDontMatch: "Passwords don't match",
    passwordMinLength: "Password must be at least 6 characters",
    invalidLink: "Invalid or expired link",
    backToLogin: "Back to login",
    accountCreated: "Account created!",
    checkEmailVerification: "Check your email to activate your account.",

    pageNotFound: "Page not found",
    returnHome: "Return to Home",
  },
} as const;

type TranslationKeys = keyof typeof translations.pt;
type Translations = Record<TranslationKeys, string | ((...args: any[]) => string)>;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "pt",
  setLanguage: () => {},
  t: translations.pt,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved === "en" ? "en" : "pt") as Language;
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage: handleSetLanguage, t: translations[language] }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
