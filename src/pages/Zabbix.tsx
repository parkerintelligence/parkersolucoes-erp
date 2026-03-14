import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, CheckCircle, XCircle, RefreshCcw, Monitor, Server,
  ExternalLink, Search, Filter, Clock, Activity, Wifi, WifiOff
} from 'lucide-react';
import { useZabbixAPI } from '@/hooks/useZabbixAPI';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';
import { GLPITicketConfirmDialog } from '@/components/GLPITicketConfirmDialog';
import ZabbixAnalysisDialog from '@/components/ZabbixAnalysisDialog';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const Zabbix = () => {
  const { useHosts, useProblems, isConfigured, integration } = useZabbixAPI();
  const { createTicket } = useGLPIExpanded();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('problems');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<any>(null);
  const [sortField, setSortField] = useState('clock');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data: hosts = [], isLoading: hostsLoading, refetch: refetchHosts, error: hostsError } = useHosts({}, {
    staleTime: 0, refetchInterval: 30000
  });
  const { data: problems = [], isLoading: problemsLoading, refetch: refetchProblems, error: problemsError } = useProblems({}, {
    staleTime: 0, refetchInterval: 10000
  });

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['zabbix-hosts'] });
      await queryClient.invalidateQueries({ queryKey: ['zabbix-problems'] });
      await Promise.all([
        Promise.race([refetchHosts(), new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))]),
        Promise.race([refetchProblems(), new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))])
      ]);
      toast({ title: "Dados atualizados", description: "Informações do Zabbix foram atualizadas." });
    } catch (error: any) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateGLPITicket = async (problem: any) => {
    try {
      await createTicket.mutateAsync({
        name: `Zabbix Problem - ${problem.name}`,
        content: `Problema: ${problem.name}\nSeveridade: ${getSeverityLabel(problem.severity)}\nHost: ${problem.hosts?.[0]?.name || 'N/A'}\nData/Hora: ${new Date(parseInt(problem.clock) * 1000).toLocaleString('pt-BR')}\nStatus: ${problem.acknowledged === '1' ? 'Reconhecido' : 'Novo'}\n\nChamado criado automaticamente do Zabbix.`,
        urgency: parseInt(problem.severity) >= 4 ? 4 : 3,
        impact: parseInt(problem.severity) >= 4 ? 4 : 3,
        priority: parseInt(problem.severity) >= 4 ? 4 : 3,
        status: 1, type: 1,
      });
      toast({ title: "Chamado GLPI criado!", description: "O chamado foi criado com sucesso." });
    } catch {
      toast({ title: "Erro ao criar chamado", description: "Verifique a configuração do GLPI.", variant: "destructive" });
    }
  };

  const openConfirmDialog = (problem: any) => { setSelectedProblem(problem); setConfirmDialogOpen(true); };
  const handleConfirmGLPITicket = () => { if (selectedProblem) handleCreateGLPITicket(selectedProblem); };

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case '5': return 'border-red-500/30 text-red-400 bg-red-500/10';
      case '4': return 'border-red-400/30 text-red-300 bg-red-400/10';
      case '3': return 'border-orange-500/30 text-orange-400 bg-orange-500/10';
      case '2': return 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10';
      case '1': return 'border-blue-500/30 text-blue-400 bg-blue-500/10';
      default: return 'border-border text-muted-foreground';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case '5': return 'Desastre'; case '4': return 'Alta'; case '3': return 'Média';
      case '2': return 'Aviso'; case '1': return 'Informação'; default: return 'Desconhecida';
    }
  };

  const formatDateTime = (timestamp: string) => new Date(parseInt(timestamp) * 1000).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const formatDuration = (timestamp: string) => {
    const diffMs = Date.now() - parseInt(timestamp) * 1000;
    const diffHours = Math.floor(diffMs / 3600000);
    const diffMinutes = Math.floor((diffMs % 3600000) / 60000);
    if (diffHours > 24) { const days = Math.floor(diffHours / 24); return `${days}d ${diffHours % 24}h ${diffMinutes}m`; }
    if (diffHours > 0) return `${diffHours}h ${diffMinutes}m`;
    return `${diffMinutes}m`;
  };

  const getHostAvailability = (host: any) => {
    if (host.status !== '0') return { status: 'disabled', label: 'Desabilitado' };
    if (host.interfaces?.length > 0) {
      const main = host.interfaces.find((i: any) => i.main === '1') || host.interfaces[0];
      if (main.available === '1') return { status: 'available', label: 'Disponível' };
      if (main.available === '2') return { status: 'unavailable', label: 'Indisponível' };
    }
    if (host.available === '1') return { status: 'available', label: 'Disponível' };
    if (host.available === '2') return { status: 'unavailable', label: 'Indisponível' };
    return { status: 'unknown', label: 'Desconhecido' };
  };

  const getAvailabilityBadge = (status: string) => {
    switch (status) {
      case 'available': return 'border-green-500/30 text-green-400';
      case 'unavailable': return 'border-red-500/30 text-red-400';
      case 'disabled': return 'border-border text-muted-foreground';
      default: return 'border-yellow-500/30 text-yellow-400';
    }
  };

  const groupedHosts = hosts.reduce((acc, host) => {
    const groupName = host.groups?.[0]?.name || 'Sem Grupo';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(host);
    return acc;
  }, {} as Record<string, typeof hosts>);

  const filteredProblems = problems.filter(problem => {
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      if (!problem.name?.toLowerCase().includes(s) && !problem.hosts?.[0]?.name?.toLowerCase().includes(s)) return false;
    }
    if (severityFilter !== 'all' && problem.severity !== severityFilter) return false;
    return true;
  }).sort((a, b) => {
    let aVal: any, bVal: any;
    switch (sortField) {
      case 'clock': aVal = parseInt(a.clock); bVal = parseInt(b.clock); break;
      case 'severity': aVal = parseInt(a.severity); bVal = parseInt(b.severity); break;
      case 'name': aVal = a.name || ''; bVal = b.name || ''; break;
      case 'host': aVal = a.hosts?.[0]?.name || ''; bVal = b.hosts?.[0]?.name || ''; break;
      default: return 0;
    }
    return sortDirection === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  const totalPages = Math.ceil(filteredProblems.length / itemsPerPage);
  const paginatedProblems = filteredProblems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearchChange = (v: string) => { setSearchTerm(v); setCurrentPage(1); };
  const handleSeverityChange = (v: string) => { setSeverityFilter(v); setCurrentPage(1); };

  // Stats
  const enabledHosts = hosts.filter(h => h.status === '0');
  const availableHosts = hosts.filter(h => getHostAvailability(h).status === 'available');
  const unavailableHosts = hosts.filter(h => getHostAvailability(h).status === 'unavailable');
  const disasterProblems = problems.filter(p => parseInt(p.severity) >= 4);

  if (!isConfigured) {
    return (
      <div className="space-y-4">
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-yellow-500" />
            <h3 className="text-sm font-semibold text-foreground mb-1">Zabbix não configurado</h3>
            <p className="text-xs text-muted-foreground mb-4">Configure a integração no painel de administração.</p>
            <Button size="sm" onClick={() => window.location.href = '/admin'} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Configurar Zabbix
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'problems', label: 'Problemas', icon: AlertTriangle },
    { id: 'hosts', label: 'Hosts', icon: Server },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            Gerenciamento Zabbix
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Monitore e gerencie hosts e problemas do Zabbix</p>
        </div>
        <div className="flex items-center gap-2">
          <ZabbixAnalysisDialog problems={filteredProblems} hosts={hosts} />
          <Button onClick={handleRefreshAll} disabled={refreshing || hostsLoading || problemsLoading} size="sm" variant="outline" className="h-8 text-xs">
            <RefreshCcw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>
      </div>

      {/* Errors */}
      {(hostsError || problemsError) && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 space-y-2">
            {hostsError && (
              <div className="flex items-center gap-2 text-xs"><XCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" /><span className="text-destructive">Hosts: {hostsError.message}</span></div>
            )}
            {problemsError && (
              <div className="flex items-center gap-2 text-xs"><XCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" /><span className="text-destructive">Problemas: {problemsError.message}</span></div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {[
          { label: "Hosts", value: hosts.length, icon: Server, color: "text-primary" },
          { label: "Habilitados", value: enabledHosts.length, icon: Activity, color: "text-primary" },
          { label: "Disponíveis", value: availableHosts.length, icon: Wifi, color: "text-green-500" },
          { label: "Indisponíveis", value: unavailableHosts.length, icon: WifiOff, color: "text-destructive" },
          { label: "Problemas", value: problems.length, icon: AlertTriangle, color: "text-orange-500" },
          { label: "Críticos", value: disasterProblems.length, icon: XCircle, color: "text-destructive" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
            <s.icon className={`h-3.5 w-3.5 ${s.color} flex-shrink-0`} />
            <div className="min-w-0">
              <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
              <span className="text-[10px] text-muted-foreground ml-1.5">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Tabs */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar..." value={searchTerm} onChange={e => handleSearchChange(e.target.value)} className="pl-8 bg-card border-border h-8 text-xs" />
        </div>
        <Select value={severityFilter} onValueChange={handleSeverityChange}>
          <SelectTrigger className="w-36 h-8 bg-card border-border text-xs"><SelectValue placeholder="Severidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="5">🔴 Desastre</SelectItem>
            <SelectItem value="4">🟠 Alta</SelectItem>
            <SelectItem value="3">🟡 Média</SelectItem>
            <SelectItem value="2">🔵 Aviso</SelectItem>
            <SelectItem value="1">ℹ️ Informação</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center text-[11px] text-muted-foreground">
          <Filter className="h-3 w-3 mr-1" />
          {filteredProblems.length} problema{filteredProblems.length !== 1 ? 's' : ''}
          {totalPages > 1 && ` | Pág. ${currentPage}/${totalPages}`}
        </div>
        <div className="flex items-center bg-card border border-border rounded-lg p-0.5 ml-auto">
          {tabs.map(tab => (
            <Button key={tab.id} variant="ghost" size="sm" onClick={() => setActiveTab(tab.id)}
              className={`h-7 px-2.5 gap-1 rounded-md text-[11px] ${activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <tab.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'problems' && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-foreground text-sm">
              <AlertTriangle className="h-4 w-4 text-primary" />
              Problemas Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {problemsLoading ? (
              <div className="text-center py-10">
                <RefreshCcw className="h-6 w-6 animate-spin mx-auto mb-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Carregando problemas...</p>
              </div>
            ) : problems.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-500" />
                <p className="text-sm font-medium text-foreground mb-1">Nenhum problema ativo!</p>
                <p className="text-xs text-muted-foreground">Todos os sistemas estão funcionando.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground text-xs cursor-pointer hover:text-foreground w-[140px]" onClick={() => handleSort('clock')}>
                        <Clock className="inline-block h-3 w-3 mr-1" />Hora {sortField === 'clock' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs cursor-pointer hover:text-foreground w-[80px]" onClick={() => handleSort('severity')}>
                        Severidade {sortField === 'severity' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs w-[60px]">Status</TableHead>
                      <TableHead className="text-muted-foreground text-xs cursor-pointer hover:text-foreground" onClick={() => handleSort('name')}>
                        Informação {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs cursor-pointer hover:text-foreground w-[180px]" onClick={() => handleSort('host')}>
                        Host {sortField === 'host' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs w-[80px]">Tipo</TableHead>
                      <TableHead className="text-muted-foreground text-xs w-[90px]">Duração</TableHead>
                      <TableHead className="text-muted-foreground text-xs w-[50px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProblems.map((problem) => (
                      <TableRow key={problem.eventid} className="border-border/50 hover:bg-muted/20">
                        <TableCell className="py-1 text-xs text-muted-foreground font-mono">{formatDateTime(problem.clock)}</TableCell>
                        <TableCell className="py-1">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getSeverityColor(problem.severity)}`}>
                            {getSeverityLabel(problem.severity)}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-1">
                          {problem.acknowledged === '1' ? (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border text-muted-foreground">OK</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-red-500/30 text-red-400">PROBLEMA</Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-1 text-xs text-foreground max-w-[300px] truncate">{problem.name}</TableCell>
                        <TableCell className="py-1 text-xs text-muted-foreground">{problem.hosts?.[0]?.name || 'Desconhecido'}</TableCell>
                        <TableCell className="py-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-red-500/30 text-red-400">INCIDENTE</Badge>
                        </TableCell>
                        <TableCell className="py-1 text-xs text-muted-foreground font-mono">{formatDuration(problem.clock)}</TableCell>
                        <TableCell className="py-1 text-right">
                          <Button variant="outline" size="sm" onClick={() => openConfirmDialog(problem)} disabled={createTicket.isPending}
                            className="h-6 w-6 p-0" title="Criar chamado GLPI">
                            <ExternalLink className="h-2.5 w-2.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="text-[11px] text-muted-foreground">
                      {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredProblems.length)} de {filteredProblems.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-7 px-2 text-xs">««</Button>
                      <Button size="sm" variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-7 px-2 text-xs">‹</Button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let page: number;
                        if (totalPages <= 5) page = i + 1;
                        else if (currentPage <= 3) page = i + 1;
                        else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                        else page = currentPage - 2 + i;
                        return (
                          <Button key={page} size="sm" variant="outline" onClick={() => setCurrentPage(page)}
                            className={`h-7 w-7 p-0 text-xs ${currentPage === page ? 'bg-primary text-primary-foreground border-primary' : ''}`}>
                            {page}
                          </Button>
                        );
                      })}
                      <Button size="sm" variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-7 px-2 text-xs">›</Button>
                      <Button size="sm" variant="outline" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="h-7 px-2 text-xs">»»</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'hosts' && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-foreground text-sm">
              <Server className="h-4 w-4 text-primary" />
              Hosts Monitorados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hostsLoading ? (
              <div className="text-center py-10">
                <RefreshCcw className="h-6 w-6 animate-spin mx-auto mb-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Carregando hosts...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedHosts).map(([groupName, groupHosts]) => (
                  <div key={groupName}>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xs font-semibold text-foreground">{groupName}</h3>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{groupHosts.length}</Badge>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="text-muted-foreground text-xs">Nome do Host</TableHead>
                            <TableHead className="text-muted-foreground text-xs">IP/DNS</TableHead>
                            <TableHead className="text-muted-foreground text-xs">Porta</TableHead>
                            <TableHead className="text-muted-foreground text-xs">Status</TableHead>
                            <TableHead className="text-muted-foreground text-xs">Disponibilidade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupHosts.map((host) => {
                            const availability = getHostAvailability(host);
                            const mainInterface = host.interfaces?.find((i: any) => i.main === '1') || host.interfaces?.[0];
                            return (
                              <TableRow key={host.hostid} className="border-border/50 hover:bg-muted/20">
                                <TableCell className="py-1 text-xs font-medium text-foreground">{host.name}</TableCell>
                                <TableCell className="py-1 text-xs text-muted-foreground font-mono">{mainInterface?.ip || mainInterface?.dns || 'N/A'}</TableCell>
                                <TableCell className="py-1 text-xs text-muted-foreground">{mainInterface?.port || 'N/A'}</TableCell>
                                <TableCell className="py-1">
                                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${host.status === '0' ? 'border-green-500/30 text-green-400' : 'border-border text-muted-foreground'}`}>
                                    {host.status === '0' ? 'Ativo' : 'Inativo'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-1">
                                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getAvailabilityBadge(availability.status)}`}>
                                    {availability.label}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <GLPITicketConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmGLPITicket}
        description="Deseja abrir um chamado GLPI para este problema do Zabbix?"
      />
    </div>
  );
};

export default Zabbix;
