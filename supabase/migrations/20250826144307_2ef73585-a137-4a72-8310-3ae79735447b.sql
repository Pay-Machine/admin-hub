-- Criar enum para roles
CREATE TYPE public.user_role AS ENUM ('superadmin', 'admin', 'user');

-- Criar enum para status de aprovação
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Adicionar colunas na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN user_role public.user_role NOT NULL DEFAULT 'admin',
ADD COLUMN approval_status public.approval_status NOT NULL DEFAULT 'pending',
ADD COLUMN approved_by UUID REFERENCES public.profiles(id),
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN rejected_reason TEXT;

-- Criar função para verificar role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT user_role::text FROM public.profiles WHERE profiles.user_id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Criar função para verificar se usuário é superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT user_role = 'superadmin' FROM public.profiles WHERE profiles.user_id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Criar função para verificar se usuário está aprovado
CREATE OR REPLACE FUNCTION public.is_user_approved(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT approval_status = 'approved' FROM public.profiles WHERE profiles.user_id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Atualizar políticas RLS para profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Política para visualizar perfis
CREATE POLICY "Users can view profiles" ON public.profiles
FOR SELECT USING (
  auth.uid() = user_id OR -- próprio usuário
  public.is_superadmin(auth.uid()) -- ou superadmin
);

-- Política para inserir perfil (apenas próprio usuário)
CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para atualizar perfis
CREATE POLICY "Users can update profiles" ON public.profiles
FOR UPDATE USING (
  auth.uid() = user_id OR -- próprio usuário
  public.is_superadmin(auth.uid()) -- ou superadmin
);

-- Atualizar políticas RLS para produtos - apenas usuários aprovados podem acessar
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;

-- Políticas para produtos (apenas usuários aprovados)
CREATE POLICY "Approved users can view products" ON public.products
FOR SELECT TO authenticated USING (
  public.is_user_approved(auth.uid())
);

CREATE POLICY "Approved users can insert products" ON public.products
FOR INSERT TO authenticated WITH CHECK (
  public.is_user_approved(auth.uid())
);

CREATE POLICY "Approved users can update products" ON public.products
FOR UPDATE TO authenticated USING (
  public.is_user_approved(auth.uid())
);

CREATE POLICY "Approved users can delete products" ON public.products
FOR DELETE TO authenticated USING (
  public.is_user_approved(auth.uid())
);

-- Criar função para aprovar usuário
CREATE OR REPLACE FUNCTION public.approve_user(target_user_id UUID, approver_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar se o aprovador é superadmin
  IF NOT public.is_superadmin(approver_id) THEN
    RAISE EXCEPTION 'Apenas superadmins podem aprovar usuários';
  END IF;
  
  -- Aprovar o usuário
  UPDATE public.profiles 
  SET 
    approval_status = 'approved',
    approved_by = approver_id,
    approved_at = now()
  WHERE user_id = target_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar função para rejeitar usuário
CREATE OR REPLACE FUNCTION public.reject_user(target_user_id UUID, approver_id UUID, reason TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar se o aprovador é superadmin
  IF NOT public.is_superadmin(approver_id) THEN
    RAISE EXCEPTION 'Apenas superadmins podem rejeitar usuários';
  END IF;
  
  -- Rejeitar o usuário
  UPDATE public.profiles 
  SET 
    approval_status = 'rejected',
    approved_by = approver_id,
    approved_at = now(),
    rejected_reason = reason
  WHERE user_id = target_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;