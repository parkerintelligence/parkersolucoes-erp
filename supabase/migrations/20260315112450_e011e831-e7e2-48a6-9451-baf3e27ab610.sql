
-- Trigger to keep only the last 50 webhook_logs per user
CREATE OR REPLACE FUNCTION public.cleanup_old_webhook_logs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.webhook_logs
  WHERE id IN (
    SELECT id FROM public.webhook_logs
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    OFFSET 50
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cleanup_webhook_logs
AFTER INSERT ON public.webhook_logs
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_webhook_logs();
