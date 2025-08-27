-- Criar usuário superadmin (primeiro, criar o usuário no auth.users via inserção manual)
-- Como não podemos inserir diretamente em auth.users, vamos criar um trigger que automaticamente
-- promove o primeiro usuário a superadmin

-- Função para promover primeiro usuário a superadmin
CREATE OR REPLACE FUNCTION public.promote_first_user_to_superadmin()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se é o primeiro usuário (não há outros profiles)
  IF (SELECT COUNT(*) FROM public.profiles) = 1 THEN
    -- Promover a superadmin e aprovar automaticamente
    UPDATE public.profiles 
    SET 
      user_role = 'superadmin',
      approval_status = 'approved',
      approved_at = now()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para promover primeiro usuário
CREATE TRIGGER promote_first_user_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.promote_first_user_to_superadmin();

-- Atualizar função handle_new_user para definir role padrão como admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, cpf, full_name, user_role, approval_status)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'cpf',
    NEW.raw_user_meta_data ->> 'full_name',
    'admin',
    'pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;