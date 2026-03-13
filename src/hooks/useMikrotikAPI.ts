import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMikrotikContext } from '@/contexts/MikrotikContext';

interface BatchResult {
  [endpoint: string]: { data?: any; error?: string };
}

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

      if (error) {
        // Check if error response has useful info
        const errorMsg = error.message || 'Erro ao comunicar com o MikroTik';
        throw new Error(errorMsg);
      }

      // Check for error in response body
      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error: any) {
      console.error('Erro na API MikroTik:', error);
      toast({
        title: 'Erro MikroTik',
        description: error.message || 'Erro ao comunicar com o MikroTik',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const callBatchAPI = async (endpoints: string[]): Promise<BatchResult> => {
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
          batch: endpoints,
          clientId: selectedClient.id 
        }
      });

      if (error) {
        // FunctionsHttpError — try to extract message from context
        let errorMsg = 'Erro ao comunicar com o MikroTik';
        try {
          if (error.context && typeof error.context.json === 'function') {
            const body = await error.context.json();
            errorMsg = body?.error || errorMsg;
          }
        } catch {}
        throw new Error(errorMsg);
      }

      // Check for timeout/error in response
      if (data?.timeout || data?.error) {
        toast({
          title: '⚠️ MikroTik inacessível',
          description: data.error || `Timeout ao conectar com ${selectedClient.name}. Verifique se o dispositivo está online e a API REST habilitada.`,
          variant: 'destructive',
        });
        return data.results || {};
      }

      if (data?.authFailed) {
        toast({
          title: '🔐 Falha na autenticação',
          description: 'Verifique usuário/senha e se a API REST está habilitada no MikroTik.',
          variant: 'destructive',
        });
        return {};
      }

      return data?.results || {};
    } catch (error: any) {
      console.error('Erro batch MikroTik:', error);
      toast({
        title: 'Erro MikroTik',
        description: error.message || 'Erro ao comunicar com o MikroTik',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { callAPI, callBatchAPI, loading };
};
