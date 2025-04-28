/*
  # Add IFR and IFR2 tables for player management
  
  1. New Tables
    - `ifr_players`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `current_makeup` (numeric)
      - `available_balance` (numeric)
      - `bank_reserve` (numeric)
      - `total_withdrawals` (numeric)
      - `total_profit` (numeric)
      - `contract_start_date` (timestamptz)
      - `created_at` (timestamptz)
    
    - `ifr2_players`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `current_makeup` (numeric)
      - `available_balance` (numeric)
      - `bank_reserve` (numeric)
      - `total_withdrawals` (numeric)
      - `total_profit` (numeric)
      - `contract_start_date` (timestamptz)
      - `created_at` (timestamptz)
      
  2. Security
    - Enable RLS on all tables
    - Add policies for admin users
*/

-- Create IFR players table
CREATE TABLE IF NOT EXISTS ifr_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  current_makeup numeric NOT NULL DEFAULT 0,
  available_balance numeric NOT NULL DEFAULT 0,
  bank_reserve numeric NOT NULL DEFAULT 0,
  total_withdrawals numeric NOT NULL DEFAULT 0,
  total_profit numeric NOT NULL DEFAULT 0,
  contract_start_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for IFR players
ALTER TABLE ifr_players ENABLE ROW LEVEL SECURITY;

-- Create policy for admin users
CREATE POLICY "Admin users can manage IFR players"
  ON ifr_players
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Create IFR2 players table
CREATE TABLE IF NOT EXISTS ifr2_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  current_makeup numeric NOT NULL DEFAULT 0,
  available_balance numeric NOT NULL DEFAULT 0,
  bank_reserve numeric NOT NULL DEFAULT 0,
  total_withdrawals numeric NOT NULL DEFAULT 0,
  total_profit numeric NOT NULL DEFAULT 0,
  contract_start_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for IFR2 players
ALTER TABLE ifr2_players ENABLE ROW LEVEL SECURITY;

-- Create policy for admin users
CREATE POLICY "Admin users can manage IFR2 players"
  ON ifr2_players
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Add indexes for performance
CREATE INDEX ifr_players_user_id_idx ON ifr_players(user_id);
CREATE INDEX ifr_players_created_at_idx ON ifr_players(created_at);
CREATE INDEX ifr2_players_user_id_idx ON ifr2_players(user_id);
CREATE INDEX ifr2_players_created_at_idx ON ifr2_players(created_at);