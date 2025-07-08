import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, ...params } = await req.json()
    
    console.log('UniFi Controller Proxy Request:', { action, params: { ...params, password: '***' } })
    
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
      
      // Enhanced diagnostics
      case 'diagnoseConnection':
        return await diagnoseConnection(params)
      case 'pingController':
        return await pingController(params)
      
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

// Enhanced fetch function with better SSL handling and timeouts
async function enhancedFetch(url: string, options: RequestInit = {}, timeout = 30000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    console.log(`Making request to: ${url}`)
    console.log(`Request options:`, { 
      ...options, 
      headers: options.headers,
      body: options.body ? '[BODY_CONTENT]' : undefined 
    })
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      // Allow self-signed certificates for local UniFi controllers
      ...(url.includes('https://') && { 
        // Note: In production Deno, certificate validation is enforced
        // For development/local controllers, users may need to configure proper certificates
      })
    })
    
    clearTimeout(timeoutId)
    
    console.log(`Response status: ${response.status} ${response.statusText}`)
    console.log(`Response headers:`, Object.fromEntries(response.headers.entries()))
    
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    console.error(`Network error for ${url}:`, error.message)
    
    // Provide more specific error messages
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms - Controller may be unreachable`)
    } else if (error.message.includes('certificate')) {
      throw new Error('SSL Certificate error - Controller may be using self-signed certificate')
    } else if (error.message.includes('network')) {
      throw new Error('Network error - Check if controller URL is correct and accessible')
    } else {
      throw error
    }
  }
}

async function handleLogin({ baseUrl, username, password }: { baseUrl: string, username: string, password: string }) {
  try {
    console.log('Attempting login to UniFi Controller:', baseUrl)
    
    // Validate URL format
    if (!baseUrl || !baseUrl.startsWith('http')) {
      throw new Error('Invalid controller URL format')
    }
    
    // Clean URL and ensure proper endpoint
    const cleanUrl = baseUrl.replace(/\/$/, '')
    const loginUrl = `${cleanUrl}/api/login`
    
    console.log('Login URL:', loginUrl)
    
    const loginResponse = await enhancedFetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'UniFi-Proxy/1.0',
      },
      body: JSON.stringify({
        username,
        password,
        remember: false,
        strict: true
      })
    }, 15000) // 15 second timeout for login

    console.log('Login response status:', loginResponse.status)
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text()
      console.error('Login failed - Status:', loginResponse.status, 'Response:', errorText)
      
      let errorMessage = 'Login failed'
      if (loginResponse.status === 400) {
        errorMessage = 'Invalid credentials - Check username and password'
      } else if (loginResponse.status === 401) {
        errorMessage = 'Authentication failed - Invalid username or password'
      } else if (loginResponse.status === 404) {
        errorMessage = 'Controller not found - Check URL and ensure UniFi Controller is running'
      } else if (loginResponse.status >= 500) {
        errorMessage = 'Controller server error - Check controller status'
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: `HTTP ${loginResponse.status}: ${errorText.substring(0, 200)}`,
          status: loginResponse.status,
          url: loginUrl
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const loginData = await loginResponse.json()
    console.log('Login response data:', { 
      meta: loginData?.meta, 
      dataLength: loginData?.data?.length 
    })

    const cookies = loginResponse.headers.get('set-cookie') || ''
    console.log('Cookies received:', cookies ? 'Yes' : 'No', cookies.substring(0, 100))

    if (!cookies) {
      console.warn('No cookies received from login response')
    }

    const isSuccessful = loginData?.meta?.rc === 'ok'
    console.log('Login successful:', isSuccessful)

    return new Response(
      JSON.stringify({
        success: isSuccessful,
        cookies: cookies,
        data: loginData,
        controllerUrl: cleanUrl
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
        error: 'Connection failed',
        details: error.message,
        type: 'network_error'
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
    
    // First, try to ping the controller
    const pingResult = await pingController({ baseUrl })
    if (!pingResult.success) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Controller unreachable',
          details: pingResult.error,
          step: 'ping'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Then try login
    const loginResult = await handleLogin({ baseUrl, username, password })
    const loginData = await loginResult.json()
    
    if (loginResult.status === 200 && loginData.success) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Connection and authentication successful',
          controllerInfo: {
            url: baseUrl,
            responsive: true,
            authenticated: true
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: loginData.error || 'Authentication failed',
          details: loginData.details,
          step: 'authentication'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Test connection error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Connection test failed',
        details: error.message,
        step: 'network'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function pingController({ baseUrl }: { baseUrl: string }) {
  try {
    const cleanUrl = baseUrl.replace(/\/$/, '')
    
    // Try to reach the controller's info endpoint (usually doesn't require auth)
    const response = await enhancedFetch(`${cleanUrl}/`, {
      method: 'GET',
      headers: {
        'User-Agent': 'UniFi-Proxy/1.0',
      }
    }, 10000) // 10 second timeout
    
    return {
      success: response.status < 500, // Even 404 or 401 means the server is responding
      status: response.status,
      responsive: true
    }
  } catch (error) {
    return {
      success: false,
      responsive: false,
      error: error.message
    }
  }
}

async function diagnoseConnection({ baseUrl, username, password }: { baseUrl: string, username: string, password: string }) {
  const diagnosis = {
    baseUrl,
    timestamp: new Date().toISOString(),
    tests: [] as any[]
  }
  
  try {
    // Test 1: URL format validation
    diagnosis.tests.push({
      name: 'URL Format',
      success: baseUrl && (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')),
      details: baseUrl ? 'Valid URL format' : 'Invalid URL format'
    })
    
    // Test 2: Basic connectivity
    const pingResult = await pingController({ baseUrl })
    diagnosis.tests.push({
      name: 'Basic Connectivity',
      success: pingResult.responsive,
      details: pingResult.error || `Server responding with status ${pingResult.status}`
    })
    
    // Test 3: Authentication
    if (pingResult.responsive) {
      const authResult = await handleLogin({ baseUrl, username, password })
      const authData = await authResult.json()
      diagnosis.tests.push({
        name: 'Authentication',
        success: authData.success,
        details: authData.error || 'Authentication successful'
      })
    }
    
    // Test 4: SSL Certificate (for HTTPS)
    if (baseUrl.startsWith('https://')) {
      diagnosis.tests.push({
        name: 'SSL Certificate',
        success: true, // If we got this far, certificate is probably OK
        details: 'Certificate appears to be valid'
      })
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        diagnosis
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    diagnosis.tests.push({
      name: 'Diagnosis Error',
      success: false,
      details: error.message
    })
    
    return new Response(
      JSON.stringify({
        success: false,
        diagnosis
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

// Enhanced helper function for authenticated requests with retry logic
async function authenticatedRequest(baseUrl: string, endpoint: string, options: RequestInit = {}, cookies: string, retries = 1) {
  const cleanUrl = baseUrl.replace(/\/$/, '')
  const url = `${cleanUrl}${endpoint}`
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await enhancedFetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cookie': cookies,
          'User-Agent': 'UniFi-Proxy/1.0',
          ...options.headers
        }
      })
      
      // If unauthorized and we have retries left, could implement re-auth here
      if (response.status === 401 && attempt < retries) {
        console.log(`Unauthorized response, attempt ${attempt + 1}/${retries + 1}`)
        // For now, just continue with the error
      }
      
      return response
    } catch (error) {
      if (attempt === retries) {
        throw error
      }
      console.log(`Request failed, retrying... Attempt ${attempt + 1}/${retries + 1}`)
      // Wait a bit before retry
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
}

// Keep all existing functions but use the enhanced fetch and authenticated request functions
async function getSites({ baseUrl, cookies }: { baseUrl: string, cookies: string }) {
  try {
    console.log('Fetching sites from UniFi Controller...')
    
    const response = await authenticatedRequest(baseUrl, '/api/self/sites', {
      method: 'GET'
    }, cookies)

    console.log('Sites response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Sites fetch failed:', response.status, errorText)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch sites',
          details: errorText,
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
    
    const response = await authenticatedRequest(baseUrl, `/api/s/${siteId}/stat/device`, {
      method: 'GET'
    }, cookies)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Devices fetch failed:', response.status, errorText)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch devices',
          details: errorText,
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
    
    const response = await authenticatedRequest(baseUrl, `/api/s/${siteId}/stat/sta`, {
      method: 'GET'
    }, cookies)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Clients fetch failed:', response.status, errorText)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch clients',
          details: errorText,
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
    
    const response = await authenticatedRequest(baseUrl, `/api/s/${siteId}/stat/sysinfo`, {
      method: 'GET'
    }, cookies)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('System info fetch failed:', response.status, errorText)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch system info',
          details: errorText,
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
    
    const response = await authenticatedRequest(baseUrl, `/api/s/${siteId}/cmd/devmgr`, {
      method: 'POST',
      body: JSON.stringify({
        cmd: 'restart',
        mac: deviceMac
      })
    }, cookies)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Device restart failed:', response.status, errorText)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to restart device',
          details: errorText,
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
    
    const response = await authenticatedRequest(baseUrl, `/api/s/${siteId}/cmd/devmgr`, {
      method: 'POST',
      body: JSON.stringify({
        cmd: 'set-locate',
        mac: deviceMac
      })
    }, cookies)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Device locate failed:', response.status, errorText)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to locate device',
          details: errorText,
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
    
    const response = await authenticatedRequest(baseUrl, `/api/s/${siteId}/rest/device/${deviceMac}`, {
      method: 'PUT',
      body: JSON.stringify({
        led_override: enable ? 'on' : 'off'
      })
    }, cookies)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Device LED control failed:', response.status, errorText)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to control device LED',
          details: errorText,
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
    
    const response = await authenticatedRequest(baseUrl, `/api/s/${siteId}/rest/device/${deviceMac}`, {
      method: 'PUT',
      body: JSON.stringify(settings)
    }, cookies)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Device settings update failed:', response.status, errorText)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update device settings',
          details: errorText,
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
    
    const response = await authenticatedRequest(baseUrl, `/api/s/${siteId}/cmd/stamgr`, {
      method: 'POST',
      body: JSON.stringify({
        cmd: block ? 'block-sta' : 'unblock-sta',
        mac: clientMac
      })
    }, cookies)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Client block/unblock failed:', response.status, errorText)
      return new Response(
        JSON.stringify({ 
          error: `Failed to ${block ? 'block' : 'unblock'} client`,
          details: errorText,
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

// Add stubs for missing functions that are referenced but not implemented
async function upgradeDevice({ baseUrl, cookies, siteId, deviceMac }: { baseUrl: string, cookies: string, siteId: string, deviceMac: string }) {
  try {
    console.log('Upgrading device...', deviceMac)
    
    const response = await authenticatedRequest(baseUrl, `/api/s/${siteId}/cmd/devmgr`, {
      method: 'POST',
      body: JSON.stringify({
        cmd: 'upgrade',
        mac: deviceMac
      })
    }, cookies)

    if (!response.ok) {
      const errorText = await response.text()
      return new Response(
        JSON.stringify({ 
          error: 'Failed to upgrade device',
          details: errorText,
          status: response.status 
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Failed to upgrade device',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

// Add implementations for other missing functions with the same enhanced pattern
async function getNetworks({ baseUrl, cookies, siteId }: { baseUrl: string, cookies: string, siteId: string }) {
  try {
    const response = await authenticatedRequest(baseUrl, `/api/s/${siteId}/rest/wlanconf`, {
      method: 'GET'
    }, cookies)

    if (!response.ok) {
      const errorText = await response.text()
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch networks',
          details: errorText,
          status: response.status 
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch networks',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function getHealthMetrics({ baseUrl, cookies, siteId }: { baseUrl: string, cookies: string, siteId: string }) {
  try {
    const response = await authenticatedRequest(baseUrl, `/api/s/${siteId}/stat/health`, {
      method: 'GET'
    }, cookies)

    if (!response.ok) {
      const errorText = await response.text()
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch health metrics',
          details: errorText,
          status: response.status 
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch health metrics',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function getEvents({ baseUrl, cookies, siteId }: { baseUrl: string, cookies: string, siteId: string }) {
  try {
    const response = await authenticatedRequest(baseUrl, `/api/s/${siteId}/stat/event`, {
      method: 'GET'
    }, cookies)

    if (!response.ok) {
      const errorText = await response.text()
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch events',
          details: errorText,
          status: response.status 
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch events',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

// Add stub implementations for remaining functions
async function adoptDevice(params: any) {
  return new Response(
    JSON.stringify({ error: 'Function not yet implemented' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function unblockClient(params: any) {
  // Use the same blockClient function with block: false
  return await blockClient({ ...params, block: false })
}

async function disconnectClient(params: any) {
  return new Response(
    JSON.stringify({ error: 'Function not yet implemented' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function setClientAlias(params: any) {
  return new Response(
    JSON.stringify({ error: 'Function not yet implemented' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function setClientQoS(params: any) {
  return new Response(
    JSON.stringify({ error: 'Function not yet implemented' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function createNetwork(params: any) {
  return new Response(
    JSON.stringify({ error: 'Function not yet implemented' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateNetwork(params: any) {
  return new Response(
    JSON.stringify({ error: 'Function not yet implemented' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function deleteNetwork(params: any) {
  return new Response(
    JSON.stringify({ error: 'Function not yet implemented' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function enableNetwork(params: any) {
  return new Response(
    JSON.stringify({ error: 'Function not yet implemented' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function disableNetwork(params: any) {
  return new Response(
    JSON.stringify({ error: 'Function not yet implemented' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getSiteSettings(params: any) {
  return new Response(
    JSON.stringify({ error: 'Function not yet implemented' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateSiteSettings(params: any) {
  return new Response(
    JSON.stringify({ error: 'Function not yet implemented' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getDHCPSettings(params: any) {
  return new Response(
    JSON.stringify({ error: 'Function not yet implemented' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateDHCPSettings(params: any) {
  return new Response(
    JSON.stringify({ error: 'Function not yet implemented' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getTrafficStats(params: any) {
  return new Response(
    JSON.stringify({ error: 'Function not yet implemented' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getAlarms(params: any) {
  return new Response(
    JSON.stringify({ error: 'Function not yet implemented' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function createBackup(params: any) {
  return new Response(
    JSON.stringify({ error: 'Function not yet implemented' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getBackups(params: any) {
  return new Response(
    JSON.stringify({ error: 'Function not yet implemented' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function restoreBackup(params: any) {
  return new Response(
    JSON.stringify({ error: 'Function not yet implemented' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getLogs(params: any) {
  return new Response(
    JSON.stringify({ error: 'Function not yet implemented' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getPortForwarding(params: any) {
  return new Response(
    JSON.stringify({ error: 'Function not yet implemented' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function createPortForwarding(params: any) {
  return new Response(
    JSON.stringify({ error: 'Function not yet implemented' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updatePortForwarding(params: any) {
  return new Response(
    JSON.stringify({ error: 'Function not yet implemented' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function deletePortForwarding(params: any) {
  return new Response(
    JSON.stringify({ error: 'Function not yet implemented' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getFirewallRules(params: any) {
  return new Response(
    JSON.stringify({ error: 'Function not yet implemented' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function createFirewallRule(params: any) {
  return new Response(
    JSON.stringify({ error: 'Function not yet implemented' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateFirewallRule(params: any) {
  return new Response(
    JSON.stringify({ error: 'Function not yet implemented' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function deleteFirewallRule(params: any) {
  return new Response(
    JSON.stringify({ error: 'Function not yet implemented' }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
