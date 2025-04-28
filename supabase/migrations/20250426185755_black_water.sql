/*
  # Rename Player Tables

  1. Changes
    - Rename `ifr_players` to `players`
    - Rename `ifr2_players` to `players2`
    - Update all references and triggers
    - Preserve all data and relationships

  2. Security
    - Maintain existing RLS policies
    - Update trigger functions
*/

-- Rename tables
ALTER TABLE IF EXISTS public.ifr_players RENAME TO players;
ALTER TABLE IF EXISTS public.ifr2_players RENAME TO players2;

-- Update trigger functions
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

-- Update triggers for players table
DROP TRIGGER IF EXISTS create_ifr_player_account ON public.players;
CREATE TRIGGER create_player_account
  BEFORE INSERT ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION create_player_account();

DROP TRIGGER IF EXISTS handle_ifr_player_deletion ON public.players;
CREATE TRIGGER handle_player_deletion
  AFTER DELETE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION handle_player_deletion();

-- Update triggers for players2 table
DROP TRIGGER IF EXISTS create_ifr2_player_account ON public.players2;
CREATE TRIGGER create_player2_account
  BEFORE INSERT ON public.players2
  FOR EACH ROW
  EXECUTE FUNCTION create_player_account();

DROP TRIGGER IF EXISTS handle_ifr2_player_deletion ON public.players2;
CREATE TRIGGER handle_player2_deletion
  AFTER DELETE ON public.players2
  FOR EACH ROW
  EXECUTE FUNCTION handle_player_deletion();

-- Update foreign key references in player_rooms table
ALTER TABLE IF EXISTS public.player_rooms
  DROP CONSTRAINT IF EXISTS player_rooms_player_id_fkey,
  ADD CONSTRAINT player_rooms_player_id_fkey 
    FOREIGN KEY (player_id) 
    REFERENCES players(id) 
    ON DELETE CASCADE;