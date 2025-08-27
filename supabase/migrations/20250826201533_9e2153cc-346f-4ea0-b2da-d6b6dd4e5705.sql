-- Fix critical security vulnerability in profile_access_log table

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Only superadmins can view access logs" ON public.profile_access_log;
DROP POLICY IF EXISTS "Functions can insert access logs" ON public.profile_access_log;
DROP POLICY IF EXISTS "Functions can insert access logs with auth check" ON public.profile_access_log;

-- Create a RESTRICTIVE policy that blocks anonymous access completely
CREATE POLICY "Block anonymous access to access logs" ON public.profile_access_log
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL);

-- Create proper SELECT policy for authenticated superadmins only
CREATE POLICY "Superadmins can view access logs" ON public.profile_access_log
  FOR SELECT
  TO authenticated
  USING (is_superadmin(auth.uid()));

-- Create INSERT policy for authenticated functions only
CREATE POLICY "Authenticated functions can insert logs" ON public.profile_access_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND accessor_user_id = auth.uid());

-- Fix the is_superadmin function to properly handle NULL user IDs
CREATE OR REPLACE FUNCTION public.is_superadmin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Return false immediately if user_id is NULL (anonymous users)
  SELECT CASE 
    WHEN user_id IS NULL THEN false
    ELSE COALESCE((SELECT user_role = 'superadmin' FROM public.profiles WHERE profiles.user_id = $1), false)
  END;
$function$;

-- Also create a function to explicitly check if a user is authenticated and approved
CREATE OR REPLACE FUNCTION public.is_authenticated_and_approved()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN auth.uid() IS NULL THEN false
    ELSE COALESCE((SELECT approval_status = 'approved' FROM public.profiles WHERE user_id = auth.uid()), false)
  END;
$function$;