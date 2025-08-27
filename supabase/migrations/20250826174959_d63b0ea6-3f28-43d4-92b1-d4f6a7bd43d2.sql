-- Criar tabela para armazenar API tokens para integrações externas
CREATE TABLE public.api_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  token_prefix TEXT NOT NULL,
  permissions TEXT[] NOT NULL DEFAULT ARRAY['webhook_receive'],
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Habilitar RLS
ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para api_tokens
CREATE POLICY "Approved users can manage their own tokens"
ON public.api_tokens
FOR ALL
TO authenticated
USING (user_id = auth.uid() AND is_user_approved(auth.uid()));

CREATE POLICY "Superadmins can manage all tokens"
ON public.api_tokens
FOR ALL
TO authenticated
USING (is_superadmin(auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_api_tokens_updated_at
BEFORE UPDATE ON public.api_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para validar token de API
CREATE OR REPLACE FUNCTION public.validate_api_token(token_input TEXT)
RETURNS TABLE (
  user_id UUID,
  token_name TEXT,
  permissions TEXT[]
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    at.user_id,
    at.token_name,
    at.permissions
  FROM public.api_tokens at
  WHERE at.token_hash = encode(digest(token_input, 'sha256'), 'hex')
    AND at.is_active = true
    AND (at.expires_at IS NULL OR at.expires_at > now())
    AND is_user_approved(at.user_id);
$$;

-- Função para registrar uso do token
CREATE OR REPLACE FUNCTION public.log_token_usage(token_input TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.api_tokens 
  SET last_used_at = now()
  WHERE token_hash = encode(digest(token_input, 'sha256'), 'hex')
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());
  
  SELECT FOUND;
$$;