-- Remover o trigger e função com CASCADE para resolver dependências
DROP FUNCTION IF EXISTS public.promote_first_user_to_superadmin() CASCADE;

-- Criar usuário superadmin diretamente no banco
-- Como não posso inserir diretamente em auth.users, vou criar via profiles e depois ajustar manualmente

-- Primeiro, vou criar um profile para o superadmin que será vinculado manualmente
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
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
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

-- Atualizar a função handle_new_user para não criar usuários aprovados automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, cpf, full_name, user_role, approval_status)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'cpf', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    'admin',
    'pending'
  );
  RETURN NEW;
END;
$$;