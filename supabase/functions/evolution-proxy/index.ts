import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { integrationId, endpoint, method = 'GET', body } = await req.json();
    console.log(`🔄 Evolution Proxy - Request: ${method} ${endpoint}`, { integrationId, hasBody: !!body });

    if (!integrationId || !endpoint) {
      return new Response(JSON.stringify({ error: 'integrationId and endpoint are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: integration, error: dbError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .single();

    if (dbError || !integration) {
      console.error('Integration not found:', dbError);
      return new Response(JSON.stringify({ error: 'Integration not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const baseUrl = integration.base_url?.replace(/\/$/, '');
    const apiToken = integration.api_token;

    if (!baseUrl || !apiToken) {
      console.error('Missing base_url or api_token');
      return new Response(JSON.stringify({ error: 'Integration missing base_url or api_token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = `${baseUrl}${endpoint}`;
    console.log(`📡 Evolution Proxy: ${method} ${url}`);

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiToken,
      },
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      fetchOptions.body = JSON.stringify(body);
      console.log('📦 Request body:', JSON.stringify(body));
    }

    const response = await fetch(url, fetchOptions);
    const responseText = await response.text();
    console.log(`📥 Response status: ${response.status}`);
    console.log(`📥 Response body (first 1000 chars): ${responseText.substring(0, 1000)}`);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    // For connect/create endpoints, log QR code details extensively
    if (endpoint.includes('/connect/') || endpoint.includes('/instance/create')) {
      if (typeof responseData === 'object' && responseData !== null) {
        console.log('🔑 Response keys:', Object.keys(responseData));
        console.log('🔑 Has base64:', !!responseData.base64);
        console.log('🔑 Has qrcode:', !!responseData.qrcode);
        console.log('🔑 qrcode type:', typeof responseData.qrcode);
        if (responseData.qrcode && typeof responseData.qrcode === 'object') {
          console.log('🔑 qrcode keys:', Object.keys(responseData.qrcode));
          console.log('🔑 qrcode.base64 exists:', !!responseData.qrcode.base64);
          console.log('🔑 qrcode.count:', responseData.qrcode.count);
        }
        console.log('🔑 Has code:', !!responseData.code);
        console.log('🔑 Has pairingCode:', !!responseData.pairingCode);
      }
    }

    return new Response(JSON.stringify(responseData), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Evolution proxy error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
