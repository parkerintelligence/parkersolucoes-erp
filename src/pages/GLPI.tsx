import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ExternalLink, RefreshCw, AlertTriangle, Settings, CheckCircle, AlertCircle, Clock,
  Ticket, Box, CalendarClock
} from 'lucide-react';
import { GLPITicketsGrid } from '@/components/GLPITicketsGrid';
import { GLPIInventory } from '@/components/GLPIInventory';
import GLPIScheduledTicketsView from '@/components/GLPIScheduledTicketsView';
import { GLPIFiltersPanel } from '@/components/GLPIFiltersPanel';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';
import { toast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const GLPI = () => {
  const {
    glpiIntegration,
    hasValidSession,
    isEnabled,
    tickets,
    initSession
  } = useGLPIExpanded();
  const [filters, setFilters] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const isConfigured = !!glpiIntegration;

  useEffect(() => {
    if (isConfigured && !hasValidSession && !initSession.isPending) {
      initSession.mutate();
    }
  }, [isConfigured, hasValidSession, initSession]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (!hasValidSession) {
        await initSession.mutateAsync();
      }
      tickets.refetch();
      toast({ title: "Dados atualizados", description: "Informações do GLPI foram atualizadas." });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: error instanceof Error ? error.message : "Não foi possível atualizar os dados.",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <Card className="border-amber-600/50 bg-amber-900/10">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-400" />
            <h3 className="text-lg font-semibold text-foreground mb-2">GLPI não configurado</h3>
            <p className="text-muted-foreground mb-4">
              Configure a integração no painel de administração.
            </p>
            <Button onClick={() => window.location.href = '/admin'} variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Configurar GLPI
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const connectionOk = hasValidSession && !tickets.isLoading && !tickets.error;
  const connectionLoading = tickets.isLoading || initSession.isPending;

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-orange-600 p-2 rounded-lg">
            <ExternalLink className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Central de Chamados GLPI</h1>
            <p className="text-xs text-muted-foreground">{glpiIntegration.base_url}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Inline connection status */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border border-border">
                  {connectionLoading ? (
                    <Clock className="h-3.5 w-3.5 text-muted-foreground animate-pulse" />
                  ) : connectionOk ? (
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {connectionLoading
                      ? 'Conectando...'
                      : connectionOk
                        ? `${tickets.data?.length || 0} chamados`
                        : 'Desconectado'}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {connectionOk
                  ? 'Sessão GLPI ativa'
                  : hasValidSession
                    ? tickets.error?.message || 'Erro na conexão'
                    : 'Sessão não iniciada'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => initSession.mutate()}
            disabled={initSession.isPending}
            className="h-8 px-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${initSession.isPending ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error banner (only if error) */}
      {tickets.error && (
        <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
          Erro: {tickets.error.message}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="tickets" className="w-full">
        <TabsList className="bg-muted/50 border border-border">
          <TabsTrigger value="tickets" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white gap-1.5 text-xs">
            <Ticket className="h-3.5 w-3.5" />
            Chamados
          </TabsTrigger>
          <TabsTrigger value="inventory" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white gap-1.5 text-xs">
            <Box className="h-3.5 w-3.5" />
            Inventário
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white gap-1.5 text-xs">
            <CalendarClock className="h-3.5 w-3.5" />
            Agendados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="mt-4">
          <div className="space-y-3">
            <GLPIFiltersPanel
              onFiltersChange={setFilters}
              onRefresh={handleRefresh}
              isLoading={refreshing || tickets.isLoading}
              totalTickets={tickets.data?.length || 0}
            />
            <GLPITicketsGrid filters={filters} />
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-4">
          <GLPIInventory />
        </TabsContent>

        <TabsContent value="scheduled" className="mt-4">
          <GLPIScheduledTicketsView />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GLPI;
