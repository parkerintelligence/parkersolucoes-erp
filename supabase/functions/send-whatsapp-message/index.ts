import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { sendWhatsAppViaConfiguredInstance } from '../_shared/evolutionGo.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessageRequest {
  phoneNumber: string;
  message: string;
  /** @deprecated mantidos por compatibilidade; o sistema usa a instância única de Administração */
  integrationId?: string;
  instanceName?: string;
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

    const { phoneNumber, message } = await req.json() as WhatsAppMessageRequest;

    console.log('📋 Request:', { phoneNumber: phoneNumber?.substring(0, 4) + '****' });

    if (!phoneNumber || !message) {
      return new Response(
        JSON.stringify({ success: false, error: 'Parâmetros obrigatórios: phoneNumber, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (phoneNumber.length < 12 || phoneNumber.length > 15) {
      console.error('❌ Número inválido:', phoneNumber.length);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Número de telefone inválido. Deve ter código do país (ex: 5564999887766)',
          details: `Número fornecido tem ${phoneNumber.length} dígitos. Esperado: 12-15 dígitos com código do país.`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Instância ÚNICA configurada em Administração
    const result = await sendWhatsAppViaConfiguredInstance(supabaseAdmin, phoneNumber, message);

    if (!result.ok) {
      console.error('❌ Evolution error:', result.status, result.error || result.raw?.substring(0, 300));
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error || `Servidor WhatsApp retornou erro ${result.status}`,
          details: result.raw?.substring(0, 500)
        }),
        { status: result.status || 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responseText = result.raw;




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