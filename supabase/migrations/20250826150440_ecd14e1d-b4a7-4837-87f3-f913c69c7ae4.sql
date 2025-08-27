-- Promover o usuário admin@admin.com a superadmin
UPDATE public.profiles 
SET 
  user_role = 'superadmin',
  approval_status = 'approved',
  approved_at = now(),
  full_name = 'Administrador'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'admin@admin.com' LIMIT 1
);