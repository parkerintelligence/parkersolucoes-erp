import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Integration {
  id: string;
  name: string;
  base_url: string;
  username: string;
  password: string;
  is_active: boolean;
  user_id: string;
  type: string;
}

interface MikrotikContextType {
  selectedClient: Integration | null;
  selectClient: (client: Integration) => void;
  disconnectClient: () => void;
  clients: Integration[];
  loading: boolean;
  refreshClients: () => Promise<void>;
}

const MikrotikContext = createContext<MikrotikContextType | undefined>(undefined);

export const MikrotikProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [selectedClient, setSelectedClient] = useState<Integration | null>(null);
  const [clients, setClients] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  const loadClients = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('type', 'mikrotik')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setClients(data || []);

      // Tentar restaurar seleção do localStorage
      const savedClientId = localStorage.getItem('mikrotik_selected_client');
      console.log('🔍 Tentando restaurar cliente:', savedClientId);
      
      if (savedClientId && data) {
        const savedClient = data.find(c => c.id === savedClientId && c.is_active);
        if (savedClient) {
          console.log('✅ Cliente restaurado:', savedClient.name);
          setSelectedClient(savedClient);
        } else {
          console.log('⚠️ Cliente salvo não encontrado ou inativo');
          localStorage.removeItem('mikrotik_selected_client');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar clientes MikroTik:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [user]);

  const selectClient = (client: Integration) => {
    console.log('✅ Cliente selecionado:', client.name, client.id);
    setSelectedClient(client);
    localStorage.setItem('mikrotik_selected_client', client.id);
  };

  const disconnectClient = () => {
    setSelectedClient(null);
    localStorage.removeItem('mikrotik_selected_client');
  };

  const refreshClients = async () => {
    await loadClients();
  };

  return (
    <MikrotikContext.Provider
      value={{
        selectedClient,
        selectClient,
        disconnectClient,
        clients,
        loading,
        refreshClients,
      }}
    >
      {children}
    </MikrotikContext.Provider>
  );
};

export const useMikrotikContext = () => {
  const context = useContext(MikrotikContext);
  if (context === undefined) {
    throw new Error('useMikrotikContext must be used within a MikrotikProvider');
  }
  return context;
};
