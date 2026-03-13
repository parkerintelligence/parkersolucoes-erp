import { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Wifi, Settings2 } from 'lucide-react';
import { EvolutionInstanceManager } from '@/components/evolution/EvolutionInstanceManager';
import { WhatsAppScreenConfig } from '@/components/evolution/WhatsAppScreenConfig';
import { useIntegrations } from '@/hooks/useIntegrations';
import { supabase } from '@/integrations/supabase/client';

interface InstanceInfo {
  instanceName: string;
  instanceId?: string;
  status?: string;
}

const callEvolutionProxy = async (integrationId: string, endpoint: string) => {
  const { data, error } = await supabase.functions.invoke('evolution-proxy', {
    body: { integrationId, endpoint, method: 'GET' }
  });
  if (error) throw error;
  return data;
};

const WhatsApp = () => {
  const { data: integrations } = useIntegrations();
  const evolutionConfig = integrations?.find(i => i.type === 'evolution_api');
  const [instances, setInstances] = useState<InstanceInfo[]>([]);
  const integrationId = evolutionConfig?.id || '';

  const fetchInstances = useCallback(async () => {
    if (!integrationId) return;
    try {
      const data = await callEvolutionProxy(integrationId, '/instance/fetchInstances');
      const list = Array.isArray(data) ? data : [];
      setInstances(list.map((inst: any) => ({
        instanceName: inst.instance?.instanceName || inst.instanceName || inst.name || 'Sem nome',
        instanceId: inst.instance?.instanceId || inst.id,
        status: inst.instance?.status || inst.status || 'unknown',
      })));
    } catch (error) {
      console.error('Erro ao buscar instâncias:', error);
    }
  }, [integrationId]);

  useEffect(() => {
    if (integrationId) fetchInstances();
  }, [integrationId, fetchInstances]);

  const connectedCount = instances.filter(i => i.status === 'open').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-green-600 text-white">
            <Smartphone className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">WhatsApp</h1>
            <p className="text-muted-foreground">Gerencie instâncias e configure envio por tela</p>
          </div>
        </div>
        {connectedCount > 0 && (
          <Badge className="bg-green-600 text-white gap-1 px-3 py-1.5 text-sm">
            <Wifi className="h-4 w-4" /> {connectedCount} conectada{connectedCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="instances" className="w-full">
        <div className="bg-card border rounded-t-lg p-1">
          <TabsList className="bg-transparent gap-1">
            <TabsTrigger value="instances" className="data-[state=active]:bg-muted gap-2">
              <Smartphone className="h-4 w-4" /> Instâncias
            </TabsTrigger>
            <TabsTrigger value="screen-config" className="data-[state=active]:bg-green-600 data-[state=active]:text-white gap-2">
              <Settings2 className="h-4 w-4" /> Configuração por Tela
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="instances" className="mt-4">
          <EvolutionInstanceManager onInstancesChange={setInstances} />
        </TabsContent>

        <TabsContent value="screen-config" className="mt-4">
          <WhatsAppScreenConfig instances={instances} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhatsApp;
