## Objetivo

Regularizar o desconto de 10€ da cliente **Neuza Lopes** (código 695742), que já foi entregue no restaurante mas continua marcado como disponível na conta.

## Estado atual verificado

- `discount_available = true`, ganho a 05/07/2026
- `total_savings = 0`
- Sem qualquer transação de resgate no histórico (a última entrada é "Refeição 3/4" a 03/07)

## Ações

1. **Atualizar o perfil** desta cliente:
   - `discount_available` → falso
   - `discount_earned_at` → vazio
   - `total_savings` → 10 (0 + 10€)

2. **Criar entrada no histórico do cliente** (tabela de transações):
   - tipo `redeem_discount`, valor 10€, 0 pontos, descrição "Desconto 10€ resgatado", data de **27/07/2026**

3. **Registar no histórico de admin** a ação `redeem_discount` para a cliente, também com data de 27/07/2026, para ficar rasto da regularização.

## Notas técnicas

A alteração ao perfil precisa de correr como `service_role` na mesma transação, porque o trigger `restrict_profile_update` reverte alterações a `discount_available`, `total_savings` e `discount_earned_at` feitas fora desse contexto. Nada de pontos é alterado (`total_points` mantém-se em 90).

Isto é uma correção pontual de dados desta cliente — não altera código nem a lógica de resgate.
