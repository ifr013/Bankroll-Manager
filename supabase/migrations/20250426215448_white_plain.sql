/*
  # Add RLS policies for user-related tables

  1. Changes
    - Enable RLS on auth.users table
    - Add RLS policies for auth.users table
    - Update RLS policies for admin_users table
    - Update RLS policies for staking_players table

  2. Security
    - Admins can read all user data
    - Users can read their own data
    - Managers can read player data
    - Players can read their own data
*/

-- Enable RLS on auth.users table
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Add policies for auth.users table
CREATE POLICY "Users can read own data"
  ON auth.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all user data"
  ON auth.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Update admin_users policies
DROP POLICY IF EXISTS "admin_users_policy" ON public.admin_users;

CREATE POLICY "Admins can read admin data"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Update staking_players policies
DROP POLICY IF EXISTS "Players can view own data" ON public.staking_players;
DROP POLICY IF EXISTS "Managers can view all staking players" ON public.staking_players;
DROP POLICY IF EXISTS "Admin users can manage staking players" ON public.staking_players;

CREATE POLICY "Players can view own data"
  ON public.staking_players
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Managers can view all players"
  ON public.staking_players
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.managers
      WHERE managers.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin users can manage all players"
  ON public.staking_players
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );