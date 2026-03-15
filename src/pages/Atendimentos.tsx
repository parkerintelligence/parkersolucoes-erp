import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Search, RefreshCw, Send, AlertCircle, Loader2, CheckCircle2, AlertTriangle, Clock, MessageCircle, X, ChevronRight, User, TrendingUp, Tag, Ticket, Bell, BellOff, BarChart3, Mail, Inbox } from 'lucide-react';
import { useChatwootAPI, ChatwootConversation } from '@/hooks/useChatwootAPI';
import { useConversationMessages } from '@/hooks/useConversationMessages';
import { useChatwootRealtime, useChatwootMessageNotifications } from '@/hooks/useChatwootRealtime';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useChatwootLabels } from '@/hooks/useChatwootLabels';
import { format, isSameDay, isYesterday, isThisWeek, isToday, startOfWeek, startOfMonth, isAfter } from 'date-fns';
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
import { GLPINewTicketDialog } from '@/components/GLPINewTicketDialog';
import { useDesktopNotifications } from '@/hooks/useDesktopNotifications';

const Atendimentos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<ChatwootConversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'pending' | 'resolved'>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'mine' | 'unassigned'>('all');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('all');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'labels'>('date');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedInboxId, setSelectedInboxId] = useState<string>('all');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showContactPanel, setShowContactPanel] = useState(false);
  const [viewMode, setViewMode] = useState<'conversations' | 'metrics' | 'stats'>('conversations');
  const [isGLPIDialogOpen, setIsGLPIDialogOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isConfigured, integrationId,
    conversations = [], isLoading, error,
    testConnection, sendMessage, updateConversationStatus,
    refetchConversations, markConversationAsRead
  } = useChatwootAPI();

  const { agents, isLoading: agentsLoading } = useChatwootAgents();
  const { labels: availableLabels } = useChatwootLabels(integrationId);
  const { labelStats, isLoading: isLoadingLabelStats } = useChatwootLabelStats(conversations, integrationId);
  const { data: integrations } = useIntegrations();
  const chatwootIntegration = integrations?.find(int => int.type === 'chatwoot');

  const {
    messages: conversationMessages,
    isLoading: messagesLoading,
    refetch: refetchMessages
  } = useConversationMessages(integrationId, selectedConversation?.id.toString() || null);

  const enablePopupNotifications = (chatwootIntegration as any)?.enable_popup_notifications ?? true;
  useChatwootRealtime(integrationId, isConfigured, enablePopupNotifications);
  useChatwootMessageNotifications(conversationMessages, selectedConversation?.id.toString() || null, isConfigured);
  const { isNotificationPermissionGranted } = useDesktopNotifications(conversations, notificationsEnabled && isConfigured);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!integrationId) return;
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: { session } } = await supabase.auth.refreshSession();
        if (!session) return;
        const response = await fetch('https://mpvxppgoyadwukkfoccs.supabase.co/functions/v1/chatwoot-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ integrationId, endpoint: '/profile', method: 'GET' })
        });
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

  useEffect(() => {
    if (isConfigured && !error) {
      const interval = setInterval(() => { refetchConversations?.(); }, 30000);
      return () => clearInterval(interval);
    }
  }, [isConfigured, error, refetchConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  useEffect(() => {
    if (selectedConversation) refetchMessages?.();
  }, [selectedConversation]);

  useEffect(() => {
    if (selectedConversation && integrationId && markConversationAsRead) {
      const timer = setTimeout(() => {
        markConversationAsRead(selectedConversation.id.toString()).catch(() => {});
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedConversation?.id, integrationId, markConversationAsRead]);

  const safeConversations = Array.isArray(conversations) ? conversations : [];

  const availableInboxes = useMemo(() => {
    const inboxMap = new Map<number, { id: number; name: string }>();
    safeConversations.forEach(conv => {
      if (conv.inbox?.id && conv.inbox?.name) {
        inboxMap.set(conv.inbox.id, { id: conv.inbox.id, name: conv.inbox.name });
      }
    });
    return Array.from(inboxMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [safeConversations]);

  const filteredConversations = safeConversations.filter(conv => {
    const matchesSearch = conv.meta?.sender?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || conv.meta?.sender?.phone_number?.includes(searchTerm) || conv.id?.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
    const matchesInbox = selectedInboxId === 'all' || conv.inbox?.id?.toString() === selectedInboxId;

    let matchesPeriod = true;
    if (periodFilter !== 'all' && conv.last_activity_at) {
      const activityDate = new Date(conv.last_activity_at);
      const now = new Date();
      switch (periodFilter) {
        case 'today': matchesPeriod = isToday(activityDate); break;
        case 'week': matchesPeriod = isAfter(activityDate, startOfWeek(now, { weekStartsOn: 0 })); break;
        case 'month': matchesPeriod = isAfter(activityDate, startOfMonth(now)); break;
      }
    }

    let matchesAssignment = true;
    if (assignmentFilter === 'mine') matchesAssignment = conv.assignee?.id === currentUserId;
    else if (assignmentFilter === 'unassigned') matchesAssignment = !conv.assignee || conv.assignee === null;

    let matchesAgent = true;
    if (selectedAgentId !== 'all') {
      if (selectedAgentId === 'unassigned') matchesAgent = !conv.assignee || conv.assignee === null;
      else matchesAgent = conv.assignee?.id?.toString() === selectedAgentId;
    }

    let matchesLabel = true;
    if (selectedLabels.length > 0) {
      const convLabels = conv.labels || [];
      matchesLabel = selectedLabels.some(label => convLabels.includes(label));
    }
    return matchesSearch && matchesStatus && matchesAssignment && matchesAgent && matchesLabel && matchesPeriod && matchesInbox;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime();
      case 'priority': {
        const getPriority = (conv: ChatwootConversation) => {
          if (!conv.assignee) return 4;
          if (conv.status === 'open') return 3;
          if (conv.status === 'pending') return 2;
          if (conv.status === 'resolved') return 1;
          return 0;
        };
        const diff = getPriority(b) - getPriority(a);
        return diff === 0 ? new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime() : diff;
      }
      case 'labels': {
        const labelA = a.labels && a.labels.length > 0 ? a.labels[0] : 'zzz';
        const labelB = b.labels && b.labels.length > 0 ? b.labels[0] : 'zzz';
        const cmp = labelA.localeCompare(labelB, 'pt-BR');
        return cmp === 0 ? new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime() : cmp;
      }
      default:
        return new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime();
    }
  });

  const myConversationsCount = safeConversations.filter(c => c.assignee?.id === currentUserId).length;
  const unassignedCount = safeConversations.filter(c => !c.assignee || c.assignee === null).length;
  const openCount = safeConversations.filter(c => c.status === 'open').length;
  const pendingCount = safeConversations.filter(c => c.status === 'pending').length;
  const resolvedCount = safeConversations.filter(c => c.status === 'resolved').length;

  const handleSendMessage = async () => {
    if (!selectedConversation || !messageText.trim()) {
      toast({ title: "Erro", description: "Por favor, digite uma mensagem.", variant: "destructive" });
      return;
    }
    try {
      await sendMessage.mutateAsync({ conversationId: selectedConversation.id.toString(), content: messageText });
      setMessageText('');
      setTimeout(() => { refetchMessages?.(); refetchConversations?.(); }, 500);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleStatusChange = async (status: 'open' | 'resolved' | 'pending') => {
    if (!selectedConversation) {
      toast({ title: "Erro", description: "Nenhuma conversa selecionada", variant: "destructive" });
      return;
    }
    try {
      setSelectedConversation({ ...selectedConversation, status });
      await updateConversationStatus.mutateAsync({ conversationId: selectedConversation.id.toString(), status });
      const updatedConversation = conversations?.find(c => c.id === selectedConversation.id);
      if (updatedConversation) setSelectedConversation(updatedConversation);
    } catch (error) {
      console.error('Error changing status:', error);
      setSelectedConversation(selectedConversation);
      if (!conversations?.find(c => c.id === selectedConversation.id)) refetchConversations?.();
    }
  };

  const getChannelIcon = (channel: string) => {
    const ch = channel?.toLowerCase() || '';
    if (ch.includes('whatsapp') || ch === 'channel::whatsapp') return <MessageSquare className="h-3 w-3 text-green-500" />;
    if (ch.includes('telegram')) return <Send className="h-3 w-3 text-blue-500" />;
    if (ch.includes('email')) return <Mail className="h-3 w-3 text-muted-foreground" />;
    return <MessageCircle className="h-3 w-3 text-muted-foreground" />;
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { cls: string; icon: any; label: string }> = {
      open: { cls: 'bg-green-500/15 text-green-400 border-green-500/30', icon: Clock, label: 'Aberta' },
      resolved: { cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: CheckCircle2, label: 'Resolvida' },
      pending: { cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: AlertTriangle, label: 'Pendente' },
    };
    const config = configs[status] || configs.open;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`${config.cls} text-[10px] px-1.5 py-0 h-5 gap-1`}>
        <Icon className="h-2.5 w-2.5" />
        {config.label}
      </Badge>
    );
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
  };

  const formatMessageTime = (timestamp: string | number) => {
    if (!timestamp) return '--:--';
    let date: Date;
    if (typeof timestamp === 'number') date = timestamp < 10000000000 ? new Date(timestamp * 1000) : new Date(timestamp);
    else date = new Date(timestamp);
    if (isNaN(date.getTime()) || date.getFullYear() < 2000) return '--:--';
    try {
      if (isSameDay(date, new Date())) return 'Hoje às ' + format(date, 'HH:mm', { locale: ptBR });
      if (isYesterday(date)) return 'Ontem às ' + format(date, 'HH:mm', { locale: ptBR });
      if (isThisWeek(date, { weekStartsOn: 0 })) return format(date, "EEEE', 'HH:mm", { locale: ptBR });
      return format(date, "dd/MM/yyyy', 'HH:mm", { locale: ptBR });
    } catch { return '--:--'; }
  };

  // --- Not configured ---
  if (!isConfigured) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Atendimentos
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Configure o Chatwoot para começar</p>
        </div>
        <Card className="p-12 text-center border-dashed border-2 border-border bg-card/50">
          <CardContent className="flex flex-col items-center">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Configuração necessária</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Configure a integração do Chatwoot em Admin → Chatwoot para começar a usar.
            </p>
            <Button onClick={() => window.location.href = '/admin'} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Ir para Configurações
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Error ---
  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Atendimentos
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Gerencie suas conversas</p>
        </div>
        <Card className="p-12 text-center border-dashed border-2 border-destructive/30 bg-card/50">
          <CardContent className="flex flex-col items-center">
            <div className="w-20 h-20 bg-destructive/10 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Erro ao carregar conversas</h3>
            <p className="text-muted-foreground mb-6">{error.message}</p>
            <div className="flex gap-2">
              <Button onClick={() => refetchConversations?.()} variant="outline"><RefreshCw className="mr-2 h-4 w-4" />Tentar Novamente</Button>
              <Button onClick={() => testConnection?.mutate(undefined)} disabled={testConnection?.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {testConnection?.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertCircle className="mr-2 h-4 w-4" />}
                Testar Conexão
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Main UI ---
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-3">
      {/* Header - Projects style */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Atendimentos
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filteredConversations.length} conversas • {openCount} abertas
          </p>
        </div>
        <div className="flex gap-1.5 items-center">
          <Button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            variant="outline"
            size="sm"
            className={`h-8 gap-1.5 text-xs ${notificationsEnabled ? 'border-green-500/30 text-green-400' : 'border-border text-muted-foreground'}`}
          >
            {notificationsEnabled ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
            <span className="hidden sm:inline">{notificationsEnabled ? 'Ativas' : 'Desativadas'}</span>
          </Button>
          <Button onClick={() => refetchConversations?.()} disabled={isLoading} variant="outline" size="sm" className="h-8 w-8 p-0">
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Stats Bar - Projects style */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          { label: "Total", value: safeConversations.length, icon: MessageSquare, color: "text-primary" },
          { label: "Abertas", value: openCount, icon: Clock, color: "text-green-500" },
          { label: "Pendentes", value: pendingCount, icon: AlertTriangle, color: "text-yellow-500" },
          { label: "Resolvidas", value: resolvedCount, icon: CheckCircle2, color: "text-blue-500" },
          { label: "Minhas", value: myConversationsCount, icon: User, color: "text-primary" },
          { label: "Não Atribuídas", value: unassignedCount, icon: Inbox, color: "text-muted-foreground" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
            <s.icon className={`h-3.5 w-3.5 ${s.color} flex-shrink-0`} />
            <div className="min-w-0">
              <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
              <span className="text-[10px] text-muted-foreground ml-1.5">{s.label}</span>
            </div>
          </div>
        ))}
        {/* View Mode Switcher */}
        <div className="flex items-center bg-card border border-border rounded-lg p-0.5">
          {[
            { value: "conversations", icon: MessageSquare, label: "Conversas" },
            { value: "metrics", icon: TrendingUp, label: "Métricas" },
            { value: "stats", icon: BarChart3, label: "Estatísticas" },
          ].map(view => (
            <Button
              key={view.value}
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(view.value as any)}
              className={`h-7 px-2.5 gap-1 rounded-md text-[11px] flex-1 ${
                viewMode === view.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <view.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{view.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Toolbar: Filters */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar conversas..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 bg-card border-border h-8 text-xs" />
        </div>

        {/* Assignment Filter Buttons */}
        <div className="flex items-center gap-1">
          {[
            { value: 'all', label: 'Todas', count: safeConversations.length },
            { value: 'mine', label: 'Minhas', count: myConversationsCount },
            { value: 'unassigned', label: 'Sem Agente', count: unassignedCount },
          ].map(f => (
            <Button
              key={f.value}
              variant={assignmentFilter === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAssignmentFilter(f.value as any)}
              className={`h-8 text-xs gap-1 ${
                assignmentFilter === f.value
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {f.label}
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{f.count}</Badge>
            </Button>
          ))}
        </div>

        <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
          <SelectTrigger className="w-[150px] h-8 bg-card border-border text-xs">
            <SelectValue placeholder="Agente..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Todos os agentes</SelectItem>
            <SelectItem value="unassigned" className="text-xs">Sem agente</SelectItem>
            <Separator className="my-1" />
            {agentsLoading ? (
              <div className="p-2 text-xs text-muted-foreground text-center"><Loader2 className="h-3 w-3 animate-spin mx-auto" /></div>
            ) : agents.map(agent => (
              <SelectItem key={agent.id} value={agent.id.toString()} className="text-xs">{agent.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={periodFilter} onValueChange={v => setPeriodFilter(v as any)}>
          <SelectTrigger className="w-[130px] h-8 bg-card border-border text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Todas as datas</SelectItem>
            <SelectItem value="today" className="text-xs">Hoje</SelectItem>
            <SelectItem value="week" className="text-xs">Esta semana</SelectItem>
            <SelectItem value="month" className="text-xs">Este mês</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedInboxId} onValueChange={setSelectedInboxId}>
          <SelectTrigger className="w-[150px] h-8 bg-card border-border text-xs">
            <SelectValue placeholder="Todas as caixas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Todas as caixas</SelectItem>
            <Separator className="my-1" />
            {availableInboxes.map(inbox => (
              <SelectItem key={inbox.id} value={inbox.id.toString()} className="text-xs">
                <div className="flex items-center gap-2"><MessageCircle className="h-3 w-3" />{inbox.name}</div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
          <SelectTrigger className="w-[130px] h-8 bg-card border-border text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date" className="text-xs">Data recente</SelectItem>
            <SelectItem value="priority" className="text-xs">Prioridade</SelectItem>
            <SelectItem value="labels" className="text-xs">Etiquetas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Label Filter Row */}
      {availableLabels.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-muted-foreground font-medium">Etiquetas:</span>
          {availableLabels.map(label => {
            const isSelected = selectedLabels.includes(label.title);
            return (
              <Badge
                key={label.id}
                variant="outline"
                className={`h-5 px-2 text-[10px] cursor-pointer transition-all gap-1 border-0 ${isSelected ? 'ring-2 ring-primary/30' : ''}`}
                style={{ backgroundColor: label.color, color: '#fff' }}
                onClick={() => setSelectedLabels(prev => prev.includes(label.title) ? prev.filter(l => l !== label.title) : [...prev, label.title])}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                {label.title}
              </Badge>
            );
          })}
          {selectedLabels.length > 0 && (
            <Button variant="ghost" size="sm" className="h-5 px-2 text-[10px] text-muted-foreground" onClick={() => setSelectedLabels([])}>
              <X className="h-2.5 w-2.5 mr-1" />Limpar
            </Button>
          )}
        </div>
      )}

      {/* Content */}
      {viewMode === 'conversations' && (
        <div className="flex-1 grid grid-cols-12 gap-2 min-h-0">
          {/* Conversation List */}
          <div className="col-span-12 lg:col-span-3 flex flex-col bg-card rounded-xl border border-border overflow-hidden">
            {/* Status Tabs */}
            <div className="px-2 pt-2 pb-1 border-b border-border">
              <Tabs value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
                <TabsList className="w-full grid grid-cols-4 gap-0.5 bg-secondary p-0.5 h-auto">
                  {[
                    { value: 'all', label: 'Todas', count: safeConversations.length, color: '' },
                    { value: 'open', label: 'Abertas', count: openCount, color: 'text-green-400' },
                    { value: 'pending', label: 'Pend.', count: pendingCount, color: 'text-yellow-400' },
                    { value: 'resolved', label: 'Resolv.', count: resolvedCount, color: 'text-blue-400' },
                  ].map(tab => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="text-[10px] text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex flex-col items-center px-1 py-1 h-auto"
                    >
                      <span>{tab.label}</span>
                      <span className="text-[9px] font-bold mt-0.5">{tab.count}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-1">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Carregando...</p>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Nenhuma conversa</p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {filteredConversations.map(conversation => {
                      const lastMessage = conversation.messages?.[conversation.messages.length - 1];
                      const isSelected = selectedConversation?.id === conversation.id;
                      return (
                        <div
                          key={conversation.id}
                          className={`p-2 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-primary/10 border border-primary/30'
                              : 'hover:bg-secondary border border-transparent'
                          }`}
                          onClick={() => setSelectedConversation(conversation)}
                        >
                          <div className="flex items-start gap-2">
                            <Avatar className="h-7 w-7 flex-shrink-0">
                              <AvatarImage src={conversation.meta?.sender?.avatar_url || conversation.meta?.sender?.thumbnail} />
                              <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-bold">
                                {getInitials(conversation.meta?.sender?.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <h3 className="font-medium text-xs truncate text-foreground">
                                  {conversation.meta?.sender?.name || 'Cliente'}
                                </h3>
                                {getStatusBadge(conversation.status)}
                              </div>
                              {lastMessage && (
                                <p className="text-[10px] text-muted-foreground line-clamp-1">{lastMessage.content}</p>
                              )}
                              {conversation.labels && conversation.labels.length > 0 && (
                                <div className="mt-0.5">
                                  <ChatwootLabelManager conversationId={conversation.id.toString()} currentLabels={conversation.labels} integrationId={integrationId} mode="compact" />
                                </div>
                              )}
                              <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                {conversation.inbox?.name && (
                                  <>
                                    <MessageCircle className="h-2.5 w-2.5 text-primary" />
                                    <span className="text-[10px] text-primary font-medium">{conversation.inbox.name}</span>
                                    <span className="text-[10px] text-muted-foreground">•</span>
                                  </>
                                )}
                                <span className="text-[10px] text-muted-foreground">
                                  {formatMessageTime(conversation.last_activity_at)}
                                </span>
                                {conversation.unread_count > 0 && (
                                  <Badge variant="destructive" className="h-4 px-1 text-[9px] ml-auto">{conversation.unread_count}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className={`${showContactPanel ? 'col-span-12 lg:col-span-6' : 'col-span-12 lg:col-span-9'} flex flex-col bg-card rounded-xl border border-border overflow-hidden`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="px-3 py-2 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={selectedConversation.meta?.sender?.avatar_url || selectedConversation.meta?.sender?.thumbnail} />
                        <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                          {getInitials(selectedConversation.meta?.sender?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-sm text-foreground">
                          {selectedConversation.meta?.sender?.name || 'Cliente'}
                        </h3>
                        <p className="text-[10px] text-muted-foreground">{selectedConversation.meta?.sender?.phone_number}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(selectedConversation.status)}
                      {selectedConversation.inbox?.name && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MessageCircle className="h-2.5 w-2.5" />{selectedConversation.inbox.name}
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setShowContactPanel(!showContactPanel)} className="hidden lg:flex h-6 w-6 p-0">
                          <ChevronRight className={`h-3 w-3 transition-transform ${showContactPanel ? 'rotate-180' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedConversation(null)} className="lg:hidden h-6 w-6 p-0">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <ChatwootLabelManager conversationId={selectedConversation.id.toString()} currentLabels={selectedConversation.labels || []} integrationId={integrationId} />

                  {/* Status Actions + Agent */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {[
                      { status: 'open' as const, label: 'Abrir', icon: Clock, activeClass: 'bg-green-500/15 text-green-400 border-green-500/30' },
                      { status: 'pending' as const, label: 'Pendente', icon: AlertTriangle, activeClass: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
                      { status: 'resolved' as const, label: 'Resolver', icon: CheckCircle2, activeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
                    ].map(btn => (
                      <Button
                        key={btn.status}
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(btn.status)}
                        disabled={updateConversationStatus.isPending || selectedConversation.status === btn.status}
                        className={`h-7 text-xs gap-1 ${
                          selectedConversation.status === btn.status
                            ? btn.activeClass
                            : 'bg-card border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {updateConversationStatus.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <btn.icon className="h-3 w-3" />}
                        {btn.label}
                      </Button>
                    ))}
                    <Separator orientation="vertical" className="h-5" />
                    <div className="flex-1 min-w-[180px]">
                      <ChatwootAgentSelector conversationId={selectedConversation.id.toString()} currentAgentId={selectedConversation.assignee?.id} />
                    </div>
                    <Button
                      size="sm"
                      variant={showContactPanel ? 'default' : 'outline'}
                      onClick={() => setShowContactPanel(!showContactPanel)}
                      className={`h-7 text-xs gap-1 ${showContactPanel ? 'bg-primary text-primary-foreground' : 'bg-card border-border text-muted-foreground'}`}
                    >
                      <User className="h-3 w-3" />Contato
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-2">
                  {messagesLoading ? (
                    <div className="text-center py-8">
                      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Carregando mensagens...</p>
                    </div>
                  ) : conversationMessages && conversationMessages.length > 0 ? (
                    <div className="space-y-2">
                      {conversationMessages.map((message, index) => {
                        const isOutgoing = message.message_type === 1;
                        const showSenderName = !isOutgoing && message.sender?.name;
                        return (
                          <div key={`${message.id}-${index}`} className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                            <div className="max-w-[70%]">
                              <div className={`rounded-lg p-2 shadow-sm ${
                                isOutgoing
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary text-foreground'
                              }`}>
                                {showSenderName && <p className="text-[10px] font-semibold mb-1 opacity-80">{message.sender.name}</p>}
                                <p className="text-xs whitespace-pre-wrap break-words">{message.content}</p>
                                <div className="flex items-center justify-between gap-2 mt-1">
                                  <p className={`text-[10px] ${isOutgoing ? 'opacity-70' : 'text-muted-foreground'}`}>
                                    {formatMessageTime(message.created_at)}
                                  </p>
                                  <ChatwootMessageStatus status={message.status} messageType={message.message_type} />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">Nenhuma mensagem nesta conversa</p>
                      <p className="text-[10px] mt-1">As mensagens aparecerão aqui quando forem enviadas ou recebidas</p>
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="p-2 border-t border-border">
                  <div className="mb-1.5 flex items-center gap-2">
                    <div className="flex-1"><ChatwootQuickReplies onSelectReply={setMessageText} /></div>
                    <Button variant="outline" size="sm" onClick={() => setIsGLPIDialogOpen(true)} className="h-7 px-3 text-xs border-border text-muted-foreground hover:text-foreground">
                      <Ticket className="h-3 w-3 mr-1.5" />Abrir Chamado
                    </Button>
                  </div>
                  <div className="flex gap-1.5">
                    <ChatwootFileUpload conversationId={selectedConversation.id.toString()} />
                    <Textarea
                      placeholder="Digite sua mensagem..."
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                      className="min-h-[50px] max-h-[100px] resize-none bg-secondary border-border text-foreground placeholder:text-muted-foreground text-xs"
                      disabled={!selectedConversation.can_reply}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={sendMessage.isPending || !messageText.trim() || !selectedConversation.can_reply}
                      className="px-4 bg-primary hover:bg-primary/90 text-primary-foreground h-[50px]"
                    >
                      {sendMessage.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    </Button>
                  </div>
                  {!selectedConversation.can_reply && <p className="text-[10px] text-muted-foreground mt-1">Esta conversa não permite resposta</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">Enter para enviar, Shift+Enter para quebrar linha</p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <h3 className="text-base font-medium mb-1 text-foreground">Nenhuma conversa selecionada</h3>
                  <p className="text-xs">Selecione uma conversa da lista para começar</p>
                </div>
              </div>
            )}
          </div>

          {/* GLPI Dialog */}
          {selectedConversation && <GLPINewTicketDialog open={isGLPIDialogOpen} onOpenChange={setIsGLPIDialogOpen} />}

          {/* Contact Panel */}
          {showContactPanel && (
            <div className="col-span-12 lg:col-span-3 hidden lg:block space-y-2">
              <ChatwootContactPanel conversation={selectedConversation} />
              {selectedConversation && <ChatwootStatusHistory integrationId={integrationId} conversationId={selectedConversation.id.toString()} />}
            </div>
          )}
        </div>
      )}

      {viewMode === 'metrics' && <ChatwootAgentMetrics />}

      {viewMode === 'stats' && (
        <ChatwootLabelStats
          labelStats={labelStats}
          isLoading={isLoadingLabelStats}
          onLabelClick={label => { setViewMode('conversations'); setSelectedLabels([label]); }}
        />
      )}
    </div>
  );
};

export default Atendimentos;
