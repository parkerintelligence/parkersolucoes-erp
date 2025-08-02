import React, { useState } from 'react';
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
  Lock,
  Wifi,
  WifiOff,
  TestTube
} from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useWazuhAPI } from '@/hooks/useWazuhAPI';
import { validateWazuhConnection } from '@/hooks/useWazuhValidation';
import { toast } from '@/hooks/use-toast';

const Security = () => {
  const { data: integrations } = useIntegrations();
  const wazuhIntegration = integrations?.find(int => int.type === 'wazuh' && int.is_active);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<any>(null);
  
  const { 
    useWazuhAgents, 
    useWazuhAlerts, 
    useWazuhStats,
    useWazuhCompliance,
    useWazuhVulnerabilities,
    refreshData 
  } = useWazuhAPI();

  // Fetch real Wazuh data if integration is available
  const { data: agents, isLoading: agentsLoading } = useWazuhAgents(wazuhIntegration?.id || '');
  const { data: alerts, isLoading: alertsLoading } = useWazuhAlerts(wazuhIntegration?.id || '');
  const { data: stats, isLoading: statsLoading } = useWazuhStats(wazuhIntegration?.id || '');
  const { data: compliance, isLoading: complianceLoading } = useWazuhCompliance(wazuhIntegration?.id || '');
  const { data: vulnerabilities, isLoading: vulnerabilitiesLoading } = useWazuhVulnerabilities(wazuhIntegration?.id || '');

  const isLoadingData = agentsLoading || alertsLoading || statsLoading || complianceLoading || vulnerabilitiesLoading;

  // Check for real data availability
  const hasRealAgentsData = agents?.data && !agentsLoading;
  const hasRealAlertsData = alerts?.data && !alertsLoading;
  const hasRealStatsData = stats && !statsLoading;
  const hasAnyRealData = hasRealAgentsData || hasRealAlertsData || hasRealStatsData;

  // Use real data if available, otherwise use mock data with enhanced fallback
  const displayData = {
    agents: {
      total: stats?.total_agents || (hasRealStatsData ? 0 : 45),
      active: stats?.agents_connected || (hasRealStatsData ? 0 : 42),
      disconnected: stats?.agents_disconnected || (hasRealStatsData ? 0 : 3),
      never_connected: stats?.agents_never_connected || (hasRealStatsData ? 0 : 0)
    },
    alerts: {
      critical: stats?.critical_alerts || (hasRealStatsData ? 0 : 12),
      high: stats?.high_alerts || (hasRealStatsData ? 0 : 28),
      medium: stats?.medium_alerts || (hasRealStatsData ? 0 : 156),
      low: stats?.low_alerts || (hasRealStatsData ? 0 : 89),
      total: stats?.total_alerts_today || (hasRealStatsData ? 0 : 285)
    },
    compliance: compliance?.data || {
      pci_dss: hasRealStatsData ? 0 : 87,
      gdpr: hasRealStatsData ? 0 : 92,
      hipaa: hasRealStatsData ? 0 : 78,
      nist: hasRealStatsData ? 0 : 85
    },
    vulnerabilities: vulnerabilities?.data || {
      critical: hasRealStatsData ? 0 : 5,
      high: hasRealStatsData ? 0 : 23,
      medium: hasRealStatsData ? 0 : 67,
      low: hasRealStatsData ? 0 : 134
    },
    agentsList: agents?.data?.affected_items || (hasRealAgentsData ? [] : [
      { id: '001', name: 'web-server-01', ip: '192.168.1.10', os: { name: 'Ubuntu 20.04' }, status: 'active' },
      { id: '002', name: 'db-server-01', ip: '192.168.1.20', os: { name: 'CentOS 8' }, status: 'active' },
      { id: '003', name: 'mail-server-01', ip: '192.168.1.30', os: { name: 'Ubuntu 22.04' }, status: 'disconnected' },
    ]),
    alertsList: alerts?.data?.affected_items || (hasRealAlertsData ? [] : [
      { id: 1, rule: { description: 'SSH Brute Force', level: 10 }, agent: { name: 'web-server-01' }, timestamp: '2024-01-15T10:35:22Z' },
      { id: 2, rule: { description: 'Web Attack', level: 12 }, agent: { name: 'web-server-01' }, timestamp: '2024-01-15T10:30:15Z' },
      { id: 3, rule: { description: 'File Integrity', level: 7 }, agent: { name: 'db-server-01' }, timestamp: '2024-01-15T10:25:08Z' },
    ])
  };

  // Status for debugging
  const connectionStatus = {
    integration: !!wazuhIntegration,
    loading: isLoadingData,
    hasRealData: hasAnyRealData,
    dataTypes: {
      agents: hasRealAgentsData ? 'real' : 'mock',
      alerts: hasRealAlertsData ? 'real' : 'mock', 
      stats: hasRealStatsData ? 'real' : 'mock'
    }
  };

  const handleRefresh = async () => {
    if (wazuhIntegration) {
      refreshData(wazuhIntegration.id);
    }
  };

  const handleTestConnection = async () => {
    if (!wazuhIntegration) return;
    
    setIsTestingConnection(true);
    setConnectionTestResult(null);
    
    try {
      const result = await validateWazuhConnection(
        wazuhIntegration.base_url,
        wazuhIntegration.username,
        wazuhIntegration.password,
        wazuhIntegration.id
      );
      
      setConnectionTestResult(result);
      
      if (result.isValid) {
        toast({
          title: "✅ Conexão bem-sucedida!",
          description: "A conexão com o Wazuh foi estabelecida corretamente.",
        });
      } else {
        toast({
          title: "❌ Falha na conexão",
          description: `${result.error}: ${result.details || ''}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      const errorResult = {
        isValid: false,
        error: 'Erro de rede',
        details: error.message || 'Falha ao testar a conexão'
      };
      setConnectionTestResult(errorResult);
      
      toast({
        title: "❌ Erro no teste",
        description: error.message || 'Falha ao testar a conexão',
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
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
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`${hasAnyRealData ? 'text-green-400 border-green-400' : isLoadingData ? 'text-yellow-400 border-yellow-400' : 'text-orange-400 border-orange-400'}`}>
                  {isLoadingData ? 'Carregando...' : hasAnyRealData ? 'Dados Reais' : 'Dados Mock'}
                </Badge>
                {wazuhIntegration && (
                  <Badge variant="secondary" className="text-xs">
                    {connectionStatus.dataTypes.agents === 'real' ? 'A' : 'a'}{connectionStatus.dataTypes.alerts === 'real' ? 'L' : 'l'}{connectionStatus.dataTypes.stats === 'real' ? 'S' : 's'}
                  </Badge>
                )}
              </div>
              {/* Connection Status */}
              {connectionTestResult && (
                <div className="flex items-center gap-1">
                  {connectionTestResult.isValid ? (
                    <Wifi className="h-3 w-3 text-green-400" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-red-400" />
                  )}
                  <span className="text-xs text-slate-400">
                    {connectionTestResult.isValid ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
              )}
            </div>
            <Button 
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-800"
            >
              <TestTube className={`h-4 w-4 mr-2 ${isTestingConnection ? 'animate-spin' : ''}`} />
              Testar Conexão
            </Button>
            <Button 
              onClick={handleRefresh}
              disabled={isLoadingData}
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-800"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingData ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button 
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-800"
              onClick={() => window.location.href = '/admin'}
            >
              <Eye className="h-4 w-4 mr-2" />
              Debug
            </Button>
          </div>
        </div>

        {/* Connection Status Alert */}
        {connectionTestResult && !connectionTestResult.isValid && (
          <Alert className="border-red-500 bg-red-500/10">
            <WifiOff className="h-4 w-4" />
            <AlertDescription className="text-white">
              <strong>Falha na conexão:</strong> {connectionTestResult.error}
              {connectionTestResult.details && (
                <span className="block text-sm text-red-200 mt-1">
                  {connectionTestResult.details}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

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
                <CardTitle className="text-white text-sm">Conformidade</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {Math.round((displayData.compliance.pci_dss + displayData.compliance.gdpr + displayData.compliance.hipaa + displayData.compliance.nist) / 4)}%
              </div>
              <p className="text-xs text-slate-400">média geral</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm">Vulnerabilidades</CardTitle>
                <Bug className="h-4 w-4 text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-400">{displayData.vulnerabilities.critical + displayData.vulnerabilities.high}</div>
              <p className="text-xs text-slate-400">críticas e altas</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-slate-800">
            <TabsTrigger value="dashboard" className="text-white">Dashboard</TabsTrigger>
            <TabsTrigger value="agents" className="text-white">Agentes</TabsTrigger>
            <TabsTrigger value="alerts" className="text-white">Alertas</TabsTrigger>
            <TabsTrigger value="compliance" className="text-white">Conformidade</TabsTrigger>
            <TabsTrigger value="vulnerabilities" className="text-white">Vulnerabilidades</TabsTrigger>
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

          <TabsContent value="compliance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(displayData.compliance).map(([standard, score]) => {
                const scoreValue = typeof score === 'number' ? score : 0;
                return (
                  <Card key={standard} className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">
                        {standard.toUpperCase().replace('_', ' ')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-white">{scoreValue}%</span>
                        <div className={`p-2 rounded-full ${
                          scoreValue >= 90 ? 'bg-green-500/20 text-green-400' :
                          scoreValue >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          <Lock className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2 mt-3">
                        <div 
                          className={`h-2 rounded-full ${
                            scoreValue >= 90 ? 'bg-green-500' :
                            scoreValue >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${scoreValue}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="vulnerabilities" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Análise de Vulnerabilidades</CardTitle>
                <CardDescription className="text-slate-400">
                  Vulnerabilidades detectadas nos sistemas monitorados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{displayData.vulnerabilities.critical}</div>
                    <p className="text-sm text-slate-400">Críticas</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">{displayData.vulnerabilities.high}</div>
                    <p className="text-sm text-slate-400">Altas</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{displayData.vulnerabilities.medium}</div>
                    <p className="text-sm text-slate-400">Médias</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-400">{displayData.vulnerabilities.low}</div>
                    <p className="text-sm text-slate-400">Baixas</p>
                  </div>
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