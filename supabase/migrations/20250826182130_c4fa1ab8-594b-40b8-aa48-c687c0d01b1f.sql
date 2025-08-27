-- Final security hardening for profiles table

-- 1. Create a more restrictive function for superadmin access that requires explicit audit logging
CREATE OR REPLACE FUNCTION public.superadmin_access_profile(target_user_id uuid, access_reason text)
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
  cpf_display text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Strict superadmin verification
  IF NOT is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas superadmins podem usar esta função';
  END IF;
  
  -- Require explicit reason for audit
  IF access_reason IS NULL OR length(trim(access_reason)) < 10 THEN
    RAISE EXCEPTION 'Acesso negado: motivo do acesso obrigatório (mínimo 10 caracteres)';
  END IF;
  
  -- Log the access with reason
  PERFORM log_profile_access(target_user_id, 'superadmin_access: ' || access_reason);
  
  -- Return profile with masked CPF
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
    mask_cpf(p.cpf) as cpf_display
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
END;
$$;

-- 2. Update the main RLS policy to be more restrictive - remove superadmin bypass from direct table access
DROP POLICY IF EXISTS "Authenticated users can view own profile or superadmin can view all" ON public.profiles;
CREATE POLICY "Users can only view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- 3. Create a separate, limited superadmin policy for emergency access only
CREATE POLICY "Emergency superadmin read access" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  is_superadmin(auth.uid()) 
  AND current_setting('request.jwt.claims', true)::json->>'email' LIKE '%@admin.%'
  AND extract(hour from now()) BETWEEN 8 AND 18  -- Business hours only
);

-- 4. Update UPDATE policy to be more restrictive for superadmins
DROP POLICY IF EXISTS "Authenticated users can update own profile or superadmins can update any" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Separate policy for superadmin updates with audit trail
CREATE POLICY "Superadmin can update with audit" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (
  is_superadmin(auth.uid()) 
  AND EXISTS (
    SELECT 1 FROM public.profile_access_log 
    WHERE accessor_user_id = auth.uid() 
    AND access_type LIKE 'superadmin_access:%'
    AND accessed_at > now() - interval '5 minutes'
  )
)
WITH CHECK (
  is_superadmin(auth.uid()) 
  AND EXISTS (
    SELECT 1 FROM public.profile_access_log 
    WHERE accessor_user_id = auth.uid() 
    AND access_type LIKE 'superadmin_access:%'
    AND accessed_at > now() - interval '5 minutes'
  )
);

-- 5. Secure the keep_alive table
DROP POLICY IF EXISTS "Authenticated users can access keep_alive" ON public.keep_alive;
CREATE POLICY "System process only access keep_alive" 
ON public.keep_alive 
FOR ALL 
TO authenticated
USING (false); -- Block all user access

-- Allow only service role access
CREATE POLICY "Service role can access keep_alive" 
ON public.keep_alive 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 6. Add additional protection for api_tokens table
CREATE OR REPLACE FUNCTION public.validate_token_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log all token access attempts
  INSERT INTO public.profile_access_log (
    accessed_user_id,
    accessor_user_id,
    access_type,
    accessed_at
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    auth.uid(),
    'token_access',
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for token access logging
DROP TRIGGER IF EXISTS log_token_access_trigger ON public.api_tokens;
CREATE TRIGGER log_token_access_trigger
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.api_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_token_access();