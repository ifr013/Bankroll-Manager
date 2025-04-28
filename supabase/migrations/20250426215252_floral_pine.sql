/*
  # Fix player management permissions
  
  1. Changes
    - Update RLS policies for staking_players and cfp_players
    - Allow admin users to properly manage players
    - Fix policy conditions to prevent permission issues
    
  2. Security
    - Maintain RLS protection
    - Ensure proper access control
*/

-- Drop existing policies for staking_players
DROP POLICY IF EXISTS "Admins manage all staking players" ON public.staking_players;
DROP POLICY IF EXISTS "Players can view own staking data" ON public.staking_players;
DROP POLICY IF EXISTS "Users can delete their own staking players" ON public.staking_players;
DROP POLICY IF EXISTS "Users can insert their own staking players" ON public.staking_players;

-- Create new policies for staking_players
CREATE POLICY "Admin users can manage all staking players"
ON public.staking_players
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Players can view own staking data"
ON public.staking_players
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Drop existing policies for cfp_players
DROP POLICY IF EXISTS "Admins manage all CFP players" ON public.cfp_players;
DROP POLICY IF EXISTS "Players can view own CFP data" ON public.cfp_players;

-- Create new policies for cfp_players
CREATE POLICY "Admin users can manage all CFP players"
ON public.cfp_players
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Players can view own CFP data"
ON public.cfp_players
FOR SELECT
TO authenticated
USING (user_id = auth.uid());