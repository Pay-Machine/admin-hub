import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"

interface ApiToken {
  id: string
  token_name: string
  token_prefix: string
  permissions: string[]
  expires_at: string | null
  last_used_at: string | null
  created_at: string
  is_active: boolean
}

interface CreateTokenParams {
  name: string
  permissions: string[]
  expiresIn?: number // dias, null para ilimitado
}

export function useApiTokens() {
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const fetchTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('api_tokens')
        .select('id, token_name, token_prefix, permissions, expires_at, last_used_at, created_at, is_active') // Exclude token_hash for security
        .order('created_at', { ascending: false })

      if (error) throw error
      setTokens(data || [])
    } catch (error) {
      console.error('Erro ao carregar tokens:', error)
      toast({
        title: "Erro",
        description: "Falha ao carregar tokens de API",
        variant: "destructive",
      })
    }
  }

  const generateToken = (): string => {
    // Gera um token criptograficamente seguro de 64 caracteres
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const array = new Uint8Array(64)
    crypto.getRandomValues(array)
    let token = ''
    for (let i = 0; i < 64; i++) {
      token += chars.charAt(array[i] % chars.length)
    }
    return token
  }

  const hashToken = async (token: string): Promise<string> => {
    // Hash criptograficamente seguro usando SHA-256
    const encoder = new TextEncoder()
    const data = encoder.encode(token)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const createToken = async ({ name, permissions, expiresIn }: CreateTokenParams): Promise<string | null> => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      })
      return null
    }

    setIsLoading(true)
    try {
      const token = generateToken()
      const tokenHash = await hashToken(token)
      const tokenPrefix = `vma_${token.substring(0, 8)}`
      
      const expiresAt = expiresIn 
        ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toISOString()
        : null

      const { error } = await supabase
        .from('api_tokens')
        .insert({
          user_id: user.id,
          token_name: name,
          token_hash: tokenHash,
          token_prefix: tokenPrefix,
          permissions,
          expires_at: expiresAt
        })

      if (error) throw error

      await fetchTokens()
      
      toast({
        title: "Token Criado",
        description: "Token de API criado com sucesso",
      })

      return token // Retorna o token completo apenas uma vez
    } catch (error) {
      console.error('Erro ao criar token:', error)
      toast({
        title: "Erro",
        description: "Falha ao criar token de API",
        variant: "destructive",
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const revokeToken = async (tokenId: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('api_tokens')
        .update({ is_active: false })
        .eq('id', tokenId)

      if (error) throw error

      await fetchTokens()
      
      toast({
        title: "Token Revogado",
        description: "Token de API foi desabilitado",
      })
    } catch (error) {
      console.error('Erro ao revogar token:', error)
      toast({
        title: "Erro",
        description: "Falha ao revogar token de API",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const deleteToken = async (tokenId: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('api_tokens')
        .delete()
        .eq('id', tokenId)

      if (error) throw error

      await fetchTokens()
      
      toast({
        title: "Token Excluído",
        description: "Token de API foi removido permanentemente",
      })
    } catch (error) {
      console.error('Erro ao excluir token:', error)
      toast({
        title: "Erro",
        description: "Falha ao excluir token de API",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTokens()
  }, [])

  return {
    tokens,
    isLoading,
    createToken,
    revokeToken,
    deleteToken,
    refetch: fetchTokens
  }
}