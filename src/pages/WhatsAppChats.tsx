
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useWhatsAppConversations, useCreateWhatsAppConversation, useUpdateWhatsAppConversation } from '@/hooks/useWhatsAppConversations';
import { EvolutionApiService } from '@/utils/evolutionApiService';
import { 
  MessageSquare, 
  QrCode, 
  Wifi, 
  WifiOff, 
  Send, 
  Phone,
  Settings,
  RefreshCw,
  Users,
  MessageCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: number;
  isFromMe: boolean;
  messageType?: string;
}

interface WhatsAppChat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: number;
  unreadCount: number;
  phoneNumber: string;
  profilePicUrl?: string;
}

const WhatsAppChats = () => {
  const { data: integrations } = useIntegrations();
  const { data: conversations } = useWhatsAppConversations();
  const createConversation = useCreateWhatsAppConversation();
  const updateConversation = useUpdateWhatsAppConversation();
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [qrCode, setQrCode] = useState<string>('');
  const [chats, setChats] = useState<WhatsAppChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<WhatsAppChat | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const evolutionIntegration = integrations?.find(int => int.type === 'evolution_api');

  // Check connection status
  const checkConnection = async () => {
    if (!evolutionIntegration) return;

    try {
      const service = new EvolutionApiService(evolutionIntegration);
      const status = await service.checkInstanceStatus();
      setIsConnected(status.active);
      setConnectionStatus(status.active ? 'connected' : 'disconnected');
      
      if (status.active) {
        await loadChats();
      }
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
  };

  // Connect to WhatsApp Web
  const connectToWhatsApp = async () => {
    if (!evolutionIntegration) {
      toast({
        title: "Erro",
        description: "Integração Evolution API não configurada",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    try {
      const service = new EvolutionApiService(evolutionIntegration);
      const instanceInfo = await service.getInstanceInfo();
      
      if (instanceInfo.connected) {
        setIsConnected(true);
        setConnectionStatus('connected');
        setIsConnecting(false);
        await loadChats();
        toast({
          title: "Conectado!",
          description: "WhatsApp Web já está conectado",
        });
      } else if (instanceInfo.qrCode) {
        setQrCode(instanceInfo.qrCode);
        setIsQrDialogOpen(true);
        
        // Poll for connection status
        const pollConnection = setInterval(async () => {
          const status = await service.checkInstanceStatus();
          if (status.active) {
            clearInterval(pollConnection);
            setIsConnected(true);
            setConnectionStatus('connected');
            setIsQrDialogOpen(false);
            setIsConnecting(false);
            await loadChats();
            toast({
              title: "Conectado!",
              description: "WhatsApp Web conectado com sucesso",
            });
          }
        }, 3000);
        
        // Stop polling after 2 minutes
        setTimeout(() => {
          clearInterval(pollConnection);
          if (!isConnected) {
            setIsConnecting(false);
            setIsQrDialogOpen(false);
            toast({
              title: "Tempo esgotado",
              description: "Conexão não foi estabelecida. Tente novamente.",
              variant: "destructive"
            });
          }
        }, 120000);
      }
    } catch (error) {
      console.error('Erro ao conectar:', error);
      setIsConnecting(false);
      toast({
        title: "Erro na conexão",
        description: "Não foi possível conectar ao WhatsApp Web",
        variant: "destructive"
      });
    }
  };

  // Disconnect from WhatsApp Web
  const disconnectFromWhatsApp = async () => {
    if (!evolutionIntegration) return;

    try {
      const service = new EvolutionApiService(evolutionIntegration);
      await service.disconnectInstance();
      
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setChats([]);
      setSelectedChat(null);
      setMessages([]);
      
      toast({
        title: "Desconectado",
        description: "WhatsApp Web foi desconectado",
      });
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      toast({
        title: "Erro",
        description: "Erro ao desconectar do WhatsApp Web",
        variant: "destructive"
      });
    }
  };

  // Load chats from Evolution API
  const loadChats = async () => {
    if (!evolutionIntegration) return;

    setIsLoading(true);
    try {
      const service = new EvolutionApiService(evolutionIntegration);
      const chatsData = await service.getConversations();
      
      const formattedChats: WhatsAppChat[] = chatsData.map((chat: any) => ({
        id: chat.id || chat.remoteJid,
        name: chat.name || chat.pushName || chat.remoteJid,
        lastMessage: chat.lastMessage?.body || 'Nova conversa',
        timestamp: chat.lastMessage?.timestamp || Date.now(),
        unreadCount: chat.unreadCount || 0,
        phoneNumber: chat.remoteJid || chat.id,
        profilePicUrl: chat.profilePicUrl
      }));
      
      setChats(formattedChats);
      
      // Sync with database conversations
      for (const chat of formattedChats) {
        const existingConversation = conversations?.find(c => c.contact_phone === chat.phoneNumber);
        
        if (!existingConversation) {
          await createConversation.mutateAsync({
            contact_name: chat.name,
            contact_phone: chat.phoneNumber,
            last_message: chat.lastMessage,
            last_message_time: new Date(chat.timestamp).toISOString(),
            unread_count: chat.unreadCount,
            status: 'active',
            integration_id: evolutionIntegration.id
          });
        } else {
          await updateConversation.mutateAsync({
            id: existingConversation.id,
            updates: {
              last_message: chat.lastMessage,
              last_message_time: new Date(chat.timestamp).toISOString(),
              unread_count: chat.unreadCount
            }
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar conversas do WhatsApp",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load messages for selected chat
  const loadMessages = async (chat: WhatsAppChat) => {
    if (!evolutionIntegration) return;

    try {
      const service = new EvolutionApiService(evolutionIntegration);
      const messagesData = await service.getMessages(chat.id);
      
      const formattedMessages: WhatsAppMessage[] = messagesData.map((msg: any) => ({
        id: msg.key?.id || msg.id,
        from: msg.key?.fromMe ? 'me' : msg.key?.remoteJid,
        to: msg.key?.fromMe ? msg.key?.remoteJid : 'me',
        body: msg.message?.conversation || msg.message?.extendedTextMessage?.text || 'Mensagem não suportada',
        timestamp: msg.messageTimestamp * 1000 || Date.now(),
        isFromMe: msg.key?.fromMe || false,
        messageType: msg.message?.messageType || 'text'
      }));
      
      setMessages(formattedMessages.sort((a, b) => a.timestamp - b.timestamp));
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar mensagens",
        variant: "destructive"
      });
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !evolutionIntegration) return;

    try {
      const service = new EvolutionApiService(evolutionIntegration);
      const result = await service.sendMessage(selectedChat.phoneNumber, newMessage);
      
      if (result.success) {
        const newMsg: WhatsAppMessage = {
          id: Date.now().toString(),
          from: 'me',
          to: selectedChat.phoneNumber,
          body: newMessage,
          timestamp: Date.now(),
          isFromMe: true
        };
        
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        
        // Update chat's last message
        setChats(prev => prev.map(chat => 
          chat.id === selectedChat.id 
            ? { ...chat, lastMessage: newMessage, timestamp: Date.now() }
            : chat
        ));
        
        toast({
          title: "Mensagem enviada",
          description: "Sua mensagem foi enviada com sucesso",
        });
      } else {
        toast({
          title: "Erro ao enviar",
          description: result.error?.message || "Não foi possível enviar a mensagem",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive"
      });
    }
  };

  // Select chat and load messages
  const selectChat = async (chat: WhatsAppChat) => {
    setSelectedChat(chat);
    await loadMessages(chat);
  };

  // Check connection on mount
  useEffect(() => {
    if (evolutionIntegration) {
      checkConnection();
    }
  }, [evolutionIntegration]);

  if (!evolutionIntegration) {
    return (
      <div className="container mx-auto py-10">
        <Card className="w-full max-w-4xl mx-auto border-yellow-600 bg-yellow-900/20">
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
            <h3 className="text-lg font-semibold text-yellow-200 mb-2">Evolution API não configurado</h3>
            <p className="text-yellow-300 mb-4">
              Para usar o WhatsApp Web, configure a integração Evolution API no painel de administração.
            </p>
            <Button 
              onClick={() => window.location.href = '/admin'} 
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Settings className="mr-2 h-4 w-4" />
              Configurar Evolution API
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Connection Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                WhatsApp Web
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <Wifi className="h-5 w-5 text-green-500" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-sm">
                    {isConnected ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
                <Badge variant={isConnected ? 'default' : 'destructive'}>
                  {connectionStatus}
                </Badge>
              </div>

              <div className="space-y-2">
                {!isConnected ? (
                  <Button 
                    onClick={connectToWhatsApp} 
                    disabled={isConnecting}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <QrCode className="mr-2 h-4 w-4" />
                        Conectar WhatsApp
                      </>
                    )}
                  </Button>
                ) : (
                  <Button 
                    onClick={disconnectFromWhatsApp} 
                    variant="destructive"
                    className="w-full"
                  >
                    Desconectar
                  </Button>
                )}
                
                <Button 
                  onClick={checkConnection} 
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Verificar Status
                </Button>
                
                {isConnected && (
                  <Button 
                    onClick={loadChats} 
                    variant="outline"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      <>
                        <Users className="mr-2 h-4 w-4" />
                        Atualizar Conversas
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chats List */}
          {isConnected && (
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Conversas ({chats.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => selectChat(chat)}
                      className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedChat?.id === chat.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium truncate">{chat.name}</h4>
                            {chat.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {chat.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {chat.lastMessage}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-400 truncate">
                              {chat.phoneNumber}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(chat.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {chats.length === 0 && !isLoading && (
                    <div className="p-6 text-center text-gray-500">
                      <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>Nenhuma conversa encontrada</p>
                      <p className="text-sm">Clique em "Atualizar Conversas" para sincronizar</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2">
          {selectedChat ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {selectedChat.name}
                  <span className="text-sm text-gray-500 truncate">
                    ({selectedChat.phoneNumber})
                  </span>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-96">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isFromMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                          message.isFromMe
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                        <span className="text-xs opacity-75 block mt-1">
                          {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {messages.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>Nenhuma mensagem ainda</p>
                      <p className="text-sm">Inicie uma conversa enviando uma mensagem</p>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">
                  {isConnected ? 'Selecione uma conversa' : 'Conecte-se ao WhatsApp Web'}
                </h3>
                <p className="text-gray-600">
                  {isConnected 
                    ? 'Escolha uma conversa da lista para começar a conversar'
                    : 'Conecte sua conta do WhatsApp Web para ver suas conversas'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp Web</DialogTitle>
          </DialogHeader>
          <div className="text-center p-6">
            <QrCode className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Escaneie o QR Code</h3>
            <p className="text-gray-600 mb-4">
              Use seu WhatsApp para escanear o código QR e conectar
            </p>
            {qrCode && (
              <div className="bg-white p-4 rounded-lg inline-block border">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
            )}
            <div className="mt-4">
              <RefreshCw className="h-4 w-4 animate-spin mx-auto" />
              <p className="text-sm text-gray-500 mt-2">Aguardando conexão...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhatsAppChats;
