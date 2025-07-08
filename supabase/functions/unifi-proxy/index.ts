
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
    console.log('Attempting login to UniFi Cloud with username:', username)
    
    // Step 1: Login to UniFi account with correct endpoint
    const loginResponse = await fetch('https://account.ui.com/api/sso', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        username,
        password,
        remember: false,
        token: ''
      })
    })

    console.log('Login response status:', loginResponse.status)
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text()
      console.error('Login failed:', loginResponse.status, errorText)
      return new Response(
        JSON.stringify({ 
          error: 'Login failed', 
          details: 'Invalid credentials or login endpoint issue',
          status: loginResponse.status 
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const loginData = await loginResponse.json()
    console.log('Login successful, response keys:', Object.keys(loginData))

    // Check if we have the required data
    if (!loginData.data || !loginData.data.access_token) {
      console.error('No access token in response:', loginData)
      return new Response(
        JSON.stringify({ 
          error: 'Authentication failed',
          details: 'No access token received' 
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Step 2: Get access token for UniFi Cloud API
    const tokenResponse = await fetch('https://api.ui.com/ea/user', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${loginData.data.access_token}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    console.log('Token response status:', tokenResponse.status)

    if (!tokenResponse.ok) {
      console.error('Token request failed:', tokenResponse.status)
      // Try using the original token directly
      return new Response(
        JSON.stringify({
          success: true,
          accessToken: loginData.data.access_token,
          refreshToken: loginData.data.refresh_token || '',
          expiresIn: loginData.data.expires_in || 3600
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const tokenData = await tokenResponse.json()
    console.log('Token data received, keys:', Object.keys(tokenData))
    
    return new Response(
      JSON.stringify({
        success: true,
        accessToken: loginData.data.access_token,
        refreshToken: loginData.data.refresh_token || '',
        expiresIn: loginData.data.expires_in || 3600
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
    
    // Try multiple endpoints for sites
    const endpoints = [
      'https://api.ui.com/ea/hosts',
      'https://api.ui.com/ea/hosts/v1/host',
      'https://unifi.ui.com/api/sso/v1/user/cloudaccess'
    ]
    
    for (const endpoint of endpoints) {
      try {
        console.log('Trying endpoint:', endpoint)
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })

        console.log(`Response from ${endpoint}:`, response.status)

        if (response.ok) {
          const data = await response.json()
          console.log('Sites data structure:', Object.keys(data))
          
          // Handle different response formats
          let sites = []
          if (data.data && Array.isArray(data.data)) {
            sites = data.data
          } else if (Array.isArray(data)) {
            sites = data
          } else if (data.hosts && Array.isArray(data.hosts)) {
            sites = data.hosts
          }
          
          console.log('Sites found:', sites.length)
          
          return new Response(
            JSON.stringify({
              data: sites,
              meta: { rc: 'ok' }
            }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
      } catch (endpointError) {
        console.log(`Endpoint ${endpoint} failed:`, endpointError.message)
        continue
      }
    }
    
    // If all endpoints failed, return empty result
    console.log('All endpoints failed, returning empty sites')
    return new Response(
      JSON.stringify({
        data: [],
        meta: { rc: 'ok' },
        message: 'No sites found or endpoints unavailable'
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
