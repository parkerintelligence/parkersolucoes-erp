
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, RefreshCw, Send, Search, Archive, Ban, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useChatwootAPI, ChatwootConversation } from '@/hooks/useChatwootAPI';
import { ChatwootMessageDialog } from '@/components/ChatwootMessageDialog';

const WhatsAppChats = () => {
  const { data: integrations = [], isLoading: integrationsLoading } = useIntegrations();
  const { 
    conversations, 
    isLoading: conversationsLoading, 
    error: conversationsError,
    isConfigured,
    updateConversationStatus,
    refetchConversations 
  } = useChatwootAPI();
  
  const [selectedIntegration, setSelectedIntegration] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<ChatwootConversation | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);

  const chatwootIntegrations = integrations.filter(i => 
    i.type === 'chatwoot' && i.is_active
  );
  
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.meta.sender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.meta.sender.phone_number?.includes(searchTerm) ||
                         conv.messages.some(msg => msg.content.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesIntegration = selectedIntegration === '' || true; // For now, show all since we're using one Chatwoot instance
    return matchesSearch && matchesIntegration;
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      'open': 'bg-green-100 text-green-800 border-green-200',
      'resolved': 'bg-gray-100 text-gray-800 border-gray-200',
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    const labels = {
      'open': 'Aberta',
      'resolved': 'Resolvida',
      'pending': 'Pendente',
    };
    const icons = {
      'open': <MessageCircle className="h-3 w-3" />,
      'resolved': <CheckCircle className="h-3 w-3" />,
      'pending': <Clock className="h-3 w-3" />,
    };
    
    return (
      <Badge className={`${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'} flex items-center gap-1`}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Agora';
      if (diffMins < 60) return `${diffMins} min atrás`;
      if (diffHours < 24) return `${diffHours}h atrás`;
      if (diffDays < 7) return `${diffDays}d atrás`;
      
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Horário inválido';
    }
  };

  const getLastMessage = (conversation: ChatwootConversation) => {
    if (!conversation.messages || conversation.messages.length === 0) {
      return 'Sem mensagens';
    }
    
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const prefix = lastMessage.message_type === 1 ? '📤 Você: ' : '📥 ';
    return prefix + (lastMessage.content || 'Mensagem sem conteúdo');
  };

  const handleSendMessage = (conversation: ChatwootConversation) => {
    setSelectedConversation(conversation);
    setMessageDialogOpen(true);
  };

  const handleArchive = async (conversation: ChatwootConversation) => {
    await updateConversationStatus.mutateAsync({
      conversationId: conversation.id,
      status: 'resolved'
    });
  };

  const handleReopen = async (conversation: ChatwootConversation) => {
    await updateConversationStatus.mutateAsync({
      conversationId: conversation.id,
      status: 'open'
    });
  };

  const activeConversations = filteredConversations.filter(c => c.status === 'open');
  const totalUnread = filteredConversations.reduce((sum, c) => sum + c.unread_count, 0);

  if (integrationsLoading || conversationsLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-blue-600">Carregando conversas...</div>
        </div>
      </Layout>
    );
  }

  if (!isConfigured) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Chatwoot não configurado</h2>
            <p className="text-gray-600 mb-4">
              Configure uma integração Chatwoot no painel administrativo para visualizar as conversas.
            </p>
            <Button asChild>
              <a href="/admin">Configurar Chatwoot</a>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (conversationsError) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro de Conexão</h2>
            <p className="text-gray-600 mb-4">
              {conversationsError.message || 'Não foi possível conectar ao Chatwoot.'}
            </p>
            <Button onClick={refetchConversations}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
              <MessageCircle className="h-8 w-8" />
              Conversas do WhatsApp
            </h1>
            <p className="text-blue-600">Gerencie suas conversas através do Chatwoot</p>
          </div>
          <Button variant="outline" size="sm" onClick={refetchConversations}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Estatísticas das Conversas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{filteredConversations.length}</p>
                  <p className="text-sm text-blue-600">Total de Conversas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-900">{activeConversations.length}</p>
                  <p className="text-sm text-green-600">Abertas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-orange-900">{totalUnread}</p>
                  <p className="text-sm text-orange-600">Não Lidas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-purple-900">{chatwootIntegrations.length}</p>
                  <p className="text-sm text-purple-600">Integrações Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Buscar conversas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={selectedIntegration} onValueChange={setSelectedIntegration}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Filtrar por integração" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as integrações</SelectItem>
                  {chatwootIntegrations.map((integration) => (
                    <SelectItem key={integration.id} value={integration.id}>
                      {integration.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Conversas */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Conversas do Chatwoot</CardTitle>
            <CardDescription>
              {filteredConversations.length > 0 
                ? `Mostrando ${filteredConversations.length} conversas`
                : 'Nenhuma conversa encontrada'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredConversations.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contato</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Última Mensagem</TableHead>
                    <TableHead>Última Atividade</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Não Lidas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConversations.map((conversation) => (
                    <TableRow key={conversation.id} className="hover:bg-blue-50">
                      <TableCell className="font-medium">{conversation.meta.sender.name}</TableCell>
                      <TableCell>{conversation.meta.sender.phone_number || 'N/A'}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {getLastMessage(conversation)}
                      </TableCell>
                      <TableCell>{formatTime(conversation.last_activity_at)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{conversation.meta.channel}</Badge>
                      </TableCell>
                      <TableCell>
                        {conversation.unread_count > 0 && (
                          <Badge variant="destructive">{conversation.unread_count}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(conversation.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            title="Responder"
                            onClick={() => handleSendMessage(conversation)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          {conversation.status === 'open' ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              title="Resolver"
                              onClick={() => handleArchive(conversation)}
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              title="Reabrir"
                              onClick={() => handleReopen(conversation)}
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma conversa encontrada com os filtros aplicados.</p>
                {chatwootIntegrations.length === 0 && (
                  <p className="text-sm mt-2">Configure uma integração Chatwoot no menu Administração primeiro.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ChatwootMessageDialog
        conversation={selectedConversation}
        open={messageDialogOpen}
        onOpenChange={setMessageDialogOpen}
      />
    </Layout>
  );
};

export default WhatsAppChats;
