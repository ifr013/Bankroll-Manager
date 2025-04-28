-- Create daily_entries table
CREATE TABLE IF NOT EXISTS public.daily_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL,
  date timestamptz NOT NULL,
  platforms jsonb NOT NULL,
  total numeric NOT NULL DEFAULT 0,
  result numeric NOT NULL DEFAULT 0,
  makeup_effective numeric NOT NULL DEFAULT 0,
  deposit numeric NOT NULL DEFAULT 0,
  withdrawal numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(player_id, date)
);

-- Enable RLS
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Players can manage their own entries"
  ON public.daily_entries
  FOR ALL
  TO authenticated
  USING (
    player_id IN (
      SELECT id FROM public.staking_players WHERE user_id = auth.uid()
      UNION
      SELECT id FROM public.cfp_players WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    player_id IN (
      SELECT id FROM public.staking_players WHERE user_id = auth.uid()
      UNION
      SELECT id FROM public.cfp_players WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view all entries"
  ON public.daily_entries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.managers
      WHERE user_id = auth.uid()
    )
  );

-- Add indexes
CREATE INDEX daily_entries_player_id_idx ON public.daily_entries(player_id);
CREATE INDEX daily_entries_date_idx ON public.daily_entries(date);