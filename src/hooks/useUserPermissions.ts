import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const ALL_SCREENS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'atendimentos', label: 'Atendimentos' },
  { key: 'alertas', label: 'Alertas' },
  { key: 'links', label: 'Links de Acesso' },
  { key: 'conexao-remota', label: 'Conexão Remota' },
  { key: 'glpi', label: 'GLPI' },
  { key: 'projetos', label: 'Projetos' },
  { key: 'passwords', label: 'Senhas' },
  { key: 'annotations', label: 'Anotações' },
  { key: 'schedule', label: 'Agenda' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'whatsapp-templates', label: 'Modelos WhatsApp' },
  { key: 'backups', label: 'Backups FTP' },
  { key: 'wasabi', label: 'Wasabi' },
  { key: 'automation', label: 'Automação' },
  { key: 'zabbix', label: 'Zabbix' },
  { key: 'winbox', label: 'Winbox' },
  { key: 'bacula', label: 'Bacula' },
  { key: 'vps', label: 'VPS' },
  { key: 'security', label: 'Security' },
  { key: 'webhooks', label: 'Webhooks' },
] as const;

export const useUserPermissions = (userId?: string) => {
  return useQuery({
    queryKey: ['user-permissions', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useMyPermissions = () => {
  const { user, isMaster } = useAuth();
  const query = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !isMaster,
  });

  const hasAccess = (screenKey: string): boolean => {
    if (isMaster) return true;
    // No permissions record = access to all screens (default open)
    if (!query.data) return true;
    const allowed = query.data.allowed_screens as string[];
    if (!allowed || allowed.length === 0) return true;
    return allowed.includes(screenKey);
  };

  return { ...query, hasAccess };
};

export const useSaveUserPermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, allowedScreens }: { userId: string; allowedScreens: string[] }) => {
      const { data: existing } = await supabase
        .from('user_permissions')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_permissions')
          .update({ allowed_screens: allowedScreens, updated_at: new Date().toISOString() })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_permissions')
          .insert({ user_id: userId, allowed_screens: allowedScreens });
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions', variables.userId] });
    },
  });
};
