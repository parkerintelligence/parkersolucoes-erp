import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useIntegrations } from './useIntegrations';
import { useUnifiDirect } from './useUnifiDirect';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

interface UnifiConnection {
  base_url: string;
  username: string;
  password: string;
  site?: string;
}

export interface UnifiDevice {
  mac: string;
  name: string;
  model: string;
  version: string;
  state: number;
  uptime: number;
  ip: string;
  type: string;
  adopted: boolean;
}

export interface UnifiClient {
  mac: string;
  hostname?: string;
  ip: string;
  network: string;
  tx_bytes: number;
  rx_bytes: number;
  uptime: number;
  last_seen: number;
  is_wired: boolean;
}

export interface UnifiNetwork {
  _id: string;
  name: string;
  purpose: string;
  vlan_enabled: boolean;
  vlan: number;
  dhcpd_enabled: boolean;
  ip_subnet: string;
}

export interface UnifiStatistics {
  total_devices: number;
  online_devices: number;
  total_clients: number;
  total_bytes: number;
  wan_ip: string;
}

export const useUnifiIntegration = () => {
  const { data: integrations } = useIntegrations();
  const unifiIntegration = integrations?.find(integration => 
    integration.type === 'unifi' && integration.is_active
  );
  
  // Use the direct client
  const unifiDirect = useUnifiDirect(unifiIntegration);
  
  const [errorDialog, setErrorDialog] = useState<{isOpen: boolean; error: string; details?: string}>({
    isOpen: false,
    error: '',
    details: ''
  });

  console.log('Unifi integration found:', unifiIntegration);

  const handleError = (error: any, context: string) => {
    console.error(`${context}:`, error);
    
    const errorMessage = error.message || 'Erro desconhecido';
    const errorDetails = error.stack || JSON.stringify(error, null, 2);
    
    setErrorDialog({
      isOpen: true,
      error: `${context}: ${errorMessage}`,
      details: errorDetails
    });
    
    toast({
      title: "Erro de Conexão UNIFI",
      description: errorMessage,
      variant: "destructive"
    });
  };

  const testConnection = useMutation({
    mutationFn: async ({ base_url, username, password, site }: UnifiConnection) => {
      console.log('Testando conexão UNIFI...');
      console.log('Base URL:', base_url);
      console.log('Username:', username);
      
      if (!unifiDirect.client) {
        throw new Error('Cliente UNIFI não inicializado');
      }
      
      try {
        const result = await unifiDirect.client.testConnection();
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
        description: "Conectado à UNIFI com sucesso",
      });
    },
    onError: (error: Error) => {
      handleError(error, 'Teste de Conexão');
    },
  });

  // Transform data from direct client to match existing interfaces
  const transformDevices = (devices: any[]): UnifiDevice[] => {
    return devices.map(device => ({
      mac: device.mac,
      name: device.name || device.mac,
      model: device.model || 'Unknown',
      version: device.version || 'Unknown',
      state: device.state || 0,
      uptime: device.uptime || 0,
      ip: device.ip || '',
      type: device.type || 'unknown',
      adopted: device.adopted || false
    }));
  };

  const transformClients = (clients: any[]): UnifiClient[] => {
    return clients.map(client => ({
      mac: client.mac,
      hostname: client.hostname,
      ip: client.ip || '',
      network: client.network || '',
      tx_bytes: client.tx_bytes || 0,
      rx_bytes: client.rx_bytes || 0,
      uptime: client.uptime || 0,
      last_seen: client.last_seen || 0,
      is_wired: client.is_wired || false
    }));
  };

  const transformNetworks = (networks: any[]): UnifiNetwork[] => {
    return networks.map(network => ({
      _id: network._id,
      name: network.name,
      purpose: network.purpose || 'corporate',
      vlan_enabled: network.vlan_enabled || false,
      vlan: network.vlan || 1,
      dhcpd_enabled: network.dhcpd_enabled || false,
      ip_subnet: network.ip_subnet || ''
    }));
  };

  return {
    isConfigured: !!unifiIntegration,
    devices: transformDevices(unifiDirect.devices || []),
    clients: transformClients(unifiDirect.clients || []),
    networks: transformNetworks(unifiDirect.networks || []),
    statistics: unifiDirect.statistics || {
      total_devices: 0,
      online_devices: 0,
      total_clients: 0,
      total_bytes: 0,
      wan_ip: ''
    },
    isLoading: unifiDirect.isLoading,
    error: unifiDirect.error,
    testConnection,
    refetchAll: unifiDirect.refetchAll,
    errorDialog,
    closeErrorDialog: () => setErrorDialog(prev => ({ ...prev, isOpen: false })),
  };
};