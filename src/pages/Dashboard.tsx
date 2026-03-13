import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Server, Wifi, Router, ShieldCheck, Send, SendHorizonal,
  AlertTriangle, CheckCircle2, XCircle, Clock, HardDrive,
  Activity, Database, RefreshCw, BarChart3, Zap, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardData {
  integrations: any[];
  scheduledReports: any[];
  reportsLogs: any[];
  vpsData: any[];
}

const useDashboardData = () => {
  // Integrations
  const integrations = useQuery({
    queryKey: ['dashboard-integrations'],
    queryFn: async () => {
      const { data } = await supabase.from('integrations').select('*');
      return data || [];
    },
    staleTime: 60000,
  });

  // Scheduled reports
  const reports = useQuery({
    queryKey: ['dashboard-reports'],
    queryFn: async () => {
      const { data } = await supabase.from('scheduled_reports').select('*');
      return data || [];
    },
    staleTime: 60000,
  });

  // Recent logs (last 48h)
  const logs = useQuery({
    queryKey: ['dashboard-logs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('scheduled_reports_logs')
        .select('*')
        .order('execution_date', { ascending: false })
        .limit(100);
      return data || [];
    },
    staleTime: 60000,
  });

  // FTP backup directories (root level)
  const ftpIntegration = integrations.data?.find((i: any) => i.type === 'ftp' && i.is_active);
  const ftpFiles = useQuery({
    queryKey: ['dashboard-ftp-files', ftpIntegration?.id],
    queryFn: async () => {
      if (!ftpIntegration) return [];

      const cleanHost = (ftpIntegration.base_url || '')
        .replace(/^(ftp:\/\/|ftps:\/\/|http:\/\/|https:\/\/)/, '')
        .replace(/\/$/, '');

      if (!cleanHost) return [];

      const { data, error } = await supabase.functions.invoke('ftp-list', {
        body: {
          host: cleanHost,
          port: ftpIntegration.port || 21,
          username: ftpIntegration.username || 'anonymous',
          password: ftpIntegration.password || '',
          secure: ftpIntegration.use_ssl || false,
          path: ftpIntegration.directory || '/',
          passive: ftpIntegration.passive_mode !== false,
        }
      });

      if (error) return [];
      return (data?.files || []).map((file: any) => ({
        ...file,
        lastModified: file.lastModified || new Date().toISOString(),
      }));
    },
    enabled: !!ftpIntegration,
    staleTime: 120000,
  });

  // Bacula recent jobs
  const baculaIntegration = integrations.data?.find((i: any) => i.type === 'bacula' && i.is_active);
  const baculaJobs = useQuery({
    queryKey: ['dashboard-bacula-errors'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('bacula-proxy', {
        body: { endpoint: 'jobs' }
      });
      if (error) return [];
      // Filter error jobs
      const jobs = Array.isArray(data) ? data : (data?.jobs || []);
      return jobs
        .filter((j: any) => j.jobstatus === 'E' || j.jobstatus === 'f' || j.jobstatus === 'A')
        .slice(0, 5);
    },
    enabled: !!baculaIntegration,
    staleTime: 120000,
  });

  // Zabbix recent problems
  const zabbixIntegration = integrations.data?.find((i: any) => i.type === 'zabbix' && i.is_active);
  const zabbixProblems = useQuery({
    queryKey: ['dashboard-zabbix-problems'],
    queryFn: async () => {
      if (!zabbixIntegration) return { active: [], disasters: [] };
      // Fetch active problems
      const { data, error } = await supabase.functions.invoke('zabbix-proxy', {
        body: {
          method: 'problem.get',
          params: {
            output: ['eventid', 'name', 'severity', 'clock'],
            selectHosts: ['name'],
            sortfield: 'eventid',
            sortorder: 'DESC',
            limit: 5,
            recent: true,
          },
          integrationId: zabbixIntegration.id,
        }
      });
      const activeProblems = !error ? (Array.isArray(data?.result || data) ? (data?.result || data) : []) : [];

      // Fetch last 5 disaster events (severity 5) from event history
      const { data: evtData } = await supabase.functions.invoke('zabbix-proxy', {
        body: {
          method: 'event.get',
          params: {
            output: ['eventid', 'name', 'severity', 'clock', 'r_eventid'],
            selectHosts: ['name'],
            sortfield: ['clock'],
            sortorder: 'DESC',
            limit: 5,
            severities: [5],
            value: 1,
          },
          integrationId: zabbixIntegration.id,
        }
      });
      const disasters = Array.isArray(evtData?.result || evtData) ? (evtData?.result || evtData) : [];

      return { active: activeProblems, disasters };
    },
    enabled: !!zabbixIntegration,
    staleTime: 120000,
  });

  return {
    integrations: integrations.data || [],
    reports: reports.data || [],
    logs: logs.data || [],
    ftpFiles: ftpFiles.data || [],
    baculaErrors: baculaJobs.data || [],
    zabbixProblems: zabbixProblems.data || [],
    hasBacula: !!baculaIntegration,
    hasZabbix: !!zabbixIntegration,
    hasFtp: !!ftpIntegration,
    isLoading: integrations.isLoading || reports.isLoading || logs.isLoading,
    refetchAll: () => {
      integrations.refetch();
      reports.refetch();
      logs.refetch();
      ftpFiles.refetch();
      baculaJobs.refetch();
      zabbixProblems.refetch();
    }
  };
};

