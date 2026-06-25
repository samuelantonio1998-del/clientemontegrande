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
    adLabel: "Anúncio",
    pointsGoalMsg: "Acumula 200 pontos e ganha",
    pointsGoalDiscount: "Buffet grátis",
    pointsExpireAt: (pts: number, date: string) => `${pts} pts expiram a ${date}`,

    // MealCounter
    discountAvailable: "Desconto 10€ Disponível",
    weekMeals: "Refeições desta Semana",
    weekMealsObjetivo: "Complete as 4 refeições na mesma semana para o desconto.",
    weekMealsFallback: "Caso não complete a semana, acumulará pontos para o futuro.",
    useDiscount: "Usar Desconto 10€",
    redeemDiscount: "Aplicar Desconto 10€",
    discountRedeemHint: "Válido na sua próxima visita — peça ao staff para aplicar",
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
    welcomeBack: "Bem-vindo!",
    loginSubtitle: "Inicie sessão ou crie uma conta",
    signupSubtitle: "Crie a sua conta para começar",
    haveAccount: "Já tenho conta",

    // Admin
    administration: "registo",
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
    weekdayMealRule: "Cada refeição = 10 pontos · 4 refeições/semana = 10€ desconto · 200 pontos = buffet grátis",
    discountRedeemInfo: "Quando o cliente tiver elegível para descontar, irá aparecer uma box para confirmar o desconto. Confirme o desconto e aplique na tecla desconto no ecrã do computador de faturação.",
    clientNotFound: "Cliente não encontrado",
    codeMustBe6: "O código deve ter 6 dígitos",
    weekdayOnly: "",
    dailyMealLimit: "Este cliente já tem uma refeição registada hoje",
    mealCooldown: (h: number, m: number) => `Próximo registo disponível em ${h}h${m.toString().padStart(2, "0")}m`,
    pointsAssigned: (n: number) => `+${n} pontos atribuídos`,
    discountUnlocked: "Desconto de 10€ desbloqueado!",
    discountRedeemed: "Desconto de 10€ aplicado com sucesso!",
    buffetAvailable: "Buffet Grátis Disponível",
    buffetRedeemHint: "Peça ao staff para aplicar",
    drinksExcluded: "Bebidas não incluídas",
    discountRule1: "Os descontos só podem ser utilizados numa compra futura após serem ganhos.",
    discountRule2: "Não é possível acumular nem utilizar múltiplos descontos em simultâneo.",
    discountRulesInfo: "Os descontos só podem ser utilizados numa compra futura após serem ganhos. Não é possível acumular nem utilizar múltiplos descontos em simultâneo.",
    buffetRedeemed: "Buffet grátis aplicado com sucesso!",
    buffet200Active: "Buffet grátis ativo",
    redeemBuffet: "Aplicar Buffet Grátis",
    confirmBuffet: "Aplicar buffet grátis?",
    confirmBuffetMsg: "Serão deduzidos 200 pontos e o buffet grátis será aplicado. Esta ação não pode ser revertida.",
    buffetUnlocked: "Buffet grátis desbloqueado!",
    confirmRedeem: "Aplicar desconto de 10€?",
    confirmRedeemMsg: "O desconto será aplicado a este cliente. Esta ação não pode ser revertida.",
    mealRegistered: (n: number) => `Refeição ${n}/4 registada`,
    weekendMealRegistered: "Refeição de fim-de-semana (não conta para desconto)",
    mealDescription: (reached: boolean, n: number) =>
      reached ? "4ª refeição — desconto 10€ desbloqueado" : `Refeição ${n}/4 (semana)`,
    mealPointsDesc: "Refeição — pontos",
    discountRedeemedDesc: "Desconto 10€ utilizado",
    buffetRedeemedDesc: "Buffet grátis utilizado",
    discountRedeemedToast: "Parabéns! O seu desconto de 10€ foi utilizado. 🎉",
    buffetRedeemedToast: "Parabéns! O seu buffet grátis foi utilizado. 🎉",

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

    // Google Review
    googleReviewTitle: "Avalie-nos no Google",
    googleReviewDescription: "Ajude-nos a melhorar a nossa avaliação e receba 50 pontos! O screenshot deve mostrar as estrelas e o seu nome de perfil.",
    googleReviewOpen: "Avaliar no Google",
    googleReviewApproved: "Avaliação Google verificada! +50 pontos",
    googleReviewRejected: "Screenshot inválido — as estrelas e o seu nome devem ser visíveis",
    googleReviewRejectedRetry: "Rejeitado — envie novamente",
    googleReviewHint: "O screenshot deve mostrar as estrelas e o seu nome de perfil",

    // Referral
    inviteFriends: "Convida amigos e ganha pontos",
    referralTitle: "O teu link de convite",
    referralDescription: "Partilha este link com os teus amigos e ganha pontos quando eles visitarem o Monte Grande.",
    linkCopied: "Link copiado!",
    copyLink: "Copiar Link",
    referralPoints: "Pontos de referência",

    // Follow Us
    followUsTitle: "Segue-nos no Instagram",
    followUsDescription: "Segue o nosso Instagram e ganha 10 pontos! Envia um screenshot a provar que nos segues.",
    followOpenInstagram: "Abrir Instagram",
    followUploadScreenshot: "Enviar Screenshot",
    followUploading: "A enviar...",
    followSubmitted: "Screenshot enviado! A aguardar aprovação.",
    followPending: "A aguardar aprovação",
    followApproved: "Aprovado",
    followRejected: "Rejeitado",
    followRejectedRetry: "Rejeitado — envia novamente",
    followInvalidFile: "Ficheiro inválido. Envia uma imagem.",
    followFileTooLarge: "Ficheiro demasiado grande (máx. 5MB)",
    followUploadError: "Erro ao enviar screenshot",
    followClaimsTitle: "Pedidos de follow",
    followViewScreenshot: "Ver screenshot",
    followApproveBtn: "Aprovar",
    followRejectBtn: "Rejeitar",
    followClaimApproved: (name: string) => `Follow de ${name} aprovado — +10 pontos`,
    followClaimRejected: (name: string) => `Follow de ${name} rejeitado`,

    // Admin Action History
    actionHistory: "Histórico de Ações",
    undoAction: "Anular ação",
    undone: "anulado",
    confirmUndoTitle: "Anular esta ação?",
    confirmUndoMsg: "Os pontos atribuídos serão revertidos. Esta operação não pode ser desfeita.",
    actionUndone: "Ação anulada com sucesso",

    // NotFound
    pageNotFound: "Página não encontrada",
    returnHome: "Voltar ao início",

    // GDPR / Privacy
    privacyPolicyTitle: "Política de Privacidade",
    privacyConsent: "Li e aceito a",
    privacyPolicyLink: "Política de Privacidade",
    privacyRequired: "Deve aceitar a política de privacidade",
    deleteAccount: "Eliminar Conta",
    deleteAccountTitle: "Eliminar a sua conta?",
    deleteAccountMsg: "Todos os seus dados serão permanentemente eliminados. Esta ação não pode ser revertida.",
    accountDeleted: "Conta eliminada com sucesso",
    deleteAccountError: "Erro ao eliminar conta",

    // Ads
    adsManage: "Anúncios",
    adsTitle: "Título (opcional)",
    adsLinkPlaceholder: "Link externo (opcional)",
    adsUploadImage: "Carregar Imagem",
    adsAdded: "Anúncio adicionado",
    adsDeleted: "Anúncio eliminado",
    adsUploadError: "Erro ao carregar imagem",
    adsEmpty: "Sem anúncios",
    adsEnterPin: "Introduza o PIN para confirmar",
    adsInvalidPin: "PIN incorreto",
    adsStartDate: "Data início (opcional)",
    adsEndDate: "Data fim (opcional)",

    // Navigation
    otherFunctions: "Outras Funções",

    // Admin Reviews
    adminReviewsTitle: "Avaliações dos Clientes",
    adminReviewsEmpty: "Sem avaliações",

    // Export
    exportEmails: "Exportar Emails",
    exportingEmails: "A exportar...",
    exportError: "Erro ao exportar emails",

    // Reports
    reportProblem: "Reportar Problema",
    reportProblemDesc: "Descreva o problema que encontrou e iremos analisá-lo.",
    reportPlaceholder: "Descreva o problema...",
    reportSend: "Enviar",
    reportSent: "Problema reportado com sucesso!",
    reportError: "Erro ao enviar reporte",
    reportOpen: "Aberto",
    reportResolved: "Resolvido",
    reportMarkResolved: "Marcar como resolvido",
    adminReportsTitle: "Problemas Reportados",
    adminReportsEmpty: "Sem problemas reportados",
    deleteReport: "Apagar",

    // Inactive users
    inactiveUsersTitle: "Utilizadores Inativos",
    inactiveUsersEmpty: "Sem utilizadores inativos",
    inactiveUsersCount: (n: number) => `${n} utilizador${n !== 1 ? "es" : ""} inativo${n !== 1 ? "s" : ""}`,
    inactiveDaysLabel: "Sem refeição há mais de:",
    days: "dias",
    exportInactiveEmails: "Exportar CSV",
  },
  en: {
    loyaltyProgram: "loyalty program",
    welcome: (name: string) => `Hello, ${name}`,
    code: "Code",
    loading: "Loading...",
    totalSavings: "total savings",
    savedAmount: (amount: number) => `You saved ${amount}€`,
    adLabel: "Ad",
    pointsGoalMsg: "Collect 200 points and get",
    pointsGoalDiscount: "Free buffet",
    pointsExpireAt: (pts: number, date: string) => `${pts} pts expire on ${date}`,

    discountAvailable: "10€ Discount Available",
    weekMeals: "Meals This Week",
    weekMealsObjetivo: "Complete 4 meals in the same week to get the discount.",
    weekMealsFallback: "If you don't complete the week, you'll accumulate points for the future.",
    useDiscount: "Use 10€ Discount",
    redeemDiscount: "Apply 10€ Discount",
    discountRedeemHint: "Valid on your next visit — ask staff to apply",
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
    welcomeBack: "Welcome!",
    loginSubtitle: "Sign in or create an account",
    signupSubtitle: "Create your account to get started",
    haveAccount: "I already have an account",

    administration: "register",
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
    weekdayMealRule: "Each meal = 10 points · 4 meals/week = 10€ discount · 200 points = free buffet",
    discountRedeemInfo: "When the client is eligible for a discount, a confirmation box will appear. Confirm the discount and apply it using the discount key on the billing computer.",
    clientNotFound: "Client not found",
    codeMustBe6: "Code must be 6 digits",
    weekdayOnly: "",
    dailyMealLimit: "This client already has a meal registered today",
    mealCooldown: (h: number, m: number) => `Next registration available in ${h}h${m.toString().padStart(2, "0")}m`,
    pointsAssigned: (n: number) => `+${n} points assigned`,
    discountUnlocked: "10€ discount unlocked!",
    discountRedeemed: "10€ discount applied successfully!",
    buffetAvailable: "Free Buffet Available",
    buffetRedeemHint: "Ask staff to apply",
    drinksExcluded: "Drinks not included",
    discountRulesInfo: "Discounts can only be used on a future visit after being earned. It is not possible to accumulate or use multiple discounts at the same time.",
    buffetRedeemed: "Free buffet applied successfully!",
    buffet200Active: "Free buffet active",
    redeemBuffet: "Apply Free Buffet",
    confirmBuffet: "Apply free buffet?",
    confirmBuffetMsg: "200 points will be deducted and the free buffet will be applied. This action cannot be undone.",
    buffetUnlocked: "Free buffet unlocked!",
    confirmRedeem: "Apply 10€ discount?",
    confirmRedeemMsg: "The discount will be applied to this client. This action cannot be undone.",
    mealRegistered: (n: number) => `Meal ${n}/4 registered`,
    weekendMealRegistered: "Weekend meal (does not count toward discount)",
    mealDescription: (reached: boolean, n: number) =>
      reached ? "4th meal — 10€ discount unlocked" : `Meal ${n}/4 (week)`,
    mealPointsDesc: "Meal — points",
    discountRedeemedDesc: "10€ discount used",
    buffetRedeemedDesc: "Free buffet used",
    discountRedeemedToast: "Congrats! Your 10€ discount was applied. 🎉",
    buffetRedeemedToast: "Congrats! Your free buffet was applied. 🎉",

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

    // Google Review
    googleReviewTitle: "Review us on Google",
    googleReviewDescription: "Help us get a great rating and earn 50 points!",
    googleReviewOpen: "Review on Google",
    googleReviewApproved: "Google review verified! +50 points",
    googleReviewRejected: "Invalid screenshot — stars and your name must be visible",
    googleReviewRejectedRetry: "Rejected — try again",
    googleReviewHint: "Screenshot must show the stars and your profile name",

    inviteFriends: "Invite friends and earn points",
    referralTitle: "Your invite link",
    referralDescription: "Share this link with friends and earn points when they visit Monte Grande.",
    linkCopied: "Link copied!",
    copyLink: "Copy Link",
    referralPoints: "Referral points",

    followUsTitle: "Follow Us",
    followUsDescription: "Follow our Instagram and earn 10 points! Send a screenshot to prove you followed us.",
    followOpenInstagram: "Open Instagram",
    followUploadScreenshot: "Upload Screenshot",
    followUploading: "Uploading...",
    followSubmitted: "Screenshot sent! Awaiting approval.",
    followPending: "Awaiting approval",
    followApproved: "Approved",
    followRejected: "Rejected",
    followRejectedRetry: "Rejected — try again",
    followInvalidFile: "Invalid file. Please upload an image.",
    followFileTooLarge: "File too large (max 5MB)",
    followUploadError: "Error uploading screenshot",
    followClaimsTitle: "Follow requests",
    followViewScreenshot: "View screenshot",
    followApproveBtn: "Approve",
    followRejectBtn: "Reject",
    followClaimApproved: (name: string) => `${name}'s follow approved — +10 points`,
    followClaimRejected: (name: string) => `${name}'s follow rejected`,

    // Admin Action History
    actionHistory: "Action History",
    undoAction: "Undo action",
    undone: "undone",
    confirmUndoTitle: "Undo this action?",
    confirmUndoMsg: "The assigned points will be reversed. This operation cannot be undone.",
    actionUndone: "Action undone successfully",

    pageNotFound: "Page not found",
    returnHome: "Return to Home",

    // GDPR / Privacy
    privacyPolicyTitle: "Privacy Policy",
    privacyConsent: "I have read and accept the",
    privacyPolicyLink: "Privacy Policy",
    privacyRequired: "You must accept the privacy policy",
    deleteAccount: "Delete Account",
    deleteAccountTitle: "Delete your account?",
    deleteAccountMsg: "All your data will be permanently deleted. This action cannot be undone.",
    accountDeleted: "Account deleted successfully",
    deleteAccountError: "Error deleting account",

    // Ads
    adsManage: "Ads",
    adsTitle: "Title (optional)",
    adsLinkPlaceholder: "External link (optional)",
    adsUploadImage: "Upload Image",
    adsAdded: "Ad added",
    adsDeleted: "Ad deleted",
    adsUploadError: "Error uploading image",
    adsEmpty: "No ads",
    adsEnterPin: "Enter PIN to confirm",
    adsInvalidPin: "Incorrect PIN",
    adsStartDate: "Start date (optional)",
    adsEndDate: "End date (optional)",

    // Navigation
    otherFunctions: "Other Functions",

    // Admin Reviews
    adminReviewsTitle: "Customer Reviews",
    adminReviewsEmpty: "No reviews",

    // Export
    exportEmails: "Export Emails",
    exportingEmails: "Exporting...",
    exportError: "Error exporting emails",

    // Reports
    reportProblem: "Report Problem",
    reportProblemDesc: "Describe the problem you found and we'll look into it.",
    reportPlaceholder: "Describe the problem...",
    reportSend: "Send",
    reportSent: "Problem reported successfully!",
    reportError: "Error sending report",
    reportOpen: "Open",
    reportResolved: "Resolved",
    reportMarkResolved: "Mark as resolved",
    adminReportsTitle: "Reported Problems",
    adminReportsEmpty: "No reported problems",
    deleteReport: "Delete",

    // Inactive users
    inactiveUsersTitle: "Inactive Users",
    inactiveUsersEmpty: "No inactive users",
    inactiveUsersCount: (n: number) => `${n} inactive user${n !== 1 ? "s" : ""}`,
    inactiveDaysLabel: "No meal for more than:",
    days: "days",
    exportInactiveEmails: "Export CSV",
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
