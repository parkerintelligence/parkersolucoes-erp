-- Insert the authenticated user as master
-- This uses the current authenticated user from the context
INSERT INTO public.user_roles (user_id, role) 
VALUES ('5d360177-8726-4102-93f7-cd1d918c0d89', 'master')
ON CONFLICT (user_id, role) DO NOTHING;