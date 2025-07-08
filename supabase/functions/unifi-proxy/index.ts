
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, ...params } = await req.json()
    
    console.log('UniFi Cloud Proxy Request:', { action, params })
    
    switch (action) {
      case 'login':
        return await handleLogin(params)
      case 'getSites':
        return await getSites(params)
      case 'getDevices':
        return await getDevices(params)
      case 'getClients':
        return await getClients(params)
      case 'getSystemInfo':
        return await getSystemInfo(params)
      case 'restartDevice':
        return await restartDevice(params)
      case 'blockClient':
        return await blockClient(params)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }
  } catch (error) {
    console.error('UniFi Cloud Proxy Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process request',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function handleLogin({ username, password }: { username: string, password: string }) {
  try {
    console.log('Attempting login to UniFi Cloud...')
    
    // Step 1: Login to UniFi account
    const loginResponse = await fetch('https://account.ui.com/api/sso/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'UniFi-Integration/1.0'
      },
      body: JSON.stringify({
        username,
        password,
        remember: false
      })
    })

    if (!loginResponse.ok) {
      console.error('Login failed:', loginResponse.status)
      return new Response(
        JSON.stringify({ 
          error: 'Login failed', 
          details: 'Invalid credentials' 
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const loginData = await loginResponse.json()
    console.log('Login successful, getting access token...')

    // Step 2: Get access token for UniFi Cloud
    const tokenResponse = await fetch('https://api.ui.com/ea/user/v1/user/authentication/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${loginData.data.access_token}`,
        'User-Agent': 'UniFi-Integration/1.0'
      }
    })

    if (!tokenResponse.ok) {
      console.error('Token request failed:', tokenResponse.status)
      return new Response(
        JSON.stringify({ 
          error: 'Token request failed' 
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const tokenData = await tokenResponse.json()
    
    return new Response(
      JSON.stringify({
        success: true,
        accessToken: tokenData.data.access_token,
        refreshToken: tokenData.data.refresh_token,
        expiresIn: tokenData.data.expires_in
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Login error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Login failed',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function getSites({ accessToken }: { accessToken: string }) {
  try {
    console.log('Fetching sites from UniFi Cloud...')
    
    const response = await fetch('https://api.ui.com/ea/hosts/v1/host', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'UniFi-Integration/1.0'
      }
    })

    if (!response.ok) {
      console.error('Sites fetch failed:', response.status)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch sites',
          status: response.status 
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const data = await response.json()
    console.log('Sites fetched successfully:', data.data?.length || 0)

    return new Response(
      JSON.stringify({
        data: data.data || [],
        meta: { rc: 'ok' }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Sites fetch error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch sites',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function getDevices({ accessToken, hostId }: { accessToken: string, hostId: string }) {
  try {
    console.log('Fetching devices from UniFi Cloud...', hostId)
    
    const response = await fetch(`https://api.ui.com/ea/hosts/v1/host/${hostId}/proxy/network/api/s/default/stat/device`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'UniFi-Integration/1.0'
      }
    })

    if (!response.ok) {
      console.error('Devices fetch failed:', response.status)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch devices',
          status: response.status 
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const data = await response.json()
    console.log('Devices fetched successfully:', data.data?.length || 0)

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Devices fetch error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch devices',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function getClients({ accessToken, hostId }: { accessToken: string, hostId: string }) {
  try {
    console.log('Fetching clients from UniFi Cloud...', hostId)
    
    const response = await fetch(`https://api.ui.com/ea/hosts/v1/host/${hostId}/proxy/network/api/s/default/stat/sta`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'UniFi-Integration/1.0'
      }
    })

    if (!response.ok) {
      console.error('Clients fetch failed:', response.status)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch clients',
          status: response.status 
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const data = await response.json()
    console.log('Clients fetched successfully:', data.data?.length || 0)

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Clients fetch error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch clients',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function getSystemInfo({ accessToken, hostId }: { accessToken: string, hostId: string }) {
  try {
    console.log('Fetching system info from UniFi Cloud...', hostId)
    
    const response = await fetch(`https://api.ui.com/ea/hosts/v1/host/${hostId}/proxy/network/api/s/default/stat/sysinfo`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'UniFi-Integration/1.0'
      }
    })

    if (!response.ok) {
      console.error('System info fetch failed:', response.status)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch system info',
          status: response.status 
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const data = await response.json()
    console.log('System info fetched successfully')

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('System info fetch error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch system info',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function restartDevice({ accessToken, hostId, deviceMac }: { accessToken: string, hostId: string, deviceMac: string }) {
  try {
    console.log('Restarting device...', deviceMac)
    
    const response = await fetch(`https://api.ui.com/ea/hosts/v1/host/${hostId}/proxy/network/api/s/default/cmd/devmgr`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'UniFi-Integration/1.0'
      },
      body: JSON.stringify({
        cmd: 'restart',
        mac: deviceMac
      })
    })

    if (!response.ok) {
      console.error('Device restart failed:', response.status)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to restart device',
          status: response.status 
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const data = await response.json()
    console.log('Device restart successful')

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Device restart error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to restart device',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function blockClient({ accessToken, hostId, clientMac, block }: { accessToken: string, hostId: string, clientMac: string, block: boolean }) {
  try {
    console.log(`${block ? 'Blocking' : 'Unblocking'} client...`, clientMac)
    
    const response = await fetch(`https://api.ui.com/ea/hosts/v1/host/${hostId}/proxy/network/api/s/default/cmd/stamgr`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'UniFi-Integration/1.0'
      },
      body: JSON.stringify({
        cmd: block ? 'block-sta' : 'unblock-sta',
        mac: clientMac
      })
    })

    if (!response.ok) {
      console.error('Client block/unblock failed:', response.status)
      return new Response(
        JSON.stringify({ 
          error: `Failed to ${block ? 'block' : 'unblock'} client`,
          status: response.status 
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const data = await response.json()
    console.log(`Client ${block ? 'blocked' : 'unblocked'} successfully`)

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error(`Client ${block ? 'block' : 'unblock'} error:`, error)
    return new Response(
      JSON.stringify({ 
        error: `Failed to ${block ? 'block' : 'unblock'} client`,
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}
