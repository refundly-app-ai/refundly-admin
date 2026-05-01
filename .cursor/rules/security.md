# Regras de Segurança — Refundly Admin

> Este painel tem acesso total à plataforma via service role key. Qualquer falha de segurança aqui compromete todos os clientes. Trate com máxima seriedade.

---

## Autenticação — Regras Críticas

### 2FA Obrigatório

- Todo admin **deve** configurar TOTP antes de acessar o painel.
- O middleware (`proxy.ts`) bloqueia acesso sem `totpVerified: true` na sessão.
- NUNCA adicione bypass de 2FA, nem para desenvolvimento.
- Recovery codes são a única alternativa ao TOTP — 10 códigos, cada um usado uma única vez.

### Sessão (iron-session)

- Cookie: `__Host-pa_sess` em produção — prefix `__Host-` garante secure + path=/ + sem domain.
- `httpOnly: true` — nunca acessível via JavaScript.
- `sameSite: 'lax'` — protege contra CSRF.
- TTL: 8 horas — validado pelo middleware em cada request, não apenas na criação.
- NUNCA armazene tokens, secrets ou dados sensíveis em localStorage ou sessionStorage.
- NUNCA exponha `SESSION_SECRET` — se vazar, todas as sessões podem ser forjadas.

### Bloqueio de Conta

- 6 tentativas de login falhas → conta bloqueada por 15 minutos.
- Lógica em `lib/db/admins.ts` — `incrementFailedAttempts` e `isAccountLocked`.
- Login bem-sucedido reseta o contador via `updateAdminLastLogin`.
- Admins bloqueados são redirecionados para `/locked`.

---

## Rate Limiting

Implementado com Upstash Redis em `lib/auth/rate-limit.ts`. **Não remova ou contorne.**

| Endpoint | Limiter | Limite | Janela |
|---|---|---|---|
| `POST /api/auth/login` | `loginRateLimiter` | 5 tentativas | 15 min por IP |
| `POST /api/auth/verify-2fa` | `totpRateLimiter` | 10 tentativas | 15 min por sessão |
| Demais API routes | `apiRateLimiter` | 100 requests | 1 min por admin |

```typescript
// Padrão obrigatório em endpoints sensíveis
const { success, remaining } = await checkRateLimit(identifier, limit, windowSeconds)
if (!success) {
  return NextResponse.json({ error: 'Muitas tentativas. Tente novamente mais tarde.' }, { status: 429 })
}
```

---

## Secrets e Variáveis de Ambiente

### Regras

- NUNCA hardcode URLs, API keys, secrets ou tokens no código.
- NUNCA use fallback inseguro para variáveis de ambiente:

```typescript
// ❌ ERRADO — fallback expõe secret em produção sem configuração
const key = process.env.SESSION_SECRET || 'fallback-insecure-key'

// ✅ CERTO — falha explícita
const key = process.env.SESSION_SECRET
if (!key) throw new Error('SESSION_SECRET não configurado')
```

- NENHUMA variável deste projeto tem prefixo `NEXT_PUBLIC_` — todas são server-only.
- `.env` nunca deve ser commitado. `.env.example` existe com placeholders.

### Variáveis Críticas

| Variável | Risco se Vazar |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Acesso total ao banco de todos os clientes |
| `SESSION_SECRET` | Sessões podem ser forjadas |
| `TOTP_ENCRYPTION_KEY` | Secrets TOTP de todos os admins expostos |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiting pode ser contornado |

---

## TOTP — Armazenamento Seguro

- O secret TOTP **nunca é salvo em plaintext** no banco.
- Criptografado com AES-GCM usando `TOTP_ENCRYPTION_KEY` antes de gravar.
- IV aleatório a cada criptografia, concatenado ao ciphertext.
- Descriptografia apenas em `lib/auth/crypto.ts` — nunca reimplemente localmente.
- Se `TOTP_ENCRYPTION_KEY` for trocada, todos os secrets salvos tornam-se inválidos.

