
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Activity, 
  Server, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCcw, 
  Monitor,
  Users,
  ExternalLink,
  Webhook,
  Search,
  Filter,
  Clock
} from 'lucide-react';
import { useZabbixAPI } from '@/hooks/useZabbixAPI';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';
import { ZabbixWebhookManager } from '@/components/ZabbixWebhookManager';
import { GLPITicketConfirmDialog } from '@/components/GLPITicketConfirmDialog';
import ZabbixAnalysisDialog from '@/components/ZabbixAnalysisDialog';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const Zabbix = () => {
  const { 
    useHosts, 
    useProblems, 
    isConfigured,
    integration 
  } = useZabbixAPI();

  const { createTicket } = useGLPIExpanded();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  // Carregar dados do Zabbix com staleTime reduzido para atualizações mais frequentes
  const { data: hosts = [], isLoading: hostsLoading, refetch: refetchHosts, error: hostsError } = useHosts({}, {
    staleTime: 0, // Sempre buscar dados frescos ao refetch
    refetchInterval: 30000
  });
  const { data: problems = [], isLoading: problemsLoading, refetch: refetchProblems, error: problemsError } = useProblems({}, {
    staleTime: 0, // Sempre buscar dados frescos ao refetch
    refetchInterval: 10000
  });

  // Debug information
  console.log('=== Zabbix Page Debug ===');
  console.log('isConfigured:', isConfigured);
  console.log('integration:', integration);
  console.log('hosts:', hosts);
  console.log('problems:', problems);
  console.log('errors:', { hostsError, problemsError });

  const handleRefreshAll = async () => {
    console.log('🔄 Iniciando refresh manual dos dados do Zabbix...');
    setRefreshing(true);
    
    try {
      // Invalidar todas as queries relacionadas ao Zabbix para forçar busca de dados frescos
      await queryClient.invalidateQueries({ queryKey: ['zabbix-hosts'] });
      await queryClient.invalidateQueries({ queryKey: ['zabbix-problems'] });
      
      console.log('🗑️ Cache invalidado, iniciando refetch...');
      
      // Forçar refetch com timeout
      const refreshPromises = [
        Promise.race([
          refetchHosts(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout ao buscar hosts')), 15000))
        ]),
        Promise.race([
          refetchProblems(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout ao buscar problemas')), 15000))
        ])
      ];

      await Promise.all(refreshPromises);
      
      console.log('✅ Refresh concluído com sucesso');
      toast({
        title: "✅ Dados atualizados",
        description: "Informações do Zabbix foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('❌ Erro durante o refresh:', error);
      toast({
        title: "❌ Erro ao atualizar",
        description: `Não foi possível atualizar os dados do Zabbix: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<any>(null);
  const [sortField, setSortField] = useState('clock');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleCreateGLPITicket = async (problem: any) => {
    try {
      const ticketData = {
        name: `Zabbix Problem - ${problem.name}`,
        content: `Problema: ${problem.name}\nSeveridade: ${getSeverityLabel(problem.severity)}\nHost: ${problem.hosts?.[0]?.name || 'N/A'}\nData/Hora: ${new Date(parseInt(problem.clock) * 1000).toLocaleString('pt-BR')}\nStatus: ${problem.acknowledged === '1' ? 'Reconhecido' : 'Novo'}\n\nEste chamado foi criado automaticamente a partir do monitoramento Zabbix.`,
        urgency: parseInt(problem.severity) >= 4 ? 4 : 3,
        impact: parseInt(problem.severity) >= 4 ? 4 : 3,
        priority: parseInt(problem.severity) >= 4 ? 4 : 3,
        status: 1,
        type: 1,
      };

      await createTicket.mutateAsync(ticketData);
      toast({
        title: "✅ Chamado GLPI criado!",
        description: "O chamado foi criado com sucesso no GLPI.",
      });
    } catch (error) {
      console.error('Erro ao criar chamado GLPI:', error);
      toast({
        title: "❌ Erro ao criar chamado",
        description: "Não foi possível criar o chamado no GLPI. Verifique a configuração.",
        variant: "destructive",
      });
    }
  };

  const openConfirmDialog = (problem: any) => {
    setSelectedProblem(problem);
    setConfirmDialogOpen(true);
  };

  const handleConfirmGLPITicket = () => {
    if (selectedProblem) {
      handleCreateGLPITicket(selectedProblem);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case '5': return 'bg-red-600 text-white'; // Disaster
      case '4': return 'bg-red-500 text-white'; // High
      case '3': return 'bg-orange-500 text-white'; // Average
      case '2': return 'bg-yellow-500 text-black'; // Warning
      case '1': return 'bg-blue-500 text-white'; // Information
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case '5': return 'Desastre';
      case '4': return 'Alta';
      case '3': return 'Média';
      case '2': return 'Aviso';
      case '1': return 'Informação';
      default: return 'Desconhecida';
    }
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (timestamp: string) => {
    const problemTime = new Date(parseInt(timestamp) * 1000);
    const now = new Date();
    const diffMs = now.getTime() - problemTime.getTime();
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 24) {
      const days = Math.floor(diffHours / 24);
      const hours = diffHours % 24;
      return `${days}d ${hours}h ${diffMinutes}m`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  // Função para determinar disponibilidade do host
  const getHostAvailability = (host: any) => {
    console.log('Host availability data:', {
      hostid: host.hostid,
      name: host.name,
      available: host.available,
      status: host.status,
      interfaces: host.interfaces
    });
    
    // Verificar se o host está habilitado primeiro
    if (host.status !== '0') {
      return { status: 'disabled', label: 'Desabilitado', color: 'bg-gray-600 text-white' };
    }
    
    // Verificar disponibilidade através das interfaces
    if (host.interfaces && host.interfaces.length > 0) {
      const mainInterface = host.interfaces.find(iface => iface.main === '1') || host.interfaces[0];
      console.log('Main interface:', mainInterface);
      
      if (mainInterface.available === '1') {
        return { status: 'available', label: 'Disponível', color: 'bg-green-600 text-white' };
      } else if (mainInterface.available === '2') {
        return { status: 'unavailable', label: 'Indisponível', color: 'bg-red-600 text-white' };
      } else if (mainInterface.available === '0') {
        return { status: 'unknown', label: 'Desconhecido', color: 'bg-yellow-600 text-white' };
      }
    }
    
    // Fallback para o campo available do host (se disponível)
    if (host.available === '1') {
      return { status: 'available', label: 'Disponível', color: 'bg-green-600 text-white' };
    } else if (host.available === '2') {
      return { status: 'unavailable', label: 'Indisponível', color: 'bg-red-600 text-white' };
    } else if (host.available === '0') {
      return { status: 'unknown', label: 'Desconhecido', color: 'bg-yellow-600 text-white' };
    }
    
    // Default para unknown se não conseguir determinar
    return { status: 'unknown', label: 'Desconhecido', color: 'bg-gray-600 text-white' };
  };

  // Agrupar hosts por grupo
  const groupedHosts = hosts.reduce((acc, host) => {
    const groupName = host.groups?.[0]?.name || 'Sem Grupo';
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(host);
    return acc;
  }, {} as Record<string, typeof hosts>);

  // Filtrar e ordenar problemas
  const filteredProblems = problems.filter(problem => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        problem.name?.toLowerCase().includes(searchLower) ||
        problem.hosts?.[0]?.name?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    
    if (severityFilter !== 'all' && problem.severity !== severityFilter) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    let aValue, bValue;
    
    switch (sortField) {
      case 'clock':
        aValue = parseInt(a.clock);
        bValue = parseInt(b.clock);
        break;
      case 'severity':
        aValue = parseInt(a.severity);
        bValue = parseInt(b.severity);
        break;
      case 'name':
        aValue = a.name || '';
        bValue = b.name || '';
        break;
      case 'host':
        aValue = a.hosts?.[0]?.name || '';
        bValue = b.hosts?.[0]?.name || '';
        break;
      default:
        return 0;
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Agrupar problemas por host
  const groupedProblems = filteredProblems.reduce((acc, problem) => {
    const hostName = problem.hosts?.[0]?.name || 'Host Desconhecido';
    if (!acc[hostName]) {
      acc[hostName] = [];
    }
    acc[hostName].push(problem);
    return acc;
  }, {} as Record<string, typeof problems>);

  const renderHostsTable = (hostsToShow: typeof hosts) => (
    <Table>
      <TableHeader>
        <TableRow className="border-gray-700 hover:bg-gray-800/50">
          <TableHead className="text-gray-300">Nome do Host</TableHead>
          <TableHead className="text-gray-300">IP/DNS</TableHead>
          <TableHead className="text-gray-300">Porta</TableHead>
          <TableHead className="text-gray-300">Status</TableHead>
          <TableHead className="text-gray-300">Disponibilidade</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {hostsToShow.map((host) => {
          const availability = getHostAvailability(host);
          const mainInterface = host.interfaces?.find(iface => iface.main === '1') || host.interfaces?.[0];
          return (
            <TableRow key={host.hostid} className="h-8 border-gray-700 hover:bg-gray-800/30">
              <TableCell className="font-medium py-2 text-gray-200">{host.name}</TableCell>
              <TableCell className="py-2 text-gray-300">
                {mainInterface?.ip || mainInterface?.dns || 'N/A'}
              </TableCell>
              <TableCell className="py-2 text-gray-300">
                {mainInterface?.port || 'N/A'}
              </TableCell>
              <TableCell className="py-2">
                <Badge className={host.status === '0' ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}>
                  {host.status === '0' ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell className="py-2">
                <Badge className={availability.color}>
                  {availability.label}
                </Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <Card className="border-yellow-600 bg-yellow-900/20">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
            <h3 className="text-lg font-semibold text-yellow-200 mb-2">Zabbix não configurado</h3>
            <p className="text-yellow-300 mb-4">
              Para usar o gerenciamento do Zabbix, configure a integração no painel de administração.
            </p>
            <button onClick={() => window.location.href = '/admin'} className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded border border-yellow-600">
              Configurar Zabbix
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <Monitor className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Gerenciamento Zabbix</h1>
              <p className="text-gray-400">
                Monitore e gerencie seus hosts e problemas do Zabbix
              </p>
            </div>
          </div>
        </div>

        {/* Debug Section - Show errors if any */}
        {(hostsError || problemsError) && (
          <Card className="border-red-600 bg-red-900/20">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Erros de Comunicação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {hostsError && (
                  <div className="bg-red-800/30 p-3 rounded border-l-4 border-red-500">
                    <strong className="text-red-300">Erro ao buscar hosts:</strong> <span className="text-gray-300">{hostsError.message}</span>
                  </div>
                )}
                {problemsError && (
                  <div className="bg-red-800/30 p-3 rounded border-l-4 border-red-500">
                    <strong className="text-red-300">Erro ao buscar problemas:</strong> <span className="text-gray-300">{problemsError.message}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros Compactos */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 min-w-48">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 h-8 text-sm"
                />
              </div>
              
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white h-8 w-40">
                  <SelectValue placeholder="Severidade" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all" className="text-white">Todas</SelectItem>
                  <SelectItem value="5" className="text-white">Desastre</SelectItem>
                  <SelectItem value="4" className="text-white">Alta</SelectItem>
                  <SelectItem value="3" className="text-white">Média</SelectItem>
                  <SelectItem value="2" className="text-white">Aviso</SelectItem>
                  <SelectItem value="1" className="text-white">Informação</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Filter className="h-4 w-4" />
                <span>{filteredProblems.length} problema{filteredProblems.length !== 1 ? 's' : ''} | {hosts.length} host{hosts.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <ZabbixAnalysisDialog problems={filteredProblems} hosts={hosts} />
                <Button 
                  onClick={handleRefreshAll} 
                  disabled={refreshing || hostsLoading || problemsLoading}
                  className="bg-blue-800 hover:bg-blue-700 text-white disabled:opacity-50 h-8 px-3"
                  size="sm"
                >
                  <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Atualizando...' : 'Atualizar'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="problems" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
            <TabsTrigger value="problems" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">Problemas</TabsTrigger>
            <TabsTrigger value="hosts" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">Hosts</TabsTrigger>
            <TabsTrigger value="webhooks" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              <Webhook className="mr-2 h-4 w-4" />
              Webhooks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="problems" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <AlertTriangle className="h-5 w-5" />
                  Problemas Ativos
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Lista de problemas atualmente ativos no Zabbix
                </CardDescription>
              </CardHeader>
              <CardContent>
                {problemsLoading ? (
                  <div className="text-center py-8">
                    <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-400">Carregando problemas...</p>
                  </div>
                ) : problems.length === 0 ? (
                  <div className="text-center py-8 text-green-400">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                    <p className="text-lg font-medium">Nenhum problema ativo!</p>
                    <p className="text-sm text-gray-400">Todos os sistemas estão funcionando normalmente.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                       <TableHeader>
                         <TableRow className="border-gray-700 hover:bg-gray-800/50">
                           <TableHead 
                             className="text-gray-300 text-xs w-[120px] cursor-pointer hover:text-white"
                             onClick={() => handleSort('clock')}
                           >
                             <Clock className="inline-block h-3 w-3 mr-1" />
                             Hora {sortField === 'clock' && (sortDirection === 'asc' ? '↑' : '↓')}
                           </TableHead>
                           <TableHead 
                             className="text-gray-300 text-xs w-[80px] cursor-pointer hover:text-white"
                             onClick={() => handleSort('severity')}
                           >
                             Severidade {sortField === 'severity' && (sortDirection === 'asc' ? '↑' : '↓')}
                           </TableHead>
                           <TableHead className="text-gray-300 text-xs w-[120px]">Hora da Recuperação</TableHead>
                           <TableHead className="text-gray-300 text-xs w-[60px]">Status</TableHead>
                           <TableHead 
                             className="text-gray-300 text-xs cursor-pointer hover:text-white"
                             onClick={() => handleSort('name')}
                           >
                             Informação {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                           </TableHead>
                           <TableHead 
                             className="text-gray-300 text-xs w-[200px] cursor-pointer hover:text-white"
                             onClick={() => handleSort('host')}
                           >
                             Host {sortField === 'host' && (sortDirection === 'asc' ? '↑' : '↓')}
                           </TableHead>
                           <TableHead className="text-gray-300 text-xs w-[80px]">Incidente</TableHead>
                           <TableHead className="text-gray-300 text-xs w-[100px]">Duração</TableHead>
                           <TableHead className="text-gray-300 text-xs w-[80px]">Ações</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {filteredProblems.map((problem) => (
                           <TableRow key={problem.eventid} className="border-gray-700 hover:bg-gray-800/30 text-xs">
                             <TableCell className="py-1 text-gray-300 font-mono text-xs">
                               {formatDateTime(problem.clock)}
                             </TableCell>
                             <TableCell className="py-1">
                               <Badge className={`${getSeverityColor(problem.severity)} text-xs px-1 py-0`}>
                                 {getSeverityLabel(problem.severity)}
                               </Badge>
                             </TableCell>
                             <TableCell className="py-1 text-gray-400 text-xs">
                               -
                             </TableCell>
                             <TableCell className="py-1">
                               {problem.acknowledged === '1' ? (
                                 <Badge className="bg-gray-600 text-white text-xs px-1 py-0">OK</Badge>
                               ) : (
                                 <Badge className="bg-red-600 text-white text-xs px-1 py-0">PROBLEMA</Badge>
                               )}
                             </TableCell>
                             <TableCell className="py-1 text-gray-200 text-xs max-w-[300px] truncate">
                               {problem.name}
                             </TableCell>
                             <TableCell className="py-1 text-gray-300 text-xs">
                               {problem.hosts?.[0]?.name || 'Host Desconhecido'}
                             </TableCell>
                             <TableCell className="py-1">
                               <Badge className="bg-red-600 text-white text-xs px-1 py-0">
                                 INCIDENTE
                               </Badge>
                             </TableCell>
                             <TableCell className="py-1 text-gray-300 text-xs font-mono">
                               {formatDuration(problem.clock)}
                             </TableCell>
                             <TableCell className="py-1">
                               <Button
                                 size="sm"
                                 onClick={() => openConfirmDialog(problem)}
                                 disabled={createTicket.isPending}
                                 className="bg-blue-800 hover:bg-blue-700 text-white p-1 h-6 w-6"
                                 title="Criar chamado no GLPI"
                               >
                                 <ExternalLink className="h-3 w-3" />
                               </Button>
                             </TableCell>
                           </TableRow>
                         ))}
                       </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hosts" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Server className="h-5 w-5" />
                  Hosts Monitorados
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Lista de todos os hosts configurados no Zabbix
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hostsLoading ? (
                  <div className="text-center py-8">
                    <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-400">Carregando hosts...</p>
                  </div>
                ) : (
                  <Tabs defaultValue={Object.keys(groupedHosts)[0] || 'all'} className="w-full">
                    <TabsList className="grid w-full bg-gray-700 border-gray-600 mb-6" style={{gridTemplateColumns: `repeat(${Object.keys(groupedHosts).length}, minmax(0, 1fr))`}}>
                      {Object.keys(groupedHosts).map((groupName) => (
                        <TabsTrigger 
                          key={groupName} 
                          value={groupName}
                          className="data-[state=active]:bg-gray-600 data-[state=active]:text-white text-sm px-2"
                        >
                          {groupName}
                          <Badge variant="outline" className="ml-2 border-gray-500 text-gray-300">
                            {groupedHosts[groupName].length}
                          </Badge>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    
                    {Object.entries(groupedHosts).map(([groupName, groupHosts]) => (
                      <TabsContent key={groupName} value={groupName}>
                        <Tabs defaultValue="available" className="w-full">
                          <TabsList className="grid w-full grid-cols-4 bg-gray-700 border-gray-600 mb-4">
                            <TabsTrigger value="available" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
                              Disponível
                              <Badge className="ml-2 bg-green-900/20 text-green-400">
                                {groupHosts.filter(h => getHostAvailability(h).status === 'available').length}
                              </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="unavailable" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
                              Indisponível
                              <Badge className="ml-2 bg-red-900/20 text-red-400">
                                {groupHosts.filter(h => getHostAvailability(h).status === 'unavailable').length}
                              </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="unknown" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
                              Desconhecido
                              <Badge className="ml-2 bg-yellow-900/20 text-yellow-400">
                                {groupHosts.filter(h => getHostAvailability(h).status === 'unknown').length}
                              </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="disabled" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
                              Desabilitado
                              <Badge className="ml-2 bg-gray-900/20 text-gray-400">
                                {groupHosts.filter(h => getHostAvailability(h).status === 'disabled').length}
                              </Badge>
                            </TabsTrigger>
                          </TabsList>

                          {['available', 'unavailable', 'unknown', 'disabled'].map(status => (
                            <TabsContent key={status} value={status}>
                              {renderHostsTable(groupHosts.filter(host => getHostAvailability(host).status === status))}
                            </TabsContent>
                          ))}
                        </Tabs>
                      </TabsContent>
                    ))}
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="mt-6">
            <ZabbixWebhookManager />
          </TabsContent>
        </Tabs>

        <GLPITicketConfirmDialog
          open={confirmDialogOpen}
          onOpenChange={setConfirmDialogOpen}
          onConfirm={handleConfirmGLPITicket}
          description="Deseja abrir um chamado GLPI para este problema do Zabbix?"
        />
      </div>
    </div>
  );
};

export default Zabbix;
