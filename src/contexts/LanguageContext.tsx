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
    weekMeals: "Refeições desta Semana",
    useDiscount: "Usar Desconto 10€",
    redeemDiscount: "Aplicar Desconto 10€",
    discountRedeemHint: "Peça ao staff para aplicar o desconto",
    mealsRemaining: (n: number) => `${n} ${n !== 1 ? "refeições" : "refeição"} para desconto de 10€`,

    // PointsBalance
    points: "Pontos",
    pts: "pts",
    history: "Histórico",
    meal: "Refeição",
    mealsLabel: "refeições",
    noTransactions: "Sem transações",

    // ClientQRCode
    yourQRCode: "O Seu Código QR",

    // StampOverlay
    pointsLabel: "pontos",

    // Auth
    enterEmail: "Insira o seu email",
    loyaltyProgramTitle: "Programa de Fidelidade",
    emailSent: "Email enviado! Verifique a sua caixa de correio para redefinir a password.",
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
    weekdayMealRule: "Cada refeição = 10 pontos · 4 refeições na semana = 10€ desconto · 200 pontos = 15€ desconto",
    discountRedeemInfo: "Quando o cliente tiver elegível para descontar, irá aparecer uma box para confirmar o desconto. Confirme o desconto e aplique na tecla desconto no ecrã do computador de faturação.",
    clientNotFound: "Cliente não encontrado",
    codeMustBe6: "O código deve ter 6 dígitos",
    weekdayOnly: "Refeições de desconto só contam em dias úteis",
    dailyMealLimit: "Este cliente já tem uma refeição registada hoje",
    mealCooldown: (h: number, m: number) => `Próximo registo disponível em ${h}h${m.toString().padStart(2, "0")}m`,
    pointsAssigned: (n: number) => `+${n} pontos atribuídos`,
    discountUnlocked: "Desconto de 10€ desbloqueado!",
    discountRedeemed: "Desconto de 10€ aplicado com sucesso!",
    buffetAvailable: "Desconto 15€ Disponível",
    buffetRedeemHint: "Peça ao staff para aplicar o seu desconto de 15€",
    buffetRedeemed: "Desconto de 15€ aplicado com sucesso!",
    buffet200Active: "Desconto 15€ ativo",
    redeemBuffet: "Aplicar Desconto 15€",
    confirmBuffet: "Aplicar desconto de 15€?",
    confirmBuffetMsg: "Serão deduzidos 200 pontos e o desconto de 15€ será aplicado. Esta ação não pode ser revertida.",
    buffetUnlocked: "Desconto de 15€ desbloqueado!",
    confirmRedeem: "Aplicar desconto de 10€?",
    confirmRedeemMsg: "O desconto será aplicado a este cliente. Esta ação não pode ser revertida.",
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
    setNewPassword: "Defina a sua nova password",
    passwordChanged: "Password alterada com sucesso! A redirecionar...",
    confirmPassword: "Confirmar Password",
    changePassword: "Alterar Password",
    passwordsDontMatch: "As passwords não coincidem",
    passwordMinLength: "A password deve ter pelo menos 6 caracteres",
    invalidLink: "Link inválido ou expirado",
    backToLogin: "Voltar ao login",
    accountCreated: "Conta criada com sucesso!",
    checkEmailVerification: "Verifique o seu email para ativar a sua conta.",

    // Confirm
    cancel: "Cancelar",
    confirm: "Confirmar",
    confirmMeal: "Confirmar registo de refeição?",
    confirmMealMsg: "Serão atribuídos 10 pontos a este cliente.",
    confirmDiscount: "Usar desconto de 10€?",
    confirmDiscountMsg: "Esta ação não pode ser revertida.",
    discountCelebrationMsg: "Completou 4 refeições esta semana! O seu desconto de 10€ está disponível.",
    celebrationDismiss: "Obrigado!",

    // Validation
    tooManyAttempts: "Demasiadas tentativas. Aguarda 1 minuto.",
    invalidEmail: "Email inválido",
    nameTooLong: "O nome deve ter menos de 100 caracteres",
    nameRequired: "O nome é obrigatório",

    // Birthday
    birthday: "Data de Nascimento",
    birthdayRequired: "A data de nascimento é obrigatória",
    birthdayPlaceholder: "DD/MM/AAAA",
    birthdayBannerTitle: "🎂 Feliz Aniversário!",
    birthdayBannerText18: "Celebre o seu aniversário connosco! Traga mais de 18 pessoas e a sua refeição é por nossa conta.",
    birthdayBannerText10: "Traga mais de 10 pessoas e oferecemos espumante para celebrar!",

    // Reviews
    reviewTitle: "Avalie a sua experiência",
    reviewSubtitle: "A sua opinião ajuda-nos a melhorar",
    reviewPlaceholder: "Escreva a sua crítica ou sugestão (opcional)...",
    reviewPointsHint: "Avaliação = 1.5 pts · Com crítica credível = 5 pts",
    credibleReviewHint: "Uma crítica credível fornece feedback específico e genuíno sobre comida, serviço, ambiente ou experiência.",
    confirmReview: "Confirmar Avaliação",
    reviewSubmitted: "Avaliação submetida!",
    reviewError: "Erro ao submeter avaliação",
    rate: "Avaliar",
    reviewed: "Avaliado",

    // Referral
    inviteFriends: "Convida amigos e ganha pontos",
    referralTitle: "O teu link de convite",
    referralDescription: "Partilha este link com amigos. Ganhas 2.5 pontos por cada refeição que eles registarem (até 10 refeições por amigo).",
    linkCopied: "Link copiado!",
    copyLink: "Copiar Link",
    referralPoints: "Pontos de referência",

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
    redeemDiscount: "Apply 10€ Discount",
    discountRedeemHint: "Ask staff to apply your discount",
    mealsRemaining: (n: number) => `${n} ${n !== 1 ? "meals" : "meal"} to 10€ discount`,

    points: "Points",
    pts: "pts",
    history: "History",
    meal: "Meal",
    mealsLabel: "meals",
    noTransactions: "No transactions",

    yourQRCode: "Your QR Code",

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
    weekdayMealRule: "Each meal = 10 points · 4 meals in the same week = 10€ discount · 200 points = 15€ discount",
    discountRedeemInfo: "When the client is eligible for a discount, a confirmation box will appear. Confirm the discount and apply it using the discount key on the billing computer.",
    clientNotFound: "Client not found",
    codeMustBe6: "Code must be 6 digits",
    weekdayOnly: "Discount meals only count on weekdays",
    dailyMealLimit: "This client already has a meal registered today",
    mealCooldown: (h: number, m: number) => `Next registration available in ${h}h${m.toString().padStart(2, "0")}m`,
    pointsAssigned: (n: number) => `+${n} points assigned`,
    discountUnlocked: "10€ discount unlocked!",
    discountRedeemed: "10€ discount applied successfully!",
    buffetAvailable: "15€ Discount Available",
    buffetRedeemHint: "Ask staff to apply your 15€ discount",
    buffetRedeemed: "15€ discount applied successfully!",
    buffet200Active: "15€ discount active",
    redeemBuffet: "Apply 15€ Discount",
    confirmBuffet: "Apply 15€ discount?",
    confirmBuffetMsg: "200 points will be deducted and the 15€ discount will be applied. This action cannot be undone.",
    buffetUnlocked: "15€ discount unlocked!",
    confirmRedeem: "Apply 10€ discount?",
    confirmRedeemMsg: "The discount will be applied to this client. This action cannot be undone.",
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

    cancel: "Cancel",
    confirm: "Confirm",
    confirmMeal: "Confirm meal registration?",
    confirmMealMsg: "10 points will be assigned to this client.",
    confirmDiscount: "Use 10€ discount?",
    confirmDiscountMsg: "This action cannot be undone.",
    discountCelebrationMsg: "You completed 4 meals this week! Your 10€ discount is available.",
    celebrationDismiss: "Thank you!",

    tooManyAttempts: "Too many attempts. Please wait 1 minute.",
    invalidEmail: "Invalid email",
    nameTooLong: "Name must be less than 100 characters",
    nameRequired: "Name is required",

    birthday: "Date of Birth",
    birthdayRequired: "Date of birth is required",
    birthdayPlaceholder: "DD/MM/YYYY",
    birthdayBannerTitle: "🎂 Happy Birthday!",
    birthdayBannerText18: "Celebrate your birthday with us! Bring more than 18 people and your meal is on us.",
    birthdayBannerText10: "Bring more than 10 people and we offer sparkling wine to celebrate!",

    reviewTitle: "Rate your experience",
    reviewSubtitle: "Your feedback helps us improve",
    reviewPlaceholder: "Write your review or suggestion (optional)...",
    reviewPointsHint: "Rating = 1.5 pts · With credible review = 5 pts",
    credibleReviewHint: "A credible review provides specific, genuine feedback about food, service, ambiance, or experience.",
    confirmReview: "Confirm Review",
    reviewSubmitted: "Review submitted!",
    reviewError: "Error submitting review",
    rate: "Rate",
    reviewed: "Reviewed",

    inviteFriends: "Invite friends and earn points",
    referralTitle: "Your invite link",
    referralDescription: "Share this link with friends. You earn 2.5 points for each meal they register (up to 10 meals per friend).",
    linkCopied: "Link copied!",
    copyLink: "Copy Link",
    referralPoints: "Referral points",

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
