import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, ...params } = await req.json()
    
    console.log('UniFi Controller Proxy Request:', { action, params })
    
    switch (action) {
      // Authentication
      case 'login':
        return await handleLogin(params)
      case 'testConnection':
        return await testConnection(params)
      
      // Basic data fetching
      case 'getSites':
        return await getSites(params)
      case 'getDevices':
        return await getDevices(params)
      case 'getClients':
        return await getClients(params)
      case 'getSystemInfo':
        return await getSystemInfo(params)
      
      // Device management
      case 'restartDevice':
        return await restartDevice(params)
      case 'locateDevice':
        return await locateDevice(params)
      case 'upgradeDevice':
        return await upgradeDevice(params)
      case 'adoptDevice':
        return await adoptDevice(params)
      case 'setDeviceLED':
        return await setDeviceLED(params)
      case 'setDeviceSettings':
        return await setDeviceSettings(params)
      
      // Client management
      case 'blockClient':
        return await blockClient(params)
      case 'unblockClient':
        return await unblockClient(params)
      case 'disconnectClient':
        return await disconnectClient(params)
      case 'setClientAlias':
        return await setClientAlias(params)
      case 'setClientQoS':
        return await setClientQoS(params)
      
      // Network management
      case 'getNetworks':
        return await getNetworks(params)
      case 'createNetwork':
        return await createNetwork(params)
      case 'updateNetwork':
        return await updateNetwork(params)
      case 'deleteNetwork':
        return await deleteNetwork(params)
      case 'enableNetwork':
        return await enableNetwork(params)
      case 'disableNetwork':
        return await disableNetwork(params)
      
      // Site configuration
      case 'getSiteSettings':
        return await getSiteSettings(params)
      case 'updateSiteSettings':
        return await updateSiteSettings(params)
      case 'getDHCPSettings':
        return await getDHCPSettings(params)
      case 'updateDHCPSettings':
        return await updateDHCPSettings(params)
      
      // Monitoring and stats
      case 'getHealthMetrics':
        return await getHealthMetrics(params)
      case 'getTrafficStats':
        return await getTrafficStats(params)
      case 'getEvents':
        return await getEvents(params)
      case 'getAlarms':
        return await getAlarms(params)
      
      // Backup and maintenance
      case 'createBackup':
        return await createBackup(params)
      case 'getBackups':
        return await getBackups(params)
      case 'restoreBackup':
        return await restoreBackup(params)
      case 'getLogs':
        return await getLogs(params)
      
      // Port forwarding and firewall
      case 'getPortForwarding':
        return await getPortForwarding(params)
      case 'createPortForwarding':
        return await createPortForwarding(params)
      case 'updatePortForwarding':
        return await updatePortForwarding(params)
      case 'deletePortForwarding':
        return await deletePortForwarding(params)
      case 'getFirewallRules':
        return await getFirewallRules(params)
      case 'createFirewallRule':
        return await createFirewallRule(params)
      case 'updateFirewallRule':
        return await updateFirewallRule(params)
      case 'deleteFirewallRule':
        return await deleteFirewallRule(params)
      
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
    console.error('UniFi Controller Proxy Error:', error)
    
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

async function handleLogin({ baseUrl, username, password }: { baseUrl: string, username: string, password: string }) {
  try {
    console.log('Attempting login to UniFi Controller:', baseUrl)
    
    const loginResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
        remember: false,
        strict: true
      })
    })

    console.log('Login response status:', loginResponse.status)
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text()
      console.error('Login failed:', loginResponse.status, errorText)
      return new Response(
        JSON.stringify({ 
          error: 'Login failed', 
          details: 'Invalid credentials or controller unreachable',
          status: loginResponse.status 
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const loginData = await loginResponse.json()
    console.log('Login successful:', loginData?.meta?.rc === 'ok')

    const cookies = loginResponse.headers.get('set-cookie') || ''
    console.log('Cookies received:', cookies ? 'Yes' : 'No')

    return new Response(
      JSON.stringify({
        success: true,
        cookies: cookies,
        data: loginData
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

async function getSites({ baseUrl, cookies }: { baseUrl: string, cookies: string }) {
  try {
    console.log('Fetching sites from UniFi Controller...')
    
    const response = await fetch(`${baseUrl}/api/self/sites`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cookie': cookies
      }
    })

    console.log('Sites response status:', response.status)

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
      JSON.stringify(data),
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

async function getDevices({ baseUrl, cookies, siteId }: { baseUrl: string, cookies: string, siteId: string }) {
  try {
    console.log('Fetching devices from UniFi Controller...', siteId)
    
    const response = await fetch(`${baseUrl}/api/s/${siteId}/stat/device`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cookie': cookies
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

async function getClients({ baseUrl, cookies, siteId }: { baseUrl: string, cookies: string, siteId: string }) {
  try {
    console.log('Fetching clients from UniFi Controller...', siteId)
    
    const response = await fetch(`${baseUrl}/api/s/${siteId}/stat/sta`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cookie': cookies
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

async function getSystemInfo({ baseUrl, cookies, siteId }: { baseUrl: string, cookies: string, siteId: string }) {
  try {
    console.log('Fetching system info from UniFi Controller...', siteId)
    
    const response = await fetch(`${baseUrl}/api/s/${siteId}/stat/sysinfo`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cookie': cookies
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

async function restartDevice({ baseUrl, cookies, siteId, deviceMac }: { baseUrl: string, cookies: string, siteId: string, deviceMac: string }) {
  try {
    console.log('Restarting device...', deviceMac)
    
    const response = await fetch(`${baseUrl}/api/s/${siteId}/cmd/devmgr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': cookies
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

async function locateDevice({ baseUrl, cookies, siteId, deviceMac }: { baseUrl: string, cookies: string, siteId: string, deviceMac: string }) {
  try {
    console.log('Locating device...', deviceMac)
    
    const response = await fetch(`${baseUrl}/api/s/${siteId}/cmd/devmgr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        cmd: 'set-locate',
        mac: deviceMac
      })
    })

    if (!response.ok) {
      console.error('Device locate failed:', response.status)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to locate device',
          status: response.status 
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const data = await response.json()
    console.log('Device locate successful')

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Device locate error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to locate device',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function setDeviceLED({ baseUrl, cookies, siteId, deviceMac, enable }: { baseUrl: string, cookies: string, siteId: string, deviceMac: string, enable: boolean }) {
  try {
    console.log(`${enable ? 'Enabling' : 'Disabling'} device LED...`, deviceMac)
    
    const response = await fetch(`${baseUrl}/api/s/${siteId}/rest/device/${deviceMac}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        led_override: enable ? 'on' : 'off'
      })
    })

    if (!response.ok) {
      console.error('Device LED control failed:', response.status)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to control device LED',
          status: response.status 
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const data = await response.json()
    console.log('Device LED control successful')

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Device LED control error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to control device LED',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function setDeviceSettings({ baseUrl, cookies, siteId, deviceMac, settings }: { baseUrl: string, cookies: string, siteId: string, deviceMac: string, settings: any }) {
  try {
    console.log('Updating device settings...', deviceMac)
    
    const response = await fetch(`${baseUrl}/api/s/${siteId}/rest/device/${deviceMac}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify(settings)
    })

    if (!response.ok) {
      console.error('Device settings update failed:', response.status)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update device settings',
          status: response.status 
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const data = await response.json()
    console.log('Device settings updated successfully')

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Device settings update error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to update device settings',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function blockClient({ baseUrl, cookies, siteId, clientMac, block }: { baseUrl: string, cookies: string, siteId: string, clientMac: string, block: boolean }) {
  try {
    console.log(`${block ? 'Blocking' : 'Unblocking'} client...`, clientMac)
    
    const response = await fetch(`${baseUrl}/api/s/${siteId}/cmd/stamgr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': cookies
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

async function testConnection({ baseUrl, username, password }: { baseUrl: string, username: string, password: string }) {
  try {
    console.log('Testing connection to UniFi Controller:', baseUrl)
    
    const response = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
        remember: false,
        strict: true
      })
    })

    console.log('Test connection response status:', response.status)
    
    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Connection test failed', 
          status: response.status 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const data = await response.json()
    const success = data?.meta?.rc === 'ok'

    return new Response(
      JSON.stringify({
        success,
        message: success ? 'Connection successful' : 'Authentication failed',
        data
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Test connection error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Connection test failed',
        details: error.message 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}