```typescript
// ✅ Use sempre as funções de lib/auth/crypto.ts
import { encryptSecret, decryptSecret } from '@/lib/auth/crypto'
```

---

## Supabase Service Role

- O client `supabaseAdmin` usa `SUPABASE_SERVICE_ROLE_KEY` — **bypassa RLS completamente**.
- Isso é intencional — o painel admin precisa ver todos os dados de todas as orgs.
- **NUNCA importe `supabaseAdmin` em arquivos com `"use client"`** — isso exporia a key no bundle do browser.
- **NUNCA passe `supabaseAdmin` como prop para componentes client**.
- Use-o apenas em:
  - API Routes (`app/api/`)
  - Funções de `lib/` (server-side only)
  - Scripts (`scripts/`)

---

## Proteção de Rotas

O `proxy.ts` (middleware) é a **única barreira de segurança** de rotas. Ele:

1. Verifica sessão válida (`adminId` presente)
2. Verifica expiração de sessão (8 horas)
3. Verifica `totpVerified: true` para acesso ao dashboard
4. Redireciona para `/login` se não autenticado
5. Retorna 401/403 para API routes sem sessão
6. Define headers de segurança em toda resposta

**NUNCA** implemente proteção de rota apenas em componentes client — isso é bypassável.

### Headers de Segurança (definidos no middleware)

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000 (produção)
```

---

## Validação de Input

**Toda** API Route deve validar o body com Zod antes de processar.

```typescript
import { z } from 'zod'

const BodySchema = z.object({
  reason: z.string().min(1).max(500).trim(),
  confirmSlug: z.string().min(1).max(100).trim(),
})

const parsed = BodySchema.safeParse(body)
if (!parsed.success) {
  return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
}
// Use parsed.data daqui em diante — nunca use body diretamente
```

Schemas reutilizáveis ficam em `lib/validators/`:
- `lib/validators/auth.ts`
- `lib/validators/member.ts`
- `lib/validators/organization.ts`

---

## Impersonação de Usuário

- Endpoint: `POST /api/members/[id]/impersonate`
- **Deve ser logada** via `logActivity()` com `action: 'impersonation.start'`.
- Exige confirmação explícita — não deve ser ação acidental.
- Somente admins com role `super_admin` ou `admin` podem impersonar.
- Log deve incluir: adminId, memberId, orgId, IP.

---

## Auditoria — Obrigatório

Toda ação relevante deve ser registrada em `platform_audit_logs` via `logActivity()`:

```typescript
await logActivity({
  adminId: session.adminId,
  action: 'org.suspend',       // ver AuditAction em lib/types.ts
  entity: 'organization',
  entityId: orgId,
  orgId: orgId,
  metadata: { reason },
  ip: req.headers.get('x-forwarded-for') ?? 'unknown',
})
```

### Ações que DEVEM ser auditadas

- Login / logout
- Falhas de login
- Configuração / reset de 2FA
- Suspensão / reativação de org
- Troca de plano
- Ban / unban de membro
- Criação / remoção de admin
- Impersonação
- Exportação de dados de compliance
- Troca de senha

---

## Tratamento de Erros — Não Vaze Informação

```typescript
// ❌ NUNCA — expõe stack trace ou detalhes internos
return NextResponse.json({ error: error.message }, { status: 500 })

// ✅ CORRETO — mensagem genérica para o cliente, log interno
console.error('[POST /api/organizations/suspend]', error)
return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
```

---

## Checklist para Code Review

Antes de qualquer PR neste projeto, verifique:

- [ ] Não tem credenciais hardcoded?
- [ ] Variáveis de ambiente falham explicitamente se ausentes?
- [ ] Input validado com Zod na API Route?
- [ ] `supabaseAdmin` não está importado em client component?
- [ ] Ação relevante está sendo auditada via `logActivity()`?
- [ ] Rate limiting aplicado em endpoint sensível?
- [ ] Sessão verificada antes de processar request?
- [ ] Mensagens de erro são genéricas para o cliente?
- [ ] TOTP secret criptografado antes de salvar?
- [ ] Sem bypass de 2FA?
