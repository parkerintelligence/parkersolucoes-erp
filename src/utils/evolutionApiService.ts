
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

  private async testApiConnectivity(): Promise<boolean> {
    try {
      const baseUrl = this.normalizeUrl(this.integration.base_url);
      const integrationAny = this.integration as any;
      const instanceName = integrationAny.instance_name || 'main_instance';
      
      // Test instance status endpoint
      const response = await fetch(`${baseUrl}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.integration.api_token!,
        },
      });

      console.log('API Connectivity Test:', response.status);
      return response.ok || response.status === 404; // 404 might mean instance exists but endpoint is different
    } catch (error) {
      console.error('API Connectivity Test Failed:', error);
      return false;
    }
  }

  private async sendWithAuthMethod(
    url: string, 
    payload: any, 
    authHeaders: Record<string, string>
  ): Promise<Response> {
    console.log('Sending message to:', url);
    console.log('Payload:', payload);
    console.log('Headers:', authHeaders);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(payload),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

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
    
    // Diferentes formatos de payload que a Evolution API pode aceitar
    const payloadFormats = [
      // Formato padrão
      {
        number: cleanPhoneNumber,
        text: message,
      },
      // Formato com textMessage
      {
        number: cleanPhoneNumber,
        textMessage: {
          text: message,
        },
      },
      // Formato com message
      {
        number: cleanPhoneNumber,
        message: message,
      },
      // Formato com remoteJid
      {
        remoteJid: `${cleanPhoneNumber}@s.whatsapp.net`,
        message: {
          text: message,
        },
      },
    ];

    // Endpoints mais comuns da Evolution API
    const endpoints = [
      `/message/sendText/${instanceName}`,
      `/${instanceName}/message/sendText`,
      `/message/text/${instanceName}`,
      `/${instanceName}/message/text`,
      `/sendText/${instanceName}`,
      `/${instanceName}/sendText`,
      `/message/send-text/${instanceName}`,
      `/${instanceName}/message/send-text`,
      `/api/v1/message/sendText/${instanceName}`,
      `/api/v1/${instanceName}/message/sendText`,
      `/v1/message/sendText/${instanceName}`,
      `/v1/${instanceName}/message/sendText`,
    ];

    // Métodos de autenticação
    const authMethods = [
      { 'apikey': this.integration.api_token },
      { 'Authorization': `Bearer ${this.integration.api_token}` },
      { 'x-api-key': this.integration.api_token },
      { 'api-key': this.integration.api_token },
      { 'Api-Key': this.integration.api_token },
      { 'X-API-KEY': this.integration.api_token },
    ];

    // Testar todas as combinações
    for (const endpoint of endpoints) {
      const fullUrl = `${baseUrl}${endpoint}`;
      
      for (const payload of payloadFormats) {
        for (const authHeaders of authMethods) {
          try {
            const response = await this.sendWithAuthMethod(fullUrl, payload, authHeaders);
            
            if (response.ok) {
              const result = await response.json();
              console.log('✅ Success with:', endpoint, 'payload:', Object.keys(payload)[0], 'auth:', Object.keys(authHeaders)[0]);
              console.log('Result:', result);
              return { success: true };
            } else {
              const errorText = await response.text();
              console.log(`❌ Failed ${endpoint} (${Object.keys(payload)[0]}, ${Object.keys(authHeaders)[0]}):`, response.status, errorText);
              
              // Se receber 401, pode ser problema de autenticação, continue tentando
              // Se receber 404, pode ser endpoint errado, continue tentando
              continue;
            }
          } catch (error) {
            console.error(`❌ Error ${endpoint} (${Object.keys(payload)[0]}, ${Object.keys(authHeaders)[0]}):`, error);
            continue;
          }
        }
      }
    }

    return { 
      success: false, 
      error: 'Não foi possível enviar a mensagem. Verifique se a instância está conectada e ativa na Evolution API. Confira também se o token de API está correto.' 
    };
  }
}
