/*
  # Add player details fields
  
  1. Changes
    - Add nickname fields for different poker rooms
    - Add deal percentage field
    - Add bank reserve flag and percentage fields
    
  2. Tables Modified
    - ifr_players
    - ifr2_players
*/

-- Add columns to ifr_players
ALTER TABLE ifr_players
ADD COLUMN IF NOT EXISTS pokerstars_nick text,
ADD COLUMN IF NOT EXISTS ggpoker_nick text,
ADD COLUMN IF NOT EXISTS acr_nick text,
ADD COLUMN IF NOT EXISTS deal_percentage numeric NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS has_bank_reserve boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS bank_reserve_percentage numeric NOT NULL DEFAULT 20;

-- Add columns to ifr2_players
ALTER TABLE ifr2_players
ADD COLUMN IF NOT EXISTS pokerstars_nick text,
ADD COLUMN IF NOT EXISTS ggpoker_nick text,
ADD COLUMN IF NOT EXISTS acr_nick text,
ADD COLUMN IF NOT EXISTS deal_percentage numeric NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS has_bank_reserve boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS bank_reserve_percentage numeric NOT NULL DEFAULT 20;