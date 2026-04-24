
## Adicionar nota "Bebidas não incluídas" — apenas na box do buffet

Adicionar uma única nota informativa **"Bebidas não incluídas"** exclusivamente na **box da oferta do buffet grátis (200 pontos)**. A box do desconto de 10€ e os restantes blocos não são alterados.

### Onde aparece

1. **Cliente — `MealCounter.tsx`**: dentro do banner do **buffet grátis disponível** (`buffetAvailable`), abaixo do texto de resgate.
2. **Admin — `AdminClientCard.tsx`**: dentro da secção condicional `profile.buffet_available` (botão "Resgatar Buffet"), abaixo do botão.

### Implementação técnica

**1. Tradução — `src/contexts/LanguageContext.tsx`**
Nova chave em PT e EN:
- `drinksExcluded` → PT: `"Bebidas não incluídas"` / EN: `"Drinks not included"`

**2. UI cliente — `src/components/MealCounter.tsx`**
Apenas dentro do bloco do buffet, acrescentar:
```tsx
<p className="text-xs text-center mt-1 italic opacity-80">
  {t.drinksExcluded as string}
</p>
```

**3. UI admin — `src/components/AdminClientCard.tsx`**
Apenas dentro de `{profile.buffet_available && (...)}`, abaixo do botão:
```tsx
<p className="text-xs text-muted-foreground mt-2 text-center italic">
  {t.drinksExcluded as string}
</p>
```

### Sem alterações
- Sem mexer na box do desconto de 10€
- Sem mexer no bloco geral de regras (`discountRulesInfo`, `weekdayMealRule`, etc.)
- Sem alterações de backend ou base de dados

### Ficheiros editados
- `src/contexts/LanguageContext.tsx`
- `src/components/MealCounter.tsx`
- `src/components/AdminClientCard.tsx`
