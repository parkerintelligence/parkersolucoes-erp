import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useIntegrations } from '@/hooks/useIntegrations';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type ConnState = 'unknown' | 'open' | 'connecting' | 'close';

const STATE_META: Record<ConnState, { label: string; dot: string }> = {
  open: { label: 'WhatsApp conectado', dot: 'bg-emerald-500' },
  connecting: { label: 'WhatsApp aguardando conexão', dot: 'bg-amber-500 animate-pulse' },
  close: { label: 'WhatsApp desconectado', dot: 'bg-red-500' },
  unknown: { label: 'WhatsApp: status desconhecido', dot: 'bg-muted-foreground' },
};

export const WhatsAppStatusIndicator = () => {
  const navigate = useNavigate();
  const { data: integrations } = useIntegrations();
  const integration = integrations?.find(i => i.type === 'evolution_api');
  const instanceName = (integration as any)?.instance_name as string | undefined;
  const [state, setState] = useState<ConnState>('unknown');

  useEffect(() => {
    if (!integration?.id || !instanceName) return;
    let cancelled = false;

    const check = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('evolution-proxy', {
          body: { integrationId: integration.id, endpoint: `/instance/connectionState/${instanceName}`, method: 'GET' },
        });
        if (cancelled) return;
        if (error) { setState('unknown'); return; }
        const raw = (data as any)?.data ?? data;
        setState((raw?.state || raw?.instance?.state || raw?.status || 'unknown') as ConnState);
      } catch {
        if (!cancelled) setState('unknown');
      }
    };

    check();
    const interval = setInterval(check, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [integration?.id, instanceName]);

  if (!integration?.id || !instanceName) return null;

  const meta = STATE_META[state] ?? STATE_META.unknown;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-secondary transition-colors"
          aria-label={`${meta.label}. Abrir configuração do WhatsApp`}
        >
          <span className="relative flex h-2.5 w-2.5">
            {(state === 'open' || state === 'connecting') && (
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${state === 'open' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            )}
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${meta.dot}`} />
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent>{meta.label}</TooltipContent>
    </Tooltip>
  );
};
