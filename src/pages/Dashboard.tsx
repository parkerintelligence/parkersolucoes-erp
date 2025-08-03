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
            <h1 className="text-4xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 mt-2">Visão geral das operações e infraestrutura</p>
          </div>
          <Badge variant="outline" className="text-green-400 border-green-600 bg-green-900/20">
            Sistema Online
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => <Card key={index} className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                
              </CardContent>
            </Card>)}
        </div>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="infrastructure" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-slate-700">
            <TabsTrigger value="infrastructure" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Infraestrutura
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

          <TabsContent value="backups" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Archive className="h-5 w-5 text-green-400" />
                  Bacula - Sistema de Backup
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Monitoramento e status dos jobs de backup Bacula
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BaculaDashboard />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
};
export default Dashboard;