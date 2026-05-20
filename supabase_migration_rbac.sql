-- 1. Create User Role ENUM
CREATE TYPE public.user_role AS ENUM ('admin', 'agent');

-- 2. Create Profiles Table (Linked to auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  role public.user_role DEFAULT 'agent'::public.user_role NOT NULL,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
-- Admins can read all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Users can read their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING ( auth.uid() = id );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING ( auth.uid() = id );

-- 3. Automatic Profile Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Update Leads Table to support RBAC
ALTER TABLE public.leads 
ADD COLUMN assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Leads RLS Policies Update
-- Drop old policies if they exist (assuming anon insert only before)
DROP POLICY IF EXISTS "Enable insert for all users" ON public.leads;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.leads;

-- Anyone can insert a lead (Contact form, OfferBot)
CREATE POLICY "Anyone can insert leads" 
ON public.leads FOR INSERT 
WITH CHECK (true);

-- Admins can read/update all leads
CREATE POLICY "Admins can view all leads" 
ON public.leads FOR SELECT 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can update all leads" 
ON public.leads FOR UPDATE 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Agents can only read/update their assigned leads
CREATE POLICY "Agents can view assigned leads" 
ON public.leads FOR SELECT 
USING (
  assigned_to = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Agents can update assigned leads" 
ON public.leads FOR UPDATE 
USING (
  assigned_to = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
