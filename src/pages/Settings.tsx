import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, TestTube, Webhook, CheckCircle, XCircle, Plus, Trash2, Eye, EyeOff, Cog, Shield, Globe, Clock, Key, Copy, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useApiTokens } from "@/hooks/useApiTokens"
import { supabase } from "@/integrations/supabase/client"

interface WebhookConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  authType: 'none' | 'bearer' | 'apikey' | 'basic';
  bearerToken?: string;
  apiKeyHeader?: string;
  apiKeyValue?: string;
  basicUsername?: string;
  basicPassword?: string;
  customHeaders: { key: string; value: string; }[];
  timeout: number;
  retries: number;
  bodyTemplate?: string;
  verifySSL: boolean;
}

export default function Settings() {
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>({
    url: "",
    method: 'POST',
    authType: 'none',
    customHeaders: [],
    timeout: 30,
    retries: 3,
    verifySSL: true,
    bodyTemplate: JSON.stringify({
      event: "{{event_type}}",
      timestamp: "{{timestamp}}",
      source: "vending_machine_admin",
      data: "{{data}}"
    }, null, 2)
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [isTestingWebhook, setIsTestingWebhook] = useState(false)
  const [webhookStatus, setWebhookStatus] = useState<'connected' | 'disconnected' | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [showCreateTokenForm, setShowCreateTokenForm] = useState(false)
  const [newTokenName, setNewTokenName] = useState("")
  const [newTokenExpiry, setNewTokenExpiry] = useState<string>("unlimited")
  const [generatedToken, setGeneratedToken] = useState<string | null>(null)
  const { toast } = useToast()
  const { tokens, isLoading: tokensLoading, createToken, revokeToken, deleteToken } = useApiTokens()

  useEffect(() => {
    const savedConfig = localStorage.getItem('webhook_config')
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig)
        setWebhookConfig({ ...webhookConfig, ...config })
        setWebhookStatus('connected')
      } catch (error) {
        console.error('Erro ao carregar configurações:', error)
      }
    }
  }, [])

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!webhookConfig.url.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira a URL do webhook",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      localStorage.setItem('webhook_config', JSON.stringify(webhookConfig))
      setWebhookStatus('connected')
      
      toast({
        title: "Webhook Configurado",
        description: "Configurações do webhook salvas com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar configurações do webhook",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestWebhook = async () => {
    if (!webhookConfig.url.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, configure a URL do webhook primeiro",
        variant: "destructive",
      })
      return
    }

    setIsTestingWebhook(true)

    try {
      // Buscar todos os produtos ativos do banco de dados
      let products = []
      try {
        const { data: productsData, error } = await supabase
          .from('products')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
        
        if (!error && productsData) {
          products = productsData
        }
      } catch (error) {
        console.error('Erro ao buscar produtos para teste:', error)
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (webhookConfig.authType === 'bearer' && webhookConfig.bearerToken) {
        headers['Authorization'] = `Bearer ${webhookConfig.bearerToken}`
      } else if (webhookConfig.authType === 'apikey' && webhookConfig.apiKeyHeader && webhookConfig.apiKeyValue) {
        headers[webhookConfig.apiKeyHeader] = webhookConfig.apiKeyValue
      } else if (webhookConfig.authType === 'basic' && webhookConfig.basicUsername && webhookConfig.basicPassword) {
        headers['Authorization'] = `Basic ${btoa(`${webhookConfig.basicUsername}:${webhookConfig.basicPassword}`)}`
      }

      webhookConfig.customHeaders.forEach(header => {
        if (header.key && header.value) {
          headers[header.key] = header.value
        }
      })

      const testData = {
        event: "webhook_test",
        timestamp: new Date().toISOString(),
        source: "vending_machine_admin",
        data: {
          message: "Teste de conexão",
          test_product: {
            name: "Produto Teste",
            price: 10.00,
            stock: 1,
            active: true
          },
          products: products,
          total_products: products.length
        }
      }

      const fetchOptions: RequestInit = {
        method: webhookConfig.method,
        headers,
        mode: "no-cors",
      }

      if (['POST', 'PUT', 'PATCH'].includes(webhookConfig.method)) {
        fetchOptions.body = JSON.stringify(testData)
      }

      await fetch(webhookConfig.url, fetchOptions)

      toast({
        title: "Teste Enviado",
        description: "O teste foi enviado para o webhook.",
      })
    } catch (error) {
      console.error("Erro ao testar webhook:", error)
      toast({
        title: "Erro no Teste",
        description: "Falha ao enviar teste para o webhook.",
        variant: "destructive",
      })
    } finally {
      setIsTestingWebhook(false)
    }
  }

  const handleCreateToken = async () => {
    if (!newTokenName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um nome para o token",
        variant: "destructive",
      })
      return
    }

    const expiresIn = newTokenExpiry === "unlimited" ? undefined : parseInt(newTokenExpiry)
    const token = await createToken({
      name: newTokenName,
      permissions: ["webhook_receive", "api_access"],
      expiresIn
    })

    if (token) {
      setGeneratedToken(token)
      setNewTokenName("")
      setNewTokenExpiry("unlimited")
      setShowCreateTokenForm(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copiado!",
        description: "Token copiado para a área de transferência",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao copiar token",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca"
    return new Date(dateString).toLocaleString('pt-BR')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <Cog className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
      </div>

      <Tabs defaultValue="webhook" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="webhook" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhook
          </TabsTrigger>
          <TabsTrigger value="tokens" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Tokens de API
          </TabsTrigger>
          <TabsTrigger value="api-docs" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            API de Produtos
          </TabsTrigger>
        </TabsList>

        {/* Aba de Webhook */}
        <TabsContent value="webhook">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-xl text-foreground">Configuração de Webhook</CardTitle>
                </div>
                {webhookStatus && (
                  <Badge variant={webhookStatus === 'connected' ? "default" : "secondary"}>
                    {webhookStatus === 'connected' ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Conectado
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Desconectado
                      </>
                    )}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveWebhook} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">URL do Webhook</Label>
                  <Input
                    id="webhook-url"
                    type="url"
                    value={webhookConfig.url}
                    onChange={(e) => setWebhookConfig(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://your-service.com/webhook/endpoint"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Método HTTP</Label>
                  <Select 
                    value={webhookConfig.method} 
                    onValueChange={(value) => setWebhookConfig(prev => ({ 
                      ...prev, 
                      method: value as WebhookConfig['method']
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {['POST', 'PUT', 'PATCH'].includes(webhookConfig.method) && (
                  <div className="space-y-2">
                    <Label>Template do Corpo (JSON)</Label>
                    <Textarea
                      value={webhookConfig.bodyTemplate}
                      onChange={(e) => setWebhookConfig(prev => ({ ...prev, bodyTemplate: e.target.value }))}
                      rows={8}
                      className="font-mono text-sm"
                      placeholder='{"event": "{{event_type}}", "data": "{{data}}"}'
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Salvando...' : 'Salvar Webhook'}
                  </Button>
                  
                  <Button type="button" variant="outline" onClick={handleTestWebhook} disabled={isTestingWebhook}>
                    <TestTube className="h-4 w-4 mr-2" />
                    {isTestingWebhook ? 'Testando...' : 'Testar'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Tokens de API */}
        <TabsContent value="tokens">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Tokens de API
                </CardTitle>
                <Button onClick={() => setShowCreateTokenForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Gerar Novo Token
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {generatedToken && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium text-green-800">Token criado com sucesso!</h4>
                  </div>
                  <p className="text-sm text-green-700 mb-3">
                    <strong>IMPORTANTE:</strong> Copie este token agora. Ele não será exibido novamente.
                  </p>
                  <div className="flex items-center gap-2 bg-white border rounded p-2">
                    <code className="font-mono text-sm flex-1 text-gray-800">
                      {generatedToken}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generatedToken)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => setGeneratedToken(null)}
                  >
                    Fechar
                  </Button>
                </div>
              )}

              {showCreateTokenForm && (
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium">Criar Novo Token</h4>
                  
                  <div className="space-y-2">
                    <Label>Nome do Token</Label>
                    <Input
                      value={newTokenName}
                      onChange={(e) => setNewTokenName(e.target.value)}
                      placeholder="Ex: Integração Sistema XYZ"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Expiração</Label>
                    <Select value={newTokenExpiry} onValueChange={setNewTokenExpiry}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unlimited">Sem expiração</SelectItem>
                        <SelectItem value="30">30 dias</SelectItem>
                        <SelectItem value="90">90 dias</SelectItem>
                        <SelectItem value="365">1 ano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleCreateToken}>
                      Criar Token
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateTokenForm(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {tokensLoading ? (
                  <div className="text-center py-4">Carregando tokens...</div>
                ) : tokens.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Nenhum token criado ainda
                  </div>
                ) : (
                  tokens.map((token) => (
                    <div key={token.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{token.token_name}</h4>
                          <Badge variant={token.is_active ? "default" : "secondary"}>
                            {token.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Criado: {formatDate(token.created_at)}</p>
                          <p>Último uso: {formatDate(token.last_used_at)}</p>
                          {token.expires_at && (
                            <p>Expira: {formatDate(token.expires_at)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {token.is_active ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => revokeToken(token.id)}
                          >
                            <EyeOff className="h-4 w-4 mr-1" />
                            Revogar
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteToken(token.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Documentação da API */}
        <TabsContent value="api-docs">
          <div className="space-y-6">
            {/* Visão Geral */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Globe className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle className="text-2xl">Documentação da API</CardTitle>
                    <p className="text-muted-foreground">
                      Guia completo para integrar com a API de produtos
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">API REST</h3>
                    <p className="text-sm text-blue-700">Consulte produtos via HTTP GET</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2">Webhook</h3>
                    <p className="text-sm text-green-700">Receba atualizações automáticas</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-800 mb-2">Autenticação</h3>
                    <p className="text-sm text-purple-700">Token VMA seguro</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Passo 1: Configuração de Credenciais */}
            <Card>
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="text-xl flex items-center gap-2">
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</div>
                  Configuração de Credenciais
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      Como gerar seu token de acesso:
                    </h4>
                    <ol className="list-decimal list-inside space-y-3 text-amber-700">
                      <li>
                        <strong>Acesse a aba "Tokens de API"</strong> no topo desta página
                      </li>
                      <li>
                        <strong>Clique em "Gerar Novo Token"</strong>
                      </li>
                      <li>
                        <strong>Preencha os dados:</strong>
                        <ul className="list-disc ml-6 mt-2 space-y-1">
                          <li>Nome: Ex: "Integração Sistema ERP" ou "API Externa"</li>
                          <li>Expiração: Escolha conforme sua necessidade</li>
                        </ul>
                      </li>
                      <li>
                        <strong>Clique em "Criar Token"</strong>
                      </li>
                      <li>
                        <strong className="text-red-600">IMPORTANTE:</strong> Copie e guarde o token imediatamente. 
                        Ele será exibido apenas uma vez por segurança.
                      </li>
                    </ol>
                  </div>

                  <div className="bg-gray-50 border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Formato do token gerado:</h4>
                    <code className="bg-gray-800 text-green-400 px-3 py-2 rounded block text-sm">
                      vma_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z
                    </code>
                    <p className="text-sm text-gray-600 mt-2">
                      • Sempre começa com <code>vma_</code><br/>
                      • Seguido por 56 caracteres alfanuméricos<br/>
                      • Total: 60 caracteres
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Passo 2: API REST */}
            <Card>
              <CardHeader className="bg-blue-50 border-b">
                <CardTitle className="text-xl flex items-center gap-2">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</div>
                  API REST - Consulta de Produtos
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Endpoint */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Badge className="bg-blue-600">GET</Badge>
                      <h4 className="text-lg font-semibold">Listar todos os produtos</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">URL do Endpoint:</Label>
                        <code className="bg-gray-100 px-3 py-2 rounded text-sm block mt-1 font-mono">
                          https://ajwwhmxhsmylkxslodiu.supabase.co/functions/v1/get-products
                        </code>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Headers obrigatórios:</Label>
                        <div className="bg-gray-100 p-3 rounded mt-1 text-sm font-mono">
                          Authorization: Bearer [SEU_TOKEN_VMA]
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Exemplo com cURL:</Label>
                        <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto mt-1">
{`curl -X GET \\
  "https://ajwwhmxhsmylkxslodiu.supabase.co/functions/v1/get-products" \\
  -H "Authorization: Bearer vma_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z"`}
                        </pre>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Exemplo com JavaScript/Fetch:</Label>
                        <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto mt-1">
{`fetch('https://ajwwhmxhsmylkxslodiu.supabase.co/functions/v1/get-products', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer vma_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));`}
                        </pre>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Resposta da API:</Label>
                        <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto mt-1">
{`{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Coca-Cola 350ml",
      "description": "Refrigerante Coca-Cola lata 350ml gelada",
      "price": 4.50,
      "stock": 25,
      "status": "active",
      "image_url": "https://example.com/images/coca-cola.jpg",
      "created_at": "2025-01-15T10:30:00.000Z",
      "updated_at": "2025-01-20T14:15:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Água Mineral 500ml",
      "description": "Água mineral natural 500ml",
      "price": 2.00,
      "stock": 50,
      "status": "active",
      "image_url": "https://example.com/images/agua.jpg",
      "created_at": "2025-01-15T11:00:00.000Z",
      "updated_at": "2025-01-18T09:20:00.000Z"
    }
  ],
  "count": 2,
  "message": "Produtos listados com sucesso"
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Passo 3: Configuração de Webhook */}
            <Card>
              <CardHeader className="bg-green-50 border-b">
                <CardTitle className="text-xl flex items-center gap-2">
                  <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</div>
                  Webhook - Receber Produtos Automaticamente
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-3">
                      O que é o webhook?
                    </h4>
                    <p className="text-green-700 text-sm mb-3">
                      O webhook permite que sua aplicação receba automaticamente a lista completa 
                      de produtos sempre que houver atualizações, sem precisar fazer consultas manuais.
                    </p>
                    <div className="text-sm text-green-600">
                      <strong>Vantagens:</strong>
                      <ul className="list-disc ml-5 mt-1">
                        <li>Recebe atualizações em tempo real</li>
                        <li>Todos os produtos são enviados no corpo da requisição</li>
                        <li>Não precisa fazer polling da API</li>
                        <li>Reduz latência e carga no servidor</li>
                      </ul>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="text-lg font-semibold mb-4">Como configurar o webhook:</h4>
                    
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded">
                        <h5 className="font-medium mb-2">1. Prepare seu endpoint:</h5>
                        <p className="text-sm text-gray-600 mb-3">
                          Crie um endpoint em sua aplicação que aceite requisições POST:
                        </p>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          https://sua-aplicacao.com/webhook/produtos
                        </code>
                      </div>

                      <div className="bg-gray-50 p-4 rounded">
                        <h5 className="font-medium mb-2">2. Configure na aba "Webhook" acima:</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• <strong>URL:</strong> https://sua-aplicacao.com/webhook/produtos</li>
                          <li>• <strong>Método:</strong> POST</li>
                          <li>• <strong>Autenticação:</strong> Configure conforme necessário</li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 p-4 rounded">
                        <h5 className="font-medium mb-2">3. Template do corpo (JSON):</h5>
                        <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`{
  "event": "products_update",
  "timestamp": "{{timestamp}}",
  "source": "vending_machine_admin",
  "data": {
    "products": "{{products}}",
    "total_count": "{{count}}",
    "update_type": "full_sync"
  }
}`}
                        </pre>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 p-4 rounded">
                        <h5 className="font-medium text-amber-800 mb-2">Payload que você receberá:</h5>
                        <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`{
  "event": "products_update",
  "timestamp": "2025-01-20T15:30:45.123Z",
  "source": "vending_machine_admin",
  "data": {
    "products": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Coca-Cola 350ml",
        "description": "Refrigerante Coca-Cola lata 350ml gelada",
        "price": 4.50,
        "stock": 25,
        "status": "active",
        "image_url": "https://example.com/images/coca-cola.jpg",
        "created_at": "2025-01-15T10:30:00.000Z",
        "updated_at": "2025-01-20T14:15:00.000Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Água Mineral 500ml",
        "description": "Água mineral natural 500ml",
        "price": 2.00,
        "stock": 50,
        "status": "active",
        "image_url": "https://example.com/images/agua.jpg",
        "created_at": "2025-01-15T11:00:00.000Z",
        "updated_at": "2025-01-18T09:20:00.000Z"
      }
    ],
    "total_count": 2,
    "update_type": "full_sync"
  }
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Passo 4: Códigos de Resposta e Erros */}
            <Card>
              <CardHeader className="bg-red-50 border-b">
                <CardTitle className="text-xl flex items-center gap-2">
                  <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">4</div>
                  Códigos de Resposta e Solução de Problemas
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Sucessos */}
                  <div className="border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Códigos de Sucesso
                    </h4>
                    <div className="space-y-2">
                      <div className="bg-green-50 p-3 rounded">
                        <code className="font-mono text-sm text-green-800">200 OK</code>
                        <p className="text-sm text-green-700 mt-1">
                          Requisição processada com sucesso. Produtos retornados.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Erros */}
                  <div className="border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Códigos de Erro e Soluções
                    </h4>
                    <div className="space-y-3">
                      <div className="bg-red-50 border border-red-200 p-3 rounded">
                        <div className="flex items-center gap-2 mb-2">
                          <code className="font-mono text-sm text-red-800">401 Unauthorized</code>
                          <Badge variant="destructive" className="text-xs">Crítico</Badge>
                        </div>
                        <p className="text-sm text-red-700 mb-2">
                          <strong>Erro:</strong> "Token inválido ou ausente"
                        </p>
                        <div className="text-xs text-red-600">
                          <strong>Soluções:</strong>
                          <ul className="list-disc ml-4 mt-1 space-y-1">
                            <li>Verifique se o token foi copiado corretamente (deve ter 60 caracteres)</li>
                            <li>Certifique-se de usar o formato: <code>Authorization: Bearer [TOKEN]</code></li>
                            <li>Confirme se o token não expirou</li>
                            <li>Verifique se o token começa com <code>vma_</code></li>
                          </ul>
                        </div>
                      </div>

                      <div className="bg-red-50 border border-red-200 p-3 rounded">
                        <div className="flex items-center gap-2 mb-2">
                          <code className="font-mono text-sm text-red-800">403 Forbidden</code>
                          <Badge variant="destructive" className="text-xs">Crítico</Badge>
                        </div>
                        <p className="text-sm text-red-700 mb-2">
                          <strong>Erro:</strong> "Usuário não autorizado"
                        </p>
                        <div className="text-xs text-red-600">
                          <strong>Soluções:</strong>
                          <ul className="list-disc ml-4 mt-1 space-y-1">
                            <li>Apenas usuários aprovados podem usar a API</li>
                            <li>Verifique na aba "Tokens de API" se seu token está ativo</li>
                            <li>Entre em contato com o administrador do sistema</li>
                          </ul>
                        </div>
                      </div>

                      <div className="bg-orange-50 border border-orange-200 p-3 rounded">
                        <div className="flex items-center gap-2 mb-2">
                          <code className="font-mono text-sm text-orange-800">500 Internal Server Error</code>
                          <Badge variant="secondary" className="text-xs">Temporário</Badge>
                        </div>
                        <p className="text-sm text-orange-700 mb-2">
                          <strong>Erro:</strong> "Erro interno do servidor"
                        </p>
                        <div className="text-xs text-orange-600">
                          <strong>Soluções:</strong>
                          <ul className="list-disc ml-4 mt-1 space-y-1">
                            <li>Tente novamente em alguns segundos</li>
                            <li>Verifique se a URL está correta</li>
                            <li>Se persistir, entre em contato com o suporte</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exemplos Práticos */}
            <Card>
              <CardHeader className="bg-purple-50 border-b">
                <CardTitle className="text-xl flex items-center gap-2">
                  <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">5</div>
                  Exemplos de Implementação
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Node.js (Express):</h4>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto">
{`const express = require('express');
const app = express();

// Endpoint para receber webhook
app.post('/webhook/produtos', express.json(), (req, res) => {
  const { event, timestamp, data } = req.body;
  
  if (event === 'products_update') {
    const produtos = data.products;
    console.log(\`Recebidos \${produtos.length} produtos:\`);
    
    // Processar produtos
    produtos.forEach(produto => {
      console.log(\`- \${produto.name}: R$ \${produto.price}\`);
    });
  }
  
  res.status(200).json({ success: true });
});`}
                    </pre>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Python (Flask):</h4>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto">
{`from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/webhook/produtos', methods=['POST'])
def webhook_produtos():
    data = request.get_json()
    
    if data.get('event') == 'products_update':
        produtos = data['data']['products']
        print(f"Recebidos {len(produtos)} produtos:")
        
        for produto in produtos:
            print(f"- {produto['name']}: R$ {produto['price']}")
    
    return jsonify({'success': True})`}
                    </pre>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">PHP:</h4>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto">
{`<?php
$input = json_decode(file_get_contents('php://input'), true);

if ($input['event'] === 'products_update') {
    $produtos = $input['data']['products'];
    error_log("Recebidos " . count($produtos) . " produtos:");
    
    foreach ($produtos as $produto) {
        error_log("- " . $produto['name'] . ": R$ " . $produto['price']);
    }
}

http_response_code(200);
echo json_encode(['success' => true]);
?>`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}