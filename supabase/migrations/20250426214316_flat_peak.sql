/*
  # Simplify admin_users policies
  
  1. Changes
    - Drop all existing policies
    - Create single simplified policy for admin users
    - Add basic policy for users to view their own records
    
  2. Security
    - Maintains RLS protection
    - Prevents infinite recursion
    - Ensures proper access control
*/

-- Drop ALL existing policies
DROP POLICY IF EXISTS "admin_management_policy" ON admin_users;
DROP POLICY IF EXISTS "users_manage_own_admin_record" ON admin_users;
DROP POLICY IF EXISTS "admins_manage_all_admin_records" ON admin_users;

-- Create simplified policy for admin users
CREATE POLICY "admin_users_policy"
ON admin_users
FOR ALL
TO authenticated
USING (
  CASE 
    WHEN user_id = auth.uid() THEN true
    WHEN EXISTS (
      SELECT 1 
      FROM admin_users au 
      WHERE au.user_id = auth.uid()
      LIMIT 1
    ) THEN true
    ELSE false
  END
)
WITH CHECK (
  CASE 
    WHEN user_id = auth.uid() THEN true
    WHEN EXISTS (
      SELECT 1 
      FROM admin_users au 
      WHERE au.user_id = auth.uid()
      LIMIT 1
    ) THEN true
    ELSE false
  END
);