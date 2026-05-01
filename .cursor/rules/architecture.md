# Decisões Arquiteturais — Refundly Admin

> Este arquivo documenta decisões já tomadas. Não questione essas decisões — siga-as.

---

## 1. O que é este projeto

O **Refundly Admin** é o painel de controle interno da plataforma Refundly. Não é o app usado pelos clientes — é o painel usado pela equipe da Refundly para gerenciar orgs, membros, billing, compliance e operações da plataforma.

Stack:
- **Next.js 16** (App Router)
- **Supabase** (PostgreSQL via service role — sem RLS)
- **TypeScript** (strict)
- **Tailwind CSS + shadcn/ui**
- **iron-session** (sessão via httpOnly cookies)
- **Upstash Redis** (rate limiting + cache de métricas)
- **Argon2** (hash de senha)
- **OTPAuth** (TOTP 2FA)
- **Recharts** (gráficos)
- **React Hook Form + Zod** (formulários e validação)

---

## 2. Autenticação — Admin Only

Este painel tem seu próprio sistema de auth, **independente do Supabase Auth**. Os admins não são usuários do Supabase Auth — são registros na tabela `platform_admins`.

### Fluxo de login

```
POST /api/auth/login
  → Valida email + senha (Argon2)
  → Se OK + 2FA ativo: retorna { requiresTotp: true }
  → Se OK + sem 2FA: retorna { requiresSetup: true }
  → Cria sessão com iron-session (totpPending ou enrollmentPending)

POST /api/auth/verify-2fa (se 2FA ativo)
  → Valida TOTP de 6 dígitos ou código de recuperação
  → Atualiza sessão: totpVerified: true

GET /api/auth/setup-2fa (se sem 2FA)
POST /api/auth/confirm-2fa
  → Gera e confirma TOTP
  → Grava secret criptografado (AES-GCM) + 10 recovery codes
```

### Sessão (iron-session)

- Cookie: `__Host-pa_sess` em produção (secure + httpOnly + sameSite: lax)
- TTL: 8 horas com validação de expiração no middleware
- Interface `SessionData`: `adminId`, `email`, `fullName`, `totpVerified`, `totpPending`, `enrollmentPending`, `expiresAt`
- Funções em `lib/auth/session.ts`: `getSession`, `createSession`, `destroySession`, `updateSession`
- **Nunca use `@supabase/ssr` aqui** — o auth é próprio, não Supabase Auth

### TOTP

- Emitido como "SuperAdmin", 6 dígitos, período de 30s
- Secret criptografado com AES-GCM antes de salvar (`lib/auth/crypto.ts`)
- `TOTP_ENCRYPTION_KEY` no ambiente — obrigatório
- 10 recovery codes gerados no setup, consumidos um a um

---

## 3. Banco de Dados — Supabase sem RLS

O admin usa o `SUPABASE_SERVICE_ROLE_KEY` que **bypassa o RLS**. Não há isolamento por tenant aqui — o painel vê tudo.

- Client em `lib/supabase/admin.ts`
- `autoRefreshToken: false`, `persistSession: false`
- **Não há** `createServerClient`, `createBrowserClient` ou `@supabase/ssr`
- **Não há** Prisma neste projeto — schema gerenciado diretamente no Supabase

### Tabelas do painel admin

| Tabela | Propósito |
|---|---|
| `platform_admins` | Contas dos admins da plataforma |
| `platform_audit_logs` | Log de auditoria de todas as ações |

### Tabelas do produto (leitura/escrita pelo admin)

O admin lê e gerencia dados do produto Refundly:
| Recurso | Tabelas envolvidas |
|---|---|
| Organizações | `organizations`, `user_org_roles` |
| Membros | `profiles`, `user_org_roles` |
| Billing | `billing_config`, `org_monthly_usage`, `billing_events` |
| Compliance | logs, reports |
| Integrações | `whatsapp_instances`, `webhook_configs` |

---

## 4. Estrutura de Rotas

