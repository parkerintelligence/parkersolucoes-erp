import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useIntegrations } from '@/hooks/useIntegrations';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';

type ConnState = 'unknown' | 'open' | 'connecting' | 'close';

const STATE_META: Record<ConnState, { label: string; badge: string; dot: string; iconColor: string }> = {
  open: { label: 'WhatsApp conectado', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500', iconColor: 'text-emerald-400' },
  connecting: { label: 'WhatsApp aguardando conexão', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30', dot: 'bg-amber-500', iconColor: 'text-amber-400' },
  close: { label: 'WhatsApp desconectado', badge: 'bg-red-500/15 text-red-400 border-red-500/30', dot: 'bg-red-500', iconColor: 'text-red-400' },
  unknown: { label: 'WhatsApp: status desconhecido', badge: 'bg-muted/50 text-muted-foreground border-border', dot: 'bg-muted-foreground', iconColor: 'text-muted-foreground' },
};

function formatPhone(phone?: string | null) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 13 && digits.startsWith('55')) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9, 13)}`;
  }
  if (digits.length === 12 && digits.startsWith('55')) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8, 12)}`;
  }
  return `+${digits}`;
}

export const WhatsAppStatusIndicator = () => {
  const navigate = useNavigate();
  const { data: integrations } = useIntegrations();
  const integration = integrations?.find(i => i.type === 'evolution_api');
  const instanceName = (integration as any)?.instance_name as string | undefined;
  const phoneNumber = integration?.phone_number;
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
  const isActive = state === 'open' || state === 'connecting';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="flex items-center gap-1.5 rounded-full border px-2 py-1 transition-colors hover:brightness-110 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          style={{}} // classes applied below
          aria-label={`${meta.label}: ${instanceName}${phoneNumber ? ` · ${formatPhone(phoneNumber)}` : ''}. Abrir configuração do WhatsApp`}
        >
          <Badge
            variant="outline"
            className={`h-6 gap-1.5 border pl-1.5 pr-2 text-[10px] font-semibold shadow-sm ${meta.badge}`}
          >
            <span className="relative flex h-2 w-2">
              {isActive && (
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-70 animate-ping ${meta.dot}`} />
              )}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${meta.dot}`} />
            </span>
            <MessageCircle className={`h-3 w-3 ${meta.iconColor}`} />
            <span className="hidden sm:inline">{instanceName}</span>
            {phoneNumber && (
              <span className="hidden md:inline opacity-80">· {formatPhone(phoneNumber)}</span>
            )}
          </Badge>
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs">
          <p className="font-medium">{meta.label}</p>
          <p className="text-muted-foreground">Instância: {instanceName}</p>
          {phoneNumber && <p className="text-muted-foreground">Número: {formatPhone(phoneNumber)}</p>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
