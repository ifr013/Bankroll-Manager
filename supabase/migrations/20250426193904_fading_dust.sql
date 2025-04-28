/*
  # Reset Players System
  
  1. Changes
    - Delete all existing players and related data
    - Clean up orphaned records
    - Ensure RLS policies are enabled
  
  2. Security
    - Safe deletion of records
    - Maintain referential integrity
*/

-- Delete data from tables in correct order to maintain referential integrity
DELETE FROM public.player_rooms;
DELETE FROM public.profit_verifications;
DELETE FROM public.players;
DELETE FROM public.players2;

-- Clean up any orphaned user records
DELETE FROM public.users 
WHERE is_player = true 
AND id NOT IN (
  SELECT user_id FROM public.admin_users
  UNION
  SELECT user_id FROM public.managers
);

-- Ensure RLS is enabled on all tables
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profit_verifications ENABLE ROW LEVEL SECURITY;