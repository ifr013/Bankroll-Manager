/*
  # Create admin users table and initial admin

  1. New Tables
    - `admin_users`
      - `user_id` (uuid, primary key, references auth.users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `admin_users` table
    - Add policy for authenticated users to access their own admin status
*/

-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS if not already enabled
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "admin_users_access_policy" ON public.admin_users;

-- Create policy for admin users
CREATE POLICY "admin_users_access_policy"
  ON public.admin_users
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Insert initial admin user (using the test account)
INSERT INTO public.admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'admin@test.com'
ON CONFLICT (user_id) DO NOTHING;