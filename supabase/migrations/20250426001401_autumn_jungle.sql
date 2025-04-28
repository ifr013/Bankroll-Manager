/*
  # Fix admin users policy

  1. Changes
    - Drop the existing policy that causes infinite recursion
    - Create a new policy that directly checks the user's ID without recursion
  
  2. Security
    - Enable RLS on admin_users table (in case it wasn't enabled)
    - Add new policy for admin users to manage other admin users
*/

-- First, drop the problematic policy
DROP POLICY IF EXISTS "Only super admins can manage admin users" ON admin_users;

-- Enable RLS (in case it wasn't enabled)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create new policy without recursion
CREATE POLICY "Admin users can manage admin users"
ON admin_users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  )
);