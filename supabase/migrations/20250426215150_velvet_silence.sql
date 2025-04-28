/*
  # Fix admin_users policy recursion

  1. Changes
    - Drop existing policy that causes recursion
    - Create new policy with CASE statement to prevent recursion
    - Ensure proper access control for admin users
    
  2. Security
    - Maintains RLS protection
    - Prevents infinite recursion
    - Allows admins to manage admin_users table
*/

-- Drop existing policy
DROP POLICY IF EXISTS "admin_users_policy" ON admin_users;

-- Create new policy with CASE statement to prevent recursion
CREATE POLICY "admin_users_policy"
ON admin_users
FOR ALL
TO authenticated
USING (
  CASE
    WHEN auth.uid() = user_id THEN true
    WHEN EXISTS ( SELECT 1
       FROM admin_users au
       WHERE au.user_id = auth.uid()
       LIMIT 1) THEN true
    ELSE false
  END
)
WITH CHECK (
  CASE
    WHEN auth.uid() = user_id THEN true
    WHEN EXISTS ( SELECT 1
       FROM admin_users au
       WHERE au.user_id = auth.uid()
       LIMIT 1) THEN true
    ELSE false
  END
);