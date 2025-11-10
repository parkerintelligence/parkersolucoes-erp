import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Search, 
  RefreshCw, 
  Users, 
  Clock, 
  Send,
  AlertCircle,
  Loader2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useChatwootAPI } from '@/hooks/useChatwootAPI';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

const Atendimentos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messageText, setMessageText] = useState('');
  
  const { 
    isConfigured,
    conversations = [], 
    isLoading, 
    error,
    testConnection,
    sendMessage,
    updateConversationStatus,
    refetchConversations
  } = useChatwootAPI();

  // Garantir que conversations é sempre um array
  const safeConversations = Array.isArray(conversations) ? conversations : [];

  const filteredConversations = safeConversations.filter(conv =>
    conv.messages?.[0]?.sender?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.id?.toString().includes(searchTerm)
  );

  const handleSendMessage = async () => {
    if (!selectedConversation || !messageText.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite uma mensagem.",
        variant: "destructive"
      });
      return;
    }

    try {
      await sendMessage.mutateAsync({
        conversationId: selectedConversation.id.toString(),
        content: messageText
      });
      
      setMessageText('');
      toast({
        title: "Sucesso",
        description: "Mensagem enviada com sucesso!"
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleStatusChange = async (status: 'open' | 'resolved' | 'pending') => {
    if (!selectedConversation) return;

    try {
      await updateConversationStatus.mutateAsync({
        conversationId: selectedConversation.id.toString(),
        status
      });
      
      toast({
        title: "Sucesso",
        description: "Status da conversa atualizado!"
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'resolved': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="h-3 w-3" />;
      case 'resolved': return <CheckCircle2 className="h-3 w-3" />;
      case 'pending': return <AlertTriangle className="h-3 w-3" />;
      default: return null;
    }
  };

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Atendimentos Chatwoot</h1>
            <p className="text-muted-foreground">Configure o Chatwoot para começar</p>
          </div>
        </div>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-600" />
            <h3 className="text-lg font-semibold text-orange-800 mb-2">Configuração necessária</h3>
            <p className="text-orange-700 mb-4">
              Configure a integração do Chatwoot em Admin → Chatwoot para começar a usar.
            </p>
            <Button onClick={() => window.location.href = '/admin'}>
              Ir para Configurações
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Atendimentos Chatwoot</h1>
            <p className="text-muted-foreground">Gerencie suas conversas do Chatwoot</p>
          </div>
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Erro ao carregar conversas</h3>
            <p className="text-red-700 mb-4">{error.message}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => refetchConversations && refetchConversations()} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Button>
              <Button 
                onClick={() => testConnection && testConnection.mutate(undefined)} 
                disabled={testConnection?.isPending}
              >
                {testConnection?.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <AlertCircle className="mr-2 h-4 w-4" />
                )}
                Testar Conexão
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Atendimentos Chatwoot</h1>
            <p className="text-muted-foreground">Gerencie suas conversas do Chatwoot</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => testConnection && testConnection.mutate(undefined)} 
            disabled={testConnection?.isPending}
            variant="outline"
          >
            {testConnection?.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <AlertCircle className="mr-2 h-4 w-4" />
            )}
            Testar Conexão
          </Button>
          <Button 
            onClick={() => refetchConversations && refetchConversations()} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Conversas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeConversations.length}</div>
            <p className="text-xs text-muted-foreground">
              Conversas registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversas Abertas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {safeConversations.filter(c => c.status === 'open').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvidas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {safeConversations.filter(c => c.status === 'resolved').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Finalizadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Conversas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Conversas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Conversas ({filteredConversations.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Carregando conversas...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? (
                  <>
                    <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                    <p>Nenhuma conversa encontrada para "{searchTerm}"</p>
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                    <p>Nenhuma conversa encontrada</p>
                    <p className="text-sm">
                      Aguarde novas conversas ou teste a conexão
                    </p>
                  </>
                )}
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">
                          {conversation.messages?.[0]?.sender?.name || `Conversa #${conversation.id}`}
                        </h3>
                        <Badge className={getStatusColor(conversation.status)}>
                          {getStatusIcon(conversation.status)}
                          <span className="ml-1">{conversation.status}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ID: {conversation.id}
                      </p>
                      {conversation.messages?.[0]?.content && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {conversation.messages[0].content}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {conversation.timestamp && typeof conversation.timestamp === 'number'
                        ? formatDistanceToNow(new Date(conversation.timestamp * 1000), {
                            addSuffix: true,
                            locale: ptBR,
                          })
                        : 'Recente'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Detalhes da Conversa */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Conversa</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedConversation ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-lg">
                    {selectedConversation.messages?.[0]?.sender?.name || `Conversa #${selectedConversation.id}`}
                  </h3>
                  <p className="text-muted-foreground">ID: {selectedConversation.id}</p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <Badge className={getStatusColor(selectedConversation.status)}>
                      {getStatusIcon(selectedConversation.status)}
                      <span className="ml-1">{selectedConversation.status}</span>
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Mensagens</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedConversation.messages?.length || 0}
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Alterar Status</p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStatusChange('open')}
                      disabled={updateConversationStatus.isPending}
                    >
                      Abrir
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStatusChange('pending')}
                      disabled={updateConversationStatus.isPending}
                    >
                      Pendente
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStatusChange('resolved')}
                      disabled={updateConversationStatus.isPending}
                    >
                      Resolver
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm font-medium mb-2">Mensagens</p>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto p-3 bg-gray-50 rounded-lg">
                    {selectedConversation.messages?.map((msg: any, idx: number) => (
                      <div key={idx} className="text-sm">
                        <p className="font-medium">{msg.sender?.name || 'Cliente'}</p>
                        <p className="text-muted-foreground">{msg.content}</p>
                      </div>
                    )) || <p className="text-sm text-muted-foreground">Nenhuma mensagem</p>}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm font-medium mb-2">Enviar Mensagem</p>
                  <Textarea
                    placeholder="Digite sua mensagem..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="mb-2"
                  />
                  <Button 
                    className="w-full" 
                    onClick={handleSendMessage}
                    disabled={sendMessage.isPending || !messageText.trim()}
                  >
                    {sendMessage.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Enviar Mensagem
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                <p>Selecione uma conversa para ver os detalhes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Atendimentos;
