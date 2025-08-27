-- Apenas remover a lógica de primeiro usuário ser superadmin
DROP FUNCTION IF EXISTS public.promote_first_user_to_superadmin() CASCADE;

-- Garantir que novos usuários sejam criados pendentes
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