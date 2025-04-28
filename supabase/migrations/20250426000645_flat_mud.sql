/*
  # Fix RLS policies for ifr_players table

  1. Changes
    - Add policy to allow users to insert their own players
    - Modify existing policy to allow users to manage their own players
    - Add policy to allow users to view their own players

  2. Security
    - Enable RLS on ifr_players table
    - Add policies for authenticated users to:
      - Insert players with their own user_id
      - Manage their own players
      - View their own players
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own IFR players" ON ifr_players;
DROP POLICY IF EXISTS "Users can view their own IFR players" ON ifr_players;
DROP POLICY IF EXISTS "Admin users can manage all IFR players" ON ifr_players;

-- Create new policies
CREATE POLICY "Users can insert their own players"
  ON ifr_players
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own players"
  ON ifr_players
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own players"
  ON ifr_players
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own players"
  ON ifr_players
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admin users can manage all players"
  ON ifr_players
  FOR ALL
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