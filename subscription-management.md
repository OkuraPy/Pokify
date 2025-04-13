# Gerenciamento de Assinaturas - Pokify

Este documento contém todas as informações necessárias para gerenciar assinaturas através das Edge Functions do Supabase.

## Token de Autenticação

Usar este token para todas as requisições:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udGVzY3BqZWZnaGNra2tsc2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NjE2MjgsImV4cCI6MjA1NjAzNzYyOH0.eXsEOWg5y5c0n3WetqjpRhiLeCVmVJT0CwJWvw9_glA
```

URL base: `https://mntescpjefghckkklslo.supabase.co/functions/v1/`

## Planos Disponíveis

| ID | Nome    | Tipo      | Ciclo      | Duração   | Lojas |
|----|---------|-----------|------------|-----------|-------|
| 1  | STARTER | Mensal    | monthly    | 30 dias   | 2     |
| 2  | GROWTH  | Semestral | semi_annual| 6 meses   | 5     |
| 3  | PRO     | Vitalício | lifetime   | Ilimitado | 5     |

## Comandos para Ativar Planos

### Plano STARTER (Mensal)

```bash
curl -L -X POST 'https://mntescpjefghckkklslo.supabase.co/functions/v1/handle-subscription' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udGVzY3BqZWZnaGNra2tsc2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NjE2MjgsImV4cCI6MjA1NjAzNzYyOH0.eXsEOWg5y5c0n3WetqjpRhiLeCVmVJT0CwJWvw9_glA' \
  -H 'Content-Type: application/json' \
  --data '{"userEmail":"email_do_usuario@exemplo.com","planType":"STARTER","name":"Nome do Usuário"}'
```

Ou usando o código numérico:

```bash
curl -L -X POST 'https://mntescpjefghckkklslo.supabase.co/functions/v1/handle-subscription' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udGVzY3BqZWZnaGNra2tsc2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NjE2MjgsImV4cCI6MjA1NjAzNzYyOH0.eXsEOWg5y5c0n3WetqjpRhiLeCVmVJT0CwJWvw9_glA' \
  -H 'Content-Type: application/json' \
  --data '{"userEmail":"email_do_usuario@exemplo.com","planType":"1","name":"Nome do Usuário"}'
```

### Plano GROWTH (Semestral)

```bash
curl -L -X POST 'https://mntescpjefghckkklslo.supabase.co/functions/v1/handle-subscription' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udGVzY3BqZWZnaGNra2tsc2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NjE2MjgsImV4cCI6MjA1NjAzNzYyOH0.eXsEOWg5y5c0n3WetqjpRhiLeCVmVJT0CwJWvw9_glA' \
  -H 'Content-Type: application/json' \
  --data '{"userEmail":"email_do_usuario@exemplo.com","planType":"GROWTH","name":"Nome do Usuário"}'
```

Ou usando o código numérico:

```bash
curl -L -X POST 'https://mntescpjefghckkklslo.supabase.co/functions/v1/handle-subscription' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udGVzY3BqZWZnaGNra2tsc2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NjE2MjgsImV4cCI6MjA1NjAzNzYyOH0.eXsEOWg5y5c0n3WetqjpRhiLeCVmVJT0CwJWvw9_glA' \
  -H 'Content-Type: application/json' \
  --data '{"userEmail":"email_do_usuario@exemplo.com","planType":"2","name":"Nome do Usuário"}'
```

### Plano PRO (Vitalício)

```bash
curl -L -X POST 'https://mntescpjefghckkklslo.supabase.co/functions/v1/handle-subscription' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udGVzY3BqZWZnaGNra2tsc2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NjE2MjgsImV4cCI6MjA1NjAzNzYyOH0.eXsEOWg5y5c0n3WetqjpRhiLeCVmVJT0CwJWvw9_glA' \
  -H 'Content-Type: application/json' \
  --data '{"userEmail":"email_do_usuario@exemplo.com","planType":"PRO","name":"Nome do Usuário"}'
```

Ou usando o código numérico:

```bash
curl -L -X POST 'https://mntescpjefghckkklslo.supabase.co/functions/v1/handle-subscription' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udGVzY3BqZWZnaGNra2tsc2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NjE2MjgsImV4cCI6MjA1NjAzNzYyOH0.eXsEOWg5y5c0n3WetqjpRhiLeCVmVJT0CwJWvw9_glA' \
  -H 'Content-Type: application/json' \
  --data '{"userEmail":"email_do_usuario@exemplo.com","planType":"3","name":"Nome do Usuário"}'
```

## Processamento de Chargebacks e Estornos

Esta função é usada para excluir completamente a conta de um usuário quando ele solicita estorno ou realiza um chargeback. A exclusão é permanente e remove todos os dados do usuário.

```bash
curl -L -X POST 'https://mntescpjefghckkklslo.supabase.co/functions/v1/handle-chargeback' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udGVzY3BqZWZnaGNra2tsc2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NjE2MjgsImV4cCI6MjA1NjAzNzYyOH0.eXsEOWg5y5c0n3WetqjpRhiLeCVmVJT0CwJWvw9_glA' \
  -H 'Content-Type: application/json' \
  --data '{"userEmail":"email_do_usuario@exemplo.com","reason":"Chargeback solicitado pelo cliente"}'
```

Esta função realiza as seguintes ações:
1. Registra o evento de chargeback no histórico
2. Exclui todas as assinaturas do usuário
3. Exclui todas as lojas do usuário
4. Exclui o usuário da tabela `users`
5. Tenta excluir o usuário do sistema de autenticação

**⚠️ ATENÇÃO: Esta ação é irreversível. Os dados excluídos não podem ser recuperados.**

## Verificação Automática de Assinaturas Expiradas

Este comando deve ser executado diariamente via CRON para verificar assinaturas expiradas:

```bash
curl -L -X POST 'https://mntescpjefghckkklslo.supabase.co/functions/v1/check-expired-subscriptions' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udGVzY3BqZWZnaGNra2tsc2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NjE2MjgsImV4cCI6MjA1NjAzNzYyOH0.eXsEOWg5y5c0n3WetqjpRhiLeCVmVJT0CwJWvw9_glA' \
  -H 'Content-Type: application/json' \
  --data '{}'
```

## Notas Importantes

1. **Criação de assinaturas:**
   - Sempre cria uma nova assinatura e cancela assinaturas anteriores
   - Define a data de vencimento com base na data atual do pagamento
   - Atualiza automaticamente o status do usuário para "active"
   - Configura os limites de lojas e produtos conforme o plano
   - **Importante**: O parâmetro "name" é obrigatório e deve conter o nome do usuário

2. **Como usar com N8N:**
   - Configurar um webhook para receber notificações de pagamento
   - Extrair o email do usuário do webhook
   - Extrair o tipo de plano do webhook ou definir manualmente
   - Fazer a chamada HTTP POST para a Edge Function
   - Configurar um CRON diário para verificar assinaturas expiradas
   - Configurar um webhook para estornos/chargebacks que chame a função handle-chargeback

3. **Comportamento de renovação:**
   - Para renovações, simplesmente chame a função novamente com o mesmo email e tipo de plano
   - A data de vencimento sempre será atualizada para o período completo a partir da data atual
   - O usuário não perde dias se renovar após o vencimento, recebe o período completo

4. **Políticas de Estorno/Chargeback:**
   - Quando um usuário solicita estorno ou faz chargeback, todos os seus dados são excluídos permanentemente
   - Esta abordagem protege o sistema contra usuários que tentam obter serviços sem pagar
   - O email do estorno deve corresponder exatamente ao email registrado do usuário 