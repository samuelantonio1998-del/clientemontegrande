
## Adicionar nota de não-acumulação no painel admin

A nota *"Os descontos só podem ser utilizados numa compra futura após serem ganhos. Não é possível acumular nem utilizar múltiplos descontos em simultâneo."* já existe nas traduções (`discountRulesInfo`, PT + EN) e está visível no **dashboard do cliente** (`MealCounter.tsx`), mas **não aparece no painel admin**.

No `AdminClientCard.tsx` só está renderizada a `discountRedeemInfo` (instrução operacional sobre como aplicar o desconto na caixa), que é uma mensagem diferente.

### Alteração

**`src/components/AdminClientCard.tsx`** — adicionar a regra `discountRulesInfo` no bloco de "Registar Refeição", logo abaixo da nota `discountRedeemInfo` existente, para que o admin tenha sempre visível a regra de não-acumulação ao operar o cartão do cliente:

```tsx
<p className="text-xs text-muted-foreground/70 mt-2 italic">
  {t.discountRedeemInfo as string}
</p>
<p className="text-xs text-muted-foreground/70 mt-2">
  {t.discountRulesInfo as string}
</p>
```

### Sem outras alterações

- Sem mudanças de tradução (chaves já existem em PT e EN)
- Sem mudanças de backend
- Sem mudanças de base de dados

### Ficheiros editados
- `src/components/AdminClientCard.tsx`
