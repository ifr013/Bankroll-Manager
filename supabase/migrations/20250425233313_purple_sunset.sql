/*
  # Team Management Schema

  1. New Tables
    - `teams`
      - Team information including name and registration details
    - `team_members`
      - Manages relationships between teams and users with different roles
    - `team_invites`
      - Handles pending invitations for team members

  2. Security
    - Enable RLS on all tables
    - Add policies for team management
*/

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  registration_number text UNIQUE, -- CPF or CNPJ
  phone text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'manager', 'player')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Create team_invites table
CREATE TABLE IF NOT EXISTS public.team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'manager', 'player')),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  UNIQUE(team_id, email)
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- Policies for teams
CREATE POLICY "Users can view their own teams"
  ON public.teams
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.team_members 
      WHERE team_id = id
    )
  );

CREATE POLICY "Team owners can manage their teams"
  ON public.teams
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.team_members 
      WHERE team_id = id AND role = 'owner'
    )
  );

-- Policies for team_members
CREATE POLICY "Users can view team members"
  ON public.team_members
  FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can manage team members"
  ON public.team_members
  FOR ALL
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Policies for team_invites
CREATE POLICY "Team owners can manage invites"
  ON public.team_invites
  FOR ALL
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Create indexes
CREATE INDEX team_members_team_id_idx ON public.team_members(team_id);
CREATE INDEX team_members_user_id_idx ON public.team_members(user_id);
CREATE INDEX team_invites_team_id_idx ON public.team_invites(team_id);
CREATE INDEX team_invites_email_idx ON public.team_invites(email);