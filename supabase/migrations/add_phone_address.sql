-- RevFlow: Add phone, address, city, country to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS country text DEFAULT 'India';

