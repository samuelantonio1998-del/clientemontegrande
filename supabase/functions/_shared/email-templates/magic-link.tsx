/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

const LOGO_URL = 'https://pfasftcqkgloxmvgwkfl.supabase.co/storage/v1/object/public/email-assets/logo.svg'

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="pt" dir="ltr">
    <Head />
    <Preview>O seu link de acesso — {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={siteName} width="180" height="auto" style={logo} />
        <Heading style={h1}>O seu link de acesso</Heading>
        <Text style={text}>
          Clique no botão abaixo para aceder à {siteName}. Este link expira em breve.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Entrar
        </Button>
        <Text style={footer}>
          Se não solicitou este link, pode ignorar este email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

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
const button = {
  backgroundColor: 'hsl(25, 30%, 28%)',
  color: 'hsl(45, 18%, 87%)',
  fontSize: '13px',
  borderRadius: '2px',
  padding: '12px 24px',
  textDecoration: 'none',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.15em',
  fontFamily: "'DM Sans', Arial, sans-serif",
}
const footer = { fontSize: '12px', color: 'hsl(25, 15%, 38%)', margin: '30px 0 0' }
