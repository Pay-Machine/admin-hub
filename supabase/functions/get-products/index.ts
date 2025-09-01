import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // --- ROTA PÚBLICA ---
    if (pathname === "/get-products") {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsError) {
        throw productsError;
      }

      return new Response(JSON.stringify({
        success: true,
        data: products,
        count: products.length,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- ROTAS PROTEGIDAS (mantém sua lógica de token) ---
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Token de autorização necessário' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token.startsWith('vma_') || token.length < 32) {
      return new Response(JSON.stringify({ error: 'Formato de token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();
    const tokenData = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', tokenData);
    const tokenHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const { data: validTokenData, error: tokenError } = await supabase
      .from('api_tokens')
      .select('user_id, is_active, permissions, expires_at')
      .eq('token_hash', tokenHash)
      .eq('is_active', true)
      .single();

    if (tokenError || !validTokenData) {
      return new Response(JSON.stringify({ error: 'Token inválido ou inativo' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (validTokenData.expires_at && new Date(validTokenData.expires_at) <= new Date()) {
      return new Response(JSON.stringify({ error: 'Token expirado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!validTokenData.permissions.includes('webhook_receive')) {
      return new Response(JSON.stringify({ error: 'Token sem permissões necessárias' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await supabase
      .from('api_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('token_hash', tokenHash);

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('user_role, approval_status')
      .eq('user_id', validTokenData.user_id)
      .single();

    if (profileError || !profileData || profileData.approval_status !== 'approved') {
      return new Response(JSON.stringify({ error: 'Usuário não autorizado' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // aqui você coloca as rotas protegidas que precisam de auth...
    return new Response(JSON.stringify({ success: true, message: "Acesso autorizado às rotas privadas" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in function:', error);
    return new Response(JSON.stringify({
      error: 'Erro interno do servidor',
      details: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
