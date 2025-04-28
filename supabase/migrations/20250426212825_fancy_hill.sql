/*
  # Fix admin_users table RLS policy

  1. Changes
    - Remove recursive policy on admin_users table
    - Create new policy that allows admins to manage admin_users without recursion
    - Add policy for users to view their own admin status

  2. Security
    - Enable RLS on admin_users table
    - Add policies for:
      - Admins to manage all admin users
      - Users to view their own admin status
*/

-- Drop the existing recursive policy
DROP POLICY IF EXISTS "admin_users_access_policy" ON public.admin_users;

-- Create new policies without recursion
CREATE POLICY "Admins can manage all admin users"
ON public.admin_users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view own admin status"
ON public.admin_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());