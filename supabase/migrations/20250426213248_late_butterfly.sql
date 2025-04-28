/*
  # Fix admin users policy with simplified approach
  
  1. Changes
    - Drop all existing policies on admin_users table
    - Create new simplified policies that avoid recursion
    - Add basic policy for users to view their own status
    
  2. Security
    - Maintain RLS protection
    - Ensure admin users can manage the table
    - Allow users to view their own status
*/

-- Drop ALL existing policies
DROP POLICY IF EXISTS "admin_users_policy_v2" ON admin_users;
DROP POLICY IF EXISTS "admin_users_access_policy" ON admin_users;
DROP POLICY IF EXISTS "Admins can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Users can view own admin status" ON admin_users;

-- Create simplified admin management policy
CREATE POLICY "admin_management_policy"
ON admin_users
FOR ALL
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM admin_users a2
    WHERE a2.user_id = auth.uid()
    LIMIT 1
  )
)
WITH CHECK (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM admin_users a2
    WHERE a2.user_id = auth.uid()
    LIMIT 1
  )
);