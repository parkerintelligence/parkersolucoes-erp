import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const webhook = await req.json();
    
    console.log('🔔 Chatwoot Webhook received:', {
      event: webhook.event,
      conversation_id: webhook.conversation?.id,
      account_id: webhook.account?.id,
      message_type: webhook.message_type
    });

    // Encontrar a integração ativa do Chatwoot
    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('integrations')
      .select('id')
      .eq('type', 'chatwoot')
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      console.log('⚠️ No active Chatwoot integration found:', integrationError?.message);
      return new Response(JSON.stringify({ received: true, note: 'no_integration' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    console.log('✅ Found integration:', integration.id);

    // Inserir evento na tabela
    const { error: insertError } = await supabaseAdmin
      .from('chatwoot_events')
      .insert({
        integration_id: integration.id,
        event_type: webhook.event,
        conversation_id: webhook.conversation?.id || 0,
        account_id: webhook.account?.id || 0,
        event_data: webhook,
        processed: false
      });

    if (insertError) {
      console.error('❌ Error inserting event:', insertError);
      throw insertError;
    }

    console.log('✅ Event stored successfully in database');

    return new Response(
      JSON.stringify({ received: true, stored: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
