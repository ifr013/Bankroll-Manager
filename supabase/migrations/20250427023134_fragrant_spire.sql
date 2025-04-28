/*
  # Fix user roles and permissions

  1. Changes
    - Add managers policy to allow viewing players
    - Update RLS policies for players tables
    - Add function to ensure proper role assignment
*/

-- Create function to ensure user has a role
CREATE OR REPLACE FUNCTION ensure_user_role()
RETURNS trigger AS $$
BEGIN
  -- If user is not an admin, assign as player
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = NEW.id
  ) AND NOT EXISTS (
    SELECT 1 FROM public.managers
    WHERE user_id = NEW.id
  ) THEN
    -- Check if user is already a player
    IF NOT EXISTS (
      SELECT 1 FROM public.staking_players
      WHERE user_id = NEW.id
      UNION
      SELECT 1 FROM public.cfp_players
      WHERE user_id = NEW.id
    ) THEN
      -- Create a default staking player record
      INSERT INTO public.staking_players (
        name,
        email,
        user_id,
        contract_start_date,
        deal_percentage,
        has_bank_reserve,
        bank_reserve_percentage
      ) VALUES (
        COALESCE(NEW.raw_user_meta_data->>'name', 'New Player'),
        NEW.email,
        NEW.id,
        NOW(),
        50,
        false,
        20
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
CREATE TRIGGER ensure_user_role_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_role();

-- Update policies for staking_players
DROP POLICY IF EXISTS "Players can view own staking data" ON public.staking_players;
DROP POLICY IF EXISTS "Managers can view all players" ON public.staking_players;

CREATE POLICY "Players can view own staking data"
  ON public.staking_players
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Managers can view all staking players"
  ON public.staking_players
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.managers
      WHERE user_id = auth.uid()
    )
  );

-- Update policies for cfp_players
DROP POLICY IF EXISTS "Players can view own CFP data" ON public.cfp_players;
DROP POLICY IF EXISTS "Managers can view all CFP players" ON public.cfp_players;

CREATE POLICY "Players can view own CFP data"
  ON public.cfp_players
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Managers can view all CFP players"
  ON public.cfp_players
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.managers
      WHERE user_id = auth.uid()
    )
  );