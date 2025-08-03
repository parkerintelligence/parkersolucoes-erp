import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

console.log("UniFi Website Proxy function starting...");

serve(async (req) => {
  console.log(`Received ${req.method} request to unifi-website-proxy`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Creating Supabase client...");
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Get user_id from query parameters for public function
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');
    
    if (!userId) {
      console.error('No user_id parameter found');
      throw new Error('user_id parameter is required');
    }

    console.log(`User ID from parameter: ${userId}`);
    
    // Validate that the user exists in our database
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      console.error('User validation failed:', profileError);
      throw new Error('Invalid user_id');
    }

    console.log(`User validated: ${userId}`);

    // Get UniFi URL from system settings
    console.log("Fetching UniFi URL setting...");
    const { data: urlSetting, error: settingError } = await supabaseClient
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'unifi_website_url')
      .eq('user_id', userId)
      .single();

    if (settingError || !urlSetting) {
      console.error('UniFi URL setting not found:', settingError);
      throw new Error('UniFi URL não configurada');
    }

    const unifiUrl = urlSetting.setting_value;
    console.log('UniFi URL found:', unifiUrl);

    // Parse request to get the path to proxy
    const url = new URL(req.url);
    const proxyPath = url.searchParams.get('path') || '/';
    const targetUrl = unifiUrl.replace(/\/+$/, '') + proxyPath;
    
    console.log('Proxying request to:', targetUrl);

    // Forward the request to the UniFi controller
    const proxyHeaders: HeadersInit = {
      'User-Agent': 'Lovable-UniFi-Proxy/1.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };

    // Forward cookies if present
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      proxyHeaders['Cookie'] = cookieHeader;
    }

    const proxyRequest = await fetch(targetUrl, {
      method: req.method,
      headers: proxyHeaders,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.blob() : undefined,
    });

    console.log('Proxy response status:', proxyRequest.status);

    // Get response content
    let responseBody = await proxyRequest.text();
    const contentType = proxyRequest.headers.get('content-type') || 'text/html';

    // If it's HTML, modify it to remove frame-busting code and fix relative URLs
    if (contentType.includes('text/html')) {
      console.log('Processing HTML response...');
      
      // Remove X-Frame-Options and CSP headers by modifying the HTML
      responseBody = responseBody.replace(
        /<meta[^>]*http-equiv=["']X-Frame-Options["'][^>]*>/gi,
        ''
      );
      responseBody = responseBody.replace(
        /<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi,
        ''
      );
      
      // Remove frame-busting JavaScript
      responseBody = responseBody.replace(
        /if\s*\(\s*top\s*[!=]=\s*self\s*\).*?<\/script>/gis,
        '</script>'
      );
      responseBody = responseBody.replace(
        /if\s*\(\s*window\s*[!=]=\s*window\.top\s*\).*?<\/script>/gis,
        '</script>'
      );
      responseBody = responseBody.replace(
        /top\.location\s*=\s*self\.location/gi,
        '// frame-busting disabled'
      );
      
      // Fix relative URLs to absolute URLs
      const baseUrl = unifiUrl.replace(/\/+$/, '');
      responseBody = responseBody.replace(
        /src=["']\/([^"']*?)["']/gi,
        `src="${baseUrl}/$1"`
      );
      responseBody = responseBody.replace(
        /href=["']\/([^"']*?)["']/gi,
        `href="${baseUrl}/$1"`
      );
      responseBody = responseBody.replace(
        /action=["']\/([^"']*?)["']/gi,
        `action="${baseUrl}/$1"`
      );
    }

    // Create response headers without frame restrictions
    const responseHeaders = new Headers(corsHeaders);
    responseHeaders.set('Content-Type', contentType);
    
    // Copy safe headers from original response
    const safeCopyHeaders = [
      'cache-control',
      'expires',
      'last-modified',
      'etag',
      'vary'
    ];
    
    safeCopyHeaders.forEach(headerName => {
      const value = proxyRequest.headers.get(headerName);
      if (value) {
        responseHeaders.set(headerName, value);
      }
    });

    // Explicitly remove frame-busting headers
    responseHeaders.delete('X-Frame-Options');
    responseHeaders.delete('Content-Security-Policy');
    responseHeaders.delete('X-Content-Security-Policy');
    responseHeaders.delete('X-WebKit-CSP');

    console.log('Proxy successful, response headers:', Object.fromEntries(responseHeaders.entries()));

    return new Response(responseBody, {
      status: proxyRequest.status,
      statusText: proxyRequest.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('UniFi website proxy error:', error);
    
    const errorResponse = {
      error: error.message,
      details: 'Erro ao acessar o controlador UniFi via proxy',
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});