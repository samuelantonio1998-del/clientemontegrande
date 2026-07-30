## Situação atual (verificada)

Cliente **Neuza Lopes** (código 695742):
- 90 pontos, 0 refeições na semana, sem desconto ativo, 10€ de poupança já registada
- Última refeição registada: 03/07; resgate de 10€ (27/07) já regularizado
- Não existe refeição de 29/07

## O que fazer

Registo retroativo da refeição de **29/07/2026** (quarta-feira):

1. Criar transação `meal` com data 29/07/2026, 10 pontos, descrição "Refeição 1/4"
2. Atualizar o perfil: 90 → 100 pontos, `consecutive_meals` 0 → 1, `current_week_start` = 2026-07-27
3. Registar em `admin_actions` com a mesma data, como registo manual/retroativo ligado à transação

Sem desbloqueio de desconto (fica 1/4 nessa semana).

## Notas técnicas

Escritas via `service_role` para contornar os triggers que bloqueiam alteração direta de pontos, deixando os valores exatamente como o fluxo normal os deixaria.
