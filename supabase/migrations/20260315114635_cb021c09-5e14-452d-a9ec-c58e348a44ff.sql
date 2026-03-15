
-- Replace the cleanup function to keep only last 20 records per user
CREATE OR REPLACE FUNCTION public.cleanup_old_report_logs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.scheduled_reports_logs
  WHERE id IN (
    SELECT id FROM public.scheduled_reports_logs
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    OFFSET 20
  );
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_cleanup_report_logs ON public.scheduled_reports_logs;

-- Create trigger to auto-cleanup on insert
CREATE TRIGGER trg_cleanup_report_logs
AFTER INSERT ON public.scheduled_reports_logs
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_report_logs();
