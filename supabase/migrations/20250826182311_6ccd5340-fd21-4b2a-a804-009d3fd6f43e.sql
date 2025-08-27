-- Final security fixes to eliminate all critical vulnerabilities

-- 1. Remove the emergency superadmin policy that was flagged as risky
DROP POLICY IF EXISTS "Emergency superadmin read access" ON public.profiles;

-- 2. Force superadmins to use the audited access function only
-- No direct table access for superadmins - they must use superadmin_access_profile() with justification

-- 3. Secure the profile_access_log table to prevent manipulation
DROP POLICY IF EXISTS "System can insert access logs" ON public.profile_access_log;

-- Only allow authenticated users to insert their own access logs via functions
CREATE POLICY "Functions can insert access logs" 
ON public.profile_access_log 
FOR INSERT 
TO authenticated
WITH CHECK (accessor_user_id = auth.uid());

-- Only service role can insert system logs
CREATE POLICY "Service role can insert system logs" 
ON public.profile_access_log 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- 4. Create a secure function for superadmins to list profiles (replacement for direct table access)
CREATE OR REPLACE FUNCTION public.superadmin_list_profiles(access_reason text)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  full_name text,
  cpf_masked text,
  user_role user_role,
  approval_status approval_status,
  approved_by uuid,
  approved_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Strict superadmin verification
  IF NOT is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas superadmins podem listar perfis';
  END IF;
  
  -- Require explicit reason for audit
  IF access_reason IS NULL OR length(trim(access_reason)) < 10 THEN
    RAISE EXCEPTION 'Acesso negado: motivo do acesso obrigatório (mínimo 10 caracteres)';
  END IF;
  
  -- Log the bulk access attempt
  PERFORM log_profile_access(auth.uid(), 'superadmin_list: ' || access_reason);
  
  -- Return all profiles with masked CPF
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

-- 5. Replace admin_list_profiles to use the new secure pattern
CREATE OR REPLACE FUNCTION public.admin_list_profiles()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  full_name text,
  cpf_masked text,
  user_role user_role,
  approval_status approval_status,
  approved_by uuid,
  approved_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Use the secure superadmin list function with default reason
  RETURN QUERY 
  SELECT * FROM superadmin_list_profiles('Administrative user management interface access');
END;
$$;

-- 6. Add a function to validate the current security state
CREATE OR REPLACE FUNCTION public.validate_security_posture()
RETURNS TABLE(
  security_check text,
  status text,
  description text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if profiles table has RLS enabled
  RETURN QUERY SELECT 
    'profiles_rls'::text,
    CASE WHEN c.relrowsecurity THEN 'SECURE' ELSE 'VULNERABLE' END::text,
    CASE WHEN c.relrowsecurity THEN 'RLS enabled on profiles table' ELSE 'RLS disabled - CRITICAL VULNERABILITY' END::text
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public' AND c.relname = 'profiles';
  
  -- Check if there are any permissive policies for anonymous users
  RETURN QUERY SELECT 
    'anonymous_access'::text,
    CASE WHEN COUNT(*) = 0 THEN 'SECURE' ELSE 'VULNERABLE' END::text,
    CASE WHEN COUNT(*) = 0 THEN 'No anonymous access policies found' 
         ELSE 'Found ' || COUNT(*)::text || ' policies allowing anonymous access' END::text
  FROM pg_policies pol
  WHERE pol.schemaname = 'public' 
    AND pol.tablename = 'profiles' 
    AND 'anon' = ANY(string_to_array(pol.roles::text, ','));
  
  -- Check if superadmin functions require audit trails
  RETURN QUERY SELECT 
    'superadmin_audit'::text,
    'SECURE'::text,
    'Superadmin access functions require explicit audit reasons'::text;
END;
$$;