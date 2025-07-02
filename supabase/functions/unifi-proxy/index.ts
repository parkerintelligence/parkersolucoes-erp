import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UnifiConfig {
  base_url: string;
  username: string;
  password: string;
  site?: string;
}

let cookieCache: Map<string, { cookies: string; expires: number }> = new Map();

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

    const { config, endpoint, method = 'GET', body } = await req.json()
    const unifiConfig = config as UnifiConfig

    console.log('Unifi Proxy Request:', { endpoint, method, url: unifiConfig.base_url })

    // Get or refresh session cookie
    const cookies = await getSessionCookie(unifiConfig)
    
    // Make Unifi API request
    const result = await makeUnifiRequest(unifiConfig, endpoint, method, body, cookies)

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Unifi Proxy Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function getSessionCookie(config: UnifiConfig): Promise<string> {
  const cacheKey = `${config.base_url}_${config.username}`
  const cached = cookieCache.get(cacheKey)
  
  if (cached && cached.expires > Date.now()) {
    console.log('Using cached Unifi session')
    return cached.cookies
  }

  console.log('Getting new Unifi session')
  
  const url = config.base_url.replace(/\/$/, '') + '/api/auth/login'
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      username: config.username,
      password: config.password
    })
  })

  if (!response.ok) {
    throw new Error(`Unifi login failed: ${response.status} ${response.statusText}`)
  }

  const setCookieHeaders = response.headers.getSetCookie()
  const cookies = setCookieHeaders.map(cookie => cookie.split(';')[0]).join('; ')
  
  if (!cookies) {
    throw new Error('No session cookies received from Unifi')
  }

  cookieCache.set(cacheKey, { cookies, expires: Date.now() + 3600000 }) // 1 hour
  return cookies
}

async function makeUnifiRequest(
  config: UnifiConfig,
  endpoint: string,
  method: string = 'GET',
  body?: any,
  cookies?: string
): Promise<any> {
  const site = config.site || 'default'
  const baseUrl = config.base_url.replace(/\/$/, '')
  
  // Handle different endpoint patterns
  let url = endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/api/s/${site}/${endpoint}`
  
  console.log('Unifi API Request:', { method, url })

  const requestOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': cookies || ''
    }
  }

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    requestOptions.body = JSON.stringify(body)
  }

  const response = await fetch(url, requestOptions)

  if (!response.ok) {
    throw new Error(`Unifi API Error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  
  if (data.meta && data.meta.rc !== 'ok') {
    throw new Error(`Unifi API Error: ${data.meta.msg || 'Unknown error'}`)
  }

  console.log('Unifi API Success:', { endpoint })
  return data.data || data
}