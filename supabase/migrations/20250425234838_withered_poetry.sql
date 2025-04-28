/*
  # Add support for dynamic poker rooms and wallets
  
  1. New Tables
    - `poker_rooms`
      - `id` (uuid, primary key)
      - `name` (text)
      - `type` (text) - 'poker' or 'wallet'
      - `created_at` (timestamptz)
      
    - `player_rooms`
      - `id` (uuid, primary key)
      - `player_id` (uuid)
      - `room_id` (uuid)
      - `nickname` (text)
      - `email` (text)
      - `created_at` (timestamptz)
      
  2. Changes
    - Remove static nickname columns from ifr_players and ifr2_players
    
  3. Security
    - Enable RLS on new tables
    - Add policies for admin users
*/

-- Create poker_rooms table
CREATE TABLE IF NOT EXISTS poker_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('poker', 'wallet')),
  created_at timestamptz DEFAULT now()
);

-- Create player_rooms table
CREATE TABLE IF NOT EXISTS player_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL,
  room_id uuid NOT NULL REFERENCES poker_rooms(id) ON DELETE CASCADE,
  nickname text,
  email text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(player_id, room_id)
);

-- Enable RLS
ALTER TABLE poker_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_rooms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin users can manage poker rooms"
  ON poker_rooms
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

CREATE POLICY "Admin users can manage player rooms"
  ON player_rooms
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Add indexes
CREATE INDEX player_rooms_player_id_idx ON player_rooms(player_id);
CREATE INDEX player_rooms_room_id_idx ON player_rooms(room_id);

-- Remove old columns
ALTER TABLE ifr_players
DROP COLUMN IF EXISTS pokerstars_nick,
DROP COLUMN IF EXISTS ggpoker_nick,
DROP COLUMN IF EXISTS acr_nick;

ALTER TABLE ifr2_players
DROP COLUMN IF EXISTS pokerstars_nick,
DROP COLUMN IF EXISTS ggpoker_nick,
DROP COLUMN IF EXISTS acr_nick;