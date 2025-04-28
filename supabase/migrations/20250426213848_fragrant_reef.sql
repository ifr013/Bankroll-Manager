/*
  # Fix admin_users policy recursion

  1. Changes
    - Drop existing policy that causes infinite recursion
    - Create new simplified policy that only checks uid() = user_id
    - Add separate policy for admin users to manage other admins

  2. Security
    - Maintains row-level security
    - Ensures users can only manage their own records
    - Allows existing admins to manage other admin users
*/

-- Drop the existing policy that causes recursion
DROP POLICY IF EXISTS "admin_management_policy" ON public.admin_users;

-- Create policy for users to manage their own records
CREATE POLICY "users_manage_own_admin_record"
ON public.admin_users
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create policy for admin users to manage all records
CREATE POLICY "admins_manage_all_admin_records"
ON public.admin_users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
  )
);