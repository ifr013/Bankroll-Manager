-- Create function to generate secure temporary password
CREATE OR REPLACE FUNCTION generate_temp_password()
RETURNS text AS $$
BEGIN
  RETURN encode(gen_random_bytes(12), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update player account creation function for both player types
CREATE OR REPLACE FUNCTION create_player_account()
RETURNS TRIGGER AS $$
DECLARE
  new_user_id uuid;
  temp_password text;
BEGIN
  -- Generate a secure temporary password
  temp_password := generate_temp_password();
  
  -- Check if user already exists
  SELECT id INTO new_user_id
  FROM auth.users
  WHERE email = NEW.email;

  IF new_user_id IS NULL THEN
    -- Create new auth user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      invited_at,
      confirmation_token,
      confirmation_sent_at,
      recovery_token,
      recovery_sent_at,
      email_change_token_new,
      email_change,
      email_change_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      phone,
      phone_confirmed_at,
      phone_change,
      phone_change_token,
      phone_change_sent_at,
      email_change_token_current,
      email_change_confirm_status,
      banned_until,
      reauthentication_token,
      reauthentication_sent_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      NEW.email,
      crypt(temp_password, gen_salt('bf')),
      NOW(),
      NOW(),
      encode(gen_random_bytes(32), 'base64'),
      NOW(),
      encode(gen_random_bytes(32), 'base64'),
      NOW(),
      encode(gen_random_bytes(32), 'base64'),
      NULL,
      NOW(),
      NOW(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object(
        'name', NEW.name,
        'is_player', true,
        'temp_password', temp_password,
        'player_type', TG_TABLE_NAME
      ),
      FALSE,
      NOW(),
      NOW(),
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      encode(gen_random_bytes(32), 'base64'),
      0,
      NULL,
      encode(gen_random_bytes(32), 'base64'),
      NOW()
    )
    RETURNING id INTO new_user_id;

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

-- Update triggers for both player types
DROP TRIGGER IF EXISTS create_player_account ON public.staking_players;
CREATE TRIGGER create_player_account
  BEFORE INSERT ON public.staking_players
  FOR EACH ROW
  EXECUTE FUNCTION create_player_account();

DROP TRIGGER IF EXISTS create_player_account ON public.cfp_players;
CREATE TRIGGER create_player_account
  BEFORE INSERT ON public.cfp_players
  FOR EACH ROW
  EXECUTE FUNCTION create_player_account();