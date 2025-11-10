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
  Send,
  AlertCircle,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageCircle,
  X,
  ChevronRight,
  User
} from 'lucide-react';
import { useChatwootAPI, ChatwootConversation } from '@/hooks/useChatwootAPI';
import { useConversationMessages } from '@/hooks/useConversationMessages';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { ChatwootStats } from '@/components/chatwoot/ChatwootStats';
import { ChatwootAgentSelector } from '@/components/chatwoot/ChatwootAgentSelector';
import { ChatwootContactPanel } from '@/components/chatwoot/ChatwootContactPanel';
import { ChatwootQuickReplies } from '@/components/chatwoot/ChatwootQuickReplies';
import { ChatwootMessageStatus } from '@/components/chatwoot/ChatwootMessageStatus';
import { ChatwootFileUpload } from '@/components/chatwoot/ChatwootFileUpload';
import { ChatwootLabelManager } from '@/components/chatwoot/ChatwootLabelManager';

const Atendimentos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<ChatwootConversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'pending' | 'resolved'>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'mine' | 'unassigned'>('all');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showContactPanel, setShowContactPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    isConfigured,
    integrationId,
    conversations = [], 
    isLoading, 
    error,
    testConnection,
    sendMessage,
    updateConversationStatus,
    refetchConversations
  } = useChatwootAPI();

  // Load messages for selected conversation
  const {
    messages: conversationMessages,
    isLoading: messagesLoading,
    refetch: refetchMessages
  } = useConversationMessages(integrationId, selectedConversation?.id.toString() || null);

  // Get current user ID from Chatwoot
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!integrationId) return;
      
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: { session } } = await supabase.auth.refreshSession();
        if (!session) return;

        const response = await fetch(
          'https://mpvxppgoyadwukkfoccs.supabase.co/functions/v1/chatwoot-proxy',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              integrationId,
              endpoint: '/profile',
              method: 'GET',
            }),
          }
        );

        if (response.ok) {
          const profile = await response.json();
          setCurrentUserId(profile.id);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchCurrentUser();
  }, [integrationId]);

  // Auto-refresh conversations every 30 seconds
  useEffect(() => {
    if (isConfigured && !error) {
      const interval = setInterval(() => {
        refetchConversations?.();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isConfigured, error, refetchConversations]);

  // Auto-scroll to last message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  // Auto-refresh messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      refetchMessages?.();
    }
  }, [selectedConversation]);

  const safeConversations = Array.isArray(conversations) ? conversations : [];

  const filteredConversations = safeConversations
    .filter(conv => {
      const matchesSearch = 
        conv.meta?.sender?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.meta?.sender?.phone_number?.includes(searchTerm) ||
        conv.id?.toString().includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
      
      // Assignment filter
      let matchesAssignment = true;
      if (assignmentFilter === 'mine') {
        matchesAssignment = conv.assignee?.id === currentUserId;
      } else if (assignmentFilter === 'unassigned') {
        matchesAssignment = !conv.assignee || conv.assignee === null;
      }
      
      return matchesSearch && matchesStatus && matchesAssignment;
    })
    .sort((a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime());

  // Calculate counts for assignment filter
  const myConversationsCount = safeConversations.filter(c => c.assignee?.id === currentUserId).length;
  const unassignedCount = safeConversations.filter(c => !c.assignee || c.assignee === null).length;

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
      
      // Refresh messages immediately after sending
      setTimeout(() => {
        refetchMessages?.();
        refetchConversations?.();
      }, 500);
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
      
      // Update local state immediately
      setSelectedConversation({
        ...selectedConversation,
        status
      });
      
      // Refetch conversations to update the list
      setTimeout(() => {
        refetchConversations?.();
        refetchMessages?.();
      }, 500);
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

      {/* Statistics Dashboard */}
      <ChatwootStats />

      {/* Assignment Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground mr-2">
              Filtrar por:
            </span>
            <Button
              variant={assignmentFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAssignmentFilter('all')}
              className="gap-2"
            >
              Todas
              <Badge variant={assignmentFilter === 'all' ? 'secondary' : 'outline'} className="h-5 px-2">
                {safeConversations.length}
              </Badge>
            </Button>
            <Button
              variant={assignmentFilter === 'mine' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAssignmentFilter('mine')}
              className="gap-2"
            >
              Minhas
              <Badge variant={assignmentFilter === 'mine' ? 'secondary' : 'outline'} className="h-5 px-2">
                {myConversationsCount}
              </Badge>
            </Button>
            <Button
              variant={assignmentFilter === 'unassigned' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAssignmentFilter('unassigned')}
              className="gap-2"
            >
              Não Atribuídas
              <Badge variant={assignmentFilter === 'unassigned' ? 'secondary' : 'outline'} className="h-5 px-2">
                {unassignedCount}
              </Badge>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* Conversations List */}
        <Card className="col-span-12 lg:col-span-3 flex flex-col">
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
        <Card className={`${showContactPanel ? 'col-span-12 lg:col-span-6' : 'col-span-12 lg:col-span-9'} flex flex-col`}>
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
                      <p className="text-xs text-muted-foreground">
                        {selectedConversation.meta?.sender?.phone_number}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedConversation.status)}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowContactPanel(!showContactPanel)}
                      className="hidden lg:flex"
                    >
                      <ChevronRight className={`h-4 w-4 transition-transform ${showContactPanel ? 'rotate-180' : ''}`} />
                    </Button>
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
                
                {/* Agent Selector */}
                <div className="mt-3">
                  <ChatwootAgentSelector 
                    conversationId={selectedConversation.id.toString()}
                    currentAgentId={selectedConversation.assignee?.id}
                  />
                </div>

                {/* Labels */}
                <ChatwootLabelManager 
                  conversationId={selectedConversation.id.toString()}
                  currentLabels={[]}
                />
                
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
                  
                  <Separator orientation="vertical" className="h-8" />
                  
                  <Button
                    size="sm"
                    variant={showContactPanel ? 'default' : 'outline'}
                    onClick={() => setShowContactPanel(!showContactPanel)}
                    className="ml-auto"
                    title={showContactPanel ? 'Ocultar informações do contato' : 'Mostrar informações do contato'}
                  >
                    <User className="h-3 w-3 mr-1" />
                    Contato
                  </Button>
                </div>
              </CardHeader>
              
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-sm text-muted-foreground">Carregando mensagens...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversationMessages && conversationMessages.length > 0 ? (
                      conversationMessages.map((message) => {
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
                                    ? 'bg-accent text-accent-foreground'
                                    : 'bg-primary text-primary-foreground'
                                }`}
                              >
                                {!isOutgoing && message.sender?.name && (
                                  <p className="text-xs font-medium mb-1 opacity-70">
                                    {message.sender.name}
                                  </p>
                                )}
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                <div className="flex items-center justify-between mt-1">
                                  <p className={`text-xs ${isOutgoing ? 'text-accent-foreground/70' : 'text-primary-foreground/70'}`}>
                                    {formatMessageTime(message.created_at)}
                                  </p>
                                  <ChatwootMessageStatus 
                                    status={message.status}
                                    messageType={message.message_type}
                                  />
                                </div>
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
                )}
              </ScrollArea>
              
              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="mb-2">
                  <ChatwootQuickReplies onSelectReply={setMessageText} />
                </div>
                <div className="flex gap-2">
                  <ChatwootFileUpload 
                    conversationId={selectedConversation.id.toString()}
                  />
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

        {/* Contact Panel */}
        {showContactPanel && (
          <div className="col-span-12 lg:col-span-3 hidden lg:block">
            <ChatwootContactPanel conversation={selectedConversation} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Atendimentos;
