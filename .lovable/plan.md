

## Plano: Mostrar mensagem de verificação de email após registo

### Problema
Após criar conta, o utilizador é redirecionado para `/` em vez de ver uma mensagem a pedir para verificar o email.

### Alterações

**`src/pages/Auth.tsx`**
- Adicionar estado `signUpSuccess` (boolean)
- No bloco de signup bem-sucedido (linha 70-72), em vez de `navigate("/")`, definir `signUpSuccess = true`
- Quando `signUpSuccess` é true, mostrar uma mensagem de confirmação em vez do formulário (ex: "Conta criada! Verifica o teu email para ativar a conta.")

**`src/contexts/LanguageContext.tsx`**
- Adicionar traduções:
  - PT: `accountCreated: "Conta criada com sucesso!"`, `checkEmailVerification: "Verifica o teu email para ativar a tua conta."`
  - EN: `accountCreated: "Account created!"`, `checkEmailVerification: "Check your email to activate your account."`

