
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useIntegrations } from '@/hooks/useIntegrations';
import { EvolutionApiService } from '@/utils/evolutionApiService';
import { 
  MessageSquare, 
  QrCode, 
  Wifi, 
  WifiOff, 
  Send, 
  Phone,
  Settings,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: number;
  isFromMe: boolean;
}

interface WhatsAppConversation {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: number;
  unreadCount: number;
  phoneNumber: string;
}

const WhatsAppChats = () => {
  const { data: integrations } = useIntegrations();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [qrCode, setQrCode] = useState<string>('');
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);

  const evolutionIntegration = integrations?.find(int => int.type === 'evolution_api');

  const checkConnection = async () => {
    if (!evolutionIntegration) return;

    try {
      const service = new EvolutionApiService(evolutionIntegration);
      const status = await service.checkInstanceStatus();
      setIsConnected(status.active);
      setConnectionStatus(status.active ? 'connected' : 'disconnected');
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
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

    setIsConnecting(true);
    try {
      // Simular conexão e geração de QR Code
      setQrCode('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
      setIsQrDialogOpen(true);
      
      // Simular processo de conexão
      setTimeout(() => {
        setIsConnected(true);
        setConnectionStatus('connected');
        setIsQrDialogOpen(false);
        setIsConnecting(false);
        loadConversations();
        toast({
          title: "Conectado!",
          description: "WhatsApp Web conectado com sucesso",
        });
      }, 3000);
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

  const disconnectFromWhatsApp = async () => {
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setConversations([]);
    setSelectedConversation(null);
    setMessages([]);
    toast({
      title: "Desconectado",
      description: "WhatsApp Web foi desconectado",
    });
  };

  const loadConversations = async () => {
    // Simular carregamento de conversas
    const mockConversations: WhatsAppConversation[] = [
      {
        id: '1',
        name: 'João Silva',
        lastMessage: 'Olá, preciso de ajuda com o sistema',
        timestamp: Date.now() - 300000,
        unreadCount: 2,
        phoneNumber: '5511999999999'
      },
      {
        id: '2',
        name: 'Maria Santos',
        lastMessage: 'Obrigada pelo atendimento!',
        timestamp: Date.now() - 600000,
        unreadCount: 0,
        phoneNumber: '5511888888888'
      }
    ];
    setConversations(mockConversations);
  };

  const loadMessages = async (conversation: WhatsAppConversation) => {
    // Simular carregamento de mensagens
    const mockMessages: WhatsAppMessage[] = [
      {
        id: '1',
        from: conversation.phoneNumber,
        to: 'me',
        body: 'Olá, preciso de ajuda com o sistema',
        timestamp: Date.now() - 300000,
        isFromMe: false
      },
      {
        id: '2',
        from: 'me',
        to: conversation.phoneNumber,
        body: 'Olá! Como posso ajudá-lo?',
        timestamp: Date.now() - 250000,
        isFromMe: true
      }
    ];
    setMessages(mockMessages);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !evolutionIntegration) return;

    try {
      const service = new EvolutionApiService(evolutionIntegration);
      const result = await service.sendMessage(selectedConversation.phoneNumber, newMessage);
      
      if (result.success) {
        const newMsg: WhatsAppMessage = {
          id: Date.now().toString(),
          from: 'me',
          to: selectedConversation.phoneNumber,
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
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive"
      });
    }
  };

  const selectConversation = (conversation: WhatsAppConversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation);
  };

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
        {/* Painel de Status e Conexão */}
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
              </div>
            </CardContent>
          </Card>

          {/* Lista de Conversas */}
          {isConnected && (
            <Card className="flex-1">
              <CardHeader>
                <CardTitle>Conversas ({conversations.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => selectConversation(conversation)}
                      className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedConversation?.id === conversation.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{conversation.name}</h4>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-400">
                              {conversation.phoneNumber}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(conversation.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Área de Chat */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {selectedConversation.name}
                  <span className="text-sm text-gray-500">
                    ({selectedConversation.phoneNumber})
                  </span>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Área de Mensagens */}
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
                        <p className="text-sm">{message.body}</p>
                        <span className="text-xs opacity-75">
                          {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Campo de Envio */}
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
                <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
                <p className="text-gray-600">
                  Escolha uma conversa da lista para começar a conversar
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog QR Code */}
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
              <div className="bg-white p-4 rounded-lg inline-block">
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
