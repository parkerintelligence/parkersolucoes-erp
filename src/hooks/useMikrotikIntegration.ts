import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useIntegrations } from './useIntegrations';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MikrotikConnection {
  base_url: string;
  username: string;
  password: string;
  port?: number;
}

export interface MikrotikInterface {
  id: string;
  name: string;
  type: string;
  running: boolean;
  rx_bytes: number;
  tx_bytes: number;
  rx_packets: number;
  tx_packets: number;
}

export interface MikrotikResource {
  cpu_load: number;
  free_memory: number;
  total_memory: number;
  uptime: string;
  version: string;
  board_name: string;
}

export const useMikrotikIntegration = () => {
  const { data: integrations } = useIntegrations();
  const queryClient = useQueryClient();
  
  const mikrotikIntegration = integrations?.find(integration => 
    integration.type === 'mikrotik' as any && integration.is_active
  );

  const makeMikrotikRequest = async (endpoint: string, integrationId: string) => {
    console.log('=== Mikrotik API Request ===');
    console.log('Endpoint:', endpoint);
    console.log('Integration ID:', integrationId);
    
    try {
      const { data, error } = await supabase.functions.invoke('mikrotik-proxy', {
        body: {
          endpoint,
          integrationId
        }
      });

      if (error) {
        console.error('Supabase Function Error:', error);
        throw new Error(`Erro na comunicação: ${error.message}`);
      }

      if (data?.error) {
        console.error('API Error:', data.error);
        throw new Error(`${data.error}${data.details ? ': ' + data.details : ''}`);
      }

      return data?.result || [];
    } catch (error) {
      console.error('Client Error:', error);
      throw error;
    }
  };

  const testConnection = useMutation({
    mutationFn: async ({ base_url, username, password, port }: MikrotikConnection) => {
      console.log('Testando conexão Mikrotik...');
      console.log('Base URL:', base_url);
      console.log('Port:', port || 8728);
      
      if (!mikrotikIntegration) {
        throw new Error('Integração Mikrotik não encontrada');
      }
      
      try {
        const result = await makeMikrotikRequest('/system/identity', mikrotikIntegration.id);
        console.log('Teste de conexão bem-sucedido:', result);
        return result;
      } catch (error) {
        console.error('Teste de conexão falhou:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Conexão testada com sucesso:', data);
      toast({
        title: "Conexão bem-sucedida!",
        description: `Conectado ao Mikrotik com sucesso.`,
      });
    },
    onError: (error: Error) => {
      console.error('Erro no teste:', error);
      toast({
        title: "Erro de Conexão Mikrotik",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const interfacesQuery = useQuery({
    queryKey: ['mikrotik-interfaces'],
    queryFn: async () => {
      if (!mikrotikIntegration) {
        throw new Error('Mikrotik não configurado');
      }

      console.log('Buscando interfaces...');
      return await makeMikrotikRequest('/interface', mikrotikIntegration.id) as MikrotikInterface[];
    },
    enabled: !!mikrotikIntegration,
    refetchInterval: 30000,
    retry: 2,
    staleTime: 10000,
  });

  const resourcesQuery = useQuery({
    queryKey: ['mikrotik-resources'],
    queryFn: async () => {
      if (!mikrotikIntegration) {
        throw new Error('Mikrotik não configurado');
      }

      console.log('Buscando recursos do sistema...');
      return await makeMikrotikRequest('/system/resource', mikrotikIntegration.id) as MikrotikResource;
    },
    enabled: !!mikrotikIntegration,
    refetchInterval: 15000,
    retry: 2,
    staleTime: 5000,
  });

  const refetchAll = () => {
    console.log('Recarregando todos os dados do Mikrotik...');
    queryClient.invalidateQueries({ queryKey: ['mikrotik-interfaces'] });
    queryClient.invalidateQueries({ queryKey: ['mikrotik-resources'] });
  };

  return {
    isConfigured: !!mikrotikIntegration,
    interfaces: interfacesQuery.data || [],
    resources: resourcesQuery.data,
    isLoading: interfacesQuery.isLoading || resourcesQuery.isLoading,
    error: interfacesQuery.error || resourcesQuery.error,
    testConnection,
    refetchAll,
  };
};