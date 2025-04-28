/*
  # Final fix for admin permissions
  
  1. Changes
    - Reset and recreate admin user
    - Fix all RLS policies
    - Ensure proper permissions cascade
    
  2. Security
    - Maintain RLS protection
    - Ensure proper access control
*/

-- First, ensure the admin user exists in auth.users
CREATE OR REPLACE FUNCTION ensure_admin_user()
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
SELECT ensure_admin_user();

-- Reset all policies
DROP POLICY IF EXISTS "admin_users_policy" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can manage all staking players" ON public.staking_players;
DROP POLICY IF EXISTS "Players can view own staking data" ON public.staking_players;
DROP POLICY IF EXISTS "Admin users can manage all CFP players" ON public.cfp_players;
DROP POLICY IF EXISTS "Players can view own CFP data" ON public.cfp_players;

-- Create new admin_users policy
CREATE POLICY "admin_users_policy"
ON public.admin_users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email = 'admin@test.com'
  )
  OR user_id = auth.uid()
);

-- Create new staking_players policies
CREATE POLICY "Admin users can manage staking players"
ON public.staking_players
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Players can view own staking data"
ON public.staking_players
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create new cfp_players policies
CREATE POLICY "Admin users can manage CFP players"
ON public.cfp_players
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Players can view own CFP data"
ON public.cfp_players
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Ensure RLS is enabled on all tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staking_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cfp_players ENABLE ROW LEVEL SECURITY;