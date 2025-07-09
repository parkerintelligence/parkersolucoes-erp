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

export class EvolutionApiService {
  private baseUrl: string;
  private apiToken: string;
  private instanceName: string;

  constructor(private integration: Integration) {
    this.baseUrl = integration.base_url.replace(/\/$/, '');
    this.apiToken = integration.api_token;
    this.instanceName = integration.instance_name || 'default';
  }

  async checkInstanceStatus(): Promise<{ active: boolean, qrCode?: string }> {
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
      console.log('✅ Status da instância:', data.status);
      return { active: data.status === 'CONNECTED' };
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      return { active: false };
    }
  }

  async getInstanceInfo(): Promise<{ connected: boolean, qrCode?: string, error?: string }> {
    try {
      console.log('🔍 Evolution API: Buscando informações da instância...');
      const response = await fetch(`${this.baseUrl}/instance/info/${this.instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiToken
        }
      });

      if (!response.ok) {
        console.error('❌ Erro ao buscar informações da instância:', response.status, response.statusText);
        return { connected: false, error: `Erro HTTP: ${response.status} ${response.statusText}` };
      }

      const data = await response.json();
      console.log('✅ Informações da instância:', data);

      if (data.status === 'CONNECTED') {
        return { connected: true };
      } else if (data.status === 'QRCODE') {
        return { connected: false, qrCode: data.qrcode };
      } else {
        return { connected: false, error: data.status };
      }
    } catch (error) {
      console.error('❌ Erro ao buscar informações da instância:', error);
      return { connected: false, error: error.message };
    }
  }

  async disconnectInstance(): Promise<void> {
    try {
      console.log('🔌 Evolution API: Desconectando instância...');
      const response = await fetch(`${this.baseUrl}/instance/logout/${this.instanceName}`, {
        method: 'GET',
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
      throw new Error(`Erro ao desconectar: ${error.message}`);
    }
  }

  async getConversations() {
    try {
      console.log('🔍 Evolution API: Buscando conversas e grupos...');
      
      const headers = {
        'Content-Type': 'application/json',
        'apikey': this.integration.api_token
      };

      // Buscar chats individuais
      const chatsResponse = await fetch(
        `${this.baseUrl}/chat/findChats/${this.instanceName}`, 
        {
          method: 'GET',
          headers
        }
      );

      // Buscar grupos
      const groupsResponse = await fetch(
        `${this.baseUrl}/group/fetchAllGroups/${this.instanceName}`, 
        {
          method: 'GET',
          headers
        }
      );

      const chatsData = chatsResponse.ok ? await chatsResponse.json() : [];
      const groupsData = groupsResponse.ok ? await groupsResponse.json() : [];

      console.log('📱 Chats encontrados:', chatsData.length);
      console.log('👥 Grupos encontrados:', groupsData.length);

      // Combinar chats e grupos
      const allConversations = [];

      // Processar chats individuais
      if (Array.isArray(chatsData)) {
        chatsData.forEach(chat => {
          if (chat.id && !chat.id.includes('@g.us')) { // Não é grupo
            allConversations.push({
              id: chat.id,
              name: chat.name || chat.pushName || chat.id.split('@')[0],
              lastMessage: chat.lastMessage || 'Nova conversa',
              timestamp: chat.lastMessageTime || Date.now(),
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
            name: group.subject || 'Grupo sem nome',
            lastMessage: 'Conversa em grupo',
            timestamp: group.createdAt || Date.now(),
            unreadCount: 0,
            remoteJid: group.id,
            isGroup: true,
            participantsCount: group.participants?.length || 0,
            profilePicUrl: group.profilePicUrl
          });
        });
      }

      // Ordenar por timestamp (mais recente primeiro)
      allConversations.sort((a, b) => b.timestamp - a.timestamp);

      console.log('💬 Total de conversas processadas:', allConversations.length);
      return allConversations;

    } catch (error) {
      console.error('❌ Erro ao buscar conversas:', error);
      throw new Error(`Erro ao buscar conversas: ${error.message}`);
    }
  }

  async getMessages(chatId: string, limit: number = 50) {
    try {
      console.log(`📥 Evolution API: Buscando mensagens para ${chatId}...`);
      
      const response = await fetch(
        `${this.baseUrl}/chat/findMessages/${this.instanceName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.integration.api_token
          },
          body: JSON.stringify({
            where: {
              key: {
                remoteJid: chatId
              }
            },
            limit
          })
        }
      );

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
      return { success: false, error: error.message };
    }
  }
}
