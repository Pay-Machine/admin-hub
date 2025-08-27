-- Função temporária para criar superadmin a partir de qualquer usuário com email admin@admin.com
CREATE OR REPLACE FUNCTION public.create_superadmin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Buscar o ID do usuário admin@admin.com
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@admin.com' 
    LIMIT 1;
    
    -- Se encontrou o usuário, criar/atualizar o profile como superadmin
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.profiles (user_id, cpf, full_name, user_role, approval_status, approved_at)
        VALUES (admin_user_id, '00000000000', 'Administrador', 'superadmin', 'approved', now())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            user_role = 'superadmin',
            approval_status = 'approved',
            approved_at = now(),
            full_name = 'Administrador';
    END IF;
END;
$$;

-- Executar a função para criar o superadmin
SELECT public.create_superadmin();

-- Remover a função temporária
DROP FUNCTION public.create_superadmin();