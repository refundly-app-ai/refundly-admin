-- =============================================================================
-- Refundly Admin — Melhorias de Performance e Estrutura
-- Executar no SQL Editor do Supabase (em ordem)
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Coluna `role` na tabela platform_admins
--    Necessário para controle de permissão no endpoint de impersonation
-- -----------------------------------------------------------------------------
ALTER TABLE platform_admins
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin'
  CHECK (role IN ('super_admin', 'admin', 'support', 'viewer'));

COMMENT ON COLUMN platform_admins.role IS
  'Nível de permissão do admin: super_admin pode impersonar usuários';


-- -----------------------------------------------------------------------------
-- 2. Índice GIN full-text em organizations (name + slug)
--    Elimina o full sequential scan causado por ILIKE %texto%
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_organizations_fts
  ON organizations
  USING gin(to_tsvector('portuguese', COALESCE(name, '') || ' ' || COALESCE(slug, '')));

COMMENT ON INDEX idx_organizations_fts IS
  'Full-text search index para buscas em name e slug de organizations';


-- -----------------------------------------------------------------------------
-- 3. FK explícita em platform_audit_logs → platform_admins
--    Elimina o workaround Array.isArray() no código TypeScript
--    (só executar se a FK ainda não existir)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'platform_audit_logs_admin_id_fkey'
      AND table_name = 'platform_audit_logs'
  ) THEN
    ALTER TABLE platform_audit_logs
      ADD CONSTRAINT platform_audit_logs_admin_id_fkey
      FOREIGN KEY (admin_id)
      REFERENCES platform_admins(id)
      ON DELETE SET NULL;
  END IF;
END $$;


-- -----------------------------------------------------------------------------
-- 4. RPC superadmin_list_members com paginação e filtros no banco
--    Elimina o carregamento de todos os membros em memória (problema crítico)
--    Substitui a RPC atual que retorna tudo sem limit
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION superadmin_list_members(
  p_limit  INT DEFAULT 20,
  p_offset INT DEFAULT 0,
  p_search TEXT DEFAULT NULL,
  p_role   TEXT DEFAULT NULL
)
RETURNS TABLE (
  user_id          UUID,
  role             TEXT,
  org_id           UUID,
  is_active        BOOLEAN,
  full_name        TEXT,
  email            TEXT,
  whatsapp_verified BOOLEAN,
  org_name         TEXT,
  org_slug         TEXT,
  total_count      BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT
      uor.user_id,
      uor.role,
      uor.org_id,
      COALESCE(uor.is_active, TRUE)   AS is_active,
      p.full_name,
      p.email,
      p.whatsapp_verified,
      o.name                          AS org_name,
      o.slug                          AS org_slug
    FROM user_org_roles uor
    LEFT JOIN profiles p    ON p.id  = uor.user_id
    LEFT JOIN organizations o ON o.id = uor.org_id
    WHERE
      (p_role   IS NULL OR uor.role = p_role)
      AND (
        p_search IS NULL
        OR p.email     ILIKE '%' || p_search || '%'
        OR p.full_name ILIKE '%' || p_search || '%'
      )
  )
  SELECT
    b.user_id,
    b.role,
    b.org_id,
    b.is_active,
    b.full_name,
    b.email,
    b.whatsapp_verified,
    b.org_name,
    b.org_slug,
    COUNT(*) OVER () AS total_count
  FROM base b
  ORDER BY b.full_name ASC NULLS LAST
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION superadmin_list_members(INT, INT, TEXT, TEXT)
  TO service_role;

COMMENT ON FUNCTION superadmin_list_members IS
  'Lista membros paginados com filtro de role e busca por nome/email — evita carregar tudo em memória';


-- -----------------------------------------------------------------------------
-- 5. (Opcional) Index para acelerar buscas de membros por email/full_name
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower
  ON profiles (LOWER(email));

CREATE INDEX IF NOT EXISTS idx_profiles_full_name_lower
  ON profiles (LOWER(full_name));