const LOGS_PER_PAGE = 5;

const Dashboard = () => {
  const { integrations, reports, logs, ftpFiles, baculaErrors, zabbixProblems, hasBacula, hasZabbix, hasFtp, isLoading, refetchAll } = useDashboardData();
  const [logsPage, setLogsPage] = useState(0);

  // --- Compute stats ---
  const activeIntegrations = integrations.filter((i: any) => i.is_active);
  const integrationsByType = integrations.reduce((acc: Record<string, any[]>, i: any) => {
    acc[i.type] = acc[i.type] || [];
    acc[i.type].push(i);
    return acc;
  }, {});

  const mikrotikConns = integrationsByType['mikrotik'] || [];
  const ftpConns = integrationsByType['ftp'] || [];
  const hostingerConns = integrationsByType['hostinger'] || [];
  const baculaConns = integrationsByType['bacula'] || [];
  const evolutionConns = integrationsByType['evolution_api'] || [];
  const chatwootConns = integrationsByType['chatwoot'] || [];
  const zabbixConns = integrationsByType['zabbix'] || [];
  const unifiConns = integrationsByType['unifi'] || [];
  const glpiConns = integrationsByType['glpi'] || [];

  // Reports stats
  const activeReports = reports.filter((r: any) => r.is_active);
  const totalSent = logs.filter((l: any) => l.status === 'success').length;
  const totalFailed = logs.filter((l: any) => l.status === 'error').length;
  const totalPending = activeReports.filter((r: any) => !r.last_execution).length;

  // Reports without execution for >2 days
  const staleReports = activeReports.filter((r: any) => {
    if (!r.last_execution) return true;
    return differenceInDays(new Date(), parseISO(r.last_execution)) > 2;
  });

  // FTP backups - check if last backup is old
  const ftpActive = ftpConns.filter((f: any) => f.is_active);

  // Integration health summary
  const connectionTypes = [
    { label: 'MikroTik', data: mikrotikConns, icon: Router, color: 'text-orange-400', bg: 'bg-orange-900/20 border-orange-600/30' },
    { label: 'FTP/Backup', data: ftpConns, icon: HardDrive, color: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-600/30' },
    { label: 'Hostinger VPS', data: hostingerConns, icon: Server, color: 'text-purple-400', bg: 'bg-purple-900/20 border-purple-600/30' },
    { label: 'Bacula', data: baculaConns, icon: Database, color: 'text-green-400', bg: 'bg-green-900/20 border-green-600/30' },
    { label: 'Evolution API', data: evolutionConns, icon: Send, color: 'text-emerald-400', bg: 'bg-emerald-900/20 border-emerald-600/30' },
    { label: 'Chatwoot', data: chatwootConns, icon: SendHorizonal, color: 'text-cyan-400', bg: 'bg-cyan-900/20 border-cyan-600/30' },
    { label: 'Zabbix', data: zabbixConns, icon: Activity, color: 'text-red-400', bg: 'bg-red-900/20 border-red-600/30' },
    { label: 'UniFi', data: unifiConns, icon: Wifi, color: 'text-sky-400', bg: 'bg-sky-900/20 border-sky-600/30' },
    { label: 'GLPI', data: glpiConns, icon: ShieldCheck, color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-600/30' },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Dashboard Geral</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão consolidada de todo o sistema</p>
        </div>
        <Button variant="outline" size="sm" onClick={refetchAll} disabled={isLoading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-900/30 to-emerald-950/50 border-emerald-600/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-300/70 font-medium">Integrações Ativas</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{activeIntegrations.length}</p>
                <p className="text-[10px] text-emerald-300/50 mt-0.5">de {integrations.length} total</p>
              </div>
              <Zap className="h-8 w-8 text-emerald-500/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/30 to-blue-950/50 border-blue-600/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-300/70 font-medium">Relatórios Ativos</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">{activeReports.length}</p>
                <p className="text-[10px] text-blue-300/50 mt-0.5">de {reports.length} total</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/30 to-green-950/50 border-green-600/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-300/70 font-medium">Envios com Sucesso</p>
                <p className="text-2xl font-bold text-green-400 mt-1">{totalSent}</p>
                <p className="text-[10px] text-green-300/50 mt-0.5">últimas 48h</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-900/30 to-red-950/50 border-red-600/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-300/70 font-medium">Envios com Falha</p>
                <p className="text-2xl font-bold text-red-400 mt-1">{totalFailed}</p>
                <p className="text-[10px] text-red-300/50 mt-0.5">últimas 48h</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section - FTP Backups, Bacula Errors, Zabbix Problems */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* FTP Backups sem fazer há dias */}
        <Card className="bg-gradient-to-br from-amber-900/20 to-amber-950/40 border-amber-600/30">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-amber-300 flex items-center gap-2">
              <HardDrive className="h-3.5 w-3.5" />
              Backups FTP Desatualizados
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {!hasFtp ? (
              <p className="text-[10px] text-muted-foreground">FTP não configurado</p>
            ) : (() => {
              const now = new Date();
              const oldDirs = ftpFiles
                .filter((f: any) => f.isDirectory || f.type === 'directory')
                .map((f: any) => {
                  const modifiedAt = f.lastModified || f.date || f.rawModifiedAt;
                  const modifiedDate = new Date(modifiedAt);
                  const hasValidDate = !Number.isNaN(modifiedDate.getTime());

                  return {
                    ...f,
                    daysSince: hasValidDate
                      ? Math.floor((now.getTime() - modifiedDate.getTime()) / (1000 * 60 * 60 * 24))
                      : 0,
                  };
                })
                .filter((f: any) => f.daysSince > 2)
                .sort((a: any, b: any) => b.daysSince - a.daysSince)
                .slice(0, 6);

              if (oldDirs.length === 0) {
                return (
                  <div className="flex items-center gap-2 py-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                    <p className="text-xs text-green-300">Todos os backups estão em dia</p>
                  </div>
                );
              }

              return (
                <div className="space-y-1.5 mt-1">
                  {oldDirs.map((dir: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-amber-200/80 truncate max-w-[60%]">{dir.name}</span>
                      <Badge variant="destructive" className="text-[9px] py-0 px-1.5 h-4">
                        {dir.daysSince}d atrás
                      </Badge>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Últimos 5 erros Bacula */}
        <Card className="bg-gradient-to-br from-red-900/20 to-red-950/40 border-red-600/30">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-red-300 flex items-center gap-2">
              <Database className="h-3.5 w-3.5" />
              Últimos Erros Bacula
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {!hasBacula ? (
              <p className="text-[10px] text-muted-foreground">Bacula não configurado</p>
            ) : baculaErrors.length === 0 ? (
              <div className="flex items-center gap-2 py-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                <p className="text-xs text-green-300">Sem erros recentes</p>
              </div>
            ) : (
              <div className="space-y-1.5 mt-1">
                {baculaErrors.slice(0, 5).map((job: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <XCircle className="h-3 w-3 text-red-400 flex-shrink-0" />
                      <span className="text-red-200/80 truncate">{job.name || job.jobname || 'Job'}</span>
                    </div>
                    <span className="text-[9px] text-red-300/50 flex-shrink-0">
                      {job.endtime || job.starttime ? format(parseISO(job.endtime || job.starttime), "dd/MM HH:mm", { locale: ptBR }) : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Últimos 5 problemas Zabbix */}
        <Card className="bg-gradient-to-br from-orange-900/20 to-orange-950/40 border-orange-600/30">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-orange-300 flex items-center gap-2">
              <Activity className="h-3.5 w-3.5" />
              Últimos Problemas Zabbix
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {!hasZabbix ? (
              <p className="text-[10px] text-muted-foreground">Zabbix não configurado</p>
            ) : zabbixProblems.length === 0 ? (
              <div className="flex items-center gap-2 py-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                <p className="text-xs text-green-300">Sem problemas ativos</p>
              </div>
            ) : (
              <div className="space-y-1.5 mt-1">
                {zabbixProblems.slice(0, 5).map((problem: any, i: number) => {
                  const severity = parseInt(problem.severity || '0');
                  const severityColors: Record<number, string> = {
                    0: 'text-muted-foreground', 1: 'text-blue-300', 2: 'text-yellow-300',
                    3: 'text-orange-300', 4: 'text-red-300', 5: 'text-red-400 font-bold'
                  };
                  const severityLabels: Record<number, string> = {
                    0: 'Info', 1: 'Info', 2: 'Aviso', 3: 'Médio', 4: 'Alto', 5: 'Desastre'
                  };
                  const hostName = problem.hosts?.[0]?.name || '';
                  const timestamp = problem.clock ? new Date(parseInt(problem.clock) * 1000) : null;

                  return (
                    <div key={i} className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <AlertTriangle className={`h-3 w-3 flex-shrink-0 ${severityColors[severity] || 'text-orange-400'}`} />
                        <span className="text-orange-200/80 truncate" title={`${hostName}: ${problem.name}`}>
                          {hostName ? `${hostName}: ` : ''}{problem.name}
                        </span>
                      </div>
                      <Badge variant="outline" className={`text-[8px] py-0 px-1 h-3.5 border-orange-600/30 ${severityColors[severity]}`}>
                        {severityLabels[severity] || 'N/A'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Connections Grid */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Conexões & Integrações</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectionTypes.map(ct => {
            const active = ct.data.filter((d: any) => d.is_active).length;
            const total = ct.data.length;
            if (total === 0) return null;
            return (
              <Card key={ct.label} className={ct.bg}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ct.icon className={`h-5 w-5 ${ct.color}`} />
                      <span className="text-sm font-semibold text-foreground">{ct.label}</span>
                    </div>
                    <Badge variant={active === total ? 'default' : 'secondary'} className="text-[10px]">
                      {active}/{total}
                    </Badge>
                  </div>
                  <Progress value={total > 0 ? (active / total) * 100 : 0} className="h-1.5" />
                  <div className="mt-2 space-y-1">
                    {ct.data.slice(0, 3).map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground truncate max-w-[60%]">{item.name}</span>
                        <Badge variant={item.is_active ? 'default' : 'destructive'} className="text-[9px] py-0 px-1.5 h-4">
                          {item.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    ))}
                    {ct.data.length > 3 && (
                      <p className="text-[10px] text-muted-foreground">+{ct.data.length - 3} mais...</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Reports Status */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Status dos Relatórios Agendados</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeReports.length === 0 ? (
            <Card className="col-span-full bg-muted/20 border-border">
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum relatório agendado ativo</p>
              </CardContent>
            </Card>
          ) : (
            activeReports.slice(0, 6).map((report: any) => {
              const lastExec = report.last_execution ? parseISO(report.last_execution) : null;
              const nextExec = report.next_execution ? parseISO(report.next_execution) : null;
              const daysSinceExec = lastExec ? differenceInDays(new Date(), lastExec) : null;
              const isStale = daysSinceExec !== null && daysSinceExec > 2;

              return (
                <Card key={report.id} className={`border ${isStale ? 'border-amber-600/40 bg-amber-950/10' : 'bg-card/50 border-border'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground truncate max-w-[70%]">{report.name}</span>
                      <Badge variant={isStale ? 'destructive' : 'default'} className="text-[9px]">
                        {isStale ? 'Atrasado' : 'OK'}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Última execução:</span>
                        <span className={isStale ? 'text-amber-400' : ''}>
                          {lastExec ? format(lastExec, "dd/MM HH:mm", { locale: ptBR }) : 'Nunca'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Próxima:</span>
                        <span>{nextExec ? format(nextExec, "dd/MM HH:mm", { locale: ptBR }) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Execuções:</span>
                        <span>{report.execution_count || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Recent Logs - Compact Card with Pagination */}
      {logs.length > 0 && (() => {
        const limitedLogs = logs.slice(0, 20);
        const totalPages = Math.ceil(limitedLogs.length / LOGS_PER_PAGE);
        const pagedLogs = limitedLogs.slice(logsPage * LOGS_PER_PAGE, (logsPage + 1) * LOGS_PER_PAGE);

        return (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Últimos Envios</h2>
            <Card className="bg-card/50 border-border max-w-md">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {pagedLogs.map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between px-3 py-2 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2">
                        {log.status === 'success' ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-xs text-foreground">{log.phone_number}</p>
                          <p className="text-[9px] text-muted-foreground">
                            {format(parseISO(log.execution_date), "dd/MM HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <Badge variant={log.status === 'success' ? 'default' : 'destructive'} className="text-[9px] py-0 px-1.5 h-4">
                        {log.status === 'success' ? 'Enviado' : 'Falha'}
                      </Badge>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-3 py-2 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      disabled={logsPage === 0}
                      onClick={() => setLogsPage(p => p - 1)}
                    >
                      <ChevronLeft className="h-3 w-3 mr-1" /> Anterior
                    </Button>
                    <span className="text-[10px] text-muted-foreground">{logsPage + 1}/{totalPages}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      disabled={logsPage >= totalPages - 1}
                      onClick={() => setLogsPage(p => p + 1)}
                    >
                      Próximo <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })()}
    </div>
  );
};

export default Dashboard;
