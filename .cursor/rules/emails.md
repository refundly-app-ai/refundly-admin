# Emails — Refundly Admin

> O painel admin não dispara emails de produto. Emails relevantes aqui são: notificações internas para admins e eventuais alertas operacionais.

---

## Status Atual

O projeto **Refundly Admin** não possui um sistema de email próprio implementado. Não há:
- Templates de email
- Função de envio SMTP
- Logs de email

As variáveis de ambiente de SMTP presentes no `.env.example` são herdadas do projeto principal Refundly e podem ser usadas caso seja necessário implementar notificações por email para admins no futuro.

---

## Variáveis de Ambiente SMTP Disponíveis

```bash
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=admin@refundly.com
```

---

## Se Precisar Implementar Envio de Email

Caso seja necessário adicionar envio de email neste projeto (ex: alerta de login suspeito, notificação de conta bloqueada), siga estas diretrizes:

### Regras Inegociáveis

1. **Falha de email NUNCA deve falhar a request principal** — capture, logue e continue.
2. **NUNCA retorne tokens, códigos ou secrets em respostas HTTP**.
3. **Falha de SMTP deve ser logada** em `platform_audit_logs` com `action: 'email.failed'`.
4. **Rate limiting obrigatório** em qualquer endpoint que dispare email.
5. **NUNCA exponha detalhes de erro SMTP ao cliente**.

### Onde criar

```
lib/
└── email.ts     # Função de envio (se implementado)
```

### Padrão de implementação

```typescript
// lib/email.ts
async function sendAdminEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    // implementação SMTP
  } catch (error) {
    console.error('[sendAdminEmail] Falha ao enviar:', error)
    // NÃO propague o erro — falha de email não deve quebrar o fluxo
  }
}
```

---

## Notificações In-App

Para notificações dentro do painel admin, use o endpoint `/api/notifications` que já existe na estrutura do projeto.
