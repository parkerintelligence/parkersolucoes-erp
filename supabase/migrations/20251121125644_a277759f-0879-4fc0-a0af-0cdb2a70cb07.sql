-- Create table for Hostinger VPS snapshot schedules
CREATE TABLE public.hostinger_snapshot_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  vps_id TEXT NOT NULL,
  vps_name TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cron_expression TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  retention_days INTEGER DEFAULT 7,
  next_execution TIMESTAMPTZ,
  last_execution TIMESTAMPTZ,
  execution_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hostinger_snapshot_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own snapshot schedules"
ON public.hostinger_snapshot_schedules
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own snapshot schedules"
ON public.hostinger_snapshot_schedules
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own snapshot schedules"
ON public.hostinger_snapshot_schedules
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own snapshot schedules"
ON public.hostinger_snapshot_schedules
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_hostinger_snapshot_schedules_user_id ON public.hostinger_snapshot_schedules(user_id);
CREATE INDEX idx_hostinger_snapshot_schedules_integration_id ON public.hostinger_snapshot_schedules(integration_id);
CREATE INDEX idx_hostinger_snapshot_schedules_next_execution ON public.hostinger_snapshot_schedules(next_execution) WHERE is_active = true;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_hostinger_snapshot_schedules_updated_at
BEFORE UPDATE ON public.hostinger_snapshot_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();