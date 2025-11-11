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
  User,
  TrendingUp,
  Tag
} from 'lucide-react';
import { useChatwootAPI, ChatwootConversation } from '@/hooks/useChatwootAPI';
import { useConversationMessages } from '@/hooks/useConversationMessages';
import { useChatwootRealtime, useChatwootMessageNotifications } from '@/hooks/useChatwootRealtime';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useChatwootLabels } from '@/hooks/useChatwootLabels';
import { format, isSameDay, isYesterday, isThisWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { ChatwootAgentSelector } from '@/components/chatwoot/ChatwootAgentSelector';
import { ChatwootContactPanel } from '@/components/chatwoot/ChatwootContactPanel';
import { ChatwootQuickReplies } from '@/components/chatwoot/ChatwootQuickReplies';
import { ChatwootMessageStatus } from '@/components/chatwoot/ChatwootMessageStatus';
import { ChatwootFileUpload } from '@/components/chatwoot/ChatwootFileUpload';
import { ChatwootLabelManager } from '@/components/chatwoot/ChatwootLabelManager';
import { ChatwootStatusHistory } from '@/components/chatwoot/ChatwootStatusHistory';
import { ChatwootAgentMetrics } from '@/components/chatwoot/ChatwootAgentMetrics';
import { useChatwootAgents } from '@/hooks/useChatwootAgents';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useChatwootLabelStats } from '@/hooks/useChatwootLabelStats';
import { ChatwootLabelStats } from '@/components/chatwoot/ChatwootLabelStats';

