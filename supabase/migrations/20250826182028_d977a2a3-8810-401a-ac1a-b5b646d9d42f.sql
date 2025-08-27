-- Comprehensive security fix to ensure all functions are properly secured

-- 1. Ensure the correct approve_user function (without approver_id parameter)
DROP FUNCTION IF EXISTS public.approve_user(uuid, uuid);
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

-- 2. Ensure the correct reject_user function (without approver_id parameter)
DROP FUNCTION IF EXISTS public.reject_user(uuid, uuid, text);
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

-- 3. Create a function to verify the actual security state of profiles
CREATE OR REPLACE FUNCTION public.verify_profile_security()
RETURNS TABLE(
  check_name text,
  status text,
  details text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check RLS is enabled
  RETURN QUERY SELECT 
    'RLS Enabled'::text as check_name,
    CASE WHEN c.relrowsecurity THEN 'PASS' ELSE 'FAIL' END::text as status,
    'Row Level Security is ' || CASE WHEN c.relrowsecurity THEN 'enabled' ELSE 'disabled' END::text as details
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public' AND c.relname = 'profiles';
  
  -- Check SELECT policy exists and is restrictive
  RETURN QUERY SELECT 
    'SELECT Policy Restrictive'::text as check_name,
    CASE WHEN pol.qual LIKE '%auth.uid() = user_id%' AND pol.qual LIKE '%is_superadmin%' THEN 'PASS' ELSE 'FAIL' END::text as status,
    'SELECT policy: ' || COALESCE(pol.qual, 'No policy found')::text as details
  FROM pg_policies pol
  WHERE pol.schemaname = 'public' AND pol.tablename = 'profiles' AND pol.cmd = 'SELECT';
END;
$$;

-- 4. Revoke any unnecessary permissions from public role on profiles
REVOKE ALL ON public.profiles FROM public;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- 5. Ensure no anonymous access to profiles
CREATE OR REPLACE FUNCTION public.check_profiles_anonymous_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- This function will fail if called by anonymous users trying to access profiles
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: autenticação obrigatória para acessar perfis';
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 6. Add additional policy to explicitly block anonymous access
DROP POLICY IF EXISTS "Block anonymous access" ON public.profiles;
CREATE POLICY "Block anonymous access" 
ON public.profiles 
FOR ALL 
TO anon 
USING (false);

-- 7. Update existing policies to be more explicit about authentication
DROP POLICY IF EXISTS "Users can view own profile or superadmin can view all" ON public.profiles;
CREATE POLICY "Authenticated users can view own profile or superadmin can view all" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING ((auth.uid() = user_id) OR is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Authenticated users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile or superadmins can update any" ON public.profiles;
CREATE POLICY "Authenticated users can update own profile or superadmins can update any" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING ((auth.uid() = user_id) OR is_superadmin(auth.uid()))
WITH CHECK ((auth.uid() = user_id) OR is_superadmin(auth.uid()));