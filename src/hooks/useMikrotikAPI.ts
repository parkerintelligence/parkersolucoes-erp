import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMikrotikContext } from '@/contexts/MikrotikContext';

export const useMikrotikAPI = () => {
  const { toast } = useToast();
  const { selectedClient } = useMikrotikContext();
  const [loading, setLoading] = useState(false);

  const callAPI = async (endpoint: string, method: string = 'GET', body?: any) => {
    if (!selectedClient) {
      toast({
        title: 'Erro',
        description: 'Nenhum cliente MikroTik selecionado',
        variant: 'destructive',
      });
      throw new Error('No client selected');
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('mikrotik-proxy', {
        body: { 
          endpoint, 
          method, 
          body,
          clientId: selectedClient.id 
        }
      });

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error('Erro na API MikroTik:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao comunicar com o MikroTik',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { callAPI, loading };
};
