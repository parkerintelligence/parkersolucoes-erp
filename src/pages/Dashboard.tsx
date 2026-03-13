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

  // Bacula jobs from API (optional)
  const baculaIntegration = integrations.data?.find((i: any) => i.type === 'bacula' && i.is_active);

  return {
    integrations: integrations.data || [],
    reports: reports.data || [],
    logs: logs.data || [],
    isLoading: integrations.isLoading || reports.isLoading || logs.isLoading,
    refetchAll: () => {
      integrations.refetch();
      reports.refetch();
      logs.refetch();
    }
  };
};

const LOGS_PER_PAGE = 5;

const Dashboard = () => {
  const { integrations, reports, logs, isLoading, refetchAll } = useDashboardData();
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

      {/* Alerts Section */}
      {(staleReports.length > 0 || totalFailed > 0) && (
        <Card className="bg-gradient-to-r from-amber-900/20 to-red-900/20 border-amber-600/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-amber-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alertas do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {staleReports.length > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-950/30 border border-amber-700/20">
                <Clock className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-amber-200 font-medium">
                    {staleReports.length} relatório(s) sem execução há mais de 2 dias
                  </p>
                  <p className="text-xs text-amber-300/60 mt-1">
                    {staleReports.map((r: any) => r.name).join(', ')}
                  </p>
                </div>
              </div>
            )}
            {totalFailed > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-950/30 border border-red-700/20">
                <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-200 font-medium">
                    {totalFailed} falha(s) de envio nas últimas 48h
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
