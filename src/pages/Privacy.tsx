import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import logo from "@/assets/logo-mg-horizontal-bege.svg";
import { ArrowLeft } from "lucide-react";

// =====================================================================
// Substitui estes valores pelos dados reais da empresa (RGPD Art. 13.º)
// =====================================================================
const COMPANY = {
  name: "Quinta Monte Grande, LDA.",
  address: "Estrada Nacional 242, Albergaria, 2430-074 Marinha Grande",
  nipc: "506745856",
  email: "quintamontegrande@hotmail.com",
  phone: "",
} as const;

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
        <Link
          to="/login"
          className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToLogin as string}
        </Link>
        <LanguageSwitcher />
      </nav>
      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">
          {t.privacyPolicyTitle as string}
        </h1>
        <div className="prose prose-sm text-muted-foreground space-y-4 [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_a]:underline [&_a]:text-foreground">
          {language === "pt" ? <PrivacyContentPT /> : <PrivacyContentEN />}
        </div>
      </main>
    </div>
  );
};

const PrivacyContentPT = () => (
  <>
    <p>Última atualização: 13 de maio de 2026</p>
    <p>
      A {COMPANY.name} está comprometida com a proteção dos seus dados pessoais, em conformidade
      com o Regulamento Geral sobre a Proteção de Dados (RGPD — Regulamento UE 2016/679) e a Lei
      n.º 58/2019, de 8 de agosto.
    </p>

    <h2>1. Responsável pelo Tratamento</h2>
    <p>
      <strong>{COMPANY.name}</strong>
      <br />
      Morada: {COMPANY.address}
      <br />
      NIPC: {COMPANY.nipc}
      <br />
      Contacto: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
      {COMPANY.phone && (
        <>
          <br />
          Telefone: {COMPANY.phone}
        </>
      )}
    </p>
    <p>
      Para questões específicas sobre proteção de dados, contacte-nos pelo email acima indicando
      "RGPD" no assunto.
    </p>

    <h2>2. Dados que Recolhemos</h2>
    <ul>
      <li>Nome completo</li>
      <li>Endereço de email</li>
      <li>Data de nascimento</li>
      <li>Dados de utilização do programa de fidelidade (refeições, pontos, descontos, histórico de transações)</li>
      <li>Códigos de cliente e de referência gerados automaticamente</li>
      <li>
        Dados técnicos mínimos necessários ao funcionamento da aplicação (sessão de autenticação,
        idioma preferido), armazenados localmente no seu dispositivo
      </li>
    </ul>

    <h2>3. Finalidades e Base Legal do Tratamento</h2>
    <ul>
      <li>
        <strong>Gestão da conta e do programa de fidelidade</strong> (atribuição e gestão de pontos,
        descontos e benefícios) — execução do contrato do programa de fidelidade (Art. 6.º n.º 1
        alínea b do RGPD).
      </li>
      <li>
        <strong>Comunicações relacionadas com o programa</strong> (ex.: notificações de
        aniversário, recuperação de password) — execução do contrato e interesse legítimo.
      </li>
      <li>
        <strong>Verificação automatizada de provas</strong> (capturas de ecrã de seguir o
        Instagram ou de Google Reviews, analisadas por IA) — execução do contrato e consentimento
        do utilizador ao submeter a prova. As imagens são apagadas imediatamente após verificação.
      </li>
      <li>
        <strong>Prevenção de fraude e abuso</strong> (rate limiting, cooldown entre refeições) —
        interesse legítimo na integridade do programa.
      </li>
    </ul>

    <h2>4. Período de Conservação</h2>
    <p>
      Os seus dados são conservados enquanto a sua conta estiver ativa. Após eliminação da conta,
      todos os dados pessoais são apagados de imediato dos nossos sistemas de produção e em até 30
      dias dos sistemas de cópia de segurança. Dados de transações que constituam registo
      contabilístico obrigatório poderão ser conservados pelo prazo legal aplicável (10 anos, nos
      termos do Código Comercial).
    </p>

    <h2>5. Os Seus Direitos</h2>
    <p>Nos termos do RGPD, tem direito a:</p>
    <ul>
      <li><strong>Acesso</strong> — consultar os dados que temos sobre si</li>
      <li><strong>Retificação</strong> — corrigir dados incorretos</li>
      <li><strong>Eliminação</strong> ("direito ao esquecimento") — solicitar a eliminação dos seus dados e conta, diretamente na aplicação</li>
      <li><strong>Limitação</strong> — restringir o tratamento em determinadas circunstâncias</li>
      <li><strong>Portabilidade</strong> — receber os seus dados num formato estruturado e legível por máquina</li>
      <li><strong>Oposição</strong> — opor-se ao tratamento dos seus dados</li>
      <li><strong>Retirar o consentimento</strong> em qualquer momento, sem afetar a licitude do tratamento previamente efetuado</li>
    </ul>
    <p>
      Para exercer estes direitos, pode eliminar a sua conta diretamente na aplicação ou
      contactar-nos pelo email <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
    </p>

    <h2>6. Direito de Reclamação</h2>
    <p>
      Sem prejuízo de qualquer outra via de recurso administrativo ou judicial, tem o direito de
      apresentar reclamação junto da autoridade de controlo competente — em Portugal, a Comissão
      Nacional de Proteção de Dados (CNPD):{" "}
      <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer">
        www.cnpd.pt
      </a>.
    </p>

    <h2>7. Segurança</h2>
    <p>
      Utilizamos medidas técnicas e organizativas adequadas para proteger os seus dados,
      designadamente: encriptação em trânsito (HTTPS/TLS), controlo de acesso por autenticação,
      políticas de segurança ao nível da base de dados (Row-Level Security), rate limiting, e
      separação entre dados de produção e cópias de segurança.
    </p>

    <h2>8. Partilha de Dados e Subcontratantes</h2>
    <p>
      Não vendemos nem partilhamos os seus dados pessoais com terceiros para fins de marketing. Os
      seus dados poderão ser processados pelos seguintes subcontratantes, sob acordos de proteção
      de dados:
    </p>
    <ul>
      <li><strong>Supabase</strong> (alojamento de base de dados e autenticação)</li>
      <li><strong>Lovable</strong> (alojamento da aplicação web e infraestrutura de email)</li>
      <li><strong>Google Cloud</strong> (verificação automatizada de imagens, via API Gemini, apenas para a finalidade descrita no ponto 3)</li>
    </ul>

    <h2>9. Transferências Internacionais</h2>
    <p>
      Alguns dos subcontratantes acima podem processar dados fora do Espaço Económico Europeu. Tais
      transferências, quando ocorram, são realizadas com base nas Cláusulas Contratuais-Tipo
      aprovadas pela Comissão Europeia e/ou em decisões de adequação.
    </p>

    <h2>10. Cookies e Armazenamento Local</h2>
    <p>
      Não utilizamos cookies para fins publicitários ou de rastreamento. A aplicação utiliza
      apenas armazenamento local (localStorage) do seu navegador para finalidades estritamente
      técnicas: manter a sua sessão iniciada e guardar a sua preferência de idioma. Pode limpar
      este armazenamento em qualquer momento nas definições do seu navegador.
    </p>

    <h2>11. Alterações a esta Política</h2>
    <p>
      Esta política poderá ser atualizada periodicamente. A data da última atualização é indicada
      no topo deste documento. Alterações substanciais serão comunicadas através da aplicação.
    </p>
  </>
);

