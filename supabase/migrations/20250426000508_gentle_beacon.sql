/*
  # Fix IFR Players RLS Policies

  1. Changes
    - Drop existing RLS policy for ifr_players table
    - Create new policies for:
      - Admin users to manage all IFR players
      - Users to manage their own IFR players
      - Users to view their own IFR players

  2. Security
    - Maintains RLS on ifr_players table
    - Ensures proper access control based on user roles and ownership
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Admin users can manage IFR players" ON ifr_players;

-- Create new policies
CREATE POLICY "Admin users can manage all IFR players"
ON ifr_players
FOR ALL
TO authenticated
USING (
  auth.uid() IN (SELECT admin_users.user_id FROM admin_users)
);

CREATE POLICY "Users can manage their own IFR players"
ON ifr_players
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own IFR players"
ON ifr_players
FOR SELECT
TO authenticated
USING (user_id = auth.uid());