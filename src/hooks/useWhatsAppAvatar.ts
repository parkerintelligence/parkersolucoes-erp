import { useQuery } from '@tanstack/react-query';
import { useIntegrations } from './useIntegrations';

const extractUrl = (data: any): string | null => {
  if (!data) return null;
  if (typeof data === 'string' && data.startsWith('http')) return data;
  const candidates = [
    data.url, data.URL, data.Url,
    data.profilePictureUrl, data.ProfilePictureUrl,
    data.avatar, data.Avatar,
    data.picture, data.Picture,
    data.data?.url, data.data?.URL,
  ];
  const found = candidates.find((value) => typeof value === 'string' && value.startsWith('http'));
  return found || null;
};

/**
 * Busca a foto de perfil do WhatsApp (via Evolution Go) para um número.
 */
export const useWhatsAppAvatar = (phoneNumber?: string | null) => {
  const { data: integrations } = useIntegrations();

  const evolution = integrations?.find(
    (integration) => integration.type === 'evolution_api' && integration.is_active,
  );

  const digits = (phoneNumber || '').replace(/\D/g, '');

  return useQuery({
    queryKey: ['whatsapp-avatar', evolution?.id, digits],
    queryFn: async () => {
      if (!evolution?.id || !digits) return null;
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error } = await supabase.functions.invoke('evolution-proxy', {
          body: {
            integrationId: evolution.id,
            endpoint: '/user/avatar',
            method: 'POST',
            body: { number: digits, preview: true },
          },
        });
        if (error) return null;
        return extractUrl(data);
      } catch {
        return null;
      }
    },
    enabled: !!evolution?.id && digits.length >= 10,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 6,
    retry: false,
  });
};
