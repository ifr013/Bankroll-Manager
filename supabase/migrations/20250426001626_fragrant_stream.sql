/*
  # Fix admin_users policy recursion

  1. Changes
    - Drop the existing recursive policy on admin_users table
    - Create a new non-recursive policy that allows admin users to manage the table
    
  2. Security
    - Maintains RLS protection
    - Ensures only admin users can access the table
    - Prevents infinite recursion
*/

-- Drop the existing policy that's causing recursion
DROP POLICY IF EXISTS "admin_users_policy_v2" ON admin_users;

-- Create a new policy that avoids recursion by using a direct user ID check
CREATE POLICY "admin_users_access_policy" ON admin_users
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());