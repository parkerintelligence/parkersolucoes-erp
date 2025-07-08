
import { Integration } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';

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
    this.debugLogs = []; // Reset logs
    
    // Validar configuração
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

    // Limpar e validar número de telefone
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

    // Endpoints mais específicos da Evolution API
    const endpoints = [
      // Evolution API v2 - endpoints mais comuns
      `/message/sendText/${instanceName}`,
      `/api/v2/message/sendText/${instanceName}`,
      `/${instanceName}/message/sendText`,
      `/v2/message/sendText/${instanceName}`,
      
      // Evolution API v1 - endpoints clássicos
      `/api/sendText/${instanceName}`,
      `/sendText/${instanceName}`,
      `/${instanceName}/sendText`,
      `/v1/sendText/${instanceName}`,
      
      // Endpoints alternativos
      `/message/text/${instanceName}`,
      `/api/v1/message/text/${instanceName}`,
      `/text/${instanceName}`,
      `/${instanceName}/text`,
      
      // Endpoints sem instância (algumas APIs)
      `/message/sendText`,
      `/api/sendText`,
      `/sendText`,
      `/text`
    ];

    // Formatos de payload para Evolution API
    const payloadFormats = [
      // Formato Evolution API v2 completo
      {
        number: `${cleanPhoneNumber}@s.whatsapp.net`,
        options: {
          delay: 1200,
          presence: "composing"
        },
        textMessage: {
          text: message
        }
      },
      // Formato Evolution API v1 simples
      {
        number: cleanPhoneNumber,
        text: message
      },
      // Formato com textMessage
      {
        number: cleanPhoneNumber,
        textMessage: {
          text: message
        }
      },
      // Formato com remoteJid
      {
        remoteJid: `${cleanPhoneNumber}@s.whatsapp.net`,
        message: {
          text: message
        }
      },
      // Formato com to
      {
        to: `${cleanPhoneNumber}@s.whatsapp.net`,
        body: message,
        type: "text"
      }
    ];

    // Métodos de autenticação
    const authMethods = [
      { 'apikey': this.integration.api_token },
      { 'Api-Key': this.integration.api_token },
      { 'Authorization': `Bearer ${this.integration.api_token}` },
      { 'x-api-key': this.integration.api_token },
      { 'token': this.integration.api_token }
    ];

    let lastError: EvolutionApiError | null = null;

    // Testar todas as combinações
    for (const endpoint of endpoints) {
      const fullUrl = `${baseUrl}${endpoint}`;
      
      for (const payload of payloadFormats) {
        for (const authHeaders of authMethods) {
          try {
            const payloadType = Object.keys(payload)[0];
            const authType = Object.keys(authHeaders)[0];
            
            this.addDebugLog(`Testando: ${endpoint} | Payload: ${payloadType} | Auth: ${authType}`);
            
            const { response, responseData } = await this.sendWithAuthMethod(fullUrl, payload, authHeaders);
            
            // Verificar sucesso
            if (response.ok && responseData && !responseData.error) {
              this.addDebugLog(`✅ SUCESSO! Configuração funcional encontrada`);
              return { success: true };
            }
            
            // Capturar último erro para mostrar ao usuário
            lastError = {
              message: `Falha no envio`,
              details: responseData?.message || responseData?.error || 'Erro desconhecido',
              endpoint: fullUrl,
              statusCode: response.status,
              logs: this.debugLogs
            };
            
            this.addDebugLog(`❌ Falhou: Status ${response.status}, Erro: ${responseData?.error || responseData?.message || 'Desconhecido'}`);
            
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
        details: 'Todas as configurações testadas falharam',
        logs: this.debugLogs
      }
    };
  }
}
