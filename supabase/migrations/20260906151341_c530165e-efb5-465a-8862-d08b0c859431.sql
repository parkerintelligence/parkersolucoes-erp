CREATE TABLE IF NOT EXISTS public.whatsapp_avatars (
  phone TEXT PRIMARY KEY,
  avatar_url TEXT,
  has_photo BOOLEAN NOT NULL DEFAULT false,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.whatsapp_avatars TO authenticated;
GRANT ALL ON public.whatsapp_avatars TO service_role;
ALTER TABLE public.whatsapp_avatars ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read whatsapp avatars" ON public.whatsapp_avatars;
CREATE POLICY "Authenticated users can read whatsapp avatars" ON public.whatsapp_avatars FOR SELECT TO authenticated USING (true);