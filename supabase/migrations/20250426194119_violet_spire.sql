/*
  # Rename player types from IFR/IFR2 to Staking/CFP

  1. Changes
    - Rename `ifr_players` table to `staking_players`
    - Rename `ifr2_players` table to `cfp_players`
    - Update all related constraints, indexes, and policies

  2. Security
    - Maintain existing RLS policies
    - Update policy names to reflect new table names
*/

-- Rename tables
ALTER TABLE IF EXISTS public.ifr_players RENAME TO staking_players;
ALTER TABLE IF EXISTS public.ifr2_players RENAME TO cfp_players;

-- Update indexes for staking_players
ALTER INDEX IF EXISTS ifr_players_user_id_idx RENAME TO staking_players_user_id_idx;
ALTER INDEX IF EXISTS ifr_players_created_at_idx RENAME TO staking_players_created_at_idx;
ALTER INDEX IF EXISTS ifr_players_pkey RENAME TO staking_players_pkey;

-- Update indexes for cfp_players
ALTER INDEX IF EXISTS ifr2_players_user_id_idx RENAME TO cfp_players_user_id_idx;
ALTER INDEX IF EXISTS ifr2_players_created_at_idx RENAME TO cfp_players_created_at_idx;
ALTER INDEX IF EXISTS ifr2_players_pkey RENAME TO cfp_players_pkey;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins manage all players" ON public.staking_players;
DROP POLICY IF EXISTS "Managers can view all players" ON public.staking_players;
DROP POLICY IF EXISTS "Players can view own data" ON public.staking_players;
DROP POLICY IF EXISTS "Users can delete their own players" ON public.staking_players;
DROP POLICY IF EXISTS "Users can insert their own players" ON public.staking_players;

DROP POLICY IF EXISTS "Admin users can manage all players" ON public.cfp_players;
DROP POLICY IF EXISTS "Managers can view all players" ON public.cfp_players;
DROP POLICY IF EXISTS "Players can view own data" ON public.cfp_players;

-- Recreate policies for staking_players
CREATE POLICY "Admins manage all staking players" ON public.staking_players
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.admin_users))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users));

CREATE POLICY "Managers can view all staking players" ON public.staking_players
  FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.managers));

CREATE POLICY "Players can view own staking data" ON public.staking_players
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own staking players" ON public.staking_players
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own staking players" ON public.staking_players
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Recreate policies for cfp_players
CREATE POLICY "Admins manage all CFP players" ON public.cfp_players
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.admin_users))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users));

CREATE POLICY "Managers can view all CFP players" ON public.cfp_players
  FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.managers));

CREATE POLICY "Players can view own CFP data" ON public.cfp_players
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Update foreign key references in player_rooms table if they exist
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'player_rooms_player_id_fkey'
  ) THEN
    ALTER TABLE public.player_rooms
      DROP CONSTRAINT player_rooms_player_id_fkey,
      ADD CONSTRAINT player_rooms_player_id_fkey 
        FOREIGN KEY (player_id) 
        REFERENCES staking_players(id) 
        ON DELETE CASCADE;
  END IF;
END $$;