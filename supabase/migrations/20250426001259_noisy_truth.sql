/*
  # Add test admin user and account
  
  1. Changes
    - Create function to handle admin user creation
    - Add admin privileges
*/

-- Create a function to ensure the admin user exists
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS void AS $$
DECLARE
  admin_uid uuid;
BEGIN
  -- First check if the admin user already exists
  SELECT id INTO admin_uid
  FROM auth.users
  WHERE email = 'admin@test.com'
  LIMIT 1;
  
  -- If admin doesn't exist, create them
  IF admin_uid IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@test.com',
      crypt('admin123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO admin_uid;
  END IF;

  -- Add the user to admin_users if not already present
  INSERT INTO admin_users (user_id)
  VALUES (admin_uid)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT create_admin_user();