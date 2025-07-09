
export interface Integration {
  id: string;
  created_at: string;
  name: string;
  type: string;
  base_url: string;
  api_token: string;
  username?: string;
  password?: string;
  is_active: boolean;
  instance_name?: string;
}

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
    this.baseUrl = integration.base_url.replace(/\/$/, '');
    this.apiToken = integration.api_token;
    this.instanceName = integration.instance_name || 'default';
  }

  async createInstance(): Promise<{ success: boolean; error?: string }> {
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
        console.error('❌ Erro ao criar instância:', response.status, response.statusText);
        return { success: false, error: `Erro HTTP: ${response.status}` };
      }

      const data = await response.json();
      console.log('✅ Instância criada:', data);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao criar instância:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
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
        console.error('❌ Erro ao buscar QR Code:', response.status, response.statusText);
        return { error: `Erro HTTP: ${response.status}` };
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

  async checkInstanceStatus(): Promise<{ active: boolean; qrCode?: string }> {
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
        console.error('❌ Erro ao verificar status:', response.status, response.statusText);
        return { active: false };
      }

      const data = await response.json();
      console.log('✅ Status da instância:', data);
      return { active: data.state === 'open' || data.status === 'CONNECTED' };
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      return { active: false };
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

      // Tentar buscar chats usando diferentes endpoints
      let chatsData = [];
      let groupsData = [];

      // Endpoint 1: Buscar chats
      try {
        const chatsResponse = await fetch(`${this.baseUrl}/chat/findChats/${this.instanceName}`, {
          method: 'GET',
          headers
        });

        if (chatsResponse.ok) {
          chatsData = await chatsResponse.json();
          console.log('📱 Chats encontrados:', chatsData.length);
        } else {
          console.warn('⚠️ Endpoint findChats falhou, tentando alternativo...');
          
          // Endpoint alternativo
          const altResponse = await fetch(`${this.baseUrl}/chat/whatsappNumbers/${this.instanceName}`, {
            method: 'GET',
            headers
          });
          
          if (altResponse.ok) {
            chatsData = await altResponse.json();
            console.log('📱 Chats (endpoint alternativo):', chatsData.length);
          }
        }
      } catch (error) {
        console.warn('⚠️ Erro ao buscar chats:', error);
      }

      // Endpoint 2: Buscar grupos
      try {
        const groupsResponse = await fetch(`${this.baseUrl}/group/fetchAllGroups/${this.instanceName}`, {
          method: 'GET',
          headers
        });

        if (groupsResponse.ok) {
          groupsData = await groupsResponse.json();
          console.log('👥 Grupos encontrados:', groupsData.length);
        }
      } catch (error) {
        console.warn('⚠️ Erro ao buscar grupos:', error);
      }

      // Combinar e processar dados
      const allConversations = [];

      // Processar chats individuais
      if (Array.isArray(chatsData)) {
        chatsData.forEach(chat => {
          if (chat.id && !chat.id.includes('@g.us')) {
            allConversations.push({
              id: chat.id,
              name: chat.name || chat.pushName || chat.notifyName || chat.id.split('@')[0],
              lastMessage: chat.lastMessage?.conversation || chat.lastMessage || 'Nova conversa',
              timestamp: chat.lastMessageTime || chat.t || Date.now(),
              unreadCount: chat.unreadCount || 0,
              remoteJid: chat.id,
              isGroup: false,
              profilePicUrl: chat.profilePicUrl
            });
          }
        });
      }

      // Processar grupos
      if (Array.isArray(groupsData)) {
        groupsData.forEach(group => {
          allConversations.push({
            id: group.id,
            name: group.subject || group.name || 'Grupo sem nome',
            lastMessage: 'Conversa em grupo',
            timestamp: group.createdAt || group.creation || Date.now(),
            unreadCount: 0,
            remoteJid: group.id,
            isGroup: true,
            participantsCount: group.participants?.length || group.size || 0,
            profilePicUrl: group.profilePicUrl
          });
        });
      }

      // Ordenar por timestamp (mais recente primeiro)
      allConversations.sort((a, b) => b.timestamp - a.timestamp);

      console.log('💬 Total de conversas processadas:', allConversations.length);
      console.log('📋 Conversas:', allConversations.slice(0, 3)); // Log das primeiras 3 para debug

      return allConversations;

    } catch (error) {
      console.error('❌ Erro ao buscar conversas:', error);
      throw new Error(`Erro ao buscar conversas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
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
      const response = await fetch(`${this.baseUrl}/message/sendText/${this.instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiToken
        },
        body: JSON.stringify({
          number: number,
          text: text
        })
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ Mensagem enviada com sucesso:', result);
        return { success: true };
      } else {
        console.error('❌ Erro ao enviar mensagem:', result);
        return { success: false, error: result };
      }
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }
}
