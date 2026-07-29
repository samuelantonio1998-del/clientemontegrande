## Problema

O `handleUndo` em `src/components/AdminActionHistory.tsx` compara `action.action_type === "meal"`, mas a função `register_meal_atomic` insere em `admin_actions` com `action_type = 'register_meal'`. Resultado: ao anular uma refeição, nenhum ramo de reversão corre — os pontos, o `consecutive_meals` e as flags `discount_available` / `buffet_available` ficam intactos; só a linha fica marcada como `undone`.

O mesmo se aplica ao label: `getActionLabel` mapeia `meal`, `redeem_discount`, `redeem_buffet`, pelo que uma refeição aparece no histórico com o texto cru `register_meal`.

## Correção

1. **`src/components/AdminActionHistory.tsx`**
   - Tratar `register_meal` e `meal` como o mesmo tipo no `handleUndo` (o ramo já existente, com a reversão de `discount_available`/`discount_earned_at`, `buffet_available`/`buffet_earned_at` e `consecutive_meals`).
   - Acrescentar `register_meal` ao mapa de `getActionLabel` (mesmo texto de "refeição").
   - Confirmar que os tipos de resgate gravados pela edge function `redeem-benefit` coincidem com `redeem_discount` / `redeem_buffet` usados aqui; alinhar se divergirem.

2. **Verificação**
   - Consultar os valores distintos de `action_type` existentes em `admin_actions` para garantir que não fica nenhum tipo sem tratamento.
   - Registar uma refeição de teste no painel Admin, anular, e confirmar na base de dados que `total_points`, `consecutive_meals` e as flags voltaram ao estado anterior.

## Notas

- Sem alterações à base de dados: a correção é só de mapeamento no cliente.
- A reversão da transação associada continua fora de âmbito (RLS nega DELETE em `transactions`); os pontos são revertidos no perfil, a linha histórica permanece.
