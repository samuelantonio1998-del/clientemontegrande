/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
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

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

const LOGO_URL = 'https://pfasftcqkgloxmvgwkfl.supabase.co/storage/v1/object/public/email-assets/logo.svg'

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="pt" dir="ltr">
    <Head />
    <Preview>Redefinir a sua password — {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={card}>
          <Img src={LOGO_URL} alt="Quinta Monte Grande, LDA." width="160" height="auto" style={logo} />
          <Hr style={divider} />
          <Heading style={h1}>Redefinir password</Heading>
          <Text style={text}>
            Recebemos um pedido para redefinir a sua password na {siteName}. Clique no botão abaixo para escolher uma nova password.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={confirmationUrl}>
              Redefinir Password
            </Button>
          </Section>
          <Text style={footer}>
            Se não solicitou esta alteração, pode ignorar este email. A sua password não será alterada.
          </Text>
        </Section>
        <Text style={brandFooter}>
          © {new Date().getFullYear()} Quinta Monte Grande, LDA.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

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
const text = { fontSize: '14px', color: 'hsl(25, 15%, 38%)', lineHeight: '1.7', margin: '0 0 20px' }
const buttonContainer = { textAlign: 'center' as const, margin: '8px 0 28px' }
const button = {
  backgroundColor: 'hsl(25, 30%, 28%)',
  color: 'hsl(45, 18%, 93%)',
  fontSize: '14px',
  fontWeight: '600' as const,
  borderRadius: '12px',
  padding: '14px 32px',
  textDecoration: 'none',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
}
const footer = { fontSize: '12px', color: 'hsl(25, 15%, 55%)', lineHeight: '1.6', margin: '0', textAlign: 'center' as const }
const brandFooter = { fontSize: '11px', color: 'hsl(25, 15%, 55%)', textAlign: 'center' as const, margin: '24px 0 0' }
