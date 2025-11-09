-- Create enum for roles
create type public.app_role as enum ('master', 'admin', 'user');

-- Create user_roles table
create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role app_role not null,
    unique (user_id, role)
);

-- Enable RLS
alter table public.user_roles enable row level security;

-- Create security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Policy to allow users to read their own roles
create policy "Users can view their own roles"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);

-- Policy to allow master users to manage all roles
create policy "Masters can manage all roles"
on public.user_roles
for all
to authenticated
using (public.has_role(auth.uid(), 'master'));

-- Insert default master user (replace with your user_id)
-- You'll need to run this manually with your actual user_id after the migration
-- insert into public.user_roles (user_id, role) values ('YOUR_USER_ID_HERE', 'master');