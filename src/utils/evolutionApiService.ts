
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
      const response = await fetch(`${baseUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.integration.api_token!,
        },
      });

      console.log('API Connectivity Test:', response.status);
      return response.ok;
    } catch (error) {
      console.error('API Connectivity Test Failed:', error);
      return false;
    }
  }

  private async sendWithAuthMethod(
    url: string, 
    payload: EvolutionApiMessage, 
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

    // Test API connectivity first
    const isConnected = await this.testApiConnectivity();
    if (!isConnected) {
      console.log('API connectivity test failed, but continuing anyway...');
    }

    const integrationAny = this.integration as any;
    const instanceName = integrationAny.instance_name || 'main_instance';
    const baseUrl = this.normalizeUrl(this.integration.base_url);
    
    const payload: EvolutionApiMessage = {
      number: cleanPhoneNumber,
      text: message,
    };

    // Try different endpoint formats
    const endpoints = [
      `/message/sendText/${instanceName}`,
      `/message/text/${instanceName}`,
      `/sendText/${instanceName}`,
      `/${instanceName}/message/sendText`,
      `/${instanceName}/message/text`,
      `/message/sendText`, // sem instance name
      `/sendText`, // mais simples
    ];

    // Try different authentication methods
    const authMethods = [
      { 'apikey': this.integration.api_token },
      { 'Authorization': `Bearer ${this.integration.api_token}` },
      { 'x-api-key': this.integration.api_token },
      { 'api-key': this.integration.api_token },
      { 'Api-Key': this.integration.api_token },
    ];

    for (const endpoint of endpoints) {
      const fullUrl = `${baseUrl}${endpoint}`;
      
      for (const authHeaders of authMethods) {
        try {
          const response = await this.sendWithAuthMethod(fullUrl, payload, authHeaders);
          
          if (response.ok) {
            const result = await response.json();
            console.log('Success with endpoint:', endpoint, 'and auth:', Object.keys(authHeaders)[0]);
            console.log('Result:', result);
            return { success: true };
          } else {
            const errorText = await response.text();
            console.log(`Failed with ${endpoint} and ${Object.keys(authHeaders)[0]}:`, response.status, errorText);
            
            // Continue trying other methods even on auth errors
            continue;
          }
        } catch (error) {
          console.error(`Error with ${endpoint} and ${Object.keys(authHeaders)[0]}:`, error);
          continue;
        }
      }
    }

    return { 
      success: false, 
      error: 'Não foi possível enviar a mensagem. Verifique a configuração da Evolution API, o token e se a instância está ativa.' 
    };
  }
}
