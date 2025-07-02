import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ZabbixConfig {
  base_url: string;
  api_token?: string;
  username?: string;
  password?: string;
}

interface ZabbixRequest {
  jsonrpc: string;
  method: string;
  params: any;
  id: number;
}

let authTokenCache: Map<string, { token: string; expires: number }> = new Map();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header missing')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    
    if (!user) {
      throw new Error('Invalid user token')
    }

    const { config, method, params } = await req.json()
    const zabbixConfig = config as ZabbixConfig

    console.log('Zabbix Proxy Request:', { method, url: zabbixConfig.base_url })

    // Get or refresh auth token
    const authToken = await getAuthToken(zabbixConfig)
    
    // Make Zabbix API request
    const result = await makeZabbixRequest(zabbixConfig, method, params, authToken)

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Zabbix Proxy Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function getAuthToken(config: ZabbixConfig): Promise<string> {
  const cacheKey = `${config.base_url}_${config.username || 'token'}`
  const cached = authTokenCache.get(cacheKey)
  
  if (cached && cached.expires > Date.now()) {
    console.log('Using cached Zabbix token')
    return cached.token
  }

  console.log('Getting new Zabbix token')
  
  if (config.api_token) {
    // Use API token directly
    const token = config.api_token
    authTokenCache.set(cacheKey, { token, expires: Date.now() + 3600000 }) // 1 hour
    return token
  }

  if (config.username && config.password) {
    // Authenticate with username/password
    const authResult = await makeZabbixRequest(config, 'user.login', {
      username: config.username,
      password: config.password
    })
    
    const token = authResult
    authTokenCache.set(cacheKey, { token, expires: Date.now() + 3600000 }) // 1 hour
    return token
  }

  throw new Error('No valid authentication method provided')
}

async function makeZabbixRequest(
  config: ZabbixConfig, 
  method: string, 
  params: any, 
  authToken?: string
): Promise<any> {
  const url = config.base_url.replace(/\/$/, '') + '/api_jsonrpc.php'
  
  const requestBody: ZabbixRequest = {
    jsonrpc: '2.0',
    method,
    params: authToken && method !== 'user.login' ? { ...params, auth: authToken } : params,
    id: Date.now()
  }

  console.log('Zabbix API Request:', { method, url })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  
  if (data.error) {
    // If auth error, clear cache and retry once
    if (data.error.code === -32602 && authToken) {
      const cacheKey = `${config.base_url}_${config.username || 'token'}`
      authTokenCache.delete(cacheKey)
      console.log('Auth error, cleared cache')
    }
    throw new Error(`Zabbix API Error: ${data.error.message}`)
  }

  console.log('Zabbix API Success:', { method })
  return data.result
}