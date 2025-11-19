import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useMikrotikContext } from '@/contexts/MikrotikContext';

export interface WhatsAppMessageOptions {
  gridTitle: string;
  data: any[];
  summary: string;
  includeDetails?: boolean;
  columns?: { key: string; label: string; formatter?: (val: any) => string }[];
}

export const useMikrotikWhatsApp = () => {
  const { toast } = useToast();
  const { data: integrations } = useIntegrations();
  const { selectedClient } = useMikrotikContext();
  const [sending, setSending] = useState(false);

  const formatMessage = (options: WhatsAppMessageOptions): string => {
    const clientName = selectedClient?.name || 'Cliente';
    const timestamp = new Date().toLocaleString('pt-BR');

    let message = `🔧 *RELATÓRIO MIKROTIK - ${options.gridTitle.toUpperCase()}*\n\n`;
    message += `📍 Cliente: ${clientName}\n`;
    message += `📅 Data/Hora: ${timestamp}\n`;
    message += `📊 Total de itens: ${options.data.length}\n\n`;
    message += `${options.summary}\n\n`;
    
    // Adicionar registros detalhados se solicitado
    if (options.includeDetails && options.columns && options.data.length > 0) {
      message += `📋 *REGISTROS DETALHADOS*\n\n`;
      
      // Limitar a 10 registros para não tornar a mensagem muito longa
      const recordsToShow = options.data.slice(0, 10);
      
      recordsToShow.forEach((record, index) => {
        message += `*Registro ${index + 1}*\n`;
        
        options.columns!.forEach(col => {
          const value = record[col.key];
          const formatted = col.formatter ? col.formatter(value) : (value?.toString() || '-');
          // Remover emojis e caracteres especiais para não quebrar formatação
          const clean = formatted.replace(/[📊📍✅❌🔄🔒📤📥🔀👥💻🌐📝⚠️\*]/g, '').trim();
          message += `  • ${col.label}: ${clean}\n`;
        });
        
        message += `\n`;
      });
      
      if (options.data.length > 10) {
        message += `_... e mais ${options.data.length - 10} registros_\n\n`;
      }
    }
    
    message += `---\n`;
    message += `Gerado automaticamente via Sistema Parker`;

    return message;
  };

  const sendMessage = async (phoneNumber: string, message: string) => {
    setSending(true);
    try {
      // Find active Evolution API integration
      const evolutionIntegration = integrations?.find(
        i => i.type === 'evolution_api' && i.is_active
      );

      if (!evolutionIntegration) {
        throw new Error('Nenhuma integração Evolution API ativa encontrada');
      }

      // Format phone number: remove non-digits and ensure country code
      let formattedNumber = phoneNumber.replace(/\D/g, '');
      
      // If number doesn't start with country code (55 for Brazil), add it
      if (!formattedNumber.startsWith('55')) {
        formattedNumber = '55' + formattedNumber;
      }

      console.log('📱 Número formatado:', formattedNumber);

      // Send message via edge function
      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          integrationId: evolutionIntegration.id,
          phoneNumber: formattedNumber,
          message
        }
      });

      if (error) throw error;

      toast({
        title: 'Mensagem enviada com sucesso',
        description: `Relatório enviado para ${phoneNumber}`,
      });

      return data;
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: 'Erro ao enviar mensagem',
        description: error.message || 'Não foi possível enviar a mensagem via WhatsApp',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setSending(false);
    }
  };

  return { formatMessage, sendMessage, sending };
};
