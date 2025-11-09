import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, CheckCircle, Clock, RefreshCw, AlertCircle, Settings } from 'lucide-react';
import { useChatwootAPI, ChatwootConversation } from '@/hooks/useChatwootAPI';
import { ChatwootMessageDialog } from '@/components/ChatwootMessageDialog';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export default function Chatwoot() {
  const { isConfigured, conversations, isLoading, error, updateConversationStatus, refetchConversations } = useChatwootAPI();
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'open' | 'pending' | 'resolved'>('all');
  const [selectedConversation, setSelectedConversation] = useState<ChatwootConversation | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);

  // Filtrar conversas por status
  const filteredConversations = conversations.filter(conv => {
    if (selectedStatus === 'all') return true;
    return conv.status === selectedStatus;
  });

  // Calcular estatísticas
  const stats = {
    total: conversations.length,
    open: conversations.filter(c => c.status === 'open').length,
    pending: conversations.filter(c => c.status === 'pending').length,
    resolved: conversations.filter(c => c.status === 'resolved').length,
  };

  const handleSendMessage = (conversation: ChatwootConversation) => {
    setSelectedConversation(conversation);
    setMessageDialogOpen(true);
  };

  const handleChangeStatus = async (conversationId: number, newStatus: 'open' | 'resolved' | 'pending') => {
    await updateConversationStatus.mutateAsync({ conversationId, status: newStatus });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Aberta</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendente</Badge>;
      case 'resolved':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Resolvida</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLastMessage = (conversation: ChatwootConversation) => {
    const messages = conversation.messages || [];
    if (messages.length === 0) return 'Sem mensagens';
    
    const lastMessage = messages[messages.length - 1];
    const content = lastMessage.content || 'Mensagem sem conteúdo';
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  // Se não estiver configurado, mostrar alerta
  if (!isConfigured) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            Chatwoot - Caixa de Entrada
          </h1>
          <p className="text-muted-foreground">Gerencie suas conversas do Chatwoot</p>
        </div>

        <Alert className="border-yellow-500/50 bg-yellow-500/10">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-200">
            O Chatwoot não está configurado. Por favor, configure as credenciais na página de administração.
            <Link to="/admin" className="ml-2 underline font-medium">
              Ir para Admin
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            Chatwoot - Caixa de Entrada
          </h1>
          <p className="text-muted-foreground">Gerencie suas conversas do Chatwoot</p>
        </div>
        <Button 
          onClick={() => refetchConversations()} 
          variant="outline" 
          size="sm"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
        </Card>
        
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Abertas</p>
              <p className="text-2xl font-bold text-green-400">{stats.open}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </Card>
        
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </Card>
        
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Resolvidas</p>
              <p className="text-2xl font-bold text-gray-400">{stats.resolved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-gray-400" />
          </div>
        </Card>
      </div>

      {/* Tabs de filtro */}
      <Tabs value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as any)} className="mb-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="all">Todas ({stats.total})</TabsTrigger>
          <TabsTrigger value="open">Abertas ({stats.open})</TabsTrigger>
          <TabsTrigger value="pending">Pendentes ({stats.pending})</TabsTrigger>
          <TabsTrigger value="resolved">Resolvidas ({stats.resolved})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedStatus} className="mt-4">
          {/* Lista de conversas */}
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Carregando conversas...</p>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Erro ao carregar conversas: {(error as Error).message}
              </AlertDescription>
            </Alert>
          ) : filteredConversations.length === 0 ? (
            <Card className="p-12 text-center bg-card border-border">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma conversa encontrada</h3>
              <p className="text-muted-foreground">
                {selectedStatus === 'all' 
                  ? 'Não há conversas no momento.' 
                  : `Não há conversas com status "${selectedStatus}".`}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConversations.map((conversation) => (
                <Card key={conversation.id} className="p-4 bg-card border-border hover:border-primary/50 transition-colors">
                  <div className="space-y-3">
                    {/* Header do card */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {conversation.meta.sender.name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.meta.sender.phone_number}
                        </p>
                      </div>
                      {getStatusBadge(conversation.status)}
                    </div>

                    {/* Preview da última mensagem */}
                    <ScrollArea className="h-16">
                      <p className="text-sm text-muted-foreground">
                        {getLastMessage(conversation)}
                      </p>
                    </ScrollArea>

                    {/* Informações adicionais */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatTimestamp(conversation.last_activity_at)}</span>
                      {conversation.unread_count > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conversation.unread_count} não lida{conversation.unread_count > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleSendMessage(conversation)}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Enviar
                      </Button>
                      
                      {conversation.status !== 'open' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChangeStatus(conversation.id, 'open')}
                          disabled={updateConversationStatus.isPending}
                        >
                          Abrir
                        </Button>
                      )}
                      
                      {conversation.status !== 'resolved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChangeStatus(conversation.id, 'resolved')}
                          disabled={updateConversationStatus.isPending}
                        >
                          Resolver
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog para enviar mensagem */}
      <ChatwootMessageDialog
        conversation={selectedConversation}
        open={messageDialogOpen}
        onOpenChange={setMessageDialogOpen}
      />
    </div>
  );
}
