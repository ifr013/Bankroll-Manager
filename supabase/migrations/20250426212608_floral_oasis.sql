/*
  # Fix admin permissions and ensure test account is admin
  
  1. Changes
    - Ensure test admin account exists in auth.users
    - Add test account to admin_users table
    - Update RLS policies to properly handle admin permissions
*/

-- Function to ensure test admin exists and has proper permissions
CREATE OR REPLACE FUNCTION ensure_test_admin()
RETURNS void AS $$
DECLARE
  admin_uid uuid;
BEGIN
  -- First check if the admin user exists in auth.users
  SELECT id INTO admin_uid
  FROM auth.users
  WHERE email = 'admin@test.com'
  LIMIT 1;
  
  -- If admin doesn't exist in auth.users, create them
  IF admin_uid IS NULL THEN
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
      updated_at,
      confirmation_token,
      email_change_token_current,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@test.com',
      crypt('admin123', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Admin","is_admin":true}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO admin_uid;

    -- Create user profile in public.users
    INSERT INTO public.users (id, email, name, is_player)
    VALUES (admin_uid, 'admin@test.com', 'Admin', false);
  END IF;

  -- Ensure admin is in admin_users table
  INSERT INTO public.admin_users (user_id)
  VALUES (admin_uid)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function
SELECT ensure_test_admin();

-- Update RLS policies for admin_users table
DROP POLICY IF EXISTS "admin_users_access_policy" ON public.admin_users;

CREATE POLICY "admin_users_access_policy"
ON public.admin_users
FOR ALL
TO authenticated
USING (
  user_id = auth.uid() OR
  auth.uid() IN (SELECT user_id FROM public.admin_users)
)
WITH CHECK (
  user_id = auth.uid() OR
  auth.uid() IN (SELECT user_id FROM public.admin_users)
);

-- Update RLS policies for staking_players table
DROP POLICY IF EXISTS "Admins manage all staking players" ON public.staking_players;

CREATE POLICY "Admins manage all staking players"
ON public.staking_players
FOR ALL
TO authenticated
USING (
  auth.uid() IN (SELECT user_id FROM public.admin_users)
)
WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.admin_users)
);

-- Update RLS policies for cfp_players table
DROP POLICY IF EXISTS "Admins manage all CFP players" ON public.cfp_players;

CREATE POLICY "Admins manage all CFP players"
ON public.cfp_players
FOR ALL
TO authenticated
USING (
  auth.uid() IN (SELECT user_id FROM public.admin_users)
)
WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.admin_users)
);