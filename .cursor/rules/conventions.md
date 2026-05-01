# Convenções de Código — Refundly Admin

> Padrões que todo código novo deve seguir.

---

## TypeScript

### Strict Mode

- `strict: true` no tsconfig — sem exceção.
- NUNCA use `as any` — resolva o tipo correto.
- `eslint.config.mjs` permite `any` em queries do Supabase por ausência de tipos gerados — isso é exceção pontual, não regra geral.
- Prefira `unknown` sobre `any` quando o tipo é realmente desconhecido.

### Tipos Compartilhados

Todos os tipos de domínio ficam em `lib/types.ts`:

```typescript
// Tipos disponíveis em lib/types.ts
type OrgStatus = 'active' | 'suspended' | 'blocked' | 'churned' | 'trial'
type Plan = 'free' | 'basic' | 'pro' | 'enterprise'
type MemberRole = 'owner' | 'admin' | 'member' | 'viewer'
type MemberStatus = 'active' | 'invited' | 'suspended' | 'deactivated'
type AdminRole = 'super_admin' | 'admin' | 'support' | 'viewer'
type AuditAction = 'login' | 'logout' | 'user.*' | 'org.*' | 'billing.*' | 'feature_flag.*' | 'impersonation.*'
type ComplianceStatus = 'compliant' | 'non_compliant' | 'pending_review'
type ComplianceFramework = 'SOC2' | 'GDPR' | 'HIPAA' | 'ISO27001' | 'PCI_DSS'
type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'syncing' | 'degraded'
type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing'
```

- **NUNCA** redefina `Organization`, `Member`, `PlatformAdmin`, `AuditLog` localmente — importe de `lib/types.ts`.
- Para props de componentes, defina interfaces locais no próprio arquivo.

---

## Imports

### Ordem

```typescript
// 1. React / Next.js
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// 2. Bibliotecas externas
import { useQuery, useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// 3. Componentes UI (shadcn)
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

// 4. Componentes do projeto
import { DataTable } from '@/components/dashboard/data-table'

// 5. Hooks
import { useSession } from '@/hooks/useSession'

// 6. Utils / Lib
import { cn } from '@/lib/utils'
import { supabaseAdmin } from '@/lib/supabase/admin'

// 7. Types
import type { Organization, Member } from '@/lib/types'
```

### Path Aliases

```json
// tsconfig.json — alias configurado
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

- SEMPRE use `@/` para imports — nunca `../../`.
- Use `import type` para imports que são apenas tipos.

---

## Componentes React

### Server vs Client

```typescript
// Server Component (padrão) — sem "use client"
// Pode: async/await, ler cookies, acessar lib server-side
// Não pode: useState, useEffect, onClick, hooks

export default async function OrganizationsPage() {
  const orgs = await fetchOrganizations()
  return <OrganizationList orgs={orgs} />
}

// Client Component — TEM "use client"
// Precisa de: state, eventos, hooks, TanStack Query

"use client"
export function SuspendOrgDialog({ org, onSuccess }: Props) {
  const [open, setOpen] = useState(false)
  // ...
}
```

### Use "use client" somente quando precisa de:
- `useState`, `useReducer`, `useEffect`, `useRef`
- Event handlers (`onClick`, `onChange`, `onSubmit`)
- Browser APIs
- React Hook Form
- TanStack React Query (`useQuery`, `useMutation`)
- next-themes

### Naming

- Componentes: PascalCase (`MetricsCards.tsx`)
- Hooks: camelCase com prefixo `use` (`useSession.ts`)
- Utils: camelCase (`formatCurrency`)
- Arquivos: mesmo nome do export principal
- Pastas de rotas: kebab-case (`setup-2fa`)
- Pastas de componentes: camelCase (`dashboard/`)

### Estrutura de Componente

```typescript
"use client"

import { useState } from 'react'

interface OrgCardProps {
  org: Organization
  onSuspend?: (id: string) => void
}

export function OrgCard({ org, onSuspend }: OrgCardProps) {
  // 1. Hooks
  const [isOpen, setIsOpen] = useState(false)

  // 2. Derived state
  const isPastDue = org.subscriptionStatus === 'past_due'

  // 3. Handlers
  const handleSuspend = useCallback(() => {
    onSuspend?.(org.id)
  }, [org.id, onSuspend])

  // 4. Early returns
  if (!org) return null

  // 5. Render
  return (
    <Card>
      <CardContent>...</CardContent>
    </Card>
  )
}
```

---

## TanStack React Query

### Padrões

```typescript
// Query keys — sempre array com identificadores
const orgKeys = {
  all: ['organizations'] as const,
  lists: () => [...orgKeys.all, 'list'] as const,
  list: (filters: OrgFilters) => [...orgKeys.lists(), filters] as const,
  detail: (id: string) => [...orgKeys.all, 'detail', id] as const,
}

