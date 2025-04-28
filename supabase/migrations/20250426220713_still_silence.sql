/*
  # Simplify permissions to allow full access
  
  1. Changes
    - Remove all existing RLS policies
    - Create simple policies that allow full access
    - Ensure test admin account exists
*/

-- First ensure the test admin exists
CREATE OR REPLACE FUNCTION ensure_test_admin()
RETURNS void AS $$
DECLARE
  admin_id uuid;
BEGIN
  -- Check if admin exists
  SELECT id INTO admin_id
  FROM auth.users
  WHERE email = 'admin@test.com'
  LIMIT 1;

  -- Create admin if doesn't exist
  IF admin_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@test.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Admin", "is_admin": true}',
      now(),
      now()
    )
    RETURNING id INTO admin_id;
  END IF;

  -- Ensure admin is in admin_users
  INSERT INTO public.admin_users (user_id)
  VALUES (admin_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Ensure admin is in users table
  INSERT INTO public.users (id, email, name, is_player)
  VALUES (admin_id, 'admin@test.com', 'Admin', false)
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the function
SELECT ensure_test_admin();

-- Drop all existing policies
DROP POLICY IF EXISTS "admin_policy" ON public.admin_users;
DROP POLICY IF EXISTS "users_policy" ON public.users;
DROP POLICY IF EXISTS "staking_players_policy" ON public.staking_players;
DROP POLICY IF EXISTS "cfp_players_policy" ON public.cfp_players;

-- Create new simplified policies that allow full access
CREATE POLICY "full_access"
ON public.admin_users
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "full_access"
ON public.users
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "full_access"
ON public.staking_players
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "full_access"
ON public.cfp_players
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled but with full access policies
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staking_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cfp_players ENABLE ROW LEVEL SECURITY;