/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

const LOGO_URL = 'https://pfasftcqkgloxmvgwkfl.supabase.co/storage/v1/object/public/email-assets/logo.svg'

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="pt" dir="ltr">
    <Head />
    <Preview>O seu código de verificação</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={card}>
          <Img src={LOGO_URL} alt="Quinta Monte Grande, LDA." width="160" height="auto" style={logo} />
          <Hr style={divider} />
          <Heading style={h1}>Código de verificação</Heading>
          <Text style={text}>Use o código abaixo para confirmar a sua identidade:</Text>
          <Section style={codeContainer}>
            <Text style={codeStyle}>{token}</Text>
          </Section>
          <Text style={footer}>
            Este código expira em breve. Se não solicitou este código, pode ignorar este email.
          </Text>
        </Section>
        <Text style={brandFooter}>
          © {new Date().getFullYear()} Quinta Monte Grande, LDA.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = {
  backgroundColor: 'hsl(45, 18%, 93%)',
  fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  padding: '40px 0',
}
const container = { maxWidth: '480px', margin: '0 auto', padding: '0 20px' }
const card = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '40px 32px',
  boxShadow: '0 2px 12px -2px hsla(25, 25%, 15%, 0.06), 0 1px 4px -1px hsla(25, 25%, 15%, 0.04)',
}
const logo = { margin: '0 auto 16px', display: 'block' as const }
const divider = { borderColor: 'hsl(30, 10%, 88%)', margin: '16px 0 28px' }
const h1 = {
  fontSize: '24px',
  fontWeight: '700' as const,
  color: 'hsl(25, 25%, 15%)',
  margin: '0 0 16px',
  fontFamily: "'Playfair Display', Georgia, serif",
  textAlign: 'center' as const,
}
const text = { fontSize: '14px', color: 'hsl(25, 15%, 38%)', lineHeight: '1.7', margin: '0 0 20px', textAlign: 'center' as const }
const codeContainer = {
  textAlign: 'center' as const,
  backgroundColor: 'hsl(45, 18%, 93%)',
  borderRadius: '12px',
  padding: '20px',
  margin: '0 0 28px',
}
const codeStyle = {
  fontFamily: "'Inter', 'Courier New', monospace",
  fontSize: '32px',
  fontWeight: '700' as const,
  color: 'hsl(25, 25%, 15%)',
  letterSpacing: '0.2em',
  margin: '0',
}
const footer = { fontSize: '12px', color: 'hsl(25, 15%, 55%)', lineHeight: '1.6', margin: '0', textAlign: 'center' as const }
const brandFooter = { fontSize: '11px', color: 'hsl(25, 15%, 55%)', textAlign: 'center' as const, margin: '24px 0 0' }