// useQuery
const { data, isLoading, error } = useQuery({
  queryKey: orgKeys.list(filters),
  queryFn: async () => {
    const res = await fetch(`/api/organizations?${params}`)
    if (!res.ok) throw new Error('Falha ao carregar organizações')
    return res.json()
  },
})

// useMutation com invalidação
const suspendOrg = useMutation({
  mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
    const res = await fetch(`/api/organizations/${id}/suspend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    if (!res.ok) throw new Error('Falha ao suspender organização')
    return res.json()
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: orgKeys.lists() })
    toast.success('Organização suspensa com sucesso')
  },
  onError: () => {
    toast.error('Erro ao suspender organização')
  },
})
```

### Regras

- Fetch de dados via API Routes (`/api/...`) — nunca chame Supabase direto de client components.
- Sempre trate erros de resposta HTTP (`if (!res.ok) throw new Error(...)`).
- Invalide queries relacionadas após mutations.
- `staleTime` para dados que mudam pouco (KPIs: 30s, listas: 60s).

---

## Zod Schemas

- Schemas de validação ficam em `lib/validators/`:
  - `lib/validators/auth.ts` — login, TOTP, troca de senha
  - `lib/validators/member.ts` — ban, filtros, convite
  - `lib/validators/organization.ts` — suspender, trocar plano, filtros
- Nomeie como `{Ação}{Entidade}Schema`: `suspendOrgSchema`, `loginSchema`
- Sempre use `.trim()` em strings para evitar espaços
- Sempre use `.max()` em strings para limitar tamanho

---

## API Routes

### Padrão de resposta

```typescript
// Sucesso
return NextResponse.json({ data })

// Erro de validação
return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

// Não autenticado
return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

// Sem permissão
return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

// Erro interno
return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
```

### Estrutura de uma API Route

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { z } from 'zod'
import { logActivity } from '@/lib/audit'

const BodySchema = z.object({
  reason: z.string().min(1).max(500).trim(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session.adminId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  try {
    // ... lógica
    await logActivity({ adminId: session.adminId, action: 'org.suspend', /* ... */ })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[POST /api/organizations/[id]/suspend]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
```

---

## Estilização

- **Tailwind CSS** para tudo — nunca CSS inline ou CSS modules.
- **shadcn/ui** (estilo "new-york") para componentes base — nunca recrie button, input, dialog do zero.
- `cn()` de `lib/utils.ts` para merge de classes condicionais:
  ```typescript
  import { cn } from '@/lib/utils'
  <div className={cn('base', isActive && 'active')} />
  ```
- Responsivo mobile-first: `className="p-4 md:p-6"`
- Dark mode suportado via `next-themes` — use tokens semânticos do Tailwind quando possível.

---

## Formulários

- **React Hook Form** + **Zod** via `@hookform/resolvers/zod`.
- Schemas definidos em `lib/validators/` ou localmente se específicos da tela.
- Componentes `Form`, `FormField`, `FormItem`, `FormLabel`, `FormMessage` do shadcn.

---

## Toast Notifications

- Use `sonner` para toasts — já configurado no layout raiz.
- `toast.success()` após sucesso de mutation.
- `toast.error()` após erro de mutation.
- Mensagens em pt-BR e amigáveis ao usuário.

---

## Tratamento de Erros

```typescript
// Em hooks/mutations — toast para o usuário
onError: () => {
  toast.error('Mensagem amigável')
  console.error('[useSuspendOrg]', error)
}

// Em API Routes — response HTTP com mensagem genérica
} catch (error) {
  console.error('[POST /api/organizations/suspend]', error)
  return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
}

// NUNCA exponha detalhes internos ao cliente
// ❌ return NextResponse.json({ error: error.message })
// ✅ return NextResponse.json({ error: 'Erro ao processar' })
```

---

## Commits

- Em português.
- Formato: `tipo: descrição curta`
- Tipos: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `security`
- Exemplos:
  - `security: adicionar rate limiting em /api/auth/login`
  - `feat: implementar suspensão de organização`
  - `fix: corrigir expiração de sessão no middleware`
  - `refactor: extrair lógica de TOTP para lib/auth/totp`
  - `chore: atualizar dependências`
