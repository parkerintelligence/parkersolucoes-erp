import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessageRequest {
  integrationId: string;
  phoneNumber: string;
  message: string;
  instanceName?: string; // Override para usar instância específica da screen config
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📱 WhatsApp Message Proxy - Start');
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ No authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    // Check if it's a service role call
    const isServiceRole = token === serviceRoleKey;
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey,
    );

    // If not service role, validate user token
    if (!isServiceRole) {
      const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

      if (userError || !user) {
        console.error('❌ Authentication failed:', userError?.message);
        return new Response(
          JSON.stringify({ success: false, error: 'Authentication failed' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ User authenticated:', user.email);
    } else {
      console.log('✅ Service role authenticated');
    }

    const { integrationId, phoneNumber, message, instanceName: instanceNameOverride } = await req.json() as WhatsAppMessageRequest;

    console.log('📋 Request:', { integrationId, phoneNumber: phoneNumber.substring(0, 4) + '****' });

    if (!integrationId || !phoneNumber || !message) {
      return new Response(
        JSON.stringify({ success: false, error: 'Parâmetros obrigatórios: integrationId, phoneNumber, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate phone number format (should have country code)
    if (phoneNumber.length < 12 || phoneNumber.length > 15) {
      console.error('❌ Número inválido:', phoneNumber, 'Tamanho:', phoneNumber.length);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Número de telefone inválido. Deve ter código do país (ex: 5564999887766)',
          details: `Número fornecido: ${phoneNumber.substring(0, 4)}**** tem ${phoneNumber.length} dígitos. Esperado: 12-15 dígitos com código do país.`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client to fetch integration (works for both global and user-specific integrations)
    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('integrations')
      .select('base_url, api_token, instance_name')
      .eq('id', integrationId)
      .eq('type', 'evolution_api')
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      console.error('❌ Integration not found:', integrationError);
      return new Response(
        JSON.stringify({ success: false, error: 'Integração Evolution API não encontrada ou inativa' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Integration found:', {
      base_url: integration.base_url,
      instance_name: integration.instance_name,
      has_token: !!integration.api_token
    });

    const evolutionUrl = `${integration.base_url.replace(/\/$/, '')}/message/sendText/${integration.instance_name}`;
    
    console.log('🚀 Sending to Evolution API:', evolutionUrl);

    const evolutionResponse = await fetch(evolutionUrl, {
      method: 'POST',
      headers: {
        'apikey': integration.api_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: phoneNumber,
        text: message,
      }),
    });

    const responseText = await evolutionResponse.text();
    console.log('Evolution API response status:', evolutionResponse.status);
    console.log('Evolution API response:', responseText.substring(0, 200));

    if (!evolutionResponse.ok) {
      console.error('❌ Evolution API error:', evolutionResponse.status, responseText);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Evolution API retornou erro ${evolutionResponse.status}`,
          details: responseText.substring(0, 500)
        }),
        { status: evolutionResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let evolutionData;
    try {
      evolutionData = JSON.parse(responseText);
    } catch {
      evolutionData = { raw: responseText };
    }

    console.log('✅ Message sent successfully');

    return new Response(
      JSON.stringify({
        success: true,
        data: evolutionData,
        message: 'Mensagem enviada com sucesso'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});