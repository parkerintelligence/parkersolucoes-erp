import { Integration } from '@/hooks/useIntegrations';

export interface EvolutionApiMessage {
  number: string;
  text: string;
}

export interface EvolutionApiResponse {
  key?: {
    id: string;
    remoteJid: string;
  };
  message?: any;
  error?: string;
}

export interface EvolutionApiError {
  message: string;
  details?: string;
  endpoint?: string;
  statusCode?: number;
  logs?: string[];
}

export class EvolutionApiService {
  private integration: Integration;
  private debugLogs: string[] = [];
  
  constructor(integration: Integration) {
    this.integration = integration;
  }

  private addDebugLog(message: string) {
    this.debugLogs.push(`[${new Date().toISOString()}] ${message}`);
    console.log(`🔍 Evolution API: ${message}`);
  }

  private normalizeUrl(baseUrl: string): string {
    let cleanUrl = baseUrl.replace(/\/+$/, '');
    
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }
    
    return cleanUrl;
  }

  private cleanPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.length === 11 && !cleaned.startsWith('55')) {
      return `55${cleaned}`;
    }
    
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      return cleaned;
    }
    
    return cleaned;
  }

  private async validateConfiguration(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!this.integration.api_token) {
      errors.push('Token da API não configurado');
    }

    if (!this.integration.base_url) {
      errors.push('URL base não configurada');
    }

    const integrationAny = this.integration as any;
    if (!integrationAny.instance_name) {
      errors.push('Nome da instância não configurado');
    }

    return { valid: errors.length === 0, errors };
  }

  async checkInstanceStatus(): Promise<{ active: boolean; error?: string }> {
    const configValidation = await this.validateConfiguration();
    if (!configValidation.valid) {
      return {
        active: false,
        error: `Configuração inválida: ${configValidation.errors.join(', ')}`
      };
    }

    const integrationAny = this.integration as any;
    const instanceName = integrationAny.instance_name || 'main_instance';
    const baseUrl = this.normalizeUrl(this.integration.base_url);

    // Optimized endpoints for webhook usage
    const endpoints = [
      `/${instanceName}/instance/connectionState`,
      `/instance/connectionState/${instanceName}`,
      `/instance/fetchInstances`
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.integration.api_token || '',
          },
        });

        if (response.ok) {
          const data = await response.json();
          this.addDebugLog(`✅ Instance verified via ${endpoint}`);
          return { active: true };
        }
      } catch (error) {
        this.addDebugLog(`❌ Error checking instance via ${endpoint}: ${error}`);
      }
    }

    return { active: false, error: 'Unable to verify instance status' };
  }

  private async sendWithAuthMethod(
    url: string, 
    payload: any, 
    authHeaders: Record<string, string>
  ): Promise<{ response: Response; responseData: any }> {
    this.addDebugLog(`Tentando enviar para: ${url}`);
    this.addDebugLog(`Payload: ${JSON.stringify(payload, null, 2)}`);
    this.addDebugLog(`Headers: ${JSON.stringify(authHeaders, null, 2)}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });

      this.addDebugLog(`Status HTTP: ${response.status}`);

      let responseData;
      try {
        responseData = await response.json();
        this.addDebugLog(`Resposta: ${JSON.stringify(responseData, null, 2)}`);
      } catch (e) {
        const textResponse = await response.text();
        this.addDebugLog(`Resposta em texto: ${textResponse}`);
        responseData = { error: textResponse };
      }

      return { response, responseData };
    } catch (error) {
      this.addDebugLog(`Erro de rede: ${error}`);
      throw error;
    }
  }

  async getInstanceInfo(): Promise<{ 
    connected: boolean; 
    qrCode?: string; 
    instanceName: string;
  }> {
    const configValidation = await this.validateConfiguration();
    if (!configValidation.valid) {
      throw new Error(`Invalid configuration: ${configValidation.errors.join(', ')}`);
    }

    const integrationAny = this.integration as any;
    const instanceName = integrationAny.instance_name || 'main_instance';
    const baseUrl = this.normalizeUrl(this.integration.base_url);

    try {
      const response = await fetch(`${baseUrl}/${instanceName}/instance/connect`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.integration.api_token || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          connected: data.instance?.state === 'open',
          qrCode: data.qrcode?.base64,
          instanceName: instanceName
        };
      }
    } catch (error) {
      this.addDebugLog(`Error getting instance info: ${error}`);
    }

    return {
      connected: false,
      instanceName: instanceName
    };
  }

  async getConversations(): Promise<any[]> {
    const configValidation = await this.validateConfiguration();
    if (!configValidation.valid) {
      return [];
    }

    const integrationAny = this.integration as any;
    const instanceName = integrationAny.instance_name || 'main_instance';
    const baseUrl = this.normalizeUrl(this.integration.base_url);

    try {
      const response = await fetch(`${baseUrl}/${instanceName}/chat/findChats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.integration.api_token || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data || [];
      }
    } catch (error) {
      this.addDebugLog(`Error getting conversations: ${error}`);
    }

    return [];
  }

  async getMessages(chatId: string): Promise<any[]> {
    const configValidation = await this.validateConfiguration();
    if (!configValidation.valid) {
      return [];
    }

    const integrationAny = this.integration as any;
    const instanceName = integrationAny.instance_name || 'main_instance';
    const baseUrl = this.normalizeUrl(this.integration.base_url);

    try {
      const response = await fetch(`${baseUrl}/${instanceName}/chat/findMessages/${chatId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.integration.api_token || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data || [];
      }
    } catch (error) {
      this.addDebugLog(`Error getting messages: ${error}`);
    }

    return [];
  }

  async disconnectInstance(): Promise<{ success: boolean; error?: string }> {
    const configValidation = await this.validateConfiguration();
    if (!configValidation.valid) {
      return {
        success: false,
        error: configValidation.errors.join(', ')
      };
    }

    const integrationAny = this.integration as any;
    const instanceName = integrationAny.instance_name || 'main_instance';
    const baseUrl = this.normalizeUrl(this.integration.base_url);

    try {
      const response = await fetch(`${baseUrl}/${instanceName}/instance/logout`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.integration.api_token || '',
        },
      });

      if (response.ok) {
        this.addDebugLog('Instance disconnected successfully');
        return { success: true };
      }
    } catch (error) {
      this.addDebugLog(`Error disconnecting instance: ${error}`);
    }

    return {
      success: false,
      error: 'Failed to disconnect instance'
    };
  }

  async sendMessage(phoneNumber: string, message: string): Promise<{ 
    success: boolean; 
    error?: EvolutionApiError 
  }> {
    this.debugLogs = [];
    
    const configValidation = await this.validateConfiguration();
    if (!configValidation.valid) {
      return {
        success: false,
        error: {
          message: 'Invalid Evolution API configuration',
          details: configValidation.errors.join(', '),
          logs: this.debugLogs
        }
      };
    }

    const cleanPhoneNumber = this.cleanPhoneNumber(phoneNumber);
    
    if (cleanPhoneNumber.length < 10 || cleanPhoneNumber.length > 15) {
      return {
        success: false,
        error: {
          message: 'Invalid phone number',
          details: 'Use format: 5511999999999 or 11999999999',
          logs: this.debugLogs
        }
      };
    }

    const integrationAny = this.integration as any;
    const instanceName = integrationAny.instance_name || 'main_instance';
    const baseUrl = this.normalizeUrl(this.integration.base_url);
    
    this.addDebugLog(`Config - Base URL: ${baseUrl}, Instance: ${instanceName}, Phone: ${cleanPhoneNumber}`);

    // Optimized endpoints for webhook messaging (most reliable first)
    const endpoints = [
      `/${instanceName}/message/sendText`,
      `/message/sendText/${instanceName}`,
      `/${instanceName}/sendMessage`,
      `/sendMessage/${instanceName}`
    ];

    // Optimized payload formats (most compatible first)
    const payloadFormats = [
      {
        number: cleanPhoneNumber,
        text: message
      },
      {
        number: `${cleanPhoneNumber}@s.whatsapp.net`,
        text: message
      }
    ];

    // Authentication methods (most common first)
    const authMethods = [
      { 'apikey': this.integration.api_token },
      { 'Authorization': `Bearer ${this.integration.api_token}` }
    ];

    let lastError: EvolutionApiError | null = null;

    // Try most reliable combinations first for webhook usage
    for (const endpoint of endpoints) {
      const fullUrl = `${baseUrl}${endpoint}`;
      
      for (const payload of payloadFormats) {
        for (const authHeaders of authMethods) {
          try {
            const { response, responseData } = await this.sendWithAuthMethod(fullUrl, payload, authHeaders);
            
            // Check for success
            if (response.ok && responseData && !responseData.error) {
              this.addDebugLog(`✅ SUCCESS! Message sent via ${endpoint}`);
              return { success: true };
            }
            
            lastError = {
              message: `Send failed`,
              details: responseData?.message || responseData?.error || `Status ${response.status}`,
              endpoint: fullUrl,
              statusCode: response.status,
              logs: this.debugLogs
            };
            
            this.addDebugLog(`❌ Failed: ${endpoint} - Status ${response.status}`);
            
          } catch (error) {
            lastError = {
              message: 'Connection error',
              details: error instanceof Error ? error.message : 'Unknown error',
              endpoint: fullUrl,
              logs: this.debugLogs
            };
            
            this.addDebugLog(`❌ Network error: ${error}`);
          }
          
          // Small delay to avoid rate limiting in webhook context
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    }

    return { 
      success: false, 
      error: lastError || {
        message: 'Unable to send message',
        details: 'All configurations tested failed. Check if instance is active.',
        logs: this.debugLogs
      }
    };
  }

  // Optimized for webhook usage - faster connection test
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    this.addDebugLog('🧪 Testing connection for webhook usage...');
    
    const instanceStatus = await this.checkInstanceStatus();
    
    if (!instanceStatus.active) {
      return {
        success: false,
        error: instanceStatus.error || 'Instance is not active'
      };
    }

    this.addDebugLog('✅ Connection test successful');
    return { success: true };
  }

  // Get debug logs for webhook troubleshooting
  getDebugLogs(): string[] {
    return [...this.debugLogs];
  }

  // Clear debug logs
  clearDebugLogs(): void {
    this.debugLogs = [];
  }
}
