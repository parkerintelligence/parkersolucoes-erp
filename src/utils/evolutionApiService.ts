
import { Integration } from '@/hooks/useIntegrations';

export interface EvolutionApiError {
  message: string;
  details?: string;
  endpoint?: string;
  statusCode?: number;
  logs?: string[];
}

export class EvolutionApiService {
  private baseUrl: string;
  private apiToken: string;
  private instanceName: string;

  constructor(private integration: Integration) {
    // Validate required fields for Evolution API
    if (!integration.api_token) {
      throw new Error('API token is required for Evolution API integration');
    }
    if (!integration.instance_name) {
      throw new Error('Instance name is required for Evolution API integration');
    }
    if (!integration.base_url) {
      throw new Error('Base URL is required for Evolution API integration');
    }

    this.baseUrl = integration.base_url.replace(/\/$/, '');
    this.apiToken = integration.api_token;
    this.instanceName = integration.instance_name;

    console.log('🔌 Evolution API Service initialized:', {
      baseUrl: this.baseUrl,
      instanceName: this.instanceName,
      hasToken: !!this.apiToken
    });
  }

  async createInstance(): Promise<{ success: boolean; qrCode?: string; error?: string }> {
    try {
      console.log('🔧 Evolution API: Criando instância...');
      const response = await fetch(`${this.baseUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiToken
        },
        body: JSON.stringify({
          instanceName: this.instanceName,
          token: this.apiToken,
          qrcode: true,
          markMessagesRead: false,
          delayMessage: 1000,
          integration: 'WHATSAPP-BAILEYS'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro ao criar instância:', response.status, response.statusText, errorText);
        return { success: false, error: `Erro HTTP ${response.status}: ${errorText}` };
      }

      const data = await response.json();
      console.log('✅ Instância criada:', data);
      return { success: true, qrCode: data.qrcode?.base64 || data.qrcode };
    } catch (error) {
      console.error('❌ Erro ao criar instância:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  static async fetchAllInstances(baseUrl: string, apiToken: string): Promise<any[]> {
    try {
      const url = `${baseUrl.replace(/\/$/, '')}/instance/fetchInstances`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiToken
        }
      });

      if (!response.ok) {
        console.error('❌ Erro ao listar instâncias:', response.status);
        return [];
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Erro ao listar instâncias:', error);
      return [];
    }
  }

  static async deleteInstance(baseUrl: string, apiToken: string, instanceName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `${baseUrl.replace(/\/$/, '')}/instance/delete/${instanceName}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiToken
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Erro HTTP ${response.status}: ${errorText}` };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  static async connectInstance(baseUrl: string, apiToken: string, instanceName: string): Promise<{ qrCode?: string; error?: string }> {
    try {
      const url = `${baseUrl.replace(/\/$/, '')}/instance/connect/${instanceName}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiToken
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { error: `Erro HTTP ${response.status}: ${errorText}` };
      }

      const data = await response.json();
      return { qrCode: data.base64 || data.qrcode?.base64 || data.qrcode };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  static async logoutInstance(baseUrl: string, apiToken: string, instanceName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `${baseUrl.replace(/\/$/, '')}/instance/logout/${instanceName}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiToken
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Erro HTTP ${response.status}: ${errorText}` };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  static async getInstanceStatus(baseUrl: string, apiToken: string, instanceName: string): Promise<{ state: string; error?: string }> {
    try {
      const url = `${baseUrl.replace(/\/$/, '')}/instance/connectionState/${instanceName}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiToken
        }
      });

      if (!response.ok) {
        return { state: 'unknown', error: `Erro HTTP ${response.status}` };
      }

      const data = await response.json();
      return { state: data.instance?.state || data.state || 'unknown' };
    } catch (error) {
      return { state: 'unknown', error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  async getQrCode(): Promise<{ qrCode?: string; error?: string }> {
    try {
      console.log('📱 Evolution API: Buscando QR Code...');
      const response = await fetch(`${this.baseUrl}/instance/qrcode/${this.instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiToken
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro ao buscar QR Code:', response.status, response.statusText, errorText);
        return { error: `Erro HTTP ${response.status}: ${errorText}` };
      }

      const data = await response.json();
      console.log('✅ QR Code obtido:', data);
      
      if (data.qrcode) {
        return { qrCode: data.qrcode };
      } else {
        return { error: 'QR Code não disponível' };
      }
    } catch (error) {
      console.error('❌ Erro ao buscar QR Code:', error);
      return { error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  async checkInstanceStatus(): Promise<{ active: boolean; qrCode?: string; error?: string }> {
    try {
      console.log('🔍 Evolution API: Verificando status da instância...');
      const response = await fetch(`${this.baseUrl}/instance/connectionState/${this.instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiToken
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro ao verificar status:', response.status, response.statusText, errorText);
        return { active: false, error: `Erro HTTP ${response.status}: ${errorText}` };
      }

      const data = await response.json();
      console.log('✅ Status da instância:', data);
      
      const isActive = data.state === 'open' || data.status === 'CONNECTED';
      return { active: isActive };
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      return { active: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  async getInstanceInfo(): Promise<{ connected: boolean, qrCode?: string, error?: string }> {
    try {
      console.log('🔍 Evolution API: Buscando informações da instância...');
      
      // Primeiro verificar se a instância existe
      const statusResponse = await fetch(`${this.baseUrl}/instance/connectionState/${this.instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiToken
        }
      });

      if (statusResponse.status === 404) {
        console.log('🔧 Instância não encontrada, criando...');
        const createResult = await this.createInstance();
        if (!createResult.success) {
          return { connected: false, error: createResult.error };
        }
        
        // Aguardar um pouco após criar a instância
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Verificar status da conexão
      const statusData = await statusResponse.json();
      console.log('📊 Status da instância:', statusData);

      if (statusData.state === 'open' || statusData.status === 'CONNECTED') {
        return { connected: true };
      } else if (statusData.state === 'close' || statusData.status === 'DISCONNECTED') {
        // Tentar obter QR Code para reconexão
        const qrResult = await this.getQrCode();
        if (qrResult.qrCode) {
          return { connected: false, qrCode: qrResult.qrCode };
        } else {
          return { connected: false, error: 'Instância desconectada e QR Code não disponível' };
        }
      }

      return { connected: false, error: 'Status da instância desconhecido' };
    } catch (error) {
      console.error('❌ Erro ao buscar informações da instância:', error);
      return { connected: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  async disconnectInstance(): Promise<void> {
    try {
      console.log('🔌 Evolution API: Desconectando instância...');
      const response = await fetch(`${this.baseUrl}/instance/logout/${this.instanceName}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiToken
        }
      });

      if (!response.ok) {
        console.error('❌ Erro ao desconectar:', response.status, response.statusText);
        throw new Error(`Erro ao desconectar: ${response.status} ${response.statusText}`);
      }

      console.log('✅ Instância desconectada com sucesso.');
    } catch (error) {
      console.error('❌ Erro ao desconectar:', error);
      throw new Error(`Erro ao desconectar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  async getConversations() {
    try {
      console.log('🔍 Evolution API: Buscando conversas...');
      
      const headers = {
        'Content-Type': 'application/json',
        'apikey': this.apiToken
      };

      // Lista de endpoints para tentar em ordem de prioridade
      const endpoints = [
        // Endpoint principal recomendado
        {
          url: `${this.baseUrl}/chat/findChats/${this.instanceName}`,
          method: 'GET',
          name: 'findChats'
        },
        // Endpoint alternativo 1
        {
          url: `${this.baseUrl}/chat/whatsappNumbers/${this.instanceName}`,
          method: 'GET', 
          name: 'whatsappNumbers'
        },
        // Endpoint alternativo 2 (POST com filtros)
        {
          url: `${this.baseUrl}/chat/find/${this.instanceName}`,
          method: 'POST',
          body: { where: {} },
          name: 'chatFind'
        },
        // Endpoint alternativo 3
        {
          url: `${this.baseUrl}/chat/fetchChats/${this.instanceName}`,
          method: 'GET',
          name: 'fetchChats'
        }
      ];

      let chatsData = [];
      let successfulEndpoint = null;

      // Tentar cada endpoint até conseguir dados
      for (const endpoint of endpoints) {
        try {
          console.log(`📡 Tentando endpoint: ${endpoint.name} - ${endpoint.url}`);
          
          const requestOptions: RequestInit = {
            method: endpoint.method,
            headers
          };

          if (endpoint.body) {
            requestOptions.body = JSON.stringify(endpoint.body);
          }

          const response = await fetch(endpoint.url, requestOptions);

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Sucesso no endpoint ${endpoint.name}:`, data);
            
            if (Array.isArray(data) && data.length > 0) {
              chatsData = data;
              successfulEndpoint = endpoint.name;
              break;
            } else if (data.chats && Array.isArray(data.chats)) {
              chatsData = data.chats;
              successfulEndpoint = endpoint.name;
              break;
            } else if (data.data && Array.isArray(data.data)) {
              chatsData = data.data;
              successfulEndpoint = endpoint.name;
              break;
            } else {
              console.log(`⚠️ Endpoint ${endpoint.name} retornou dados, mas não em formato esperado:`, data);
            }
          } else {
            console.warn(`⚠️ Endpoint ${endpoint.name} falhou:`, response.status, response.statusText);
          }
        } catch (error) {
          console.warn(`⚠️ Erro no endpoint ${endpoint.name}:`, error);
        }
      }

      console.log(`📊 Endpoint bem-sucedido: ${successfulEndpoint}, Total de chats: ${chatsData.length}`);

      // Buscar grupos usando endpoint específico
      let groupsData = [];
      try {
        const groupEndpoints = [
          `${this.baseUrl}/group/fetchAllGroups/${this.instanceName}`,
          `${this.baseUrl}/group/findGroups/${this.instanceName}`,
          `${this.baseUrl}/chat/findGroups/${this.instanceName}`
        ];

        for (const groupUrl of groupEndpoints) {
          try {
            console.log(`👥 Tentando buscar grupos: ${groupUrl}`);
            const groupsResponse = await fetch(groupUrl, {
              method: 'GET',
              headers
            });

            if (groupsResponse.ok) {
              const groupData = await groupsResponse.json();
              if (Array.isArray(groupData) && groupData.length > 0) {
                groupsData = groupData;
                console.log(`✅ Grupos encontrados: ${groupsData.length}`);
                break;
              } else if (groupData.groups && Array.isArray(groupData.groups)) {
                groupsData = groupData.groups;
                console.log(`✅ Grupos encontrados: ${groupsData.length}`);
                break;
              }
            }
          } catch (error) {
            console.warn(`⚠️ Erro ao buscar grupos em ${groupUrl}:`, error);
          }
        }
      } catch (error) {
        console.warn('⚠️ Erro geral ao buscar grupos:', error);
      }

      // Combinar e processar dados
      const allConversations = [];

      // Processar chats individuais com melhor tratamento de dados
      if (Array.isArray(chatsData)) {
        chatsData.forEach(chat => {
          try {
            // Filtrar apenas chats individuais (não grupos)
            const chatId = chat.id || chat.remoteJid || chat.key?.remoteJid;
            if (chatId && !chatId.includes('@g.us')) {
              const conversation = {
                id: chatId,
                name: chat.name || chat.pushName || chat.notifyName || chat.verifiedName || chatId.split('@')[0] || 'Contato sem nome',
                lastMessage: this.extractLastMessage(chat),
                timestamp: this.extractTimestamp(chat),
                unreadCount: chat.unreadCount || chat.unread || 0,
                remoteJid: chatId,
                isGroup: false,
                profilePicUrl: chat.profilePicUrl || chat.picture
              };
              
              allConversations.push(conversation);
              console.log(`💬 Chat processado: ${conversation.name} (${conversation.id})`);
            }
          } catch (error) {
            console.warn('⚠️ Erro ao processar chat individual:', error, chat);
          }
        });
      }

      // Processar grupos com melhor tratamento de dados
      if (Array.isArray(groupsData)) {
        groupsData.forEach(group => {
          try {
            const groupId = group.id || group.remoteJid || group.key?.remoteJid;
            if (groupId) {
              const conversation = {
                id: groupId,
                name: group.subject || group.name || group.pushName || 'Grupo sem nome',
                lastMessage: this.extractLastMessage(group) || 'Conversa em grupo',
                timestamp: this.extractTimestamp(group),
                unreadCount: group.unreadCount || group.unread || 0,
                remoteJid: groupId,
                isGroup: true,
                participantsCount: group.participants?.length || group.size || group.participantCount || 0,
                profilePicUrl: group.profilePicUrl || group.picture
              };
              
              allConversations.push(conversation);
              console.log(`👥 Grupo processado: ${conversation.name} (${conversation.participantsCount} participantes)`);
            }
          } catch (error) {
            console.warn('⚠️ Erro ao processar grupo:', error, group);
          }
        });
      }

      // Ordenar por timestamp (mais recente primeiro)
      allConversations.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      console.log('💬 Resumo das conversas processadas:');
      console.log(`- Total: ${allConversations.length}`);
      console.log(`- Chats individuais: ${allConversations.filter(c => !c.isGroup).length}`);
      console.log(`- Grupos: ${allConversations.filter(c => c.isGroup).length}`);
      console.log('📋 Primeiras 3 conversas:', allConversations.slice(0, 3));

      return allConversations;

    } catch (error) {
      console.error('❌ Erro geral ao buscar conversas:', error);
      throw new Error(`Erro ao buscar conversas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Métodos auxiliares para extrair dados de diferentes formatos da API
  private extractLastMessage(chat: any): string {
    const messageFields = [
      'lastMessage?.conversation',
      'lastMessage?.text', 
      'lastMessage?.body',
      'lastMessage',
      'lastMsg?.conversation',
      'lastMsg?.text',
      'lastMsg?.body', 
      'lastMsg',
      'messages?.[0]?.conversation',
      'messages?.[0]?.text',
      'messages?.[0]?.body'
    ];

    for (const field of messageFields) {
      try {
        const value = this.getNestedValue(chat, field);
        if (value && typeof value === 'string' && value.trim()) {
          return value.trim();
        }
      } catch (error) {
        // Continuar tentando outros campos
      }
    }

    return 'Nova conversa';
  }

  private extractTimestamp(chat: any): number {
    const timestampFields = [
      'lastMessageTime',
      'lastMessage?.messageTimestamp', 
      'lastMessage?.timestamp',
      'lastMessage?.t',
      'lastMsg?.messageTimestamp',
      'lastMsg?.timestamp',
      'lastMsg?.t',
      't',
      'timestamp',
      'createdAt',
      'creation'
    ];

    for (const field of timestampFields) {
      try {
        const value = this.getNestedValue(chat, field);
        if (value) {
          const timestamp = typeof value === 'string' ? parseInt(value) : value;
          if (!isNaN(timestamp) && timestamp > 0) {
            // Se for timestamp em segundos, converter para milissegundos
            return timestamp < 10000000000 ? timestamp * 1000 : timestamp;
          }
        }
      } catch (error) {
        // Continuar tentando outros campos
      }
    }

    return Date.now();
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      if (key.includes('?.[')) {
        // Tratar arrays opcionais como messages?.[0]
        const arrayMatch = key.match(/^(.+)\?\.\[(\d+)\]$/);
        if (arrayMatch && current) {
          const [, arrayKey, index] = arrayMatch;
          const array = current[arrayKey];
          return Array.isArray(array) ? array[parseInt(index)] : undefined;
        }
      }
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  async getMessages(chatId: string, limit: number = 50) {
    try {
      console.log(`📥 Evolution API: Buscando mensagens para ${chatId}...`);
      
      const response = await fetch(`${this.baseUrl}/chat/findMessages/${this.instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiToken
        },
        body: JSON.stringify({
          where: {
            key: {
              remoteJid: chatId
            }
          },
          limit
        })
      });

      if (!response.ok) {
        console.error('❌ Erro HTTP ao buscar mensagens:', response.status, response.statusText);
        return [];
      }

      const data = await response.json();
      console.log('📥 Mensagens encontradas:', data.length);
      
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Erro ao buscar mensagens:', error);
      return [];
    }
  }

  async sendMessage(number: string, text: string): Promise<{ success: boolean, error?: any }> {
    try {
      console.log(`✉️ Evolution API: Enviando mensagem para ${number}...`);
      console.log(`🔗 URL: ${this.baseUrl}/message/sendText/${this.instanceName}`);
      console.log(`🔑 Token: ${this.apiToken.substring(0, 10)}...`);
      
      const payload = {
        number: number,
        text: text
      };
      
      console.log(`📤 Payload:`, payload);
      
      const response = await fetch(`${this.baseUrl}/message/sendText/${this.instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiToken
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log(`📨 Resposta bruta:`, responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        result = { raw: responseText };
      }

      if (response.ok) {
        console.log('✅ Mensagem enviada com sucesso:', result);
        return { success: true };
      } else {
        console.error('❌ Erro ao enviar mensagem:', {
          status: response.status,
          statusText: response.statusText,
          response: result
        });
        return { 
          success: false, 
          error: {
            message: `Erro HTTP ${response.status}: ${response.statusText}`,
            details: responseText,
            statusCode: response.status
          }
        };
      }
    } catch (error) {
      console.error('❌ Erro crítico ao enviar mensagem:', error);
      return { 
        success: false, 
        error: {
          message: 'Erro crítico na comunicação',
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      };
    }
  }
}
