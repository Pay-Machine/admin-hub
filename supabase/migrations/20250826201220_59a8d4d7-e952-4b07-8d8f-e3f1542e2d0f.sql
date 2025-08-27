-- Add trigger to maintain updated_at (skip protect_profile_privileges_trigger as it exists)
CREATE TRIGGER update_profiles_updated_at_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Replace broad profile update policy with restrictive ones
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin can update with recent audit" ON public.profiles;

-- Allow users to update only safe fields on their own profile
CREATE POLICY "Users can update safe fields only" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Superadmins can update any profile (triggers will enforce field restrictions)
CREATE POLICY "Superadmins can update profiles" ON public.profiles
  FOR UPDATE USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

-- Fix API Tokens RLS - Replace broad ALL policies with specific ones
DROP POLICY IF EXISTS "Approved users can manage their own tokens" ON public.api_tokens;
DROP POLICY IF EXISTS "Superadmins can manage all tokens" ON public.api_tokens;

-- Specific policies for api_tokens
CREATE POLICY "Users can select their own tokens" ON public.api_tokens
  FOR SELECT USING (user_id = auth.uid() AND is_user_approved(auth.uid()));

CREATE POLICY "Superadmins can select all tokens" ON public.api_tokens
  FOR SELECT USING (is_superadmin(auth.uid()));

CREATE POLICY "Users can insert their own tokens" ON public.api_tokens
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_user_approved(auth.uid()));

CREATE POLICY "Users can update their own tokens" ON public.api_tokens
  FOR UPDATE USING (user_id = auth.uid() AND is_user_approved(auth.uid()))
  WITH CHECK (user_id = auth.uid() AND is_user_approved(auth.uid()));

CREATE POLICY "Users can delete their own tokens" ON public.api_tokens
  FOR DELETE USING (user_id = auth.uid() AND is_user_approved(auth.uid()));

CREATE POLICY "Superadmins can delete any token" ON public.api_tokens
  FOR DELETE USING (is_superadmin(auth.uid()));

-- Add triggers for api_tokens
CREATE TRIGGER update_api_tokens_updated_at_trigger
  BEFORE UPDATE ON public.api_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER api_tokens_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.api_tokens
  FOR EACH ROW EXECUTE FUNCTION log_token_access();

-- Tighten profile_access_log policies
DROP POLICY IF EXISTS "Service role can insert system logs" ON public.profile_access_log;

-- Only allow inserts through functions or by the actual service role (bypasses RLS)
CREATE POLICY "Functions can insert access logs with auth check" ON public.profile_access_log
  FOR INSERT WITH CHECK (accessor_user_id = auth.uid());

-- Make products admin-only for mutations (keep select for approved users)
DROP POLICY IF EXISTS "Approved users can insert products" ON public.products;
DROP POLICY IF EXISTS "Approved users can update products" ON public.products;
DROP POLICY IF EXISTS "Approved users can delete products" ON public.products;

CREATE POLICY "Admins can insert products" ON public.products
  FOR INSERT WITH CHECK (is_superadmin(auth.uid()) OR get_user_role(auth.uid()) IN ('admin', 'superadmin'));

CREATE POLICY "Admins can update products" ON public.products
  FOR UPDATE USING (is_superadmin(auth.uid()) OR get_user_role(auth.uid()) IN ('admin', 'superadmin'));

CREATE POLICY "Admins can delete products" ON public.products
  FOR DELETE USING (is_superadmin(auth.uid()) OR get_user_role(auth.uid()) IN ('admin', 'superadmin'));