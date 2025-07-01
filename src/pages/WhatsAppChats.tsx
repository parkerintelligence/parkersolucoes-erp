
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  MessageCircle, 
  Phone, 
  User, 
  Clock,
  Search,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Settings
} from 'lucide-react';
import { useChatwootAPI } from '@/hooks/useChatwootAPI';
import { ChatwootSimpleConfig } from '@/components/ChatwootSimpleConfig';
import { ChatwootMessageDialog } from '@/components/ChatwootMessageDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const WhatsAppChats = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [showConfig, setShowConfig] = useState(false);
  
  const {
    isConfigured,
    conversations,
    isLoading,
    error,
    refetchConversations,
    updateConversationStatus
  } = useChatwootAPI();

  const filteredConversations = conversations.filter(conv => 
    conv.meta?.sender?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.meta?.sender?.phone_number?.includes(searchTerm) ||
    conv.messages?.some(msg => 
      msg.content?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'resolved': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Aberta';
      case 'resolved': return 'Resolvida';
      case 'pending': return 'Pendente';
      default: return status;
    }
  };

  if (!isConfigured) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Conversas WhatsApp</h1>
              <p className="text-gray-600">Configure o Chatwoot para acessar as conversas</p>
            </div>
          </div>
          
          <ChatwootSimpleConfig />
        </div>
      </Layout>
    );
  }

  if (showConfig) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configuração Chatwoot</h1>
              <p className="text-gray-600">Atualize as configurações do Chatwoot</p>
            </div>
            <Button 
              variant="outline"
              onClick={() => setShowConfig(false)}
            >
              Voltar às Conversas
            </Button>
          </div>
          
          <ChatwootSimpleConfig />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-lg flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Conversas WhatsApp</h1>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Conectado via Chatwoot
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfig(true)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Configurações
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={refetchConversations}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar conversas por nome, telefone ou mensagem..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">Erro ao carregar conversas</p>
                  <p className="text-sm text-red-700">{error.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Carregando conversas...
              </h3>
              <p className="text-gray-600">Conectando com o Chatwoot</p>
            </CardContent>
          </Card>
        )}

        {/* Conversations List */}
        {!isLoading && (
          <div className="grid gap-4">
            {filteredConversations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa'}
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm 
                      ? `Nenhum resultado para "${searchTerm}"` 
                      : 'Não há conversas disponíveis no momento'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredConversations.map((conversation) => (
                <Card key={conversation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-green-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {conversation.meta?.sender?.name || 'Usuário sem nome'}
                            </h3>
                            <Badge className={getStatusColor(conversation.status)}>
                              {getStatusText(conversation.status)}
                            </Badge>
                            {conversation.unread_count > 0 && (
                              <Badge variant="destructive">
                                {conversation.unread_count} nova(s)
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {conversation.meta?.sender?.phone_number || 'N/A'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {format(new Date(conversation.last_activity_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </div>
                          </div>
                          
                          {conversation.messages && conversation.messages.length > 0 && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm text-gray-800 line-clamp-2">
                                <strong>
                                  {conversation.messages[conversation.messages.length - 1].message_type === 0 ? 'Cliente' : 'Agente'}:
                                </strong>{' '}
                                {conversation.messages[conversation.messages.length - 1].content}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <ChatwootMessageDialog 
                          conversation={conversation}
                          onMessageSent={refetchConversations}
                        />
                        
                        <div className="flex gap-1">
                          {conversation.status !== 'resolved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateConversationStatus.mutate({
                                conversationId: conversation.id,
                                status: 'resolved'
                              })}
                              disabled={updateConversationStatus.isPending}
                            >
                              Resolver
                            </Button>
                          )}
                          
                          {conversation.status === 'resolved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateConversationStatus.mutate({
                                conversationId: conversation.id,
                                status: 'open'
                              })}
                              disabled={updateConversationStatus.isPending}
                            >
                              Reabrir
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default WhatsAppChats;
