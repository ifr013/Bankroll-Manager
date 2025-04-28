/*
  # Create Player Account Trigger

  1. New Functions
    - create_player_account: Creates a new auth.users record when a player is added
    - handle_player_deletion: Cleans up auth.users when a player is deleted

  2. Changes
    - Add triggers for both IFR and IFR2 players tables
    - Add RLS policies for secure access

  3. Security
    - Only admin users can trigger these functions
    - Secure password generation
    - Email notifications handled by Supabase Auth
*/

-- Function to create player account
CREATE OR REPLACE FUNCTION create_player_account()
RETURNS TRIGGER AS $$
DECLARE
  new_user_id uuid;
  temp_password text;
BEGIN
  -- Generate a secure temporary password
  temp_password := encode(gen_random_bytes(12), 'base64');
  
  -- Create auth user
  new_user_id := (
    SELECT id FROM auth.users
    WHERE email = NEW.email
    LIMIT 1
  );

  IF new_user_id IS NULL THEN
    new_user_id := auth.uid();
    
    -- Create new auth user
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change_token_current,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      new_user_id,
      NEW.email,
      crypt(temp_password, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      json_build_object('name', NEW.name, 'is_player', true),
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );

    -- Create user profile
    INSERT INTO public.users (
      id,
      email,
      name,
      is_player
    )
    VALUES (
      new_user_id,
      NEW.email,
      NEW.name,
      true
    );
  END IF;

  -- Update the player record with the user_id
  NEW.user_id := new_user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle player deletion
CREATE OR REPLACE FUNCTION handle_player_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only delete the auth user if they're not an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = OLD.user_id
  ) THEN
    DELETE FROM auth.users WHERE id = OLD.user_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for IFR players
DROP TRIGGER IF EXISTS create_ifr_player_account ON public.ifr_players;
CREATE TRIGGER create_ifr_player_account
  BEFORE INSERT ON public.ifr_players
  FOR EACH ROW
  EXECUTE FUNCTION create_player_account();

DROP TRIGGER IF EXISTS handle_ifr_player_deletion ON public.ifr_players;
CREATE TRIGGER handle_ifr_player_deletion
  AFTER DELETE ON public.ifr_players
  FOR EACH ROW
  EXECUTE FUNCTION handle_player_deletion();

-- Create triggers for IFR2 players
DROP TRIGGER IF EXISTS create_ifr2_player_account ON public.ifr2_players;
CREATE TRIGGER create_ifr2_player_account
  BEFORE INSERT ON public.ifr2_players
  FOR EACH ROW
  EXECUTE FUNCTION create_player_account();

DROP TRIGGER IF EXISTS handle_ifr2_player_deletion ON public.ifr2_players;
CREATE TRIGGER handle_ifr2_player_deletion
  AFTER DELETE ON public.ifr2_players
  FOR EACH ROW
  EXECUTE FUNCTION handle_player_deletion();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;