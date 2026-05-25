## Problema

A edge function `register-meal` chama `supabase.rpc("register_meal_atomic", ...)`, mas essa função SQL **não existe** na base de dados (confirmado via `pg_proc`). Resultado: o RPC falha, a edge devolve 500, e nem a refeição da semana nem a transação são gravadas.

## Solução

Criar via migration a função `public.register_meal_atomic(_client_user_id uuid, _admin_id uuid)` — toda a lógica numa única transação atómica:

1. **Autorização**: `has_role(_admin_id, 'admin')`. Senão → `{ error: 'forbidden' }`.
2. **Lock do perfil** do cliente (`SELECT ... FOR UPDATE`). Se não existir → `{ error: 'client_not_found' }`.
3. **Cooldown**: se existir transação `type='meal'` para este utilizador nas últimas ~20h → `{ error: 'cooldown_active' }`.
4. **Reset semanal**: se `current_week_start` for nulo ou anterior à segunda-feira da semana atual, repor `consecutive_meals = 0` e `current_week_start = monday(now())`.
5. **Incrementar** `consecutive_meals += 1` e somar `+10` a `total_points`.
6. Se `consecutive_meals` chegar a 4 → `discount_available = true`, `discount_earned_at = now()`, e marcar `reachedDiscount = true` no retorno.
7. **Inserir transação** (`type='meal'`, `amount=0`, `points_earned=10`, `description='Refeição N/4'`).
8. **Inserir admin_action** (`action_type='register_meal'`, `points_changed=10`, refs do cliente e da transação).
9. Devolver `{ success: true, meals, reachedDiscount, points }`.

Definir como `SECURITY DEFINER`, `SET search_path = public`, e `REVOKE EXECUTE ... FROM anon, authenticated` (a edge chama com service_role, ignora o REVOKE) — isto também elimina os warnings do linter sobre `SECURITY DEFINER` executável publicamente.

## Verificação

1. `SELECT proname FROM pg_proc WHERE proname='register_meal_atomic';` → 1 linha.
2. No painel Admin: pesquisar cliente, registar refeição → toast "+10 pontos · Refeição N/4", `profiles.consecutive_meals` e `current_week_start` atualizados, nova linha em `transactions` e `admin_actions`.
3. Repetir no mesmo dia → resposta `cooldown_active`.

## Notas

- Sem alterações a `Admin.tsx` nem a `register-meal/index.ts` — o contrato de resposta já está correto no cliente.
- Aproveito para remover o campo `details` do erro devolvido ao cliente em `register-meal/index.ts` (mantendo `console.error` server-side), resolvendo o warning de info-leakage.
