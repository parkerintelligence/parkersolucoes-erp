import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const onlyDigits = (value?: string | null) => (value || '').replace(/\D/g, '');

/**
 * Busca (com cache no servidor) as fotos de perfil do WhatsApp de vários números.
 * Retorna um mapa: número em dígitos -> URL da foto.
 */
export const useWhatsAppAvatars = (phoneNumbers: (string | null | undefined)[]) => {
  const phones = Array.from(
    new Set(phoneNumbers.map(onlyDigits).filter((p) => p.length >= 10)),
  ).sort();

  return useQuery({
    queryKey: ['whatsapp-avatars', phones.join(',')],
    queryFn: async (): Promise<Record<string, string | null>> => {
      if (phones.length === 0) return {};
      const { data, error } = await supabase.functions.invoke('whatsapp-avatar', {
        body: { phones },
      });
      if (error) return {};
      return (data as any)?.avatars || {};
    },
    enabled: phones.length > 0,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 6,
    refetchOnWindowFocus: false,
    retry: false,
  });
};

export const avatarForPhone = (
  avatars: Record<string, string | null> | undefined,
  phone?: string | null,
) => {
  const digits = onlyDigits(phone);
  if (!digits || !avatars) return undefined;
  return avatars[digits] || undefined;
};
