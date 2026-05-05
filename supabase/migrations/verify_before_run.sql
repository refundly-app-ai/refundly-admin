-- =============================================================================
-- Verificações ANTES de rodar refundly_admin_improvements.sql
-- Execute cada bloco separadamente no SQL Editor do Supabase
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Verificar se a coluna `role` já existe em platform_admins
--    Esperado: 0 linhas → coluna NÃO existe, seguro rodar o ALTER
--    Se retornar 1 linha → coluna já existe, pular o item 1 do migration
-- -----------------------------------------------------------------------------
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'platform_admins'
  AND column_name = 'role';


-- -----------------------------------------------------------------------------
-- 2. Listar todas as colunas de platform_admins (visão geral da tabela)
-- -----------------------------------------------------------------------------
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'platform_admins'
ORDER BY ordinal_position;


-- -----------------------------------------------------------------------------
-- 3. Verificar se o índice GIN já existe em organizations
--    Esperado: 0 linhas → índice NÃO existe, seguro criar
-- -----------------------------------------------------------------------------
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'organizations'
  AND indexname = 'idx_organizations_fts';


-- -----------------------------------------------------------------------------
-- 4. Listar todos os índices de organizations (visão geral)
-- -----------------------------------------------------------------------------
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'organizations'
ORDER BY indexname;


-- -----------------------------------------------------------------------------
-- 5. Verificar se a FK de platform_audit_logs → platform_admins já existe
--    Esperado: 0 linhas → FK NÃO existe, seguro criar
-- -----------------------------------------------------------------------------
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'platform_audit_logs'
  AND constraint_name = 'platform_audit_logs_admin_id_fkey';


-- -----------------------------------------------------------------------------
-- 6. Listar todas as FKs de platform_audit_logs (visão geral)
-- -----------------------------------------------------------------------------
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name  AS foreign_table,
  ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'platform_audit_logs';


-- -----------------------------------------------------------------------------
-- 7. Verificar se a função superadmin_list_members já existe
--    e quais parâmetros ela aceita atualmente
-- -----------------------------------------------------------------------------
SELECT
  p.proname          AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid)    AS return_type
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'superadmin_list_members'
  AND n.nspname = 'public';


-- -----------------------------------------------------------------------------
-- 8. Verificar índices na tabela profiles
--    Esperado: NÃO ter idx_profiles_email_lower nem idx_profiles_full_name_lower
-- -----------------------------------------------------------------------------
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
ORDER BY indexname;


-- -----------------------------------------------------------------------------
-- 9. Contar quantos membros existem (para estimar impacto da nova RPC)
-- -----------------------------------------------------------------------------
SELECT
  COUNT(*)                                      AS total_membros,
  COUNT(*) FILTER (WHERE is_active = true)      AS ativos,
  COUNT(*) FILTER (WHERE is_active = false)     AS inativos
FROM user_org_roles;


-- -----------------------------------------------------------------------------
-- 10. Testar a RPC atual superadmin_list_members (sem parâmetros)
--     Para confirmar que ela funciona e ver o formato atual dos dados
-- -----------------------------------------------------------------------------
SELECT * FROM superadmin_list_members() LIMIT 5;
