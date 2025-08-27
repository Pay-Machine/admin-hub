-- Fix security definer view issue
-- Remove the security_barrier setting and implement proper access control

-- Drop and recreate the view without security_barrier
DROP VIEW IF EXISTS public.profiles_secure;

-- Create the view without security_barrier but with proper RLS
CREATE VIEW public.profiles_secure AS
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
FROM public.profiles
WHERE 
  -- Apply the same access control as the base table
  user_id = auth.uid() OR is_superadmin(auth.uid());

-- Enable RLS on the view
ALTER VIEW public.profiles_secure ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for the view
CREATE POLICY "Secure profiles view access" ON public.profiles_secure
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_superadmin(auth.uid()));

-- Grant permissions
GRANT SELECT ON public.profiles_secure TO authenticated;