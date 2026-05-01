# Melhorias Necessárias e Pontos de Atenção

Este documento lista somente itens que precisam de correção ou melhoria no painel `refundly-admin`.

## Como usar este documento

- Marque os checkboxes conforme execução.
- Não considerar item concluído sem atender o bloco **Critério de conclusão**.
- Após cada bloco finalizado, validar manualmente o endpoint/tela impactada.

## 1) Segurança de sessão

### 1.1 Remover fallback inseguro de `SESSION_SECRET`
- **Arquivo:** `lib/auth/session.ts`
- **Problema:** existe fallback para segredo de sessão em ambiente de desenvolvimento.
- **Risco:** uso de chave fraca/padrão e comportamento divergente entre ambientes.
- **Ação necessária:** falhar explicitamente quando `SESSION_SECRET` não estiver configurado.

#### Checklist técnico executável
- [ ] Remover `process.env.SESSION_SECRET || ...` e usar somente leitura explícita de `SESSION_SECRET`.
- [ ] Criar validação única de env (no próprio arquivo ou helper server-only) lançando erro quando ausente.
- [ ] Garantir que `sessionOptions.password` receba valor validado.
- [ ] Revisar se não existe fallback semelhante para segredos em outros arquivos de auth.

#### Critério de conclusão
- [ ] Aplicação falha no boot sem `SESSION_SECRET`.
- [ ] Com `SESSION_SECRET` definido, login/sessão continuam funcionando normalmente.

## 2) Exposição de erro interno ao cliente

### 2.1 Padronizar mensagens 500 como genéricas
- **Arquivos:** `app/api/members/route.ts`, `app/api/admins/route.ts` (e revisar demais rotas)
- **Problema:** alguns fluxos retornam `error.message` em respostas HTTP.
- **Risco:** vazamento de detalhes internos, estrutura de banco e mensagens sensíveis.
- **Ação necessária:** retornar mensagem genérica ao cliente (`Erro interno do servidor`) e manter detalhe somente em log interno.

#### Checklist técnico executável
- [ ] Em `app/api/members/route.ts`, substituir respostas 500 com `error.message` por mensagem genérica.
- [ ] Em `app/api/admins/route.ts`, substituir respostas 500 com `error.message` por mensagem genérica.
- [ ] Revisar rotas em `app/api/**/route.ts` para o mesmo padrão.
- [ ] Padronizar `console.error('[METODO /api/... ]', error)` para manter rastreabilidade.

#### Critério de conclusão
- [ ] Nenhuma rota retorna stack trace ou `error.message` ao cliente.
- [ ] Logs internos mantêm contexto suficiente para debug.

## 3) Autorização e validação em API Routes

### 3.1 Garantir validação explícita de sessão em todas as APIs
- **Arquivo:** `app/api/members/route.ts` (GET)
- **Problema:** ausência de checagem explícita de sessão no início da rota.
- **Risco:** dependência exclusiva do middleware para proteção; menor robustez defensiva.
- **Ação necessária:** validar `getSession()` no início da route e retornar 401/403 conforme regra.

#### Checklist técnico executável
- [ ] Inserir `getSession()` no início do `GET` de `app/api/members/route.ts`.
- [ ] Retornar 401 quando sem sessão válida (`adminId` ausente).
- [ ] Retornar 403 quando houver regra de permissão específica não atendida (se aplicável).
- [ ] Validar consistência com o padrão já usado nas demais rotas do projeto.

#### Critério de conclusão
- [ ] `GET /api/members` bloqueia acesso sem sessão, mesmo com chamada direta.

### 3.2 Restringir impersonação por role administrativa
- **Arquivo:** `app/api/members/[id]/impersonate/route.ts`
- **Problema:** não há checagem explícita de role (`super_admin`/`admin`) antes de impersonar.
- **Risco:** usuários administrativos sem privilégio adequado podem personificar contas.
- **Ação necessária:** validar role antes de executar a ação e negar com 403 quando não permitido.

#### Checklist técnico executável
- [ ] Carregar dados do admin logado para obter role antes da impersonação.
- [ ] Permitir apenas `super_admin` e `admin`.
- [ ] Retornar 403 com mensagem genérica de permissão insuficiente para roles não permitidas.
- [ ] Registrar tentativa negada em auditoria (`logActivity`) com metadados mínimos.

#### Critério de conclusão
- [ ] Admin autorizado impersona com sucesso.
- [ ] Admin sem role permitida recebe 403 e tentativa fica auditada.

## 4) Governança de credenciais sensíveis

### 4.1 Revisar retorno de senha temporária na criação de admin
- **Arquivo:** `app/api/admins/route.ts`
- **Problema:** `tempPassword` é retornada no payload da API.
- **Risco:** exposição acidental em logs, observabilidade, ferramentas de rede ou histórico de front-end.
- **Ação necessária:** definir política segura de onboarding (ex.: fluxo de primeiro acesso/reset) sem trafegar senha em resposta.

#### Checklist técnico executável
- [ ] Definir estratégia alvo: convite com setup inicial, reset obrigatório ou link de ativação.
- [ ] Remover `tempPassword` da resposta da API.
- [ ] Ajustar front-end de admins para novo fluxo (mensagem/estado de sucesso).
- [ ] Garantir auditoria da criação de admin sem dados sensíveis em metadata.
- [ ] Atualizar documentação operacional interna do onboarding de admins.

#### Critério de conclusão
- [ ] Não há senha trafegando em payload HTTP de criação de admin.
- [ ] Fluxo de onboarding continua utilizável pela equipe.

## 5) Alinhamento com regras do projeto

### 5.1 Executar auditoria de conformidade com `.cursor/rules/*`
- **Escopo:** `auth`, `members`, `admins`, `middleware`, `audit`
- **Problema:** implementação atual tem desvios em relação às regras documentadas.
- **Risco:** inconsistência operacional e regressão de segurança.
- **Ação necessária:** checklist de conformidade por endpoint (sessão, Zod, rate limit, auditoria, erro genérico, autorização por role).

#### Checklist técnico executável
- [ ] Criar matriz de endpoints críticos (`auth`, `members`, `admins`, `organizations`) e mapear requisitos de segurança por endpoint.
- [ ] Verificar em cada rota: sessão, Zod, rate limit (quando sensível), auditoria, erro genérico, autorização por role.
- [ ] Abrir itens de correção para cada desvio encontrado.
- [ ] Revalidar após correções e registrar status final.

#### Critério de conclusão
- [ ] Todos os endpoints críticos possuem evidência de conformidade mínima.
- [ ] Desvios remanescentes ficam documentados com prioridade e responsável.

## Prioridade Recomendada

1. **Crítico:** `SESSION_SECRET` sem fallback + erro genérico em 500.
2. **Alta:** autorização por role em impersonação + validação explícita de sessão em APIs.
3. **Média:** revisão do fluxo de senha temporária de admins.
4. **Contínuo:** auditoria de conformidade com regras internas.

## Plano de execução sugerido (curto prazo)

### Sprint 1 (segurança imediata)
- [ ] Item 1.1 completo
- [ ] Item 2.1 completo
- [ ] Item 3.1 completo
- [ ] Item 3.2 completo

### Sprint 2 (governança e operação)
- [ ] Item 4.1 completo
- [ ] Item 5.1 completo

## Resultado esperado após execução

- Redução de risco de exposição de segredos e detalhes internos.
- Endpoints mais consistentes com as regras de segurança documentadas.
- Fluxo de gestão de admins mais seguro e auditável.
