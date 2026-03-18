import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import logo from "@/assets/logo-mg-horizontal-bege.svg";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
  const { t, language } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="relative">
        <div className="w-full h-2 mx-0 my-0 px-0 py-[40px] bg-primary" />
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10">
          <img src={logo} alt="Monte Grande" className="w-[260px]" width={260} height={137} />
        </div>
      </header>
      <nav className="flex justify-between items-center px-4 pt-2">
        <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" />
          {t.backToLogin as string}
        </Link>
        <LanguageSwitcher />
      </nav>
      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">
          {t.privacyPolicyTitle as string}
        </h1>
        <div className="prose prose-sm text-muted-foreground space-y-4 [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5">
          {language === "pt" ? <PrivacyContentPT /> : <PrivacyContentEN />}
        </div>
      </main>
    </div>
  );
};

const PrivacyContentPT = () => (
  <>
    <p>Última atualização: 17 de março de 2026</p>
    <p>A Quinta Monte Grande, LDA. está comprometida com a proteção dos seus dados pessoais, em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD — Regulamento UE 2016/679).</p>

    <h2>1. Responsável pelo Tratamento</h2>
    <p>Quinta Monte Grande é a entidade responsável pelo tratamento dos seus dados pessoais recolhidos através desta aplicação.</p>

    <h2>2. Dados que Recolhemos</h2>
    <ul>
      <li>Nome completo</li>
      <li>Endereço de email</li>
      <li>Data de nascimento</li>
      <li>Dados de utilização do programa de fidelidade (refeições, pontos, descontos)</li>
    </ul>

    <h2>3. Finalidades do Tratamento</h2>
    <ul>
      <li>Gestão da sua conta no programa de fidelidade</li>
      <li>Atribuição e gestão de pontos e descontos</li>
      <li>Envio de comunicações relacionadas com o programa (ex: aniversário)</li>
      <li>Melhoria dos nossos serviços</li>
    </ul>

    <h2>4. Base Legal</h2>
    <p>O tratamento dos seus dados baseia-se no seu consentimento explícito, dado no momento do registo, e na execução do contrato do programa de fidelidade.</p>

    <h2>5. Período de Conservação</h2>
    <p>Os seus dados são conservados enquanto a sua conta estiver ativa. Após eliminação da conta, os dados são apagados no prazo de 30 dias.</p>

    <h2>6. Os Seus Direitos</h2>
    <p>Nos termos do RGPD, tem direito a:</p>
    <ul>
      <li><strong>Acesso</strong> — consultar os dados que temos sobre si</li>
      <li><strong>Retificação</strong> — corrigir dados incorretos</li>
      <li><strong>Eliminação</strong> — solicitar a eliminação dos seus dados e conta</li>
      <li><strong>Portabilidade</strong> — receber os seus dados num formato estruturado</li>
      <li><strong>Oposição</strong> — opor-se ao tratamento dos seus dados</li>
    </ul>
    <p>Para exercer estes direitos, pode eliminar a sua conta diretamente na aplicação ou contactar-nos.</p>

    <h2>7. Segurança</h2>
    <p>Utilizamos medidas técnicas e organizativas adequadas para proteger os seus dados, incluindo encriptação, controlo de acesso e políticas de segurança ao nível da base de dados.</p>

    <h2>8. Partilha de Dados</h2>
    <p>Não vendemos nem partilhamos os seus dados pessoais com terceiros para fins de marketing. Os dados podem ser processados por fornecedores de serviços técnicos (alojamento, email) sob acordos de proteção de dados.</p>

    <h2>9. Contacto</h2>
    <p>Para questões relacionadas com a proteção de dados, contacte-nos através do email disponível no nosso website.</p>
  </>
);

const PrivacyContentEN = () => (
  <>
    <p>Last updated: March 17, 2026</p>
    <p>Quinta Monte Grande, LDA. is committed to protecting your personal data in compliance with the General Data Protection Regulation (GDPR — EU Regulation 2016/679).</p>

    <h2>1. Data Controller</h2>
    <p>Quinta Monte Grande is the entity responsible for processing your personal data collected through this application.</p>

    <h2>2. Data We Collect</h2>
    <ul>
      <li>Full name</li>
      <li>Email address</li>
      <li>Date of birth</li>
      <li>Loyalty program usage data (meals, points, discounts)</li>
    </ul>

    <h2>3. Purpose of Processing</h2>
    <ul>
      <li>Managing your loyalty program account</li>
      <li>Assigning and managing points and discounts</li>
      <li>Sending program-related communications (e.g., birthday)</li>
      <li>Improving our services</li>
    </ul>

    <h2>4. Legal Basis</h2>
    <p>Your data is processed based on your explicit consent given at registration and the execution of the loyalty program contract.</p>

    <h2>5. Data Retention</h2>
    <p>Your data is retained while your account is active. After account deletion, data is erased within 30 days.</p>

    <h2>6. Your Rights</h2>
    <p>Under the GDPR, you have the right to:</p>
    <ul>
      <li><strong>Access</strong> — view the data we hold about you</li>
      <li><strong>Rectification</strong> — correct inaccurate data</li>
      <li><strong>Erasure</strong> — request deletion of your data and account</li>
      <li><strong>Portability</strong> — receive your data in a structured format</li>
      <li><strong>Object</strong> — object to the processing of your data</li>
    </ul>
    <p>To exercise these rights, you can delete your account directly in the app or contact us.</p>

    <h2>7. Security</h2>
    <p>We use appropriate technical and organizational measures to protect your data, including encryption, access control, and database-level security policies.</p>

    <h2>8. Data Sharing</h2>
    <p>We do not sell or share your personal data with third parties for marketing purposes. Data may be processed by technical service providers (hosting, email) under data protection agreements.</p>

    <h2>9. Contact</h2>
    <p>For data protection inquiries, contact us via the email available on our website.</p>
  </>
);

export default Privacy;
