/*
  # Fix users table RLS policies

  1. Changes
    - Drop existing policies
    - Add new policy to allow admin users to insert records
    - Maintain existing read/update policies
    
  2. Security
    - Ensure admin users can create user records
    - Maintain user data privacy
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Admin users can manage all users" ON public.users;

-- Create new policies
CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin users can manage all users"
  ON public.users
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM admin_users
    )
  );