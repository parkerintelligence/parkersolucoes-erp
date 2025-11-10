import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  AlertTriangle,
  User,
  Phone,
  Mail,
  MessageCircle,
  X
} from 'lucide-react';
import { useChatwootAPI, ChatwootConversation } from '@/hooks/useChatwootAPI';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

const Atendimentos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<ChatwootConversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'pending' | 'resolved'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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

  // Auto-refresh conversas a cada 30 segundos
  useEffect(() => {
    if (isConfigured && !error) {
      const interval = setInterval(() => {
        refetchConversations?.();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isConfigured, error, refetchConversations]);

  // Scroll automático para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  // Garantir que conversations é sempre um array
  const safeConversations = Array.isArray(conversations) ? conversations : [];

  // Filtrar conversas por busca e status
  const filteredConversations = safeConversations
    .filter(conv => {
      const matchesSearch = 
        conv.meta?.sender?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.meta?.sender?.phone_number?.includes(searchTerm) ||
        conv.id?.toString().includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime());

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
        description: "Mensagem enviada!"
      });
      
      // Atualizar conversas após enviar mensagem
      setTimeout(() => refetchConversations?.(), 1000);
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
        description: `Conversa marcada como ${status === 'open' ? 'aberta' : status === 'resolved' ? 'resolvida' : 'pendente'}!`
      });
      
      // Atualizar conversas
      setTimeout(() => refetchConversations?.(), 500);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      open: { color: 'bg-green-500', icon: Clock, label: 'Aberta' },
      resolved: { color: 'bg-blue-500', icon: CheckCircle2, label: 'Resolvida' },
      pending: { color: 'bg-yellow-500', icon: AlertTriangle, label: 'Pendente' }
    };
    
    const config = configs[status as keyof typeof configs] || configs.open;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(date, 'HH:mm');
    } else if (diffInHours < 48) {
      return 'Ontem ' + format(date, 'HH:mm');
    } else {
      return format(date, 'dd/MM/yyyy HH:mm');
    }
  };

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-primary" />
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
          <MessageSquare className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Atendimentos Chatwoot</h1>
            <p className="text-muted-foreground">Gerencie suas conversas</p>
          </div>
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Erro ao carregar conversas</h3>
            <p className="text-red-700 mb-4">{error.message}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => refetchConversations?.()} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Button>
              <Button 
                onClick={() => testConnection?.mutate(undefined)} 
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
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Atendimentos</h1>
            <p className="text-sm text-muted-foreground">
              {filteredConversations.length} conversas • {safeConversations.filter(c => c.status === 'open').length} abertas
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => refetchConversations?.()} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* Conversations List */}
        <Card className="col-span-12 lg:col-span-4 flex flex-col">
          <CardHeader className="pb-3">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar conversas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="all" className="text-xs">
                    Todas
                    <Badge variant="secondary" className="ml-1 h-5 px-1">
                      {safeConversations.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="open" className="text-xs">
                    Abertas
                    <Badge variant="secondary" className="ml-1 h-5 px-1 bg-green-100">
                      {safeConversations.filter(c => c.status === 'open').length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="text-xs">
                    Pendentes
                    <Badge variant="secondary" className="ml-1 h-5 px-1 bg-yellow-100">
                      {safeConversations.filter(c => c.status === 'pending').length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="resolved" className="text-xs">
                    Resolvidas
                    <Badge variant="secondary" className="ml-1 h-5 px-1 bg-blue-100">
                      {safeConversations.filter(c => c.status === 'resolved').length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          
          <ScrollArea className="flex-1">
            <CardContent className="p-2">
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-sm text-muted-foreground">Carregando conversas...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Nenhuma conversa encontrada</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredConversations.map((conversation) => {
                    const lastMessage = conversation.messages?.[conversation.messages.length - 1];
                    const isSelected = selectedConversation?.id === conversation.id;
                    
                    return (
                      <div
                        key={conversation.id}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-primary/10 border-2 border-primary'
                            : 'hover:bg-accent border-2 border-transparent'
                        }`}
                        onClick={() => setSelectedConversation(conversation)}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(conversation.meta?.sender?.name || 'Cliente')}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h3 className="font-medium text-sm truncate">
                                {conversation.meta?.sender?.name || 'Cliente'}
                              </h3>
                              {getStatusBadge(conversation.status)}
                            </div>
                            
                            {lastMessage && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {lastMessage.content}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {formatMessageTime(conversation.last_activity_at)}
                              </span>
                              {conversation.unread_count > 0 && (
                                <Badge variant="destructive" className="h-4 px-1 text-xs">
                                  {conversation.unread_count}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className="col-span-12 lg:col-span-8 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(selectedConversation.meta?.sender?.name || 'Cliente')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {selectedConversation.meta?.sender?.name || 'Cliente'}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {selectedConversation.meta?.sender?.phone_number && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {selectedConversation.meta.sender.phone_number}
                          </span>
                        )}
                        {selectedConversation.meta?.sender?.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {selectedConversation.meta.sender.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedConversation.status)}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedConversation(null)}
                      className="lg:hidden"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Status Actions */}
                <div className="flex gap-2 mt-3">
                  <Button 
                    size="sm" 
                    variant={selectedConversation.status === 'open' ? 'default' : 'outline'}
                    onClick={() => handleStatusChange('open')}
                    disabled={updateConversationStatus.isPending || selectedConversation.status === 'open'}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Abrir
                  </Button>
                  <Button 
                    size="sm" 
                    variant={selectedConversation.status === 'pending' ? 'default' : 'outline'}
                    onClick={() => handleStatusChange('pending')}
                    disabled={updateConversationStatus.isPending || selectedConversation.status === 'pending'}
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Pendente
                  </Button>
                  <Button 
                    size="sm" 
                    variant={selectedConversation.status === 'resolved' ? 'default' : 'outline'}
                    onClick={() => handleStatusChange('resolved')}
                    disabled={updateConversationStatus.isPending || selectedConversation.status === 'resolved'}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Resolver
                  </Button>
                </div>
              </CardHeader>
              
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                    selectedConversation.messages.map((message) => {
                      const isOutgoing = message.message_type === 1;
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] ${isOutgoing ? 'order-2' : 'order-1'}`}>
                            <div
                              className={`rounded-lg p-3 ${
                                isOutgoing
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-accent text-accent-foreground'
                              }`}
                            >
                              {!isOutgoing && message.sender?.name && (
                                <p className="text-xs font-medium mb-1 opacity-70">
                                  {message.sender.name}
                                </p>
                              )}
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              <p className={`text-xs mt-1 ${isOutgoing ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                {formatMessageTime(message.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma mensagem ainda</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Digite sua mensagem..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="min-h-[60px] max-h-[120px] resize-none"
                    disabled={!selectedConversation.can_reply}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={sendMessage.isPending || !messageText.trim() || !selectedConversation.can_reply}
                    className="px-6"
                  >
                    {sendMessage.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {!selectedConversation.can_reply && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Esta conversa não permite resposta
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Pressione Enter para enviar, Shift+Enter para quebrar linha
                </p>
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Nenhuma conversa selecionada</h3>
                <p className="text-sm">
                  Selecione uma conversa da lista para começar
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Atendimentos;
