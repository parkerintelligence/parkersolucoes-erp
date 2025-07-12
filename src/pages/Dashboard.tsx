import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HostingerDashboard } from '@/components/HostingerDashboard';
import { BaculaDashboard } from '@/components/BaculaDashboard';
import { BarChart3, Users, DollarSign, FileText, Calendar, TrendingUp, Server, Archive, Activity, Database, Shield } from 'lucide-react';
const Dashboard = () => {
  const stats = [{
    title: "Empresas Ativas",
    value: "24",
    change: "+2 esta semana",
    changeType: "positive",
    icon: <Users className="h-6 w-6 text-blue-400" />
  }, {
    title: "Contratos Ativos",
    value: "18",
    change: "+1 este mês",
    changeType: "positive",
    icon: <FileText className="h-6 w-6 text-green-400" />
  }, {
    title: "Receita Mensal",
    value: "R$ 45.280",
    change: "+12% vs mês anterior",
    changeType: "positive",
    icon: <DollarSign className="h-6 w-6 text-yellow-400" />
  }, {
    title: "Agenda Hoje",
    value: "7",
    change: "3 críticos",
    changeType: "warning",
    icon: <Calendar className="h-6 w-6 text-purple-400" />
  }];
  return <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Dashboard Executivo</h1>
            <p className="text-slate-400 mt-2">Visão geral da infraestrutura e operações</p>
          </div>
          <Badge variant="outline" className="text-green-400 border-green-600 bg-green-900/20">
            Sistema Online
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">{stat.title}</p>
                    <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                  </div>
                  <div className="bg-slate-700 p-3 rounded-full">
                    {stat.icon}
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    stat.changeType === 'positive' ? 'bg-green-900/50 text-green-400' :
                    stat.changeType === 'warning' ? 'bg-yellow-900/50 text-yellow-400' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Activity className="h-5 w-5 text-blue-400" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white">
                <Shield className="h-4 w-4 mr-2" />
                Verificar Backups
              </Button>
              <Button className="w-full justify-start bg-green-600 hover:bg-green-700 text-white">
                <Server className="h-4 w-4 mr-2" />
                Status GLPI
              </Button>
              <Button className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-white">
                <Database className="h-4 w-4 mr-2" />
                Monitoramento Zabbix
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-5 w-5 text-green-400" />
                Resumo do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Servidores Online</span>
                <Badge className="bg-green-900/50 text-green-400">100%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Backups Hoje</span>
                <Badge className="bg-blue-900/50 text-blue-400">12/12</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Alertas Ativos</span>
                <Badge className="bg-yellow-900/50 text-yellow-400">3</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Uptime</span>
                <Badge className="bg-green-900/50 text-green-400">99.8%</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Calendar className="h-5 w-5 text-orange-400" />
                Próximos Eventos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">Manutenção Servidor DB</p>
                  <p className="text-slate-400 text-xs">Hoje, 22:00</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">Backup Full Semanal</p>
                  <p className="text-slate-400 text-xs">Amanhã, 02:00</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">Relatório Mensal</p>
                  <p className="text-slate-400 text-xs">Segunda, 09:00</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="infrastructure" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700 grid w-full grid-cols-4">
            <TabsTrigger 
              value="infrastructure" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400"
            >
              <Server className="h-4 w-4 mr-2" />
              Infraestrutura
            </TabsTrigger>
            <TabsTrigger 
              value="monitoring" 
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-slate-400"
            >
              <Activity className="h-4 w-4 mr-2" />
              Monitoramento
            </TabsTrigger>
            <TabsTrigger 
              value="backups" 
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400"
            >
              <Archive className="h-4 w-4 mr-2" />
              Backups
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-slate-400"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="infrastructure" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Server className="h-5 w-5 text-blue-400" />
                  Hostinger VPS - Infraestrutura Principal
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Monitoramento em tempo real dos servidores virtuais privados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HostingerDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-8 text-center">
                  <div className="bg-green-900/50 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Activity className="h-10 w-10 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Sistema Zabbix</h3>
                  <p className="text-slate-400 mb-4">
                    Monitoramento avançado de infraestrutura, alertas inteligentes e métricas em tempo real.
                  </p>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    Acessar Zabbix
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-8 text-center">
                  <div className="bg-blue-900/50 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <BarChart3 className="h-10 w-10 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Grafana Dashboards</h3>
                  <p className="text-slate-400 mb-4">
                    Visualização avançada de dados, gráficos customizáveis e relatórios executivos.
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Ver Dashboards
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="backups" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Database className="h-5 w-5 text-purple-400" />
                  Sistema Bacula - Gestão de Backups Empresarial
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Controle centralizado de backups automatizados com verificação de integridade
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
                  <CardTitle className="flex items-center gap-2 text-white">
                    <BarChart3 className="h-5 w-5 text-orange-400" />
                    Métricas Operacionais
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 text-center">
                  <div className="bg-orange-900/50 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <BarChart3 className="h-10 w-10 text-orange-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Relatórios Executivos</h3>
                  <p className="text-slate-400 mb-4">
                    Métricas de performance, KPIs operacionais e análises preditivas.
                  </p>
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                    Gerar Relatórios
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <TrendingUp className="h-5 w-5 text-cyan-400" />
                    Central de Alertas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 text-center">
                  <div className="bg-cyan-900/50 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <TrendingUp className="h-10 w-10 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Notificações Inteligentes</h3>
                  <p className="text-slate-400 mb-4">
                    Sistema de alertas proativos com integração WhatsApp e email.
                  </p>
                  <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
                    Configurar Alertas
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
};
export default Dashboard;