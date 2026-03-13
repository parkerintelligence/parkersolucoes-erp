
CREATE TABLE public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  request_body jsonb,
  response_data jsonb,
  status text NOT NULL DEFAULT 'success',
  is_test boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Masters can manage all webhook_logs"
  ON public.webhook_logs FOR ALL
  TO public
  USING (get_user_role() = 'master')
  WITH CHECK (get_user_role() = 'master');

CREATE POLICY "Users can view their own webhook_logs"
  ON public.webhook_logs FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhook_logs"
  ON public.webhook_logs FOR DELETE
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert webhook_logs"
  ON public.webhook_logs FOR INSERT
  TO public
  WITH CHECK (true);

CREATE INDEX idx_webhook_logs_webhook_id ON public.webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);