```
app/
├── (auth)/
│   ├── layout.tsx              # Layout centralizado para auth
│   ├── login/page.tsx          # Login com email/senha + step de 2FA
│   ├── setup-2fa/page.tsx      # Enrolamento TOTP com QR code
│   └── locked/page.tsx         # Conta bloqueada
├── dashboard/
│   ├── layout.tsx              # Sidebar + topbar
│   ├── page.tsx                # Dashboard com KPIs e gráficos
│   ├── audit/page.tsx          # Logs de auditoria
│   ├── billing/page.tsx        # Billing e assinaturas
│   ├── compliance/page.tsx     # Relatórios de compliance
│   ├── integrations/page.tsx   # Integrações de terceiros
│   ├── members/
│   │   ├── page.tsx            # Lista de membros
│   │   └── [id]/page.tsx       # Detalhe do membro
│   ├── operations/page.tsx     # Fila de jobs e operações
│   ├── organizations/
│   │   ├── page.tsx            # Lista de organizações
│   │   └── [id]/page.tsx       # Detalhe da org
│   └── settings/
│       ├── page.tsx            # Configurações gerais
│       ├── admins/page.tsx     # Gerenciar admins
│       └── profile/page.tsx    # Perfil do admin logado
└── api/
    ├── auth/                   # login, logout, 2fa, senha
    ├── admins/                 # CRUD de admins
    ├── me/                     # Perfil atual
    ├── members/                # Membros da plataforma
    ├── organizations/          # Organizações
    ├── audit/                  # Logs de auditoria
    ├── billing/                # Dados de billing
    ├── compliance/             # Relatórios
    ├── dashboard/charts/       # Dados de gráficos
    ├── integrations/           # Status de integrações
    ├── kpis/                   # Métricas KPI
    ├── notifications/          # Notificações do admin
    ├── operations/             # Jobs e filas
    └── system-health/          # Saúde do sistema
```

---

## 5. Estrutura de Arquivos

```
/
├── app/                        # Rotas Next.js (ver seção 4)
├── components/
│   ├── dashboard/              # Componentes do painel
│   │   ├── charts.tsx
│   │   ├── command-palette.tsx
│   │   ├── data-table.tsx
│   │   ├── metrics-cards.tsx
│   │   ├── recent-activity.tsx
│   │   ├── sidebar.tsx
│   │   ├── system-health.tsx
│   │   ├── theme-toggle.tsx
│   │   └── topbar.tsx
│   ├── providers/
│   │   └── query-provider.tsx
│   ├── theme-provider.tsx
│   └── ui/                     # Componentes shadcn/ui
├── hooks/                      # Custom hooks
├── lib/
│   ├── auth/
│   │   ├── crypto.ts           # AES-GCM para TOTP secret
│   │   ├── password.ts         # Argon2 hash/verify + recovery codes
│   │   ├── rate-limit.ts       # Rate limiters (login, totp, api)
│   │   ├── session.ts          # iron-session helpers
│   │   ├── temp-store.ts       # Store temporário (dev)
│   │   └── totp.ts             # Geração e verificação TOTP
│   ├── db/
│   │   └── admins.ts           # Queries na tabela platform_admins
│   ├── supabase/
│   │   └── admin.ts            # Supabase client (service role)
│   ├── validators/
│   │   ├── auth.ts             # Schemas Zod de auth
│   │   ├── member.ts           # Schemas Zod de membros
│   │   └── organization.ts     # Schemas Zod de orgs
│   ├── audit.ts                # Logging para platform_audit_logs
│   ├── redis.ts                # Upstash Redis (cache + rate limit)
│   ├── types.ts                # Tipos compartilhados
│   └── utils.ts                # cn() para merge de classes
├── scripts/
│   └── create-first-admin.ts   # CLI para criar primeiro admin
├── styles/
│   └── globals.css
├── proxy.ts                    # Middleware Next.js (proteção de rotas)
├── next.config.mjs
├── tsconfig.json
└── components.json             # Configuração shadcn/ui
```

---

## 6. Middleware (proxy.ts)

O `proxy.ts` na raiz do projeto é o `middleware.ts` do Next.js renomeado. Ele protege todas as rotas server-side:

- Rotas públicas: `/login`, `/api/auth/login`
- Todas as demais rotas exigem sessão válida
- Valida expiração de sessão (8 horas)
- Redireciona não autenticados para `/login`
- Retorna 401/403 para API routes sem sessão
- Define headers de segurança em todas as respostas
- Gerencia fluxo de enrolamento 2FA (`/setup-2fa`)

---

## 7. Rate Limiting (Upstash Redis)

Três rate limiters em `lib/auth/rate-limit.ts`:

| Limiter | Limite | Janela | Uso |
|---|---|---|---|
| `loginRateLimiter` | 5 tentativas | 15 minutos por IP | Login |
| `totpRateLimiter` | 10 tentativas | 15 minutos por sessão | TOTP verify |
| `apiRateLimiter` | 100 requests | 1 minuto por admin | API geral |

---

## 8. Cache de Métricas (Upstash Redis)

- `cacheMetrics(key, data, ttl?)` — padrão 300s
- `getCachedMetrics(key)` — retorna null se expirado
- Atividade recente: lista circular de 100 itens no Redis
- Sessões: TTL de 24 horas no Redis (complementa iron-session)

---

## 9. Deploy

| Ambiente | Plataforma | Branch |
|---|---|---|
| Produção | Vercel | `main` |

- Variáveis de ambiente configuradas na Vercel
- `argon2` declarado como `serverExternalPackages` no `next.config.mjs` (não pode ser bundled)
- Imagens com `unoptimized: true` (sem CDN de imagens)
