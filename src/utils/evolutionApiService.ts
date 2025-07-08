
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

export class EvolutionApiService {
  private integration: Integration;
  
  constructor(integration: Integration) {
    this.integration = integration;
  }

  private normalizeUrl(baseUrl: string): string {
    // Remove trailing slash and normalize URL
    let cleanUrl = baseUrl.replace(/\/+$/, '');
    
    // Ensure protocol is present
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }
    
    return cleanUrl;
  }

  private cleanPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Ensure it has country code format (55 for Brazil)
    if (cleaned.length === 11 && !cleaned.startsWith('55')) {
      return `55${cleaned}`;
    }
    
    // If it's already 13 digits and starts with 55, return as is
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      return cleaned;
    }
    
    return cleaned;
  }

  private async sendWithAuthMethod(
    url: string, 
    payload: any, 
    authHeaders: Record<string, string>
  ): Promise<Response> {
    console.log('🚀 Enviando para:', url);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    console.log('🔐 Headers:', authHeaders);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(payload),
    });

    console.log('📡 Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Erro:', errorText);
    } else {
      const result = await response.json();
      console.log('✅ Sucesso:', result);
    }

    return response;
  }

  async sendMessage(phoneNumber: string, message: string): Promise<{ success: boolean; error?: string }> {
    if (!this.integration.api_token) {
      return { success: false, error: 'Token da API não configurado' };
    }

    // Clean and validate phone number
    const cleanPhoneNumber = this.cleanPhoneNumber(phoneNumber);
    
    if (cleanPhoneNumber.length < 10 || cleanPhoneNumber.length > 15) {
      return { success: false, error: 'Número de telefone inválido. Use o formato: 5511999999999' };
    }

    const integrationAny = this.integration as any;
    const instanceName = integrationAny.instance_name || 'main_instance';
    const baseUrl = this.normalizeUrl(this.integration.base_url);
    
    console.log('🔧 Configuração:', {
      baseUrl,
      instanceName,
      phoneNumber: cleanPhoneNumber,
      hasToken: !!this.integration.api_token
    });

    // Formatos de payload mais completos
    const payloadFormats = [
      // Formato Evolution API v2 padrão
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
      // Formato Evolution API v1
      {
        number: cleanPhoneNumber,
        text: message
      },
      // Formato com textMessage simples
      {
        number: cleanPhoneNumber,
        textMessage: {
          text: message
        }
      },
      // Formato com message object
      {
        number: cleanPhoneNumber,
        message: {
          text: message
        }
      },
      // Formato usando remoteJid
      {
        remoteJid: `${cleanPhoneNumber}@s.whatsapp.net`,
        message: {
          text: message
        }
      },
      // Formato usando to e body
      {
        to: `${cleanPhoneNumber}@s.whatsapp.net`,
        body: message,
        type: "text"
      }
    ];

    // Endpoints mais comuns da Evolution API (mais completo)
    const endpoints = [
      // Evolution API v2 padrões
      `/message/sendText/${instanceName}`,
      `/message/send-text/${instanceName}`,
      `/${instanceName}/message/sendText`,
      `/${instanceName}/message/send-text`,
      
      // Evolution API v1 padrões
      `/api/sendText/${instanceName}`,
      `/api/${instanceName}/sendText`,
      `/sendText/${instanceName}`,
      `/${instanceName}/sendText`,
      
      // Versões com prefixos API
      `/api/v1/message/sendText/${instanceName}`,
      `/api/v2/message/sendText/${instanceName}`,
      `/v1/message/sendText/${instanceName}`,
      `/v2/message/sendText/${instanceName}`,
      
      // Formatos alternativos
      `/message/text/${instanceName}`,
      `/text/${instanceName}`,
      `/${instanceName}/text`,
      
      // Endpoints sem nome da instância (alguns Evolution APIs)
      `/message/sendText`,
      `/api/sendText`,
      `/sendText`,
      `/message/send-text`,
      `/api/v1/message/sendText`,
      `/v1/message/sendText`
    ];

    // Métodos de autenticação expandidos
    const authMethods = [
      { 'apikey': this.integration.api_token },
      { 'api-key': this.integration.api_token },
      { 'Api-Key': this.integration.api_token },
      { 'API-KEY': this.integration.api_token },
      { 'x-api-key': this.integration.api_token },
      { 'X-API-KEY': this.integration.api_token },
      { 'Authorization': `Bearer ${this.integration.api_token}` },
      { 'Authorization': `ApiKey ${this.integration.api_token}` },
      { 'token': this.integration.api_token },
      { 'Token': this.integration.api_token },
      { 'access_token': this.integration.api_token }
    ];

    // Testar todas as combinações
    for (const endpoint of endpoints) {
      const fullUrl = `${baseUrl}${endpoint}`;
      
      for (const payload of payloadFormats) {
        for (const authHeaders of authMethods) {
          try {
            console.log(`🔄 Testando: ${endpoint} | Payload: ${Object.keys(payload)[0]} | Auth: ${Object.keys(authHeaders)[0]}`);
            
            const response = await this.sendWithAuthMethod(fullUrl, payload, authHeaders);
            
            if (response.ok) {
              const result = await response.json();
              console.log('🎉 SUCESSO! Configuração que funcionou:', {
                endpoint,
                payloadType: Object.keys(payload)[0],
                authType: Object.keys(authHeaders)[0],
                result
              });
              return { success: true };
            } else {
              console.log(`❌ Falhou: ${endpoint} (${Object.keys(payload)[0]}, ${Object.keys(authHeaders)[0]}) - Status: ${response.status}`);
            }
          } catch (error) {
            console.error(`❌ Erro de rede: ${endpoint} (${Object.keys(payload)[0]}, ${Object.keys(authHeaders)[0]}):`, error);
          }
          
          // Small delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    return { 
      success: false, 
      error: 'Não foi possível enviar a mensagem com nenhuma configuração testada. Verifique se:\n\n1. A instância está ativa e conectada\n2. O token da API está correto\n3. A URL base está correta\n4. O nome da instância está correto\n\nConsulte a documentação da sua Evolution API para verificar os endpoints corretos.' 
    };
  }
}
