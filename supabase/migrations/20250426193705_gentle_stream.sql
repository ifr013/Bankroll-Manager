/*
  # User Roles and Permissions Schema

  1. New Tables
    - `managers` - Store manager information
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `created_by` (uuid, references auth.users)

  2. Security
    - Enable RLS on all tables
    - Add policies for admin access
    - Add policies for manager access
    - Add policies for player access

  3. Changes
    - Add manager-specific policies to existing tables
    - Update player access policies
*/

-- Create managers table
CREATE TABLE IF NOT EXISTS public.managers (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;

-- Policies for managers table
CREATE POLICY "Admin users can manage managers"
  ON public.managers
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM admin_users
    )
  );

CREATE POLICY "Managers can view own data"
  ON public.managers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Update players table policies
DROP POLICY IF EXISTS "Users can manage their own players" ON public.players;
DROP POLICY IF EXISTS "Users can view their own players" ON public.players;
DROP POLICY IF EXISTS "Admin users can manage all players" ON public.players;

CREATE POLICY "Players can view own data"
  ON public.players
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Managers can view all players"
  ON public.players
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM managers
    )
  );

CREATE POLICY "Admins manage all players"
  ON public.players
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM admin_users
    )
  );

-- Update players2 table policies
DROP POLICY IF EXISTS "Admin users can manage IFR2 players" ON public.players2;

CREATE POLICY "Players can view own data"
  ON public.players2
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Managers can view all players"
  ON public.players2
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM managers
    )
  );

CREATE POLICY "Admin users can manage all players"
  ON public.players2
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM admin_users
    )
  );

-- Update profit_verifications table policies
DROP POLICY IF EXISTS "Admin users can manage verifications" ON public.profit_verifications;

CREATE POLICY "Managers can manage verifications"
  ON public.profit_verifications
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM managers
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM managers
    )
  );

CREATE POLICY "Admin users can manage verifications"
  ON public.profit_verifications
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM admin_users
    )
  );

-- Function to create manager account
CREATE OR REPLACE FUNCTION create_manager_account()
RETURNS TRIGGER AS $$
DECLARE
  new_user_id uuid;
  temp_password text;
BEGIN
  -- Generate a secure temporary password
  temp_password := encode(gen_random_bytes(12), 'base64');
  
  -- Create auth user
  new_user_id := auth.uid();
  
  -- Create new auth user
  INSERT INTO auth.users (
    id,
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
    new_user_id,
    NEW.email,
    crypt(temp_password, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    json_build_object('name', NEW.name, 'is_manager', true),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

  -- Create user profile
  INSERT INTO public.users (
    id,
    email,
    name,
    is_player
  )
  VALUES (
    new_user_id,
    NEW.email,
    NEW.name,
    false
  );

  -- Update the manager record with the user_id
  NEW.user_id := new_user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for manager account creation
CREATE TRIGGER create_manager_account
  BEFORE INSERT ON public.managers
  FOR EACH ROW
  EXECUTE FUNCTION create_manager_account();