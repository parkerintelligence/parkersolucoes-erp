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
            <h1 className="text-4xl font-bold text-white">Análise de VPS</h1>
            <p className="text-slate-400 mt-2">Visão geral da infraestrutura e operações</p>
          </div>
          <Badge variant="outline" className="text-green-400 border-green-600 bg-green-900/20">
            Sistema Online
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {stat.icon}
                    <div>
                      <p className="text-sm font-medium text-slate-400">{stat.title}</p>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Badge 
                    variant={stat.changeType === 'positive' ? 'default' : stat.changeType === 'warning' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {stat.change}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        

        {/* Main Content Tabs */}
        <Tabs defaultValue="infrastructure" className="space-y-6">
          

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