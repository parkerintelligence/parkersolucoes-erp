
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useWhatsAppConversations } from '@/hooks/useWhatsAppConversations';
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
  MessageCircle,
  Menu,
  X
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

const WhatsAppChats = () => {
  const { data: integrations } = useIntegrations();
  const { data: conversations, isLoading: loadingConversations, refetch: refetchConversations } = useWhatsAppConversations();
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [qrCode, setQrCode] = useState<string>('');
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const evolutionIntegration = integrations?.find(int => int.type === 'evolution_api');

  console.log('🎯 WhatsAppChats: Renderizando com dados:', {
    conversations: conversations?.length || 0,
    loadingConversations,
    evolutionIntegration: !!evolutionIntegration,
    isConnected,
    connectionStatus
  });

  // Converter conversas do banco para formato da tela
  const chats = (conversations || []).map(conv => ({
    id: conv.id,
    name: conv.contact_name,
    lastMessage: conv.last_message || 'Nova conversa',
    timestamp: conv.last_message_time ? new Date(conv.last_message_time).getTime() : Date.now(),
    unreadCount: conv.unread_count || 0,
    phoneNumber: conv.contact_phone,
    profilePicUrl: undefined,
    isGroup: conv.contact_phone?.includes('@g.us') || false,
    participantsCount: undefined
  }));

  const checkConnection = async () => {
    if (!evolutionIntegration) {
      console.log('🔍 WhatsAppChats: Nenhuma integração Evolution API encontrada');
      return;
    }

    try {
      console.log('🔍 WhatsAppChats: Verificando conexão da Evolution API...');
      const service = new EvolutionApiService(evolutionIntegration);
      const status = await service.checkInstanceStatus();
      
      console.log('📊 WhatsAppChats: Status da conexão:', status);
      
      setIsConnected(status.active);
      setConnectionStatus(status.active ? 'connected' : 'disconnected');
      
      if (status.active) {
        console.log('✅ WhatsAppChats: Conectado! Atualizando conversas...');
        await refetchConversations();
      } else {
        console.log('❌ WhatsAppChats: Não conectado');
      }
    } catch (error) {
      console.error('❌ WhatsAppChats: Erro ao verificar conexão:', error);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
  };

  const connectToWhatsApp = async () => {
    if (!evolutionIntegration) {
      toast({
        title: "Erro",
        description: "Integração Evolution API não configurada",
        variant: "destructive"
      });
      return;
    }

    if (!evolutionIntegration.api_token) {
      toast({
        title: "Erro",
        description: "Configuração da Evolution API inválida - API Token é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('connecting');

    try {
      console.log('🔄 WhatsAppChats: Iniciando conexão com WhatsApp...');
      const service = new EvolutionApiService(evolutionIntegration);
      const instanceInfo = await service.getInstanceInfo();
      
      if (instanceInfo.error) {
        toast({
          title: "Erro na conexão",
          description: instanceInfo.error,
          variant: "destructive"
        });
        setIsConnecting(false);
        setConnectionStatus('disconnected');
        return;
      }
      
      if (instanceInfo.connected) {
        setIsConnected(true);
        setConnectionStatus('connected');
        setIsConnecting(false);
        await refetchConversations();
        toast({
          title: "Conectado!",
          description: "WhatsApp Web já está conectado",
        });
      } else if (instanceInfo.qrCode) {
        setQrCode(instanceInfo.qrCode);
        setIsQrDialogOpen(true);
        setConnectionStatus('waiting_qr');
        
        const pollConnection = setInterval(async () => {
          const status = await service.checkInstanceStatus();
          if (status.active) {
            clearInterval(pollConnection);
            setIsConnected(true);
            setConnectionStatus('connected');
            setIsQrDialogOpen(false);
            setIsConnecting(false);
            await refetchConversations();
            toast({
              title: "Conectado!",
              description: "WhatsApp Web conectado com sucesso",
            });
          }
        }, 3000);
        
        setTimeout(() => {
          clearInterval(pollConnection);
          if (!isConnected) {
            setIsConnecting(false);
            setIsQrDialogOpen(false);
            setConnectionStatus('disconnected');
            toast({
              title: "Tempo esgotado",
              description: "Conexão não foi estabelecida. Tente novamente.",
              variant: "destructive"
            });
          }
        }, 120000);
      } else {
        setIsConnecting(false);
        setConnectionStatus('disconnected');
        toast({
          title: "Erro",
          description: "Não foi possível obter QR Code",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ WhatsAppChats: Erro ao conectar:', error);
      setIsConnecting(false);
      setConnectionStatus('disconnected');
      toast({
        title: "Erro na conexão",
        description: "Não foi possível conectar ao WhatsApp Web",
        variant: "destructive"
      });
    }
  };

  const disconnectFromWhatsApp = async () => {
    if (!evolutionIntegration) return;

    try {
      const service = new EvolutionApiService(evolutionIntegration);
      await service.disconnectInstance();
      
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setSelectedChat(null);
      setMessages([]);
      
      toast({
        title: "Desconectado",
        description: "WhatsApp Web foi desconectado",
      });
    } catch (error) {
      console.error('❌ WhatsAppChats: Erro ao desconectar:', error);
      toast({
        title: "Erro",
        description: "Erro ao desconectar do WhatsApp Web",
        variant: "destructive"
      });
    }
  };

  const loadMessages = async (chat: any) => {
    if (!evolutionIntegration) return;

    try {
      console.log('📥 WhatsAppChats: Carregando mensagens para:', chat.name);
      const service = new EvolutionApiService(evolutionIntegration);
      const messagesData = await service.getMessages(chat.phoneNumber);
      
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
      console.error('❌ WhatsAppChats: Erro ao carregar mensagens:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar mensagens",
        variant: "destructive"
      });
    }
  };

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
      console.error('❌ WhatsAppChats: Erro ao enviar mensagem:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive"
      });
    }
  };

  const selectChat = async (chat: any) => {
    console.log('💬 WhatsAppChats: Selecionando chat:', chat.name);
    setSelectedChat(chat);
    await loadMessages(chat);
  };

  useEffect(() => {
    if (evolutionIntegration) {
      console.log('🔄 WhatsAppChats: Integração Evolution API encontrada, verificando conexão...');
      checkConnection();
    } else {
      console.log('❌ WhatsAppChats: Integração Evolution API não encontrada');
    }
  }, [evolutionIntegration]);

  // Auto-refresh quando conectado
  useEffect(() => {
    if (isConnected && evolutionIntegration) {
      console.log('🔄 WhatsAppChats: Configurando auto-refresh das conversas...');
      const interval = setInterval(() => {
        refetchConversations();
      }, 30000); // A cada 30 segundos

      return () => clearInterval(interval);
    }
  }, [isConnected, evolutionIntegration, refetchConversations]);

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

  if (!isConnected) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-center">
              <MessageSquare className="h-6 w-6" />
              WhatsApp Web
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                {connectionStatus === 'connecting' || connectionStatus === 'waiting_qr' ? (
                  <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm capitalize">
                  {connectionStatus === 'connecting' && 'Conectando...'}
                  {connectionStatus === 'waiting_qr' && 'Aguardando QR Code...'}
                  {connectionStatus === 'disconnected' && 'Desconectado'}
                </span>
                <Badge variant={connectionStatus === 'disconnected' ? 'destructive' : 'default'}>
                  {connectionStatus}
                </Badge>
              </div>
              
              <Button 
                onClick={connectToWhatsApp} 
                disabled={isConnecting}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Conectar WhatsApp Web
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Sidebar - Conversas */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 border-r bg-background overflow-hidden flex flex-col`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Conversas ({chats.length})
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetchConversations()}
                disabled={loadingConversations}
              >
                <RefreshCw className={`h-4 w-4 ${loadingConversations ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => selectChat(chat)}
              className={`p-3 border-b cursor-pointer hover:bg-accent/50 ${
                selectedChat?.id === chat.id ? 'bg-accent' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      {chat.isGroup ? (
                        <Users className="h-4 w-4 text-blue-500" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-green-500" />
                      )}
                      <h4 className="font-medium truncate">{chat.name}</h4>
                    </div>
                    {chat.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {chat.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.lastMessage}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate">
                      {chat.phoneNumber}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(chat.timestamp).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ))}
          
          {chats.length === 0 && !loadingConversations && (
            <div className="p-6 text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma conversa encontrada</p>
              <Button 
                onClick={() => refetchConversations()} 
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Carregar Conversas
              </Button>
            </div>
          )}

          {loadingConversations && (
            <div className="p-6 text-center">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
              <p className="text-sm text-muted-foreground">Carregando conversas...</p>
            </div>
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="h-16 border-b bg-background flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            
            {selectedChat ? (
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <div>
                  <h3 className="font-medium">{selectedChat.name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedChat.phoneNumber}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <span>WhatsApp Web</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-green-500" />
              <Badge variant="default">Conectado</Badge>
            </div>
            
            <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
              <Button variant="ghost" size="sm" onClick={() => setIsConfigDialogOpen(true)}>
                <Settings className="h-4 w-4" />
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configurações WhatsApp Web</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-5 w-5 text-green-500" />
                      <span className="text-sm">Status: Conectado</span>
                    </div>
                    <Badge variant="default">Ativo</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      onClick={() => refetchConversations()} 
                      variant="outline"
                      className="w-full"
                      disabled={loadingConversations}
                    >
                      {loadingConversations ? (
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
                    
                    <Button 
                      onClick={disconnectFromWhatsApp} 
                      variant="destructive"
                      className="w-full"
                    >
                      Desconectar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Área de Mensagens */}
        <div className="flex-1 flex flex-col min-h-0">
          {selectedChat ? (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isFromMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                        message.isFromMe
                          ? 'bg-green-500 text-white'
                          : 'bg-muted text-foreground'
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
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma mensagem ainda</p>
                      <p className="text-sm">Inicie uma conversa enviando uma mensagem</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t bg-background flex-shrink-0">
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
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
                <p>Escolha uma conversa da lista para começar a conversar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp Web</DialogTitle>
          </DialogHeader>
          <div className="text-center p-6">
            <QrCode className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Escaneie o QR Code</h3>
            <p className="text-muted-foreground mb-4">
              Use seu WhatsApp para escanear o código QR e conectar
            </p>
            {qrCode && (
              <div className="bg-white p-4 rounded-lg inline-block border mb-4">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
            )}
            <div className="mt-4">
              <RefreshCw className="h-4 w-4 animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">Aguardando conexão...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhatsAppChats;
