-- Tabela para armazenar histórico de mudanças de status
CREATE TABLE public.chatwoot_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  conversation_id INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  changed_by_name TEXT,
  changed_by_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB
);

-- Índices para performance
CREATE INDEX idx_status_history_integration ON public.chatwoot_status_history(integration_id);
CREATE INDEX idx_status_history_conversation ON public.chatwoot_status_history(conversation_id);
CREATE INDEX idx_status_history_created ON public.chatwoot_status_history(created_at DESC);
CREATE INDEX idx_status_history_user ON public.chatwoot_status_history(user_id);

-- RLS Policies
ALTER TABLE public.chatwoot_status_history ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver histórico de suas integrações
CREATE POLICY "Users can view status history of their integrations"
  ON public.chatwoot_status_history
  FOR SELECT
  USING (
    integration_id IN (
      SELECT id FROM public.integrations WHERE user_id = auth.uid()
    )
  );

-- Sistema pode inserir registros de histórico
CREATE POLICY "System can insert status history"
  ON public.chatwoot_status_history
  FOR INSERT
  WITH CHECK (true);

-- Masters podem gerenciar todo o histórico
CREATE POLICY "Masters can manage all status history"
  ON public.chatwoot_status_history
  FOR ALL
  USING (get_user_role() = 'master');

-- Ativar Realtime para histórico
ALTER PUBLICATION supabase_realtime ADD TABLE public.chatwoot_status_history;