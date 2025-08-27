-- Add additional security for CPF data protection

-- Create a view that always masks CPF data except for authorized access
CREATE OR REPLACE VIEW public.profiles_secure AS
SELECT 
  id,
  user_id,
  full_name,
  -- Always show masked CPF unless specifically authorized
  CASE 
    WHEN can_view_full_cpf(user_id) THEN cpf
    ELSE mask_cpf(cpf)
  END as cpf_display,
  user_role,
  approval_status,
  approved_by,
  approved_at,
  rejected_reason,
  created_at,
  updated_at,
  -- Indicate if CPF is masked
  NOT can_view_full_cpf(user_id) as cpf_masked
FROM public.profiles;

-- Add RLS to the secure view
ALTER VIEW public.profiles_secure SET (security_barrier = true);

-- Grant appropriate permissions on the view
GRANT SELECT ON public.profiles_secure TO authenticated;

-- Create a function to safely update profiles without exposing CPF
CREATE OR REPLACE FUNCTION public.update_profile_safe(
  target_user_id uuid,
  new_full_name text DEFAULT NULL,
  new_cpf text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow users to update their own profile or superadmins
  IF target_user_id != auth.uid() AND NOT is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: você só pode atualizar seu próprio perfil';
  END IF;
  
  -- Update only the fields that were provided
  UPDATE public.profiles 
  SET 
    full_name = COALESCE(new_full_name, full_name),
    cpf = COALESCE(new_cpf, cpf),
    updated_at = NOW()
  WHERE user_id = target_user_id;
  
  -- Log the profile update
  PERFORM log_profile_access(target_user_id, 'profile_update');
  
  RETURN TRUE;
END;
$function$;

-- Create additional restrictive policy for direct table access
CREATE POLICY "Restrict direct CPF access" ON public.profiles
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated
  USING (
    -- Only allow direct access if user can view full CPF or it's their own profile
    can_view_full_cpf(user_id) OR user_id = auth.uid()
  );

-- Add comment explaining CPF protection
COMMENT ON COLUMN public.profiles.cpf IS 'CPF data - sensitive PII. Always use profiles_secure view or specific functions for access. Direct access restricted by RLS.';