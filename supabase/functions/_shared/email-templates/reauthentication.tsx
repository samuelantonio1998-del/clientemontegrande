/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
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
        <Img src={LOGO_URL} alt="Quinta Monte Grande, LDA." width="180" height="auto" style={logo} />
        <Heading style={h1}>Código de verificação</Heading>
        <Text style={text}>Use o código abaixo para confirmar a sua identidade:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Este código expira em breve. Se não solicitou este código, pode ignorar este email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '30px 25px' }
const logo = { margin: '0 0 24px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: 'hsl(25, 25%, 15%)',
  margin: '0 0 20px',
  fontFamily: "'Cormorant Garamond', Georgia, serif",
}
const text = {
  fontSize: '14px',
  color: 'hsl(25, 15%, 38%)',
  lineHeight: '1.6',
  margin: '0 0 25px',
}
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: 'hsl(25, 25%, 15%)',
  margin: '0 0 30px',
}
const footer = { fontSize: '12px', color: 'hsl(25, 15%, 38%)', margin: '30px 0 0' }
