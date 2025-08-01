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
  Lock
} from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';

const Security = () => {
  const { data: integrations } = useIntegrations();
  const wazuhIntegration = integrations?.find(int => int.type === 'wazuh' && int.is_active);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data para demonstração (seria substituído por dados reais da API)
  const mockData = {
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
    compliance: {
      pci_dss: 87,
      gdpr: 92,
      hipaa: 78,
      nist: 85
    },
    vulnerabilities: {
      critical: 5,
      high: 23,
      medium: 67,
      low: 134
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    // Aqui seria feita a chamada real para a API do Wazuh
    setTimeout(() => setIsLoading(false), 2000);
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
              <h1 className="text-3xl font-bold text-white">Segurança - Wazuh</h1>
              <p className="text-slate-400">Monitoramento e análise de segurança em tempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-green-400 border-green-400">
              Conectado
            </Badge>
            <Button 
              onClick={handleRefresh}
              disabled={isLoading}
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-800"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
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
              <div className="text-2xl font-bold text-white">{mockData.agents.active}</div>
              <p className="text-xs text-slate-400">de {mockData.agents.total} total</p>
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
              <div className="text-2xl font-bold text-red-400">{mockData.alerts.critical}</div>
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
                {Math.round((mockData.compliance.pci_dss + mockData.compliance.gdpr + mockData.compliance.hipaa + mockData.compliance.nist) / 4)}%
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
              <div className="text-2xl font-bold text-orange-400">{mockData.vulnerabilities.critical + mockData.vulnerabilities.high}</div>
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
                    <Badge variant="default" className="bg-green-600">{mockData.agents.active}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Desconectados</span>
                    <Badge variant="destructive">{mockData.agents.disconnected}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Nunca conectaram</span>
                    <Badge variant="secondary">{mockData.agents.never_connected}</Badge>
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
                    <Badge variant="destructive">{mockData.alerts.critical}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Altos</span>
                    <Badge className="bg-orange-600">{mockData.alerts.high}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Médios</span>
                    <Badge className="bg-yellow-600">{mockData.alerts.medium}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Baixos</span>
                    <Badge variant="secondary">{mockData.alerts.low}</Badge>
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
                  {/* Mock agents list */}
                  {[
                    { id: '001', name: 'web-server-01', ip: '192.168.1.10', os: 'Ubuntu 20.04', status: 'active' },
                    { id: '002', name: 'db-server-01', ip: '192.168.1.20', os: 'CentOS 8', status: 'active' },
                    { id: '003', name: 'mail-server-01', ip: '192.168.1.30', os: 'Ubuntu 22.04', status: 'disconnected' },
                  ].map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${agent.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <p className="text-white font-medium">{agent.name}</p>
                          <p className="text-slate-400 text-sm">{agent.ip} - {agent.os}</p>
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
                  {/* Mock alerts list */}
                  {[
                    { id: 1, rule: 'SSH Brute Force', agent: 'web-server-01', level: 'high', time: '10:35:22' },
                    { id: 2, rule: 'Web Attack', agent: 'web-server-01', level: 'critical', time: '10:30:15' },
                    { id: 3, rule: 'File Integrity', agent: 'db-server-01', level: 'medium', time: '10:25:08' },
                  ].map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          alert.level === 'critical' ? 'bg-red-500/20 text-red-400' :
                          alert.level === 'high' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{alert.rule}</p>
                          <p className="text-slate-400 text-sm">{alert.agent} - {alert.time}</p>
                        </div>
                      </div>
                      <Badge variant={
                        alert.level === 'critical' ? 'destructive' :
                        alert.level === 'high' ? 'default' : 'secondary'
                      }>
                        {alert.level}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(mockData.compliance).map(([standard, score]) => (
                <Card key={standard} className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">
                      {standard.toUpperCase().replace('_', ' ')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-white">{score}%</span>
                      <div className={`p-2 rounded-full ${
                        score >= 90 ? 'bg-green-500/20 text-green-400' :
                        score >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        <Lock className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2 mt-3">
                      <div 
                        className={`h-2 rounded-full ${
                          score >= 90 ? 'bg-green-500' :
                          score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                    <div className="text-2xl font-bold text-red-400">{mockData.vulnerabilities.critical}</div>
                    <p className="text-sm text-slate-400">Críticas</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">{mockData.vulnerabilities.high}</div>
                    <p className="text-sm text-slate-400">Altas</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{mockData.vulnerabilities.medium}</div>
                    <p className="text-sm text-slate-400">Médias</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-400">{mockData.vulnerabilities.low}</div>
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