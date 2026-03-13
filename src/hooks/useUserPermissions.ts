import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const ACTIONS = [
  { key: 'view', label: 'Visualizar' },
  { key: 'create', label: 'Criar' },
  { key: 'edit', label: 'Editar' },
  { key: 'delete', label: 'Excluir' },
] as const;

export type ActionKey = typeof ACTIONS[number]['key'];

export type ScreenPermissions = Record<string, ActionKey[]>;

export const ALL_SCREENS = [
  { key: 'dashboard', label: 'Dashboard', actions: ['view'] as ActionKey[] },
  { key: 'atendimentos', label: 'Atendimentos', actions: ['view', 'create', 'edit', 'delete'] as ActionKey[] },
  { key: 'alertas', label: 'Alertas', actions: ['view'] as ActionKey[] },
  { key: 'links', label: 'Links de Acesso', actions: ['view', 'create', 'edit', 'delete'] as ActionKey[] },
  { key: 'conexao-remota', label: 'Conexão Remota', actions: ['view'] as ActionKey[] },
  { key: 'glpi', label: 'GLPI', actions: ['view', 'create', 'edit', 'delete'] as ActionKey[] },
  { key: 'projetos', label: 'Projetos', actions: ['view', 'create', 'edit', 'delete'] as ActionKey[] },
  { key: 'passwords', label: 'Senhas', actions: ['view', 'create', 'edit', 'delete'] as ActionKey[] },
  { key: 'annotations', label: 'Anotações', actions: ['view', 'create', 'edit', 'delete'] as ActionKey[] },
  { key: 'schedule', label: 'Agenda', actions: ['view', 'create', 'edit', 'delete'] as ActionKey[] },
  { key: 'whatsapp', label: 'WhatsApp', actions: ['view', 'create'] as ActionKey[] },
  { key: 'whatsapp-templates', label: 'Modelos WhatsApp', actions: ['view', 'create', 'edit', 'delete'] as ActionKey[] },
  { key: 'backups', label: 'Backups FTP', actions: ['view', 'create', 'delete'] as ActionKey[] },
  { key: 'wasabi', label: 'Wasabi', actions: ['view', 'create', 'delete'] as ActionKey[] },
  { key: 'automation', label: 'Automação', actions: ['view', 'create', 'edit', 'delete'] as ActionKey[] },
  { key: 'zabbix', label: 'Zabbix', actions: ['view'] as ActionKey[] },
  { key: 'winbox', label: 'Winbox', actions: ['view', 'create', 'edit', 'delete'] as ActionKey[] },
  { key: 'bacula', label: 'Bacula', actions: ['view'] as ActionKey[] },
  { key: 'vps', label: 'VPS', actions: ['view', 'create', 'edit', 'delete'] as ActionKey[] },
  { key: 'security', label: 'Security', actions: ['view'] as ActionKey[] },
  { key: 'webhooks', label: 'Webhooks', actions: ['view', 'create', 'edit', 'delete'] as ActionKey[] },
] as const;

/** Build default full-access permissions */
export const buildFullPermissions = (): ScreenPermissions => {
  const perms: ScreenPermissions = {};
  ALL_SCREENS.forEach(s => { perms[s.key] = [...s.actions]; });
  return perms;
};

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

  const getPermissions = (): ScreenPermissions | null => {
    if (isMaster) return null; // master = full access
    if (!query.data) return null; // no record = full access
    const raw = query.data.allowed_screens;
    // Support legacy format (string[])
    if (Array.isArray(raw)) {
      const perms: ScreenPermissions = {};
      (raw as string[]).forEach(key => {
        const screen = ALL_SCREENS.find(s => s.key === key);
        perms[key] = screen ? [...screen.actions] : ['view'];
      });
      return perms;
    }
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      return raw as ScreenPermissions;
    }
    return null;
  };

  const hasAccess = (screenKey: string): boolean => {
    if (isMaster) return true;
    const perms = getPermissions();
    if (!perms) return true; // no restrictions
    const screenPerms = perms[screenKey];
    if (!screenPerms) return false;
    return screenPerms.length > 0;
  };

  const canAction = (screenKey: string, action: ActionKey): boolean => {
    if (isMaster) return true;
    const perms = getPermissions();
    if (!perms) return true;
    const screenPerms = perms[screenKey];
    if (!screenPerms) return false;
    return screenPerms.includes(action);
  };

  return { ...query, hasAccess, canAction };
};

export const useSaveUserPermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: ScreenPermissions }) => {
      const { data: existing } = await supabase
        .from('user_permissions')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_permissions')
          .update({ allowed_screens: permissions as any, updated_at: new Date().toISOString() })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_permissions')
          .insert({ user_id: userId, allowed_screens: permissions as any });
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions', variables.userId] });
    },
  });
};
