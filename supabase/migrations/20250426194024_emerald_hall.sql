/*
  # Create players tables

  1. New Tables
    - `ifr_players`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text)
      - `current_makeup` (numeric)
      - `available_balance` (numeric)
      - `bank_reserve` (numeric)
      - `total_withdrawals` (numeric)
      - `total_profit` (numeric)
      - `contract_start_date` (timestamptz)
      - `created_at` (timestamptz)
      - `deal_percentage` (numeric)
      - `has_bank_reserve` (boolean)
      - `bank_reserve_percentage` (numeric)

    - `ifr2_players` (identical structure to ifr_players)

  2. Security
    - Enable RLS on both tables
    - Add policies for:
      - Admin users to manage all players
      - Managers to view all players
      - Players to view own data
      - Users to delete their own players
      - Users to insert their own players

  3. Foreign Keys
    - Both tables reference auth.users for user_id
*/

-- Create ifr_players table
CREATE TABLE IF NOT EXISTS public.ifr_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  current_makeup numeric DEFAULT 0 NOT NULL,
  available_balance numeric DEFAULT 0 NOT NULL,
  bank_reserve numeric DEFAULT 0 NOT NULL,
  total_withdrawals numeric DEFAULT 0 NOT NULL,
  total_profit numeric DEFAULT 0 NOT NULL,
  contract_start_date timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now(),
  deal_percentage numeric DEFAULT 50 NOT NULL,
  has_bank_reserve boolean DEFAULT false NOT NULL,
  bank_reserve_percentage numeric DEFAULT 20 NOT NULL
);

-- Create indexes for ifr_players
CREATE INDEX IF NOT EXISTS ifr_players_user_id_idx ON public.ifr_players(user_id);
CREATE INDEX IF NOT EXISTS ifr_players_created_at_idx ON public.ifr_players(created_at);

-- Enable RLS for ifr_players
ALTER TABLE public.ifr_players ENABLE ROW LEVEL SECURITY;

-- Create policies for ifr_players
CREATE POLICY "Admins manage all players" ON public.ifr_players
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.admin_users))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users));

CREATE POLICY "Managers can view all players" ON public.ifr_players
  FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.managers));

CREATE POLICY "Players can view own data" ON public.ifr_players
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own players" ON public.ifr_players
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own players" ON public.ifr_players
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create ifr2_players table (identical structure)
CREATE TABLE IF NOT EXISTS public.ifr2_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  current_makeup numeric DEFAULT 0 NOT NULL,
  available_balance numeric DEFAULT 0 NOT NULL,
  bank_reserve numeric DEFAULT 0 NOT NULL,
  total_withdrawals numeric DEFAULT 0 NOT NULL,
  total_profit numeric DEFAULT 0 NOT NULL,
  contract_start_date timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now(),
  deal_percentage numeric DEFAULT 50 NOT NULL,
  has_bank_reserve boolean DEFAULT false NOT NULL,
  bank_reserve_percentage numeric DEFAULT 20 NOT NULL
);

-- Create indexes for ifr2_players
CREATE INDEX IF NOT EXISTS ifr2_players_user_id_idx ON public.ifr2_players(user_id);
CREATE INDEX IF NOT EXISTS ifr2_players_created_at_idx ON public.ifr2_players(created_at);

-- Enable RLS for ifr2_players
ALTER TABLE public.ifr2_players ENABLE ROW LEVEL SECURITY;

-- Create policies for ifr2_players
CREATE POLICY "Admin users can manage all players" ON public.ifr2_players
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.admin_users))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users));

CREATE POLICY "Managers can view all players" ON public.ifr2_players
  FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.managers));

CREATE POLICY "Players can view own data" ON public.ifr2_players
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());