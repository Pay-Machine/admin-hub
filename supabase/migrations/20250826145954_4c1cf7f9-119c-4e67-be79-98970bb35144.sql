-- Remover o trigger que promove primeiro usuário a superadmin
DROP TRIGGER IF EXISTS on_profiles_created ON public.profiles;

-- Remover a função relacionada
DROP FUNCTION IF EXISTS public.promote_first_user_to_superadmin();

-- Criar usuário superadmin fixo no banco
-- Primeiro inserir na tabela auth.users (simulando um usuário já confirmado)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'admin@admin.com',
  crypt('admin123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"full_name": "Administrador", "cpf": "00000000000"}'::jsonb,
  'authenticated',
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Inserir o profile do superadmin
INSERT INTO public.profiles (
  id,
  user_id,
  cpf,
  full_name,
  user_role,
  approval_status,
  approved_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  '00000000000',
  'Administrador',
  'superadmin',
  'approved',
  now(),
  now(),
  now()
) ON CONFLICT (user_id) DO UPDATE SET
  user_role = 'superadmin',
  approval_status = 'approved',
  approved_at = now();