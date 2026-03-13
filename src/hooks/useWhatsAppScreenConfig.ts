import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ScreenInstanceMapping {
  [screenKey: string]: string; // screenKey -> instanceName
}

export const WHATSAPP_SCREENS = [
  {
    key: 'webhooks',
    label: 'Webhooks',
    description: 'Instância utilizada para disparar mensagens WhatsApp via Webhooks recebidos',
    icon: 'zap',
    badge: 'Webhook',
    color: 'bg-yellow-500',
  },
  {
    key: 'links',
    label: 'Links',
    description: 'Instância utilizada para enviar dados de acesso (credenciais) de links cadastrados',
    icon: 'link',
    color: 'bg-teal-500',
  },
  {
    key: 'senhas',
    label: 'Senhas',
    description: 'Instância utilizada para enviar senhas e credenciais via WhatsApp',
    icon: 'lock',
    color: 'bg-purple-500',
  },
  {
    key: 'agendamentos',
    label: 'Agendamentos',
    description: 'Instância para envio de relatórios agendados automaticamente',
    icon: 'calendar',
    color: 'bg-orange-500',
  },
  {
    key: 'mikrotik',
    label: 'Mikrotik',
    description: 'Instância para envio de relatórios Mikrotik via WhatsApp',
    icon: 'router',
    color: 'bg-blue-500',
  },
  {
    key: 'bacula',
    label: 'Bacula',
    description: 'Instância para envio de relatórios diários do Bacula',
    icon: 'database',
    color: 'bg-indigo-500',
  },
  {
    key: 'atendimentos',
    label: 'Atendimentos',
    description: 'Instância para envio de mensagens da tela de atendimentos',
    icon: 'headphones',
    color: 'bg-green-500',
  },
  {
    key: 'alertas',
    label: 'Alertas (Zabbix)',
    description: 'Instância para envio de alertas do Zabbix via WhatsApp',
    icon: 'bell',
    color: 'bg-red-500',
  },
] as const;

const SETTING_KEY = 'whatsapp_screen_config';

export const useWhatsAppScreenConfig = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['whatsapp-screen-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('setting_key', SETTING_KEY)
        .maybeSingle();

      if (error) throw error;
      if (!data) return {} as ScreenInstanceMapping;

      try {
        return JSON.parse(data.setting_value) as ScreenInstanceMapping;
      } catch {
        return {} as ScreenInstanceMapping;
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (mapping: ScreenInstanceMapping) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const settingValue = JSON.stringify(mapping);

      // Check if exists
      const { data: existing } = await supabase
        .from('system_settings')
        .select('id')
        .eq('setting_key', SETTING_KEY)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('system_settings')
          .update({ setting_value: settingValue })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('system_settings')
          .insert({
            user_id: userData.user.id,
            setting_key: SETTING_KEY,
            setting_value: settingValue,
            setting_type: 'text',
            category: 'whatsapp',
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-screen-config'] });
      toast({ title: '✅ Configuração salva', description: 'Configuração por tela atualizada.' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    },
  });

  return {
    config: query.data || {},
    isLoading: query.isLoading,
    saveConfig: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
};
