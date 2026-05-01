# Banco de Dados — Refundly Admin

> Supabase PostgreSQL acessado via service role key. Sem RLS, sem Prisma.

---

## Visão Geral

- **Supabase** como banco PostgreSQL
- **Service Role Key** — bypassa RLS, acesso total
- **Sem Prisma** — schema gerenciado diretamente no Supabase
- **Sem @supabase/ssr** — não há Supabase Auth neste projeto
- Client em `lib/supabase/admin.ts`

---

## Client Supabase

```typescript
// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
```

**Regras:**
- NUNCA importe `supabaseAdmin` em componentes client (`"use client"`) — apenas em API Routes e lib server-side.
- NUNCA use este client no browser — ele expõe a service role key.
- NUNCA chame Supabase diretamente de hooks de client component — passe pela API Route.

---

## Tabelas Próprias do Admin Panel

### `platform_admins`

Contas dos administradores da plataforma Refundly.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid | PK |
| `email` | text | Email único |
| `full_name` | text | Nome completo |
| `password_hash` | text | Hash Argon2 |
| `totp_secret` | text | Secret TOTP criptografado (AES-GCM) |
| `totp_enabled` | boolean | Se 2FA está ativo |
| `totp_recovery_codes` | text[] | 10 recovery codes (consumíveis) |
| `is_active` | boolean | Conta ativa |
| `failed_login_attempts` | int | Contador de falhas |
| `locked_until` | timestamptz | Bloqueio temporário |
| `last_login_at` | timestamptz | Último login |
| `last_login_ip` | text | IP do último login |

**Queries em `lib/db/admins.ts`:**
- `findAdminByEmail(email)` — busca por email
- `findAdminById(id)` — busca por ID
- `verifyAdminPassword(admin, password)` — Argon2 verify
- `getDecryptedTotpSecret(admin)` — descriptografa secret
- `updateAdminTOTP(adminId, encryptedSecret, recoveryCodes)` — salva 2FA
- `updateAdminLastLogin(adminId, ip)` — loga login + reseta falhas
- `incrementFailedAttempts(adminId)` — incrementa falhas, bloqueia após 6
- `isAccountLocked(admin)` — verifica bloqueio
- `useRecoveryCode(adminId, code)` — consome recovery code

### `platform_audit_logs`

Log de auditoria de todas as ações dos admins.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid | PK |
| `admin_id` | uuid | FK → platform_admins |
| `action` | text | Ação realizada (ver AuditAction em types.ts) |
| `entity` | text | Entidade afetada (org, member, admin...) |
| `entity_id` | text | ID da entidade |
| `org_id` | uuid | Org afetada (nullable) |
| `metadata` | jsonb | Dados extras |
| `ip` | text | IP do admin |
| `created_at` | timestamptz | Timestamp |

**Funções em `lib/audit.ts`:**
- `logActivity(params)` — grava log (sempre chame após ações importantes)
- `getAuditLog()` — últimos 500 logs
- `getAuditLogByOrg(orgId)` — últimos 100 logs de uma org

---

## Tabelas do Produto Refundly (leitura/gestão)

O admin lê e gerencia dados do produto. Use `supabaseAdmin` para todas as queries.

### Organizações

| Tabela | Propósito |
|---|---|
| `organizations` | Tenants do produto |
| `user_org_roles` | Vínculo user ↔ org com role |

### Membros / Usuários

| Tabela | Propósito |
|---|---|
| `profiles` | Perfis de usuário (1:1 com auth.users do produto) |
| `user_org_roles` | Role do membro na org |

### Billing

| Tabela | Propósito |
|---|---|
| `billing_config` | Planos e limites globais |
| `org_monthly_usage` | Uso mensal por org |
| `billing_events` | Eventos de cobrança |

### Integrações

| Tabela | Propósito |
|---|---|
| `whatsapp_instances` | Instâncias WhatsApp (Evolution) |
| `webhook_configs` | Configuração de webhooks outbound |
| `webhook_logs` | Logs de webhooks |
| `api_keys` | Chaves API (plano Pro) |

### Compliance / Auditoria do produto

| Tabela | Propósito |
|---|---|
| `audit_logs` | Logs de auditoria do produto (separados dos do admin) |
| `email_logs` | Logs de emails enviados |

---

## Tipos de Domínio

Os tipos TypeScript das entidades estão em `lib/types.ts`. Principais:

```typescript
interface Organization {
  id: string
  name: string
  slug: string
  status: OrgStatus           // 'active' | 'suspended' | 'blocked' | 'churned' | 'trial'
  plan: Plan                  // 'free' | 'basic' | 'pro' | 'enterprise'
  mrr: number
  featureFlags: FeatureFlag[]
  // ...
}

interface Member {
  id: string
  email: string
  role: MemberRole            // 'owner' | 'admin' | 'member' | 'viewer'
  status: MemberStatus        // 'active' | 'invited' | 'suspended' | 'deactivated'
  orgId: string
  // ...
}

interface PlatformAdmin {
  id: string
  email: string
  fullName: string
  role: AdminRole             // 'super_admin' | 'admin' | 'support' | 'viewer'
  totpEnabled: boolean
  isActive: boolean
  // ...
}
```

---

## Variáveis de Ambiente Necessárias

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...   # NUNCA no frontend

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...          # NUNCA no frontend

# Auth
SESSION_SECRET=...                    # iron-session
TOTP_ENCRYPTION_KEY=...               # AES-GCM para TOTP secrets
```

Nenhuma dessas variáveis tem prefixo `NEXT_PUBLIC_` — todas são server-only.

---

## Regras para o Cursor

1. **Queries Supabase ficam em API Routes ou `lib/`** — nunca em client components.
2. **Importe `supabaseAdmin` de `lib/supabase/admin.ts`** — não crie novos clients.
3. **NUNCA exponha `SUPABASE_SERVICE_ROLE_KEY` no browser**.
4. **`lib/db/admins.ts` é a camada de acesso a `platform_admins`** — use essas funções, não queries inline.
5. **Toda ação relevante deve chamar `logActivity()`** de `lib/audit.ts`.
6. **Tipos de entidades vêm de `lib/types.ts`** — nunca redefina localmente.
7. **Não há Prisma neste projeto** — não sugira `prisma migrate` ou `@prisma/client`.
8. **Não há RLS aqui** — não escreva policies RLS para este projeto.
9. **Não há Supabase Auth** — auth é feito com `platform_admins` + iron-session.