const PrivacyContentEN = () => (
  <>
    <p>Last updated: May 13, 2026</p>
    <p>
      {COMPANY.name} is committed to protecting your personal data in compliance with the General
      Data Protection Regulation (GDPR — EU Regulation 2016/679) and Portuguese Law 58/2019 of 8
      August.
    </p>

    <h2>1. Data Controller</h2>
    <p>
      <strong>{COMPANY.name}</strong>
      <br />
      Address: {COMPANY.address}
      <br />
      Tax ID (NIPC): {COMPANY.nipc}
      <br />
      Contact: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
      {COMPANY.phone && (
        <>
          <br />
          Phone: {COMPANY.phone}
        </>
      )}
    </p>
    <p>
      For data protection inquiries, contact us at the email above with "GDPR" in the subject.
    </p>

    <h2>2. Data We Collect</h2>
    <ul>
      <li>Full name</li>
      <li>Email address</li>
      <li>Date of birth</li>
      <li>Loyalty program usage data (meals, points, discounts, transaction history)</li>
      <li>Automatically generated client and referral codes</li>
      <li>
        Minimal technical data required to operate the app (authentication session, language
        preference), stored locally on your device
      </li>
    </ul>

    <h2>3. Purpose and Legal Basis of Processing</h2>
    <ul>
      <li>
        <strong>Account and loyalty program management</strong> — performance of the loyalty
        program contract (Art. 6(1)(b) GDPR).
      </li>
      <li>
        <strong>Program-related communications</strong> (e.g., birthday notifications, password
        recovery) — performance of the contract and legitimate interest.
      </li>
      <li>
        <strong>Automated proof verification</strong> (screenshots of Instagram follow or Google
        Reviews, analyzed by AI) — performance of the contract and user consent upon submission.
        Images are deleted immediately after verification.
      </li>
      <li>
        <strong>Fraud and abuse prevention</strong> (rate limiting, cooldown between meals) —
        legitimate interest in program integrity.
      </li>
    </ul>

    <h2>4. Data Retention</h2>
    <p>
      Your data is retained while your account is active. After account deletion, all personal
      data is immediately removed from our production systems and within 30 days from backup
      systems. Transaction data that constitutes mandatory accounting records may be retained for
      the applicable legal period (10 years under the Portuguese Commercial Code).
    </p>

    <h2>5. Your Rights</h2>
    <p>Under the GDPR, you have the right to:</p>
    <ul>
      <li><strong>Access</strong> — view the data we hold about you</li>
      <li><strong>Rectification</strong> — correct inaccurate data</li>
      <li><strong>Erasure</strong> ("right to be forgotten") — request deletion of your data and account, directly within the app</li>
      <li><strong>Restriction</strong> — restrict processing in certain circumstances</li>
      <li><strong>Portability</strong> — receive your data in a structured, machine-readable format</li>
      <li><strong>Object</strong> — object to the processing of your data</li>
      <li><strong>Withdraw consent</strong> at any time, without affecting the lawfulness of prior processing</li>
    </ul>
    <p>
      To exercise these rights, you can delete your account directly in the app or contact us at{" "}
      <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
    </p>

    <h2>6. Right to Lodge a Complaint</h2>
    <p>
      Without prejudice to any other administrative or judicial remedy, you have the right to lodge
      a complaint with the competent supervisory authority — in Portugal, the Comissão Nacional de
      Proteção de Dados (CNPD):{" "}
      <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer">
        www.cnpd.pt
      </a>.
    </p>

    <h2>7. Security</h2>
    <p>
      We use appropriate technical and organizational measures to protect your data, including:
      encryption in transit (HTTPS/TLS), authentication-based access control, database-level
      security policies (Row-Level Security), rate limiting, and separation between production and
      backup data.
    </p>

    <h2>8. Data Sharing and Sub-processors</h2>
    <p>
      We do not sell or share your personal data with third parties for marketing purposes. Your
      data may be processed by the following sub-processors under data protection agreements:
    </p>
    <ul>
      <li><strong>Supabase</strong> (database hosting and authentication)</li>
      <li><strong>Lovable</strong> (web app hosting and email infrastructure)</li>
      <li><strong>Google Cloud</strong> (automated image verification, via Gemini API, only for the purpose described in section 3)</li>
    </ul>

    <h2>9. International Transfers</h2>
    <p>
      Some of the above sub-processors may process data outside the European Economic Area. Such
      transfers, when they occur, are carried out under the Standard Contractual Clauses approved
      by the European Commission and/or adequacy decisions.
    </p>

    <h2>10. Cookies and Local Storage</h2>
    <p>
      We do not use cookies for advertising or tracking purposes. The app uses only your browser's
      local storage for strictly technical purposes: keeping your session active and saving your
      language preference. You can clear this storage at any time in your browser settings.
    </p>

    <h2>11. Changes to this Policy</h2>
    <p>
      This policy may be updated periodically. The date of the last update is shown at the top of
      this document. Substantive changes will be communicated through the app.
    </p>
  </>
);

export default Privacy;