const Atendimentos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<ChatwootConversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'pending' | 'resolved'>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'mine' | 'unassigned'>('all');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('all');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showContactPanel, setShowContactPanel] = useState(false);
  const [viewMode, setViewMode] = useState<'conversations' | 'metrics' | 'stats'>('conversations');
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
    refetchConversations,
    markConversationAsRead
  } = useChatwootAPI();

  // Get agents list
  const { agents, isLoading: agentsLoading } = useChatwootAgents();
  
  // Get labels list
  const { labels: availableLabels } = useChatwootLabels(integrationId);
  
  // Get label statistics
  const { labelStats, isLoading: isLoadingLabelStats } = useChatwootLabelStats(conversations, integrationId);

  // Get integration settings for popup notifications
  const { data: integrations } = useIntegrations();
  const chatwootIntegration = integrations?.find(int => int.type === 'chatwoot');

  // Load messages for selected conversation
  const {
    messages: conversationMessages,
    isLoading: messagesLoading,
    refetch: refetchMessages
  } = useConversationMessages(integrationId, selectedConversation?.id.toString() || null);

  // Ativar notificações em tempo real (webhooks)
  const enablePopupNotifications = (chatwootIntegration as any)?.enable_popup_notifications ?? true;
  useChatwootRealtime(integrationId, isConfigured, enablePopupNotifications);
  
  // Detectar novas mensagens via polling (funciona sempre)
  useChatwootMessageNotifications(
    conversationMessages,
    selectedConversation?.id.toString() || null,
    isConfigured
  );

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

  // Marcar conversa como lida quando selecionada (com proteção contra erros)
  useEffect(() => {
    if (selectedConversation && integrationId && markConversationAsRead) {
      // Usar timeout para evitar múltiplas chamadas simultâneas
      const timer = setTimeout(() => {
        console.log('📖 Marcando conversa como lida:', selectedConversation.id);
        markConversationAsRead(selectedConversation.id.toString()).catch(err => {
          console.warn('⚠️ Não foi possível marcar como lida (não crítico):', err);
          // Não fazer nada - é esperado que algumas vezes falhe
        });
      }, 1000); // Delay de 1 segundo para evitar chamadas excessivas
      
      return () => clearTimeout(timer);
    }
  }, [selectedConversation?.id, integrationId, markConversationAsRead]);

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
      
      // Agent filter
      let matchesAgent = true;
      if (selectedAgentId !== 'all') {
        if (selectedAgentId === 'unassigned') {
          matchesAgent = !conv.assignee || conv.assignee === null;
        } else {
          matchesAgent = conv.assignee?.id?.toString() === selectedAgentId;
        }
      }
      
      // Label filter
      let matchesLabel = true;
      if (selectedLabels.length > 0) {
        const convLabels = conv.labels || [];
        matchesLabel = selectedLabels.some(label => convLabels.includes(label));
      }
      
      return matchesSearch && matchesStatus && matchesAssignment && matchesAgent && matchesLabel;
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
    console.log('🟢 handleStatusChange CHAMADO!', { status });
    console.log('🟢 selectedConversation:', selectedConversation);
    
    if (!selectedConversation) {
      console.error('❌ selectedConversation é null!');
      toast({
        title: "Erro",
        description: "Nenhuma conversa selecionada",
        variant: "destructive"
      });
      return;
    }

    console.log('🟢 Passando verificação de selectedConversation');
    console.log('🟢 updateConversationStatus:', updateConversationStatus);

    try {
      console.log('🔄 Iniciando mudança de status:', {
        conversationId: selectedConversation.id,
        statusAtual: selectedConversation.status,
        novoStatus: status
      });
      
      // Update local state IMEDIATAMENTE (optimistic update)
      setSelectedConversation({
        ...selectedConversation,
        status
      });
      
      // Make API call (mutation já atualiza o cache)
      await updateConversationStatus.mutateAsync({
        conversationId: selectedConversation.id.toString(),
        status
      });
      
      console.log('✅ Status alterado com sucesso!');
      
      // Sincronizar selectedConversation com o cache atualizado
      const updatedConversation = conversations?.find(
        c => c.id === selectedConversation.id
      );
      
      if (updatedConversation) {
        setSelectedConversation(updatedConversation);
        console.log('🔄 Estado local sincronizado com cache');
      }
      
    } catch (error) {
      console.error('❌ ERRO CAPTURADO em handleStatusChange:', error);
      
      // Revert local state on error
      setSelectedConversation(selectedConversation);
      
      // Only force refetch if conversation not found in cache
      if (!conversations?.find(c => c.id === selectedConversation.id)) {
        console.log('⚠️ Conversa não encontrada no cache, forçando refetch');
        refetchConversations?.();
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      open: { color: 'bg-green-600 hover:bg-green-700', icon: Clock, label: 'Aberta', textColor: 'text-green-400' },
      resolved: { color: 'bg-blue-600 hover:bg-blue-700', icon: CheckCircle2, label: 'Resolvida', textColor: 'text-blue-400' },
      pending: { color: 'bg-yellow-600 hover:bg-yellow-700', icon: AlertTriangle, label: 'Pendente', textColor: 'text-yellow-400' }
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

  const formatMessageTime = (timestamp: string | number) => {
    if (!timestamp) {
      return '--:--';
    }

    let date: Date;
    
    if (typeof timestamp === 'number') {
      date = timestamp < 10000000000 
        ? new Date(timestamp * 1000)
        : new Date(timestamp);
    } else {
      date = new Date(timestamp);
    }
    
    if (isNaN(date.getTime())) {
      console.error('Data inválida:', timestamp);
      return '--:--';
    }
    
    if (date.getFullYear() < 2000) {
      console.error('Data suspeita (antes de 2000):', timestamp, date);
      return '--:--';
    }

    const now = new Date();
    
    try {
      // Usar funções do date-fns para comparação precisa de dias
      if (isSameDay(date, now)) {
        // Mesmo dia = Hoje
        return 'Hoje às ' + format(date, 'HH:mm', { locale: ptBR });
      } else if (isYesterday(date)) {
        // Dia anterior = Ontem
        return 'Ontem às ' + format(date, 'HH:mm', { locale: ptBR });
      } else if (isThisWeek(date, { weekStartsOn: 0 })) {
        // Esta semana = Nome do dia
        return format(date, "EEEE', 'HH:mm", { locale: ptBR });
      } else {
        // Mais antigo = Data completa
        return format(date, "dd/MM/yyyy', 'HH:mm", { locale: ptBR });
      }
    } catch (error) {
      console.error('Erro ao formatar data:', error, timestamp);
      return '--:--';
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
    <div className="min-h-screen bg-slate-900 text-white p-3">
      <div className="h-[calc(100vh-4rem)] flex flex-col gap-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold text-white">Atendimentos</h1>
              <p className="text-xs text-slate-400">
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
            className="h-7"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* View Mode Selector */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-2">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'conversations' | 'metrics' | 'stats')}>
            <TabsList className="w-full grid grid-cols-3 bg-slate-700 h-8">
              <TabsTrigger 
                value="conversations" 
                className="text-xs text-slate-300 data-[state=active]:bg-slate-600 data-[state=active]:text-white h-7"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Conversas
              </TabsTrigger>
              <TabsTrigger 
                value="metrics" 
                className="text-xs text-slate-300 data-[state=active]:bg-slate-600 data-[state=active]:text-white h-7"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Métricas
              </TabsTrigger>
              <TabsTrigger 
                value="stats" 
                className="text-xs text-slate-300 data-[state=active]:bg-slate-600 data-[state=active]:text-white h-7"
              >
                <Tag className="h-3 w-3 mr-1" />
                Estatísticas
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {viewMode === 'conversations' && (
        <>
      {/* Assignment Filter */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-slate-300">
              Filtrar por:
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant={assignmentFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAssignmentFilter('all')}
                className="gap-1 h-7 text-xs"
              >
                Todas
                <Badge variant={assignmentFilter === 'all' ? 'secondary' : 'outline'} className="h-3 px-1 text-[10px]">
                  {safeConversations.length}
                </Badge>
              </Button>
              <Button
                variant={assignmentFilter === 'mine' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAssignmentFilter('mine')}
                className="gap-1 h-7 text-xs"
              >
                Minhas
                <Badge variant={assignmentFilter === 'mine' ? 'secondary' : 'outline'} className="h-3 px-1 text-[10px]">
                  {myConversationsCount}
                </Badge>
              </Button>
              <Button
                variant={assignmentFilter === 'unassigned' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAssignmentFilter('unassigned')}
                className="gap-1 h-7 text-xs"
              >
                Não Atribuídas
                <Badge variant={assignmentFilter === 'unassigned' ? 'secondary' : 'outline'} className="h-3 px-1 text-[10px]">
                  {unassignedCount}
                </Badge>
              </Button>
            </div>
            
            <Separator orientation="vertical" className="h-6 bg-slate-600" />
            
            <div className="flex items-center gap-1">
              <User className="h-3 w-3 text-slate-400" />
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger className="w-[160px] h-7 bg-slate-700 border-slate-600 text-white text-xs">
                  <SelectValue placeholder="Selecionar agente..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all" className="text-white hover:bg-slate-600 text-xs">
                    Todos os agentes
                  </SelectItem>
                  <SelectItem value="unassigned" className="text-white hover:bg-slate-600 text-xs">
                    Sem agente
                  </SelectItem>
                  <Separator className="my-1 bg-slate-600" />
                  {agentsLoading ? (
                    <div className="p-2 text-xs text-slate-400 text-center">
                      <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                    </div>
                  ) : (
                    agents.map((agent) => (
                      <SelectItem 
                        key={agent.id} 
                        value={agent.id.toString()}
                        className="text-white hover:bg-slate-600 text-xs"
                      >
                        {agent.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <Separator orientation="vertical" className="h-6 bg-slate-600" />
            
            {/* Buscar conversas */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2 top-1.5 h-3 w-3 text-slate-400" />
              <Input
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 h-7 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 text-xs"
              />
            </div>

            <Separator orientation="vertical" className="h-6 bg-slate-600" />
            
            {/* Compact Statistics */}
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="text-slate-400">Total:</span>
              <Badge variant="secondary" className="h-4 px-1.5 bg-slate-700 text-slate-200 text-[10px]">
                {safeConversations.length}
              </Badge>
              <span className="text-slate-400">Abertas:</span>
              <Badge variant="secondary" className="h-4 px-1.5 bg-green-900/50 text-green-300 text-[10px]">
                {safeConversations.filter(c => c.status === 'open').length}
              </Badge>
              <span className="text-slate-400">Pendentes:</span>
              <Badge variant="secondary" className="h-4 px-1.5 bg-yellow-900/50 text-yellow-300 text-[10px]">
                {safeConversations.filter(c => c.status === 'pending').length}
              </Badge>
              <span className="text-slate-400">Resolvidas:</span>
              <Badge variant="secondary" className="h-4 px-1.5 bg-blue-900/50 text-blue-300 text-[10px]">
                {safeConversations.filter(c => c.status === 'resolved').length}
              </Badge>
            </div>
          </div>
          
          {/* Label Filter */}
          {availableLabels.length > 0 && (
            <div className="px-2 py-1.5 border-t border-slate-700">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-slate-400">Etiquetas:</span>
                {availableLabels.map((label) => {
                  const isSelected = selectedLabels.includes(label.title);
                  return (
                    <Badge
                      key={label.id}
                      variant="outline"
                      className="h-5 px-2 text-[10px] cursor-pointer transition-all border-0"
                      style={{
                        backgroundColor: isSelected ? label.color : `${label.color}20`,
                        color: isSelected ? '#fff' : label.color,
                      }}
                      onClick={() => {
                        setSelectedLabels(prev =>
                          prev.includes(label.title)
                            ? prev.filter(l => l !== label.title)
                            : [...prev, label.title]
                        );
                      }}
                    >
                      {label.title}
                    </Badge>
                  );
                })}
                {selectedLabels.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-2 text-[10px]"
                    onClick={() => setSelectedLabels([])}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-2 min-h-0">
        {/* Conversations List */}
        <Card className="col-span-12 lg:col-span-3 flex flex-col bg-slate-800 border-slate-700">
          <CardHeader className="pb-1 pt-2 px-2 border-b border-slate-700">
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <TabsList className="w-full grid grid-cols-4 gap-0.5 bg-slate-700 p-0.5 h-auto">
                <TabsTrigger value="all" className="text-[10px] text-slate-300 data-[state=active]:bg-slate-600 data-[state=active]:text-white flex flex-col items-center justify-center px-1 py-1 h-auto">
                  <span>Todas</span>
                  <Badge variant="secondary" className="h-3 px-1 text-[9px] bg-slate-600 text-slate-100 font-semibold mt-0.5">
                    {safeConversations.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="open" className="text-[10px] text-slate-300 data-[state=active]:bg-slate-600 data-[state=active]:text-white flex flex-col items-center justify-center px-1 py-1 h-auto">
                  <span>Abertas</span>
                  <Badge variant="secondary" className="h-3 px-1 text-[9px] bg-green-900/50 text-green-300 font-semibold mt-0.5">
                    {safeConversations.filter(c => c.status === 'open').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-[10px] text-slate-300 data-[state=active]:bg-slate-600 data-[state=active]:text-white flex flex-col items-center justify-center px-1 py-1 h-auto">
                  <span>Pendentes</span>
                  <Badge variant="secondary" className="h-3 px-1 text-[9px] bg-yellow-900/50 text-yellow-300 font-semibold mt-0.5">
                    {safeConversations.filter(c => c.status === 'pending').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="resolved" className="text-[10px] text-slate-300 data-[state=active]:bg-slate-600 data-[state=active]:text-white flex flex-col items-center justify-center px-1 py-1 h-auto">
                  <span>Resolvidas</span>
                  <Badge variant="secondary" className="h-3 px-1 text-[9px] bg-blue-900/50 text-blue-300 font-semibold mt-0.5">
                    {safeConversations.filter(c => c.status === 'resolved').length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          
           <ScrollArea className="flex-1">
            <CardContent className="p-1">
              {isLoading ? (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-400" />
                  <p className="text-xs text-slate-300">Carregando conversas...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-4 text-slate-400">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50 text-slate-500" />
                  <p className="text-xs">Nenhuma conversa encontrada</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filteredConversations.map((conversation) => {
                    const lastMessage = conversation.messages?.[conversation.messages.length - 1];
                    const isSelected = selectedConversation?.id === conversation.id;
                    
                    return (
                      <div
                        key={conversation.id}
                        className={`p-2 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-900/30 border-2 border-blue-600'
                            : 'hover:bg-slate-700/50 border-2 border-transparent'
                        }`}
                        onClick={() => setSelectedConversation(conversation)}
                      >
                        <div className="flex items-start gap-2">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="bg-blue-600 text-white text-xs">
                              {getInitials(conversation.meta?.sender?.name || 'Cliente')}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <h3 className="font-medium text-xs truncate text-white">
                                {conversation.meta?.sender?.name || 'Cliente'}
                              </h3>
                              {getStatusBadge(conversation.status)}
                            </div>
                            
                            {lastMessage && (
                              <p className="text-[10px] text-slate-400 line-clamp-1">
                                {lastMessage.content}
                              </p>
                            )}
                            
                            {/* Labels */}
                            {conversation.labels && conversation.labels.length > 0 && (
                              <div className="mt-1">
                                <ChatwootLabelManager 
                                  conversationId={conversation.id.toString()}
                                  currentLabels={conversation.labels}
                                  integrationId={integrationId}
                                  mode="compact"
                                />
                              </div>
                            )}
                            
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] text-slate-500">
                                {formatMessageTime(conversation.last_activity_at)}
                              </span>
                              {conversation.unread_count > 0 && (
                                <Badge variant="destructive" className="h-3 px-1 text-[9px] bg-red-600">
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
        <Card className={`${showContactPanel ? 'col-span-12 lg:col-span-6' : 'col-span-12 lg:col-span-9'} flex flex-col bg-slate-800 border-slate-700`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-2 pt-2 px-3 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-600 text-white text-xs">
                        {getInitials(selectedConversation.meta?.sender?.name || 'Cliente')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-sm text-white">
                        {selectedConversation.meta?.sender?.name || 'Cliente'}
                      </h3>
                      <p className="text-[10px] text-slate-400">
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
                      className="hidden lg:flex h-7 w-7"
                    >
                      <ChevronRight className={`h-3 w-3 transition-transform ${showContactPanel ? 'rotate-180' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedConversation(null)}
                      className="lg:hidden h-7 w-7"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {/* Labels */}
                <ChatwootLabelManager 
                  conversationId={selectedConversation.id.toString()}
                  currentLabels={selectedConversation.labels || []}
                  integrationId={integrationId}
                />
                
                {/* Status Actions + Agent Selector */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <Button 
                    size="sm" 
                    variant={selectedConversation.status === 'open' ? 'default' : 'outline'}
                    onClick={() => handleStatusChange('open')}
                    disabled={updateConversationStatus.isPending || selectedConversation.status === 'open'}
                    className={`h-7 text-xs ${selectedConversation.status === 'open' 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}
                  >
                    {updateConversationStatus.isPending ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Clock className="h-3 w-3 mr-1" />
                    )}
                    Abrir
                  </Button>
                  <Button 
                    size="sm" 
                    variant={selectedConversation.status === 'pending' ? 'default' : 'outline'}
                    onClick={() => {
                      console.log('🟢 BOTÃO PENDENTE CLICADO!');
                      handleStatusChange('pending');
                    }}
                    disabled={updateConversationStatus.isPending || selectedConversation.status === 'pending'}
                    className={`h-7 text-xs ${selectedConversation.status === 'pending' 
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}
                  >
                    {updateConversationStatus.isPending ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 mr-1" />
                    )}
                    Pendente
                  </Button>
                  <Button 
                    size="sm" 
                    variant={selectedConversation.status === 'resolved' ? 'default' : 'outline'}
                    onClick={() => {
                      console.log('🟢 BOTÃO RESOLVER CLICADO!');
                      handleStatusChange('resolved');
                    }}
                    disabled={updateConversationStatus.isPending || selectedConversation.status === 'resolved'}
                    className={`h-7 text-xs ${selectedConversation.status === 'resolved' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}
                  >
                    {updateConversationStatus.isPending ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    )}
                    Resolver
                  </Button>
                  
                  <Separator orientation="vertical" className="h-6" />
                  
                  {/* Agent Selector inline */}
                  <div className="flex-1 min-w-[180px]">
                    <ChatwootAgentSelector 
                      conversationId={selectedConversation.id.toString()}
                      currentAgentId={selectedConversation.assignee?.id}
                    />
                  </div>
                  
                  <Button
                    size="sm"
                    variant={showContactPanel ? 'default' : 'outline'}
                    onClick={() => setShowContactPanel(!showContactPanel)}
                    title={showContactPanel ? 'Ocultar informações do contato' : 'Mostrar informações do contato'}
                    className="h-7 text-xs"
                  >
                    <User className="h-3 w-3 mr-1" />
                    Contato
                  </Button>
                </div>
              </CardHeader>
              
              {/* Messages */}
              <ScrollArea className="h-[calc(100vh-350px)] min-h-[300px] max-h-[500px] p-2">
                {messagesLoading ? (
                  <div className="text-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-400" />
                    <p className="text-xs text-slate-300">Carregando mensagens...</p>
                  </div>
                ) : conversationMessages && conversationMessages.length > 0 ? (
                  <div className="space-y-2">
                    {conversationMessages.map((message, index) => {
                      const isOutgoing = message.message_type === 1;
                      const showSenderName = !isOutgoing && message.sender?.name;
                      
                      console.log(`Mensagem ${index + 1}/${conversationMessages.length}:`, {
                        id: message.id,
                        content: message.content.substring(0, 50),
                        created_at: message.created_at,
                        timestamp_type: typeof message.created_at,
                        sender: message.sender?.name
                      });
                      
                      return (
                        <div
                          key={`${message.id}-${index}`}
                          className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-200`}
                        >
                          <div className={`max-w-[70%] ${isOutgoing ? 'order-2' : 'order-1'}`}>
                            <div
                              className={`rounded-lg p-2 shadow-sm ${
                                isOutgoing
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-700 text-slate-100'
                              }`}
                            >
                              {showSenderName && (
                                <p className="text-[10px] font-semibold mb-1 opacity-80">
                                  {message.sender.name}
                                </p>
                              )}
                              <p className="text-xs whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                              <div className="flex items-center justify-between gap-2 mt-1">
                                <p className={`text-[10px] ${isOutgoing ? 'text-blue-100' : 'text-slate-400'}`}>
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
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-400">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50 text-slate-500" />
                    <p className="text-xs">Nenhuma mensagem nesta conversa</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      As mensagens aparecerão aqui quando forem enviadas ou recebidas
                    </p>
                  </div>
                )}
              </ScrollArea>
              
              {/* Message Input */}
              <div className="p-2 border-t border-slate-700">
                <div className="mb-1">
                  <ChatwootQuickReplies onSelectReply={setMessageText} />
                </div>
                <div className="flex gap-1.5">
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
                    className="min-h-[50px] max-h-[100px] resize-none bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 text-xs"
                    disabled={!selectedConversation.can_reply}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={sendMessage.isPending || !messageText.trim() || !selectedConversation.can_reply}
                    className="px-4 bg-blue-600 hover:bg-blue-700 text-white h-[50px]"
                  >
                    {sendMessage.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                {!selectedConversation.can_reply && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Esta conversa não permite resposta
                  </p>
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  Pressione Enter para enviar, Shift+Enter para quebrar linha
                </p>
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50 text-slate-500" />
                <h3 className="text-base font-medium mb-1 text-slate-300">Nenhuma conversa selecionada</h3>
                <p className="text-xs">
                  Selecione uma conversa da lista para começar
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Contact Panel */}
        {showContactPanel && (
          <div className="col-span-12 lg:col-span-3 hidden lg:block space-y-4">
            <ChatwootContactPanel conversation={selectedConversation} />
            
            {/* Histórico de Status */}
            {selectedConversation && (
              <ChatwootStatusHistory 
                integrationId={integrationId}
                conversationId={selectedConversation.id.toString()}
              />
            )}
          </div>
        )}
      </div>
        </>
      )}

      {viewMode === 'metrics' && (
        <ChatwootAgentMetrics />
      )}

      {viewMode === 'stats' && (
        <ChatwootLabelStats 
          labelStats={labelStats}
          isLoading={isLoadingLabelStats}
          onLabelClick={(label) => {
            setViewMode('conversations');
            setSelectedLabels([label]);
          }}
        />
      )}
      </div>
    </div>
  );
};

export default Atendimentos;
