/*
  # Update staking_players RLS policies

  1. Changes
    - Add new policy to allow authenticated users to insert their own staking players
    - Ensure user_id matches the authenticated user's ID

  2. Security
    - Maintains existing RLS policies
    - Adds specific INSERT policy for authenticated users
    - Ensures users can only create players linked to their own user_id
*/

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Users can insert their own staking players" ON staking_players;

-- Create new insert policy
CREATE POLICY "Users can insert their own staking players"
ON staking_players
FOR INSERT
TO authenticated
WITH CHECK (
  -- Ensure the user_id matches the authenticated user's ID
  auth.uid() = user_id
);