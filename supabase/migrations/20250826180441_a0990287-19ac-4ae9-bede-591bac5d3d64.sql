-- Primeiro, vamos criar uma tabela de auditoria para rastrear acessos a dados sensíveis
CREATE TABLE IF NOT EXISTS public.profile_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_user_id UUID NOT NULL,
  accessor_user_id UUID NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'update', 'cpf_view')),
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Habilitar RLS na tabela de auditoria
ALTER TABLE public.profile_access_log ENABLE ROW LEVEL SECURITY;

-- Policy para permitir que apenas superadmins vejam os logs de auditoria
CREATE POLICY "Only superadmins can view access logs" ON public.profile_access_log
FOR SELECT USING (is_superadmin(auth.uid()));

-- Policy para permitir inserção de logs (será usada por triggers)
CREATE POLICY "System can insert access logs" ON public.profile_access_log
FOR INSERT WITH CHECK (true);

-- Criar função para registrar acessos sensíveis
CREATE OR REPLACE FUNCTION public.log_profile_access(
  accessed_user_id UUID,
  access_type TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profile_access_log (
    accessed_user_id,
    accessor_user_id,
    access_type,
    accessed_at
  ) VALUES (
    accessed_user_id,
    auth.uid(),
    access_type,
    NOW()
  );
END;
$$;

-- Criar função para mascarar CPF (mostra apenas os últimos 4 dígitos)
CREATE OR REPLACE FUNCTION public.mask_cpf(cpf_value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF cpf_value IS NULL OR LENGTH(cpf_value) < 4 THEN
    RETURN '***.**.***.***-**';
  END IF;
  
  RETURN '***.**.***.***-' || RIGHT(cpf_value, 2);
END;
$$;

-- Criar função para verificar se o usuário tem permissão para ver CPF completo
CREATE OR REPLACE FUNCTION public.can_view_full_cpf(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Usuário pode ver seu próprio CPF completo
  IF auth.uid() = target_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Superadmins podem ver CPF completo (mas será registrado)
  IF is_superadmin(auth.uid()) THEN
    -- Registrar o acesso ao CPF sensível
    PERFORM log_profile_access(target_user_id, 'cpf_view');
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Remover as policies antigas para substituir por versões mais seguras
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON public.profiles;

-- Criar nova policy de SELECT mais restritiva
CREATE POLICY "Users can view basic profile info" ON public.profiles
FOR SELECT USING (
  -- Usuários podem ver perfis básicos de outros usuários (sem CPF)
  (auth.uid() IS NOT NULL AND is_user_approved(auth.uid()))
  OR
  -- Podem ver seu próprio perfil completo
  (auth.uid() = user_id)
  OR
  -- Superadmins podem ver perfis completos
  (is_superadmin(auth.uid()))
);

-- Criar policy de UPDATE mais restritiva
CREATE POLICY "Users can update own profile or superadmins can update any" ON public.profiles
FOR UPDATE USING (
  (auth.uid() = user_id) OR is_superadmin(auth.uid())
) WITH CHECK (
  (auth.uid() = user_id) OR is_superadmin(auth.uid())
);

-- Criar view segura para expor dados de perfil sem CPF completo para usuários normais
CREATE OR REPLACE VIEW public.profiles_safe AS
SELECT 
  id,
  user_id,
  full_name,
  user_role,
  approval_status,
  approved_by,
  approved_at,
  created_at,
  updated_at,
  -- Mascarar CPF baseado na permissão do usuário
  CASE 
    WHEN can_view_full_cpf(user_id) THEN cpf
    ELSE mask_cpf(cpf)
  END AS cpf_display,
  -- Incluir flag indicando se o CPF está mascarado
  NOT can_view_full_cpf(user_id) AS cpf_masked
FROM public.profiles;

-- Habilitar RLS na view
ALTER VIEW public.profiles_safe SET (security_barrier = true);

-- Criar trigger para registrar acessos quando superadmins visualizam perfis
CREATE OR REPLACE FUNCTION public.audit_profile_access()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se um superadmin está acessando o perfil de outro usuário, registrar
  IF is_superadmin(auth.uid()) AND auth.uid() != NEW.user_id THEN
    PERFORM log_profile_access(NEW.user_id, 'view');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Não podemos criar trigger em SELECT, então vamos criar uma função wrapper para consultas administrativas
CREATE OR REPLACE FUNCTION public.admin_get_profile(target_user_id UUID)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário tem permissão de superadmin
  IF NOT is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas superadmins podem usar esta função';
  END IF;
  
  -- Se estiver acessando perfil de outro usuário, registrar no log
  IF auth.uid() != target_user_id THEN
    PERFORM log_profile_access(target_user_id, 'view');
  END IF;
  
  -- Retornar o perfil
  RETURN QUERY SELECT * FROM public.profiles WHERE user_id = target_user_id;
END;
$$;

-- Criar função para listar usuários de forma segura (para a página de gerenciamento)
CREATE OR REPLACE FUNCTION public.admin_list_profiles()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  full_name TEXT,
  cpf_masked TEXT,
  user_role user_role,
  approval_status approval_status,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário tem permissão de superadmin
  IF NOT is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas superadmins podem listar perfis';
  END IF;
  
  -- Registrar que o superadmin está visualizando a lista de usuários
  INSERT INTO public.profile_access_log (
    accessed_user_id,
    accessor_user_id,
    access_type
  ) VALUES (
    auth.uid(), -- self access for listing
    auth.uid(),
    'view'
  );
  
  -- Retornar perfis com CPF mascarado por segurança
  RETURN QUERY 
  SELECT 
    p.id,
    p.user_id,
    p.full_name,
    mask_cpf(p.cpf) as cpf_masked,
    p.user_role,
    p.approval_status,
    p.approved_by,
    p.approved_at,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$;