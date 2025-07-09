
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
    console.log(`🔍 ${message}`);
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

    const endpoints = [
      `/instance/fetchInstances`,
      `/instance/connect/${instanceName}`,
      `/${instanceName}/instance/connectionState`,
      `/fetchInstances`
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
          this.addDebugLog(`✅ Instância verificada via ${endpoint}`);
          return { active: true };
        }
      } catch (error) {
        this.addDebugLog(`❌ Erro ao verificar instância via ${endpoint}: ${error}`);
      }
    }

    return { active: false, error: 'Não foi possível verificar o status da instância' };
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
          message: 'Configuração inválida da Evolution API',
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
          message: 'Número de telefone inválido',
          details: 'Use o formato: 5511999999999 ou 11999999999',
          logs: this.debugLogs
        }
      };
    }

    const integrationAny = this.integration as any;
    const instanceName = integrationAny.instance_name || 'main_instance';
    const baseUrl = this.normalizeUrl(this.integration.base_url);
    
    this.addDebugLog(`Configuração: Base URL: ${baseUrl}, Instância: ${instanceName}, Telefone: ${cleanPhoneNumber}`);

    // Endpoints corretos da Evolution API (baseado nos padrões mais comuns)
    const endpoints = [
      // Endpoints mais comuns da Evolution API v2
      `/message/sendText/${instanceName}`,
      `/sendMessage/${instanceName}`,
      `/${instanceName}/message/sendText`,
      `/${instanceName}/sendMessage`,
      
      // Endpoints da Evolution API v1
      `/api/sendText/${instanceName}`,
      `/api/sendMessage/${instanceName}`,
      
      // Endpoints sem instância específica
      `/message/sendText`,
      `/sendMessage`,
      `/api/sendText`,
      `/api/sendMessage`
    ];

    // Formatos de payload simplificados (focando nos que funcionam)
    const payloadFormats = [
      // Formato mais simples e comum
      {
        number: cleanPhoneNumber,
        text: message
      },
      // Formato com @s.whatsapp.net
      {
        number: `${cleanPhoneNumber}@s.whatsapp.net`,
        text: message
      },
      // Formato Evolution API v2
      {
        number: cleanPhoneNumber,
        textMessage: {
          text: message
        }
      }
    ];

    // Métodos de autenticação mais comuns
    const authMethods = [
      { 'apikey': this.integration.api_token },
      { 'Authorization': `Bearer ${this.integration.api_token}` },
      { 'x-api-key': this.integration.api_token }
    ];

    let lastError: EvolutionApiError | null = null;

    // Testar combinações mais prováveis primeiro
    for (const endpoint of endpoints) {
      const fullUrl = `${baseUrl}${endpoint}`;
      
      for (const payload of payloadFormats) {
        for (const authHeaders of authMethods) {
          try {
            const { response, responseData } = await this.sendWithAuthMethod(fullUrl, payload, authHeaders);
            
            // Verificar sucesso
            if (response.ok && responseData && !responseData.error) {
              this.addDebugLog(`✅ SUCESSO! Mensagem enviada via ${endpoint}`);
              return { success: true };
            }
            
            lastError = {
              message: `Falha no envio`,
              details: responseData?.message || responseData?.error || `Status ${response.status}`,
              endpoint: fullUrl,
              statusCode: response.status,
              logs: this.debugLogs
            };
            
            this.addDebugLog(`❌ Falhou: ${endpoint} - Status ${response.status}`);
            
          } catch (error) {
            lastError = {
              message: 'Erro de conexão',
              details: error instanceof Error ? error.message : 'Erro desconhecido',
              endpoint: fullUrl,
              logs: this.debugLogs
            };
            
            this.addDebugLog(`❌ Erro de rede: ${error}`);
          }
          
          // Pequeno delay para evitar rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    return { 
      success: false, 
      error: lastError || {
        message: 'Não foi possível enviar a mensagem',
        details: 'Todas as configurações testadas falharam. Verifique se a instância está ativa.',
        logs: this.debugLogs
      }
    };
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    const instanceStatus = await this.checkInstanceStatus();
    
    if (!instanceStatus.active) {
      return {
        success: false,
        error: instanceStatus.error || 'Instância não está ativa'
      };
    }

    // Tentar enviar uma mensagem de teste para um número fictício
    const testResult = await this.sendMessage('5511999999999', 'Teste de conexão');
    
    if (testResult.success) {
      return { success: true };
    } else {
      return {
        success: false,
        error: testResult.error?.message || 'Falha no teste de conexão'
      };
    }
  }
}
