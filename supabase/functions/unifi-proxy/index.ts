import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UniFiLoginRequest {
  action: string;
  baseUrl: string;
  username?: string;
  password?: string;
  cookies?: string;
  siteId?: string;
  deviceMac?: string;
  clientMac?: string;
  networkId?: string;
  networkData?: any;
  settings?: any;
  block?: boolean;
  enable?: boolean;
  alias?: string;
  ignoreSsl?: boolean;
}

class UniFiController {
  private baseUrl: string;
  private ignoreSsl: boolean;

  constructor(baseUrl: string, ignoreSsl: boolean = true) {
    // Remove trailing slashes and normalize URL
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.ignoreSsl = ignoreSsl;
    
    console.log(`UniFi Controller initialized: ${this.baseUrl}, ignoreSsl: ${this.ignoreSsl}`);
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}, retryWithHttp: boolean = true) {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`Making request to: ${url}`);
    console.log(`Request options:`, { 
      method: options.method || 'GET', 
      hasBody: !!options.body,
      ignoreSsl: this.ignoreSsl 
    });
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'UniFi-API-Client/1.0',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      console.log(`Response status: ${response.status} ${response.statusText}`);
      console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const text = await response.text();
        console.log(`Response error body: ${text}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${text}`);
      }

      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log(`Response data:`, data);
      } else {
        const text = await response.text();
        console.log(`Response text:`, text);
        // Try to parse as JSON anyway
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }
      }

      return {
        success: true,
        data: data.data || data,
        meta: data.meta,
        cookies: response.headers.get('set-cookie'),
      };
    } catch (error) {
      console.error(`Request failed for ${url}:`, error.message);
      
      // Enhanced error handling with specific suggestions
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after 15 seconds. Controller may be unreachable or overloaded.`);
      }
      
      if (error.message.includes('certificate') || error.message.includes('SSL') || error.message.includes('TLS')) {
        const httpsUrl = this.baseUrl.startsWith('https://');
        if (httpsUrl && retryWithHttp) {
          console.log('SSL error detected, attempting HTTP fallback...');
          const httpBaseUrl = this.baseUrl.replace('https://', 'http://').replace(':8443', ':8080');
          const httpController = new UniFiController(httpBaseUrl, this.ignoreSsl);
          return await httpController.makeRequest(endpoint, options, false);
        }
        throw new Error(`SSL Certificate Error: ${error.message}. Try using HTTP instead of HTTPS for local controllers, or enable "Ignore SSL" option.`);
      }
      
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        throw new Error(`Network Error: Cannot reach controller at ${this.baseUrl}. Check if the IP address and port are correct.`);
      }
      
      if (error.message.includes('timeout')) {
        throw new Error(`Connection timeout: Controller at ${this.baseUrl} is not responding. Verify it's online and accessible.`);
      }
      
      throw error;
    }
  }

  async pingController() {
    try {
      console.log('Starting ping test...');
      
      // Try a simple endpoint first
      const response = await this.makeRequest('/status');
      return {
        success: true,
        details: 'Controller is responding',
        data: response.data
      };
    } catch (error) {
      console.error('Ping failed:', error.message);
      return {
        success: false,
        details: error.message,
        suggestion: this.getSuggestionForError(error.message)
      };
    }
  }

  private getSuggestionForError(errorMessage: string): string {
    if (errorMessage.includes('SSL') || errorMessage.includes('certificate')) {
      return 'Try using HTTP instead of HTTPS, or enable "Ignore SSL errors" option';
    }
    if (errorMessage.includes('timeout') || errorMessage.includes('unreachable')) {
      return 'Verify controller IP address, port, and network connectivity';
    }
    if (errorMessage.includes('8443')) {
      return 'For local controllers, try port 8080 with HTTP instead of 8443 with HTTPS';
    }
    return 'Check controller configuration and network settings';
  }

  async login(username: string, password: string) {
    try {
      console.log(`Attempting login for user: ${username}`);
      
      const response = await this.makeRequest('/api/login', {
        method: 'POST',
        body: JSON.stringify({
          username,
          password,
          remember: false
        }),
      });

      console.log('Login successful');
      return {
        success: true,
        cookies: response.cookies,
        data: response.data
      };
    } catch (error) {
      console.error('Login failed:', error.message);
      return {
        success: false,
        error: error.message,
        suggestion: error.message.includes('401') || error.message.includes('403') 
          ? 'Check username and password' 
          : this.getSuggestionForError(error.message)
      };
    }
  }

  async testConnection(username: string, password: string) {
    const tests = [];
    
    console.log('=== Starting comprehensive connection test ===');
    
    // Test 1: URL Format Validation
    try {
      new URL(this.baseUrl);
      tests.push({
        name: 'URL Format',
        success: true,
        details: 'URL format is valid'
      });
    } catch {
      tests.push({
        name: 'URL Format',
        success: false,
        details: 'Invalid URL format',
        suggestion: 'Use format: https://controller-ip:8443 or http://controller-ip:8080'
      });
      return { timestamp: new Date().toISOString(), tests };
    }

    // Test 2: Basic connectivity
    const pingResult = await this.pingController();
    tests.push({
      name: 'Controller Connectivity',
      success: pingResult.success,
      details: pingResult.details,
      suggestion: pingResult.suggestion
    });

    if (!pingResult.success) {
      return { timestamp: new Date().toISOString(), tests };
    }

    // Test 3: Authentication
    const loginResult = await this.login(username, password);
    tests.push({
      name: 'Authentication',
      success: loginResult.success,
      details: loginResult.success ? 'Authentication successful' : loginResult.error,
      suggestion: loginResult.suggestion
    });

    // Test 4: API Access (if authenticated)
    if (loginResult.success && loginResult.cookies) {
      try {
        const sitesResult = await this.makeRequest('/api/self/sites', {
          headers: {
            'Cookie': loginResult.cookies
          }
        });
        
        const siteCount = sitesResult.data?.length || 0;
        tests.push({
          name: 'API Access',
          success: true,
          details: `Found ${siteCount} sites`,
          suggestion: siteCount === 0 ? 'No sites found - check user permissions' : undefined
        });
      } catch (error) {
        tests.push({
          name: 'API Access',
          success: false,
          details: error.message,
          suggestion: 'API access failed - check user permissions and controller version'
        });
      }
    }

    console.log('=== Connection test completed ===');
    return {
      timestamp: new Date().toISOString(),
      tests
    };
  }

  async getSites(cookies: string) {
    return await this.makeRequest('/api/self/sites', {
      headers: { 'Cookie': cookies }
    });
  }

  async getDevices(cookies: string, siteId: string) {
    return await this.makeRequest(`/api/s/${siteId}/stat/device`, {
      headers: { 'Cookie': cookies }
    });
  }

  async getClients(cookies: string, siteId: string) {
    return await this.makeRequest(`/api/s/${siteId}/stat/sta`, {
      headers: { 'Cookie': cookies }
    });
  }

  async getSystemInfo(cookies: string, siteId: string) {
    return await this.makeRequest(`/api/s/${siteId}/stat/sysinfo`, {
      headers: { 'Cookie': cookies }
    });
  }

  async getNetworks(cookies: string, siteId: string) {
    return await this.makeRequest(`/api/s/${siteId}/rest/wlanconf`, {
      headers: { 'Cookie': cookies }
    });
  }

  async getHealthMetrics(cookies: string, siteId: string) {
    return await this.makeRequest(`/api/s/${siteId}/stat/health`, {
      headers: { 'Cookie': cookies }
    });
  }

  async getEvents(cookies: string, siteId: string) {
    return await this.makeRequest(`/api/s/${siteId}/stat/event?_limit=50`, {
      headers: { 'Cookie': cookies }
    });
  }

  async restartDevice(cookies: string, siteId: string, deviceMac: string) {
    return await this.makeRequest(`/api/s/${siteId}/cmd/devmgr`, {
      method: 'POST',
      headers: { 'Cookie': cookies },
      body: JSON.stringify({
        cmd: 'restart',
        mac: deviceMac
      })
    });
  }

  async blockClient(cookies: string, siteId: string, clientMac: string, block: boolean) {
    return await this.makeRequest(`/api/s/${siteId}/cmd/stamgr`, {
      method: 'POST',
      headers: { 'Cookie': cookies },
      body: JSON.stringify({
        cmd: block ? 'block-sta' : 'unblock-sta',
        mac: clientMac
      })
    });
  }

  async locateDevice(cookies: string, siteId: string, deviceMac: string) {
    return await this.makeRequest(`/api/s/${siteId}/cmd/devmgr`, {
      method: 'POST',
      headers: { 'Cookie': cookies },
      body: JSON.stringify({
        cmd: 'set-locate',
        mac: deviceMac
      })
    });
  }

  async setDeviceLED(cookies: string, siteId: string, deviceMac: string, enable: boolean) {
    return await this.makeRequest(`/api/s/${siteId}/rest/device/${deviceMac}`, {
      method: 'PUT',
      headers: { 'Cookie': cookies },
      body: JSON.stringify({
        led_override: enable ? 'on' : 'off'
      })
    });
  }

  async createNetwork(cookies: string, siteId: string, networkData: any) {
    return await this.makeRequest(`/api/s/${siteId}/rest/wlanconf`, {
      method: 'POST',
      headers: { 'Cookie': cookies },
      body: JSON.stringify(networkData)
    });
  }

  async updateNetwork(cookies: string, siteId: string, networkId: string, networkData: any) {
    return await this.makeRequest(`/api/s/${siteId}/rest/wlanconf/${networkId}`, {
      method: 'PUT',
      headers: { 'Cookie': cookies },
      body: JSON.stringify(networkData)
    });
  }

  async deleteNetwork(cookies: string, siteId: string, networkId: string) {
    return await this.makeRequest(`/api/s/${siteId}/rest/wlanconf/${networkId}`, {
      method: 'DELETE',
      headers: { 'Cookie': cookies }
    });
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, baseUrl, ignoreSsl = true, ...params }: UniFiLoginRequest = await req.json();
    
    console.log(`=== Processing UniFi Action: ${action} ===`);
    console.log(`Base URL: ${baseUrl}`);
    console.log(`Ignore SSL: ${ignoreSsl}`);
    console.log(`Additional params:`, Object.keys(params));
    
    if (!baseUrl) {
      throw new Error('Base URL is required');
    }

    const controller = new UniFiController(baseUrl, ignoreSsl);

    switch (action) {
      case 'pingController':
        const pingResult = await controller.pingController();
        return new Response(JSON.stringify(pingResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'testConnection':
      case 'diagnoseConnection':
        if (!params.username || !params.password) {
          throw new Error('Username and password are required for connection test');
        }
        const testResult = await controller.testConnection(params.username, params.password);
        return new Response(JSON.stringify({ success: true, diagnosis: testResult }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'login':
        if (!params.username || !params.password) {
          throw new Error('Username and password are required');
        }
        const loginResult = await controller.login(params.username, params.password);
        return new Response(JSON.stringify(loginResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'getSites':
        if (!params.cookies) {
          throw new Error('Authentication cookies are required');
        }
        const sitesResult = await controller.getSites(params.cookies);
        return new Response(JSON.stringify(sitesResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'getDevices':
        if (!params.cookies || !params.siteId) {
          throw new Error('Authentication cookies and site ID are required');
        }
        const devicesResult = await controller.getDevices(params.cookies, params.siteId);
        return new Response(JSON.stringify(devicesResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'getClients':
        if (!params.cookies || !params.siteId) {
          throw new Error('Authentication cookies and site ID are required');
        }
        const clientsResult = await controller.getClients(params.cookies, params.siteId);
        return new Response(JSON.stringify(clientsResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'getSystemInfo':
        if (!params.cookies || !params.siteId) {
          throw new Error('Authentication cookies and site ID are required');
        }
        const systemInfoResult = await controller.getSystemInfo(params.cookies, params.siteId);
        return new Response(JSON.stringify(systemInfoResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'getNetworks':
        if (!params.cookies || !params.siteId) {
          throw new Error('Authentication cookies and site ID are required');
        }
        const networksResult = await controller.getNetworks(params.cookies, params.siteId);
        return new Response(JSON.stringify(networksResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'getHealthMetrics':
        if (!params.cookies || !params.siteId) {
          throw new Error('Authentication cookies and site ID are required');
        }
        const healthResult = await controller.getHealthMetrics(params.cookies, params.siteId);
        return new Response(JSON.stringify(healthResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'getEvents':
        if (!params.cookies || !params.siteId) {
          throw new Error('Authentication cookies and site ID are required');
        }
        const eventsResult = await controller.getEvents(params.cookies, params.siteId);
        return new Response(JSON.stringify(eventsResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'restartDevice':
        if (!params.cookies || !params.siteId || !params.deviceMac) {
          throw new Error('Authentication cookies, site ID, and device MAC are required');
        }
        const restartResult = await controller.restartDevice(params.cookies, params.siteId, params.deviceMac);
        return new Response(JSON.stringify(restartResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'blockClient':
        if (!params.cookies || !params.siteId || !params.clientMac || params.block === undefined) {
          throw new Error('Authentication cookies, site ID, client MAC, and block status are required');
        }
        const blockResult = await controller.blockClient(params.cookies, params.siteId, params.clientMac, params.block);
        return new Response(JSON.stringify(blockResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'locateDevice':
        if (!params.cookies || !params.siteId || !params.deviceMac) {
          throw new Error('Authentication cookies, site ID, and device MAC are required');
        }
        const locateResult = await controller.locateDevice(params.cookies, params.siteId, params.deviceMac);
        return new Response(JSON.stringify(locateResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'setDeviceLED':
        if (!params.cookies || !params.siteId || !params.deviceMac || params.enable === undefined) {
          throw new Error('Authentication cookies, site ID, device MAC, and enable status are required');
        }
        const ledResult = await controller.setDeviceLED(params.cookies, params.siteId, params.deviceMac, params.enable);
        return new Response(JSON.stringify(ledResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'createNetwork':
        if (!params.cookies || !params.siteId || !params.networkData) {
          throw new Error('Authentication cookies, site ID, and network data are required');
        }
        const createResult = await controller.createNetwork(params.cookies, params.siteId, params.networkData);
        return new Response(JSON.stringify(createResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'updateNetwork':
        if (!params.cookies || !params.siteId || !params.networkId || !params.networkData) {
          throw new Error('Authentication cookies, site ID, network ID, and network data are required');
        }
        const updateResult = await controller.updateNetwork(params.cookies, params.siteId, params.networkId, params.networkData);
        return new Response(JSON.stringify(updateResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'deleteNetwork':
        if (!params.cookies || !params.siteId || !params.networkId) {
          throw new Error('Authentication cookies, site ID, and network ID are required');
        }
        const deleteResult = await controller.deleteNetwork(params.cookies, params.siteId, params.networkId);
        return new Response(JSON.stringify(deleteResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('=== Error processing request ===', error);
    
    let errorType = 'unknown_error';
    let suggestion = 'Check controller configuration and try again';
    
    if (error.message.includes('certificate') || error.message.includes('SSL')) {
      errorType = 'ssl_error';
      suggestion = 'Try using HTTP instead of HTTPS, or enable "Ignore SSL errors" option';
    } else if (error.message.includes('timeout') || error.message.includes('unreachable')) {
      errorType = 'network_error';
      suggestion = 'Check if controller IP and port are correct and controller is online';
    } else if (error.message.includes('credentials') || error.message.includes('authentication') || error.message.includes('401')) {
      errorType = 'auth_error';
      suggestion = 'Verify username and password are correct';
    }

    return new Response(
      JSON.stringify({
        error: 'Connection failed',
        details: error.message,
        type: errorType,
        suggestion
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
