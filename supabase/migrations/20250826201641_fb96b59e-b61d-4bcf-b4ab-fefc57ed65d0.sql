-- Fix profiles table security issues
-- Drop conflicting policies and recreate with proper role separation
DROP POLICY IF EXISTS "Users can update safe fields only" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can update profiles" ON public.profiles;

-- Add RESTRICTIVE policy to block anonymous access completely
CREATE POLICY "Block all anonymous access to profiles" ON public.profiles
  AS RESTRICTIVE
  FOR ALL
  TO anon
  USING (false);

-- Recreate UPDATE policies for authenticated users only
CREATE POLICY "Authenticated users can update safe fields" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Superadmins can update any profile" ON public.profiles
  FOR UPDATE  
  TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

-- Fix api_tokens table security issues  
-- Drop all existing policies and recreate with proper authentication
DROP POLICY IF EXISTS "Users can select their own tokens" ON public.api_tokens;
DROP POLICY IF EXISTS "Superadmins can select all tokens" ON public.api_tokens;
DROP POLICY IF EXISTS "Users can insert their own tokens" ON public.api_tokens;
DROP POLICY IF EXISTS "Users can update their own tokens" ON public.api_tokens;
DROP POLICY IF EXISTS "Users can delete their own tokens" ON public.api_tokens;
DROP POLICY IF EXISTS "Superadmins can delete any token" ON public.api_tokens;

-- Add RESTRICTIVE policy to block anonymous access to api_tokens
CREATE POLICY "Block anonymous access to tokens" ON public.api_tokens
  AS RESTRICTIVE
  FOR ALL
  TO anon
  USING (false);

-- Recreate api_tokens policies for authenticated users only
CREATE POLICY "Users can view their own tokens" ON public.api_tokens
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND is_user_approved(auth.uid()));

CREATE POLICY "Superadmins can view all tokens" ON public.api_tokens
  FOR SELECT
  TO authenticated
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Users can create their own tokens" ON public.api_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_user_approved(auth.uid()));

CREATE POLICY "Users can modify their own tokens" ON public.api_tokens
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND is_user_approved(auth.uid()))
  WITH CHECK (user_id = auth.uid() AND is_user_approved(auth.uid()));

CREATE POLICY "Users can remove their own tokens" ON public.api_tokens
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND is_user_approved(auth.uid()));

CREATE POLICY "Superadmins can remove any token" ON public.api_tokens
  FOR DELETE
  TO authenticated
  USING (is_superadmin(auth.uid()));