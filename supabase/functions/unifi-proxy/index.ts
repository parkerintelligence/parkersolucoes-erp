
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
}

class UniFiController {
  private baseUrl: string;
  private ignoreSsl: boolean;

  constructor(baseUrl: string, ignoreSsl: boolean = true) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.ignoreSsl = ignoreSsl;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`Making request to: ${url}`);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      });

      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const text = await response.text();
        console.log(`Response error: ${text}`);
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data || data,
        meta: data.meta,
        cookies: response.headers.get('set-cookie'),
      };
    } catch (error) {
      console.error(`Request failed: ${error.message}`);
      
      if (error.message.includes('certificate') || error.message.includes('SSL')) {
        throw new Error(`SSL Certificate Error: ${error.message}. Consider using HTTP instead of HTTPS for local controllers.`);
      }
      
      if (error.message.includes('timeout') || error.message.includes('unreachable')) {
        throw new Error(`Connection timeout or unreachable: ${error.message}. Check if controller is accessible.`);
      }
      
      throw error;
    }
  }

  async pingController() {
    try {
      const response = await this.makeRequest('/status');
      return {
        success: true,
        details: 'Controller is responding',
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        details: error.message
      };
    }
  }

  async login(username: string, password: string) {
    try {
      const response = await this.makeRequest('/api/login', {
        method: 'POST',
        body: JSON.stringify({
          username,
          password,
          remember: false
        }),
      });

      return {
        success: true,
        cookies: response.cookies,
        data: response.data
      };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testConnection(username: string, password: string) {
    const tests = [];
    
    // Test 1: Basic connectivity
    const pingResult = await this.pingController();
    tests.push({
      name: 'Controller Connectivity',
      success: pingResult.success,
      details: pingResult.details
    });

    if (!pingResult.success) {
      return {
        timestamp: new Date().toISOString(),
        tests
      };
    }

    // Test 2: Authentication
    const loginResult = await this.login(username, password);
    tests.push({
      name: 'Authentication',
      success: loginResult.success,
      details: loginResult.success ? 'Authentication successful' : loginResult.error
    });

    // Test 3: API Access (if authenticated)
    if (loginResult.success && loginResult.cookies) {
      try {
        const sitesResult = await this.makeRequest('/api/self/sites', {
          headers: {
            'Cookie': loginResult.cookies
          }
        });
        
        tests.push({
          name: 'API Access',
          success: true,
          details: `Found ${sitesResult.data?.length || 0} sites`
        });
      } catch (error) {
        tests.push({
          name: 'API Access',
          success: false,
          details: error.message
        });
      }
    }

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
    const { action, baseUrl, ...params }: UniFiLoginRequest = await req.json();
    
    console.log(`Processing action: ${action} for baseUrl: ${baseUrl}`);
    
    if (!baseUrl) {
      throw new Error('Base URL is required');
    }

    const controller = new UniFiController(baseUrl, true);

    switch (action) {
      case 'pingController':
        const pingResult = await controller.pingController();
        return new Response(JSON.stringify(pingResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'testConnection':
        if (!params.username || !params.password) {
          throw new Error('Username and password are required for connection test');
        }
        const testResult = await controller.testConnection(params.username, params.password);
        return new Response(JSON.stringify({ success: true, diagnosis: testResult }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'diagnoseConnection':
        if (!params.username || !params.password) {
          throw new Error('Username and password are required for diagnosis');
        }
        const diagnosisResult = await controller.testConnection(params.username, params.password);
        return new Response(JSON.stringify({ success: true, diagnosis: diagnosisResult }), {
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
    console.error('Error processing request:', error);
    
    let errorType = 'unknown_error';
    if (error.message.includes('certificate') || error.message.includes('SSL')) {
      errorType = 'ssl_error';
    } else if (error.message.includes('timeout') || error.message.includes('unreachable')) {
      errorType = 'network_error';
    } else if (error.message.includes('credentials') || error.message.includes('authentication')) {
      errorType = 'auth_error';
    }

    return new Response(
      JSON.stringify({
        error: 'Connection failed',
        details: error.message,
        type: errorType
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
