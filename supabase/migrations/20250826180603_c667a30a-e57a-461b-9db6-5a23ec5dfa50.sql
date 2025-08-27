-- Corrigir função log_profile_access adicionando search_path
CREATE OR REPLACE FUNCTION public.log_profile_access(
  accessed_user_id UUID,
  access_type TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Corrigir função mask_cpf adicionando search_path
CREATE OR REPLACE FUNCTION public.mask_cpf(cpf_value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF cpf_value IS NULL OR LENGTH(cpf_value) < 4 THEN
    RETURN '***.**.***.***-**';
  END IF;
  
  RETURN '***.**.***.***-' || RIGHT(cpf_value, 2);
END;
$$;

-- Corrigir função can_view_full_cpf adicionando search_path
CREATE OR REPLACE FUNCTION public.can_view_full_cpf(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
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

-- Corrigir função admin_get_profile adicionando search_path
CREATE OR REPLACE FUNCTION public.admin_get_profile(target_user_id UUID)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Corrigir função admin_list_profiles adicionando search_path
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
SET search_path = public
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

-- Corrigir função audit_profile_access adicionando search_path
CREATE OR REPLACE FUNCTION public.audit_profile_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Se um superadmin está acessando o perfil de outro usuário, registrar
  IF is_superadmin(auth.uid()) AND auth.uid() != NEW.user_id THEN
    PERFORM log_profile_access(NEW.user_id, 'view');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Remover a view insegura e substituir por uma abordagem mais segura
DROP VIEW IF EXISTS public.profiles_safe;

-- Criar uma função segura em vez de view para obter dados mascarados
CREATE OR REPLACE FUNCTION public.get_profile_safe(target_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  full_name TEXT,
  user_role user_role,
  approval_status approval_status,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  cpf_display TEXT,
  cpf_masked BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Se target_user_id for fornecido, retornar apenas esse perfil
  IF target_user_id IS NOT NULL THEN
    RETURN QUERY 
    SELECT 
      p.id,
      p.user_id,
      p.full_name,
      p.user_role,
      p.approval_status,
      p.approved_by,
      p.approved_at,
      p.created_at,
      p.updated_at,
      CASE 
        WHEN can_view_full_cpf(p.user_id) THEN p.cpf
        ELSE mask_cpf(p.cpf)
      END AS cpf_display,
      NOT can_view_full_cpf(p.user_id) AS cpf_masked
    FROM public.profiles p
    WHERE p.user_id = target_user_id
    AND (
      p.user_id = auth.uid() 
      OR is_superadmin(auth.uid())
      OR (is_user_approved(auth.uid()) AND target_user_id != auth.uid())
    );
  ELSE
    -- Se nenhum ID específico, retornar perfil do usuário atual
    RETURN QUERY 
    SELECT 
      p.id,
      p.user_id,
      p.full_name,
      p.user_role,
      p.approval_status,
      p.approved_by,
      p.approved_at,
      p.created_at,
      p.updated_at,
      p.cpf AS cpf_display,
      FALSE AS cpf_masked
    FROM public.profiles p
    WHERE p.user_id = auth.uid();
  END IF;
END;
$$;