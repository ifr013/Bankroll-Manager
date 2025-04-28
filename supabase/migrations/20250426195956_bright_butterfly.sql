/*
  # Add email column to player tables

  1. Changes
    - Add email column to staking_players table
    - Add email column to cfp_players table
    - Add unique constraint on email for each table
    - Add indexes for email columns

  2. Security
    - No changes to RLS policies needed
*/

-- Add email column to staking_players
ALTER TABLE public.staking_players
ADD COLUMN IF NOT EXISTS email text;

-- Add email column to cfp_players
ALTER TABLE public.cfp_players
ADD COLUMN IF NOT EXISTS email text;

-- Create indexes for email columns
CREATE INDEX IF NOT EXISTS staking_players_email_idx ON public.staking_players(email);
CREATE INDEX IF NOT EXISTS cfp_players_email_idx ON public.cfp_players(email);

-- Add unique constraints
ALTER TABLE public.staking_players
ADD CONSTRAINT staking_players_email_key UNIQUE (email);

ALTER TABLE public.cfp_players
ADD CONSTRAINT cfp_players_email_key UNIQUE (email);

-- Update existing records to copy email from auth.users if available
UPDATE public.staking_players sp
SET email = u.email
FROM auth.users u
WHERE sp.user_id = u.id
AND sp.email IS NULL;

UPDATE public.cfp_players cp
SET email = u.email
FROM auth.users u
WHERE cp.user_id = u.id
AND cp.email IS NULL;

-- Make email column required after updating existing records
ALTER TABLE public.staking_players
ALTER COLUMN email SET NOT NULL;

ALTER TABLE public.cfp_players
ALTER COLUMN email SET NOT NULL;