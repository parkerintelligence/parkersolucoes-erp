import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  TrendingUp,
  Database,
  FileText,
  RefreshCw,
  Eye,
  Bug,
  Lock
} from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useWazuhAPI } from '@/hooks/useWazuhAPI';

const Security = () => {
  const { data: integrations } = useIntegrations();
  const wazuhIntegration = integrations?.find(int => int.type === 'wazuh' && int.is_active);
  
  const { 
    useWazuhAgents, 
    useWazuhAlerts, 
    useWazuhStats,
    useWazuhManagerInfo,
    useWazuhRules,
    testWazuhConnection,
    refreshData 
  } = useWazuhAPI();

  // Fetch real Wazuh data if integration is available
  const { data: agents, isLoading: agentsLoading, error: agentsError } = useWazuhAgents(wazuhIntegration?.id || '');
  const { data: alerts, isLoading: alertsLoading, error: alertsError } = useWazuhAlerts(wazuhIntegration?.id || '');
  const { data: stats, isLoading: statsLoading, error: statsError } = useWazuhStats(wazuhIntegration?.id || '');
  const { data: managerInfo, isLoading: managerInfoLoading, error: managerInfoError } = useWazuhManagerInfo(wazuhIntegration?.id || '');
  const { data: rules, isLoading: rulesLoading, error: rulesError } = useWazuhRules(wazuhIntegration?.id || '');

  const isLoadingData = agentsLoading || alertsLoading || statsLoading || managerInfoLoading || rulesLoading;

  // Use real data if available, otherwise use mock data
  const hasRealData = useMemo(() => {
    if (!wazuhIntegration || isLoadingData) return false;
    
    // Check if we have successful data from any of the queries
    const hasValidStats = stats && !statsError && 
      (stats.total_agents > 0 || stats.agents_connected > 0);
    const hasValidAgents = agents && !agentsError && 
      Array.isArray(agents?.data?.affected_items) && agents.data.affected_items.length > 0;
    const hasValidAlerts = alerts && !alertsError;
    
    console.log('Real data check:', { 
      hasValidStats, 
      hasValidAgents, 
      hasValidAlerts, 
      stats, 
      statsError,
      agents: agents?.data,
      agentsError,
      alerts: alerts?.data,
      alertsError
    });
    
    return hasValidStats || hasValidAgents || hasValidAlerts;
  }, [wazuhIntegration, isLoadingData, stats, statsError, agents, agentsError, alerts, alertsError]);
  const displayData = hasRealData ? {
    agents: {
      total: stats.total_agents || 0,
      active: stats.agents_connected || 0,
      disconnected: stats.agents_disconnected || 0,
      never_connected: stats.agents_never_connected || 0
    },
    alerts: {
      critical: stats.critical_alerts || 0,
      high: stats.high_alerts || 0,
      medium: stats.medium_alerts || 0,
      low: stats.low_alerts || 0,
      total: stats.total_alerts_today || 0
    },
    managerInfo: managerInfo?.data || {
      name: "Wazuh Manager",
      version: "4.0.0",
      hostname: "wazuh-manager"
    },
    rulesCount: rules?.data?.total_affected_items || 0,
    agentsList: agents?.data?.affected_items || [],
    alertsList: alerts?.data?.affected_items || []
  } : {
    agents: {
      total: 45,
      active: 42,
      disconnected: 3,
      never_connected: 0
    },
    alerts: {
      critical: 12,
      high: 28,
      medium: 156,
      low: 89,
      total: 285
    },
    managerInfo: {
      name: "Wazuh Manager (Demo)",
      version: "4.0.0",
      hostname: "demo-wazuh-manager"
    },
    rulesCount: 1850,
    agentsList: [
      { id: '001', name: 'web-server-01', ip: '192.168.1.10', os: { name: 'Ubuntu 20.04' }, status: 'active' },
      { id: '002', name: 'db-server-01', ip: '192.168.1.20', os: { name: 'CentOS 8' }, status: 'active' },
      { id: '003', name: 'mail-server-01', ip: '192.168.1.30', os: { name: 'Ubuntu 22.04' }, status: 'disconnected' },
    ],
    alertsList: [
      { id: 1, rule: { description: 'SSH Brute Force', level: 10 }, agent: { name: 'web-server-01' }, timestamp: '2024-01-15T10:35:22Z' },
      { id: 2, rule: { description: 'Web Attack', level: 12 }, agent: { name: 'web-server-01' }, timestamp: '2024-01-15T10:30:15Z' },
      { id: 3, rule: { description: 'File Integrity', level: 7 }, agent: { name: 'db-server-01' }, timestamp: '2024-01-15T10:25:08Z' },
    ]
  };

  const handleRefresh = async () => {
    if (wazuhIntegration) {
      refreshData(wazuhIntegration.id);
    }
  };

  if (!wazuhIntegration) {
    return (
      <div className="min-h-screen bg-slate-900 p-4">
        <div className="max-w-7xl mx-auto">
          <Alert className="border-orange-500 bg-orange-500/10">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-white">
              A integração com Wazuh não está configurada. 
              <Button 
                variant="link" 
                className="p-0 ml-2 text-orange-400"
                onClick={() => window.location.href = '/admin'}
              >
                Configure agora
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-orange-500" />
            <div>
              <h1 className="text-3xl font-bold text-white">Wazuh</h1>
              <p className="text-slate-400">Monitoramento e análise de segurança em tempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={`${hasRealData ? 'text-green-400 border-green-400' : 'text-orange-400 border-orange-400'}`}>
              {hasRealData ? 'Dados Reais' : 'Dados Mock'}
            </Badge>
            <Button 
              onClick={handleRefresh}
              disabled={isLoadingData}
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-800"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingData ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm">Agentes Ativos</CardTitle>
                <Users className="h-4 w-4 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{displayData.agents.active}</div>
              <p className="text-xs text-slate-400">de {displayData.agents.total} total</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm">Alertas Críticos</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{displayData.alerts.critical}</div>
              <p className="text-xs text-slate-400">últimas 24h</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm">Manager Status</CardTitle>
                <Database className="h-4 w-4 text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-400">{displayData.managerInfo.name}</div>
              <p className="text-xs text-slate-400">v{displayData.managerInfo.version}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm">Regras Ativas</CardTitle>
                <FileText className="h-4 w-4 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">{displayData.rulesCount}</div>
              <p className="text-xs text-slate-400">regras de detecção</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800">
            <TabsTrigger value="dashboard" className="text-white">Dashboard</TabsTrigger>
            <TabsTrigger value="agents" className="text-white">Agentes</TabsTrigger>
            <TabsTrigger value="alerts" className="text-white">Alertas</TabsTrigger>
            <TabsTrigger value="rules" className="text-white">Regras</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Agentes Status */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Status dos Agentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Ativos</span>
                    <Badge variant="default" className="bg-green-600">{displayData.agents.active}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Desconectados</span>
                    <Badge variant="destructive">{displayData.agents.disconnected}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Nunca conectaram</span>
                    <Badge variant="secondary">{displayData.agents.never_connected}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Alertas por Severidade */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Alertas por Severidade
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Críticos</span>
                    <Badge variant="destructive">{displayData.alerts.critical}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Altos</span>
                    <Badge className="bg-orange-600">{displayData.alerts.high}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Médios</span>
                    <Badge className="bg-yellow-600">{displayData.alerts.medium}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Baixos</span>
                    <Badge variant="secondary">{displayData.alerts.low}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="agents" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Agentes Wazuh</CardTitle>
                <CardDescription className="text-slate-400">
                  Lista de todos os agentes conectados ao servidor Wazuh
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {displayData.agentsList.slice(0, 10).map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${agent.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <p className="text-white font-medium">{agent.name}</p>
                          <p className="text-slate-400 text-sm">{agent.ip} - {agent.os?.name || 'Unknown OS'}</p>
                        </div>
                      </div>
                      <Badge variant={agent.status === 'active' ? 'default' : 'destructive'}>
                        {agent.status === 'active' ? 'Ativo' : 'Desconectado'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Alertas Recentes</CardTitle>
                <CardDescription className="text-slate-400">
                  Últimos alertas de segurança detectados pelo Wazuh
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {displayData.alertsList.slice(0, 10).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          alert.rule?.level >= 12 ? 'bg-red-500/20 text-red-400' :
                          alert.rule?.level >= 7 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{alert.rule?.description || 'Unknown Alert'}</p>
                          <p className="text-slate-400 text-sm">
                            {alert.agent?.name || 'Unknown Agent'} - {
                              alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'Unknown Time'
                            }
                          </p>
                        </div>
                      </div>
                      <Badge variant={
                        alert.rule?.level >= 12 ? 'destructive' :
                        alert.rule?.level >= 7 ? 'default' : 'secondary'
                      }>
                        {alert.rule?.level >= 12 ? 'critical' : alert.rule?.level >= 7 ? 'high' : 'medium'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Security;