interface WebhookData {
  event: string
  timestamp: string
  source: string
  data: any
}

export const sendWebhookNotification = async (eventType: string, data: any) => {
  const webhookConfig = localStorage.getItem('webhook_config')
  
  if (!webhookConfig) {
    console.log('Webhook não configurado, pulando notificação')
    return
  }

  let config
  try {
    config = JSON.parse(webhookConfig)
  } catch (error) {
    console.error('Erro ao analisar configuração do webhook:', error)
    return
  }

  // Buscar todos os produtos ativos
  let products = []
  try {
    const { supabase } = await import('@/integrations/supabase/client')
    const { data: productsData, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    
    if (!error && productsData) {
      products = productsData
    }
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
  }

  const webhookData: WebhookData = {
    event: eventType,
    timestamp: new Date().toISOString(),
    source: 'vending_machine_admin',
    data: {
      ...data,
      products: products,
      total_products: products.length
    }
  }

  try {
    console.log('Enviando webhook:', { eventType, data: webhookData })
    
    // Preparar headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Adicionar autenticação se configurada
    if (config.authType === 'bearer' && config.bearerToken) {
      headers['Authorization'] = `Bearer ${config.bearerToken}`
    } else if (config.authType === 'apikey' && config.apiKeyHeader && config.apiKeyValue) {
      headers[config.apiKeyHeader] = config.apiKeyValue
    } else if (config.authType === 'basic' && config.basicUsername && config.basicPassword) {
      headers['Authorization'] = `Basic ${btoa(`${config.basicUsername}:${config.basicPassword}`)}`
    }

    // Adicionar headers customizados
    if (config.customHeaders) {
      config.customHeaders.forEach((header: { key: string; value: string }) => {
        if (header.key && header.value) {
          headers[header.key] = header.value
        }
      })
    }

    // Preparar corpo da requisição
    let body = JSON.stringify(webhookData)
    if (config.bodyTemplate) {
      try {
        body = config.bodyTemplate
          .replace(/\{\{event_type\}\}/g, eventType)
          .replace(/\{\{timestamp\}\}/g, webhookData.timestamp)
          .replace(/\{\{data\}\}/g, JSON.stringify(webhookData.data))
      } catch (error) {
        console.warn('Erro ao processar template do corpo, usando corpo padrão:', error)
      }
    }

    await fetch(config.url, {
      method: config.method || 'POST',
      headers,
      mode: 'no-cors',
      body,
    })

    console.log('Webhook enviado com sucesso')
  } catch (error) {
    console.error('Erro ao enviar webhook:', error)
  }
}

// Função utilitária para gerar dados do produto formatados
export const formatProductForWebhook = (product: any, action: string) => {
  return {
    action,
    product: {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      size: product.size,
      active: product.active,
      created_at: product.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    metadata: {
      admin_action: true,
      source_system: 'vending_machine_admin'
    }
  }
}