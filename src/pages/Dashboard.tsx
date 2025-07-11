import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HostingerDashboard } from '@/components/HostingerDashboard';
import { BaculaDashboard } from '@/components/BaculaDashboard';
import { BarChart3, Users, DollarSign, FileText, Calendar, TrendingUp, Server, Archive, Activity, Database } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    {
      title: "Empresas Ativas",
      value: "24",
      change: "+2 esta semana",
      changeType: "positive",
      icon: <Users className="h-6 w-6 text-blue-400" />
    },
    {
      title: "Contratos Ativos",
      value: "18",
      change: "+1 este mês",
      changeType: "positive",
      icon: <FileText className="h-6 w-6 text-green-400" />
    },
    {
      title: "Receita Mensal",
      value: "R$ 45.280",
      change: "+12% vs mês anterior",
      changeType: "positive",
      icon: <DollarSign className="h-6 w-6 text-yellow-400" />
    },
    {
      title: "Agenda Hoje",
      value: "7",
      change: "3 críticos",
      changeType: "warning",
      icon: <Calendar className="h-6 w-6 text-purple-400" />
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400">Visão geral do sistema e infraestrutura</p>
          </div>
          <Badge variant="outline" className="text-slate-300 border-slate-600">
            Sistema Ativo
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className={`text-sm ${
                      stat.changeType === 'positive' ? 'text-green-400' : 
                      stat.changeType === 'warning' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {stat.change}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-700 rounded-lg">
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="infrastructure" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800">
            <TabsTrigger value="infrastructure" className="data-[state=active]:bg-slate-700">
              <Server className="h-4 w-4 mr-2" />
              Infraestrutura
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="data-[state=active]:bg-slate-700">
              <Activity className="h-4 w-4 mr-2" />
              Monitoramento
            </TabsTrigger>
            <TabsTrigger value="backups" className="data-[state=active]:bg-slate-700">
              <Archive className="h-4 w-4 mr-2" />
              Backups
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-700">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="infrastructure" className="space-y-6">
            <div className="grid gap-6">
              {/* Hostinger VPS */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Server className="h-5 w-5 text-orange-500" />
                    Hostinger VPS
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Monitoramento de servidores virtuais privados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <HostingerDashboard />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-8 text-center">
                <Activity className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                <h3 className="text-lg font-semibold text-white mb-2">Monitoramento</h3>
                <p className="text-slate-400 mb-4">
                  Painel de monitoramento em desenvolvimento.
                </p>
                <p className="text-sm text-slate-500">
                  Integrações: Zabbix, Grafana, Uptime monitoring
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backups" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Archive className="h-5 w-5 text-blue-500" />
                  Sistema de Backups Bacula
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Status e controle de backups automatizados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BaculaDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Métricas do Sistema</CardTitle>
                </CardHeader>
                <CardContent className="p-8 text-center">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
                  <p className="text-slate-400 mb-4">
                    Relatórios e métricas detalhadas em desenvolvimento.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Alertas e Notificações</CardTitle>
                </CardHeader>
                <CardContent className="p-8 text-center">
                  <TrendingUp className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-lg font-semibold text-white mb-2">Sistema de Alertas</h3>
                  <p className="text-slate-400 mb-4">
                    Central de notificações e alertas do sistema.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;