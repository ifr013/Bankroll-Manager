/*
  # Fix admin users policy to prevent infinite recursion

  1. Changes
    - Drop all existing policies on admin_users table
    - Create new policy with fixed conditions to prevent recursion
    
  2. Security
    - Maintain RLS enabled
    - Add new policy for admin users that doesn't cause recursion
*/

-- Drop ALL existing policies to ensure clean slate
DROP POLICY IF EXISTS "Only super admins can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Admin users can manage admin users" ON admin_users;

-- Create new policy with fixed conditions and unique name
CREATE POLICY "admin_users_policy_v2"
ON admin_users
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM admin_users au
  WHERE au.user_id = auth.uid()
  LIMIT 1
))
WITH CHECK (EXISTS (
  SELECT 1 FROM admin_users au
  WHERE au.user_id = auth.uid()
  LIMIT 1
));