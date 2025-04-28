/*
  # Fix admin permissions and RLS policies
  
  1. Changes
    - Simplify RLS policies
    - Ensure test admin account exists and has proper permissions
    - Fix recursive policy issues
*/

-- First ensure the test admin exists and has proper permissions
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

    -- Create user profile
    INSERT INTO public.users (id, email, name, is_player)
    VALUES (admin_id, 'admin@test.com', 'Admin', false);
  END IF;

  -- Ensure admin is in admin_users
  INSERT INTO public.admin_users (user_id)
  VALUES (admin_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the function
SELECT ensure_test_admin();

-- Reset policies for admin_users table
DROP POLICY IF EXISTS "admin_users_policy" ON public.admin_users;
DROP POLICY IF EXISTS "users_manage_own_admin_record" ON public.admin_users;
DROP POLICY IF EXISTS "admins_manage_all_admin_records" ON public.admin_users;

-- Create simplified admin_users policy
CREATE POLICY "admin_access_policy"
ON public.admin_users
FOR ALL
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email = 'admin@test.com'
  )
);

-- Reset policies for users table
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Admin users can manage all users" ON public.users;

-- Create simplified users policies
CREATE POLICY "users_read_own_data"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "admin_manage_users"
ON public.users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email = 'admin@test.com'
  )
);

-- Reset policies for staking_players table
DROP POLICY IF EXISTS "Admin users can manage all players" ON public.staking_players;
DROP POLICY IF EXISTS "Players can view own data" ON public.staking_players;

-- Create simplified staking_players policies
CREATE POLICY "admin_manage_players"
ON public.staking_players
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email = 'admin@test.com'
  )
);

CREATE POLICY "players_view_own_data"
ON public.staking_players
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Ensure RLS is enabled on all tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staking_players ENABLE ROW LEVEL SECURITY;