CREATE POLICY "All authenticated users can view profiles for assignment"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (true);