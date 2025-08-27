-- Security fixes migration

-- 1. Add BEFORE UPDATE trigger on profiles to prevent privilege escalation
CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow superadmins to change privileged fields
  IF NOT is_superadmin(auth.uid()) THEN
    -- Check if any privileged field is being changed
    IF (OLD.user_role IS DISTINCT FROM NEW.user_role) OR
       (OLD.approval_status IS DISTINCT FROM NEW.approval_status) OR
       (OLD.approved_by IS DISTINCT FROM NEW.approved_by) OR
       (OLD.approved_at IS DISTINCT FROM NEW.approved_at) THEN
      RAISE EXCEPTION 'Acesso negado: apenas superadmins podem alterar campos privilegiados';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS protect_profile_privileges_trigger ON public.profiles;
CREATE TRIGGER protect_profile_privileges_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileges();

-- 2. Tighten profiles SELECT RLS policy - only self or superadmin
DROP POLICY IF EXISTS "Users can view basic profile info" ON public.profiles;
CREATE POLICY "Users can view own profile or superadmin can view all" 
ON public.profiles 
FOR SELECT 
USING ((auth.uid() = user_id) OR is_superadmin(auth.uid()));

-- 3. Change default user_role to 'user' and update handle_new_user
ALTER TABLE public.profiles ALTER COLUMN user_role SET DEFAULT 'user'::user_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, cpf, full_name, user_role, approval_status)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'cpf', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    'user'::user_role,  -- Changed to 'user' instead of 'admin'
    'pending'::approval_status
  );
  RETURN NEW;
END;
$$;

-- 4. Fix approve_user and reject_user to use auth.uid() and verify superadmin
CREATE OR REPLACE FUNCTION public.approve_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar se o usuário atual é superadmin
  IF NOT is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas superadmins podem aprovar usuários';
  END IF;
  
  -- Aprovar o usuário usando auth.uid() como aprovador
  UPDATE public.profiles 
  SET 
    approval_status = 'approved'::approval_status,
    approved_by = auth.uid(),
    approved_at = now()
  WHERE user_id = target_user_id;
  
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_user(target_user_id uuid, reason text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar se o usuário atual é superadmin
  IF NOT is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas superadmins podem rejeitar usuários';
  END IF;
  
  -- Rejeitar o usuário usando auth.uid() como aprovador
  UPDATE public.profiles 
  SET 
    approval_status = 'rejected'::approval_status,
    approved_by = auth.uid(),
    approved_at = now(),
    rejected_reason = reason
  WHERE user_id = target_user_id;
  
  RETURN TRUE;
END;
$$;

-- 5. Update get_profile_safe to be more restrictive
CREATE OR REPLACE FUNCTION public.get_profile_safe(target_user_id uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid, 
  user_id uuid, 
  full_name text, 
  user_role user_role, 
  approval_status approval_status, 
  approved_by uuid, 
  approved_at timestamp with time zone, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone, 
  cpf_display text, 
  cpf_masked boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Se target_user_id for fornecido, retornar apenas esse perfil
  IF target_user_id IS NOT NULL THEN
    -- Apenas o próprio usuário ou superadmin pode acessar
    IF target_user_id != auth.uid() AND NOT is_superadmin(auth.uid()) THEN
      RAISE EXCEPTION 'Acesso negado: você pode visualizar apenas seu próprio perfil';
    END IF;
    
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
    WHERE p.user_id = target_user_id;
  ELSE
    -- Retornar perfil do usuário atual
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

-- 6. Add admin_change_user_role function for secure role changes
CREATE OR REPLACE FUNCTION public.admin_change_user_role(target_user_id uuid, new_role user_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar se o usuário atual é superadmin
  IF NOT is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas superadmins podem alterar roles de usuários';
  END IF;
  
  -- Atualizar a role do usuário
  UPDATE public.profiles 
  SET user_role = new_role
  WHERE user_id = target_user_id;
  
  -- Verificar se a atualização foi bem-sucedida
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;
  
  RETURN TRUE;
END;
$$;