
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Activity, BarChart3, Server, AlertTriangle, TrendingUp, Database } from 'lucide-react';
import { useZabbixIntegration } from '@/hooks/useZabbixIntegration';
import { ZabbixDashboard } from '@/components/ZabbixDashboard';
import { ZabbixHostsGrid } from '@/components/ZabbixHostsGrid';
import { ZabbixProblemsGrid } from '@/components/ZabbixProblemsGrid';
import { ZabbixGraphsGrid } from '@/components/ZabbixGraphsGrid';
import { ZabbixInventoryGrid } from '@/components/ZabbixInventoryGrid';
import { ZabbixMaintenanceGrid } from '@/components/ZabbixMaintenanceGrid';
import { ZabbixTemplatesGrid } from '@/components/ZabbixTemplatesGrid';
import { ZabbixServicesGrid } from '@/components/ZabbixServicesGrid';

const Zabbix = () => {
  const { isConfigured } = useZabbixIntegration();

  if (!isConfigured) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
                <Activity className="h-8 w-8" />
                Zabbix - Monitoramento Avançado
              </h1>
              <p className="text-blue-600">Plataforma completa de monitoramento de infraestrutura</p>
            </div>
          </div>

          <Card className="border-blue-200">
            <CardContent className="p-8 text-center">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Zabbix não configurado</h3>
              <p className="text-gray-600 mb-4">
                Configure a integração com Zabbix no painel administrativo para acessar o monitoramento completo.
              </p>
              <Button onClick={() => window.location.href = '/admin'}>
                <Settings className="mr-2 h-4 w-4" />
                Configurar Zabbix
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
              <Activity className="h-8 w-8" />
              Zabbix - Monitoramento Avançado
            </h1>
            <p className="text-blue-600">Gestão completa de infraestrutura e monitoramento em tempo real</p>
          </div>
        </div>

        {/* Interface Principal com Abas */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid grid-cols-8 w-full">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="hosts" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Hosts
            </TabsTrigger>
            <TabsTrigger value="problems" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Problemas
            </TabsTrigger>
            <TabsTrigger value="graphs" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Gráficos
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Inventário
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Manutenção
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Serviços
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <ZabbixDashboard />
          </TabsContent>

          <TabsContent value="hosts" className="mt-6">
            <ZabbixHostsGrid />
          </TabsContent>

          <TabsContent value="problems" className="mt-6">
            <ZabbixProblemsGrid />
          </TabsContent>

          <TabsContent value="graphs" className="mt-6">
            <ZabbixGraphsGrid />
          </TabsContent>

          <TabsContent value="inventory" className="mt-6">
            <ZabbixInventoryGrid />
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <ZabbixTemplatesGrid />
          </TabsContent>

          <TabsContent value="maintenance" className="mt-6">
            <ZabbixMaintenanceGrid />
          </TabsContent>

          <TabsContent value="services" className="mt-6">
            <ZabbixServicesGrid />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Zabbix;
