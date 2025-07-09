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

  async checkInstanceExists(): Promise<boolean> {
    const configValidation = await this.validateConfiguration();
    if (!configValidation.valid) {
      return false;
    }

    const integrationAny = this.integration as any;
    const instanceName = integrationAny.instance_name || 'main_instance';
    const baseUrl = this.normalizeUrl(this.integration.base_url);

    try {
      this.addDebugLog(`Verificando se instância '${instanceName}' existe...`);
      
      const response = await fetch(`${baseUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.integration.api_token || '',
        },
      });

      if (response.ok) {
        const instances = await response.json();
        const instanceExists = Array.isArray(instances) && 
          instances.some((instance: any) => instance.instanceName === instanceName);
        
        this.addDebugLog(`Instância existe: ${instanceExists}`);
        return instanceExists;
      }
    } catch (error) {
      this.addDebugLog(`Erro ao verificar instância: ${error}`);
    }

    return false;
  }

  async createInstance(): Promise<{ success: boolean; qrCode?: string; error?: string }> {
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
      this.addDebugLog(`Criando nova instância '${instanceName}'...`);

      const payload = {
        instanceName: instanceName,
        token: this.integration.api_token,
        qrcode: true,
        number: this.integration.phone_number || '',
        typebot: false,
        chatwoot_account_id: null,
        chatwoot_token: null,
        chatwoot_url: null,
        chatwoot_sign_msg: false,
        chatwoot_reopen_conversation: false,
        chatwoot_conversation_pending: false
      };

      const response = await fetch(`${baseUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.integration.api_token || '',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        this.addDebugLog(`Instância criada com sucesso`);
        
        return {
          success: true,
          qrCode: data.qrcode?.base64 || data.base64
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        this.addDebugLog(`Erro ao criar instância: ${response.status} - ${JSON.stringify(errorData)}`);
        
        return {
          success: false,
          error: errorData.message || `Erro HTTP ${response.status}`
        };
      }
    } catch (error) {
      this.addDebugLog(`Erro de rede ao criar instância: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async getQRCode(): Promise<{ success: boolean; qrCode?: string; error?: string }> {
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
      this.addDebugLog(`Obtendo QR Code para instância '${instanceName}'...`);

      const response = await fetch(`${baseUrl}/instance/qrcode/${instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.integration.api_token || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.addDebugLog(`QR Code obtido com sucesso`);
        
        return {
          success: true,
          qrCode: data.qrcode?.base64 || data.base64
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        this.addDebugLog(`Erro ao obter QR Code: ${response.status} - ${JSON.stringify(errorData)}`);
        
        return {
          success: false,
          error: errorData.message || `Erro HTTP ${response.status}`
        };
      }
    } catch (error) {
      this.addDebugLog(`Erro de rede ao obter QR Code: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
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

    try {
      this.addDebugLog(`Verificando status da instância '${instanceName}'...`);

      const response = await fetch(`${baseUrl}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.integration.api_token || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const isActive = data.instance?.state === 'open';
        this.addDebugLog(`Status da instância: ${data.instance?.state} (Ativo: ${isActive})`);
        
        return { active: isActive };
      } else {
        this.addDebugLog(`Erro ao verificar status: ${response.status}`);
        return { active: false, error: `Erro HTTP ${response.status}` };
      }
    } catch (error) {
      this.addDebugLog(`Erro de rede ao verificar status: ${error}`);
      return { active: false, error: 'Erro de conexão' };
    }
  }

  async getInstanceInfo(): Promise<{ 
    connected: boolean; 
    qrCode?: string; 
    instanceName: string;
    error?: string;
  }> {
    const configValidation = await this.validateConfiguration();
    if (!configValidation.valid) {
      return {
        connected: false,
        instanceName: '',
        error: `Configuração inválida: ${configValidation.errors.join(', ')}`
      };
    }

    const integrationAny = this.integration as any;
    const instanceName = integrationAny.instance_name || 'main_instance';

    try {
      // Primeiro, verificar se a instância existe
      const instanceExists = await this.checkInstanceExists();
      
      if (!instanceExists) {
        this.addDebugLog('Instância não existe, criando nova...');
        const createResult = await this.createInstance();
        
        if (createResult.success) {
          return {
            connected: false,
            qrCode: createResult.qrCode,
            instanceName: instanceName
          };
        } else {
          return {
            connected: false,
            instanceName: instanceName,
            error: createResult.error
          };
        }
      }

      // Verificar status da conexão
      const statusResult = await this.checkInstanceStatus();
      
      if (statusResult.active) {
        return {
          connected: true,
          instanceName: instanceName
        };
      } else {
        // Se não está conectado, obter QR Code
        const qrResult = await this.getQRCode();
        
        return {
          connected: false,
          qrCode: qrResult.success ? qrResult.qrCode : undefined,
          instanceName: instanceName,
          error: qrResult.success ? undefined : qrResult.error
        };
      }
    } catch (error) {
      this.addDebugLog(`Erro ao obter informações da instância: ${error}`);
      return {
        connected: false,
        instanceName: instanceName,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
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
      const response = await fetch(`${baseUrl}/instance/logout/${instanceName}`, {
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

    const endpoints = [
      `/${instanceName}/message/sendText`,
      `/message/sendText/${instanceName}`,
      `/${instanceName}/sendMessage`,
      `/sendMessage/${instanceName}`
    ];

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

    const authMethods = [
      { 'apikey': this.integration.api_token },
      { 'Authorization': `Bearer ${this.integration.api_token}` }
    ];

    let lastError: EvolutionApiError | null = null;

    for (const endpoint of endpoints) {
      const fullUrl = `${baseUrl}${endpoint}`;
      
      for (const payload of payloadFormats) {
        for (const authHeaders of authMethods) {
          try {
            const { response, responseData } = await this.sendWithAuthMethod(fullUrl, payload, authHeaders);
            
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

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    this.addDebugLog('🧪 Testing connection...');
    
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

  getDebugLogs(): string[] {
    return [...this.debugLogs];
  }

  clearDebugLogs(): void {
    this.debugLogs = [];
  }
}
