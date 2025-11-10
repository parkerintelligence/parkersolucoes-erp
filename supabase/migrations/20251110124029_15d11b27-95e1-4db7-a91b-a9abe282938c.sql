-- Tabela para armazenar eventos do Chatwoot
CREATE TABLE public.chatwoot_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  conversation_id INTEGER NOT NULL,
  account_id INTEGER NOT NULL,
  event_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed BOOLEAN DEFAULT false
);

-- Índices para performance
CREATE INDEX idx_chatwoot_events_integration ON public.chatwoot_events(integration_id);
CREATE INDEX idx_chatwoot_events_conversation ON public.chatwoot_events(conversation_id);
CREATE INDEX idx_chatwoot_events_created ON public.chatwoot_events(created_at DESC);
CREATE INDEX idx_chatwoot_events_processed ON public.chatwoot_events(processed) WHERE NOT processed;

-- RLS Policies
ALTER TABLE public.chatwoot_events ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver eventos de suas integrações
CREATE POLICY "Users can view their integration events"
  ON public.chatwoot_events
  FOR SELECT
  USING (
    integration_id IN (
      SELECT id FROM public.integrations WHERE user_id = auth.uid()
    )
  );

-- Ativar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chatwoot_events;