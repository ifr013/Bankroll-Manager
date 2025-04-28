/*
  # Create bankrolls and profit verifications tables with admin support
  
  1. New Tables
    - `admin_users`
      - `user_id` (uuid, primary key)
      - `created_at` (timestamptz)
    
    - `bankrolls`
      - `id` (uuid, primary key)
      - `name` (text)
      - `initial_amount` (numeric)
      - `current_amount` (numeric)
      - `makeup_effective` (numeric)
      - `last_result` (numeric)
      - `created_at` (timestamptz)
      
    - `profit_verifications`
      - `id` (uuid, primary key)
      - `player_id` (uuid, references bankrolls)
      - `date` (timestamptz)
      - `makeup` (numeric)
      - `was_positive` (boolean)
      - `profit_withdrawn` (numeric)
      - `created_at` (timestamptz)
      
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    
  3. Indexes
    - Add indexes for performance optimization
*/

-- Create admin_users table first
CREATE TABLE IF NOT EXISTS admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy for admin users table
CREATE POLICY "Only super admins can manage admin users"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Create bankrolls table
CREATE TABLE IF NOT EXISTS bankrolls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  initial_amount numeric NOT NULL DEFAULT 0,
  current_amount numeric NOT NULL DEFAULT 0,
  makeup_effective numeric NOT NULL DEFAULT 0,
  last_result numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for bankrolls
ALTER TABLE bankrolls ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can manage their own bankrolls"
  ON bankrolls
  FOR ALL
  TO authenticated
  USING (auth.uid() = id);

-- Create profit verifications table
CREATE TABLE IF NOT EXISTS profit_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES bankrolls(id) ON DELETE CASCADE,
  date timestamptz NOT NULL DEFAULT now(),
  makeup numeric NOT NULL DEFAULT 0,
  was_positive boolean NOT NULL DEFAULT false,
  profit_withdrawn numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for profit verifications
ALTER TABLE profit_verifications ENABLE ROW LEVEL SECURITY;

-- Create policy for admin users
CREATE POLICY "Admin users can manage verifications"
  ON profit_verifications
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Add indexes for performance
CREATE INDEX profit_verifications_player_id_idx ON profit_verifications(player_id);
CREATE INDEX profit_verifications_date_idx ON profit_verifications(date);
CREATE INDEX bankrolls_created_at_idx ON bankrolls(created_at);