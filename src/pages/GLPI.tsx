
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SafeTabs, SafeTabsContent, SafeTabsList, SafeTabsTrigger } from '@/components/SafeTabsWrapper';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ExternalLink, RefreshCcw, AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import { GLPIDashboard } from '@/components/GLPIDashboard';
import { GLPITicketsGrid } from '@/components/GLPITicketsGrid';
import { GLPIInventory } from '@/components/GLPIInventory';
import GLPIScheduledTicketsView from '@/components/GLPIScheduledTicketsView';
import { GLPIFiltersPanel } from '@/components/GLPIFiltersPanel';
import { GLPIConnectionStatus } from '@/components/GLPIConnectionStatus';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';
import { toast } from '@/hooks/use-toast';

const GLPI = () => {
  const {
    glpiIntegration,
    hasValidSession,
    isEnabled,
    tickets,
    initSession
  } = useGLPIExpanded();
  const [filters, setFilters] = React.useState({});
  const [refreshing, setRefreshing] = React.useState(false);
  const isConfigured = !!glpiIntegration;

  // Inicializar sessão automaticamente quando a página carregar
  React.useEffect(() => {
    if (isConfigured && !hasValidSession && !initSession.isPending) {
      console.log('🔄 Auto-inicializando sessão GLPI...');
      initSession.mutate();
    }
  }, [isConfigured, hasValidSession, initSession]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Primeiro verificar se há sessão válida
      if (!hasValidSession) {
        await initSession.mutateAsync();
      }
      
      // Invalida as queries para forçar reload
      tickets.refetch();
      
      toast({
        title: "Dados atualizados",
        description: "Informações do GLPI foram atualizadas com sucesso."
      });
    } catch (error) {
      console.error('Erro ao atualizar dados GLPI:', error);
      toast({
        title: "Erro ao atualizar",
        description: error instanceof Error ? error.message : "Não foi possível atualizar os dados do GLPI.",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2 rounded-lg">
              <ExternalLink className="h-6 w-6 text-white" />
            </div>
            <div className="bg-slate-900">
              <h1 className="text-2xl font-bold text-white">Central de Chamados GLPI</h1>
              <p className="text-gray-400">
                Gerencie chamados, inventário e agendamentos do GLPI
              </p>
            </div>
          </div>
        </div>

        <GLPIConnectionStatus />

        <SafeTabs defaultValue="tickets" className="w-full">
          <SafeTabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
            <SafeTabsTrigger value="tickets" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              Chamados
            </SafeTabsTrigger>
            <SafeTabsTrigger value="inventory" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              Inventário
            </SafeTabsTrigger>
            <SafeTabsTrigger value="scheduled" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              Agendados
            </SafeTabsTrigger>
          </SafeTabsList>

          <SafeTabsContent value="tickets" className="mt-6">
            <div className="space-y-4">
              <GLPIFiltersPanel 
                onFiltersChange={setFilters} 
                onRefresh={handleRefresh} 
                isLoading={refreshing || tickets.isLoading} 
                totalTickets={tickets.data?.length || 0} 
              />
              <GLPITicketsGrid filters={filters} />
            </div>
          </SafeTabsContent>

          <SafeTabsContent value="inventory" className="mt-6">
            <GLPIInventory />
          </SafeTabsContent>

          <SafeTabsContent value="scheduled" className="mt-6">
            <GLPIScheduledTicketsView />
          </SafeTabsContent>
        </SafeTabs>
      </div>
    </div>
  );
};

export default GLPI;
