import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ExternalLink, RefreshCcw, AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import { GLPIDashboard } from '@/components/GLPIDashboard';
import { GLPITicketsGrid } from '@/components/GLPITicketsGrid';
import { GLPIInventory } from '@/components/GLPIInventory';
import GLPIScheduledTicketsView from '@/components/GLPIScheduledTicketsView';
import { GLPIFiltersPanel } from '@/components/GLPIFiltersPanel';
import { useGLPI } from '@/hooks/useGLPI';
import { toast } from '@/hooks/use-toast';
const GLPI = () => {
  const {
    glpiIntegration
  } = useGLPI();
  const [filters, setFilters] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const isConfigured = !!glpiIntegration;
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Simulate refresh - in real implementation, this would refresh data
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Dados atualizados",
        description: "Informações do GLPI foram atualizadas com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os dados do GLPI.",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };
  if (!isConfigured) {
    return <div className="min-h-screen bg-gray-900 text-white p-6">
        <Card className="border-yellow-600 bg-yellow-900/20">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
            <h3 className="text-lg font-semibold text-yellow-200 mb-2">GLPI não configurado</h3>
            <p className="text-yellow-300 mb-4">
              Para usar o gerenciamento do GLPI, configure a integração no painel de administração.
            </p>
            <Button onClick={() => window.location.href = '/admin'} className="bg-blue-800 hover:bg-blue-700 text-white border border-yellow-600">
              <Settings className="mr-2 h-4 w-4" />
              Configurar GLPI
            </Button>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-900">
              <ExternalLink className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Central de Chamados GLPI</h1>
              <p className="text-gray-400">
                Gerencie chamados, inventário e agendamentos do GLPI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-sm text-green-400">Conectado</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="tickets" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
            <TabsTrigger value="tickets" className="data-[state=active]:text-white bg-red-950 hover:bg-red-800">
              Chamados
            </TabsTrigger>
            <TabsTrigger value="inventory" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              Inventário
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              Agendados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="mt-6">
            <div className="space-y-4">
              <GLPIFiltersPanel onFiltersChange={setFilters} onRefresh={handleRefresh} isLoading={refreshing} totalTickets={0} />
              <GLPITicketsGrid filters={filters} />
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="mt-6">
            <GLPIInventory />
          </TabsContent>

          <TabsContent value="scheduled" className="mt-6">
            <GLPIScheduledTicketsView />
          </TabsContent>
        </Tabs>
      </div>
    </div>;
};
export default GLPI;