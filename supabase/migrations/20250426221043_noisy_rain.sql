-- Add created_by column to staking_players and cfp_players
ALTER TABLE public.staking_players
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.cfp_players
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update player account creation function
CREATE OR REPLACE FUNCTION create_player_account()
RETURNS TRIGGER AS $$
DECLARE
  new_user_id uuid;
  temp_password text;
BEGIN
  -- Generate a secure temporary password
  temp_password := encode(gen_random_bytes(12), 'base64');
  
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
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      NEW.email,
      crypt(temp_password, gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      jsonb_build_object(
        'name', NEW.name,
        'is_player', true,
        'temp_password', temp_password,
        'player_type', TG_TABLE_NAME
      ),
      now(),
      now()
    )
    RETURNING id INTO new_user_id;

    -- Create user profile
    INSERT INTO public.users (id, email, name, is_player)
    VALUES (new_user_id, NEW.email, NEW.name, true);
  END IF;

  -- Update the player record with the user_id
  NEW.user_id := new_user_id;
  NEW.created_by := auth.uid();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;