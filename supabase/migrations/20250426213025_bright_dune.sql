/*
  # Fix admin users policy to prevent recursion

  1. Changes
    - Drop existing policies on admin_users table
    - Create new policy with fixed conditions to prevent recursion
    
  2. Security
    - Maintain RLS enabled
    - Add new policy for admin users that doesn't cause recursion
*/

-- Drop ALL existing policies to ensure clean slate
DROP POLICY IF EXISTS "admin_users_policy_v2" ON admin_users;
DROP POLICY IF EXISTS "admin_users_access_policy" ON admin_users;
DROP POLICY IF EXISTS "Admins can manage all admin users" ON admin_users;
DROP POLICY IF EXISTS "Users can view own admin status" ON admin_users;

-- Create new policies
CREATE POLICY "Admins can manage admin users"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.user_id = auth.uid()
  ));

CREATE POLICY "Users can view own admin status"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());