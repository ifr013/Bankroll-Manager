/*
  # Add Weekly Settlement System
  
  1. New Tables
    - `settlement_periods`
      - Tracks weekly settlement periods
      - Stores start/end dates and status
    - `settlement_entries`
      - Stores player entries within settlement periods
      - Links to players and periods
      
  2. Security
    - Enable RLS on new tables
    - Add policies for managers and admins
*/

-- Create settlement_periods table
CREATE TABLE IF NOT EXISTS public.settlement_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  closed_at timestamptz,
  closed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  total_profit numeric DEFAULT 0,
  total_makeup numeric DEFAULT 0,
  CONSTRAINT date_order CHECK (start_date <= end_date)
);

-- Create settlement_entries table
CREATE TABLE IF NOT EXISTS public.settlement_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id uuid REFERENCES settlement_periods(id) ON DELETE CASCADE,
  player_id uuid NOT NULL,
  initial_makeup numeric NOT NULL DEFAULT 0,
  final_makeup numeric NOT NULL DEFAULT 0,
  total_deposits numeric NOT NULL DEFAULT 0,
  total_withdrawals numeric NOT NULL DEFAULT 0,
  profit_share numeric NOT NULL DEFAULT 0,
  total_profit numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  locked boolean DEFAULT false,
  UNIQUE(settlement_id, player_id)
);

-- Enable RLS
ALTER TABLE public.settlement_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for settlement_periods
CREATE POLICY "Managers can view all settlement periods"
  ON public.settlement_periods
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.managers
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage open settlement periods"
  ON public.settlement_periods
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.managers
      WHERE user_id = auth.uid()
    )
    AND status = 'open'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.managers
      WHERE user_id = auth.uid()
    )
    AND status = 'open'
  );

-- Create policies for settlement_entries
CREATE POLICY "Managers can view all settlement entries"
  ON public.settlement_entries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.managers
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage unlocked entries"
  ON public.settlement_entries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.managers
      WHERE user_id = auth.uid()
    )
    AND NOT locked
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.managers
      WHERE user_id = auth.uid()
    )
    AND NOT locked
  );

-- Create function to check if a date is within an open settlement
CREATE OR REPLACE FUNCTION is_date_in_open_settlement(check_date timestamptz)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM settlement_periods
    WHERE status = 'open'
      AND check_date BETWEEN start_date AND end_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to lock entries when settlement is closed
CREATE OR REPLACE FUNCTION lock_settlement_entries()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'closed' AND OLD.status = 'open' THEN
    -- Lock all entries for this settlement
    UPDATE settlement_entries
    SET locked = true
    WHERE settlement_id = NEW.id;
    
    -- Update closed_at timestamp
    NEW.closed_at = now();
    NEW.closed_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for locking entries
CREATE TRIGGER lock_entries_on_settlement_close
  BEFORE UPDATE ON settlement_periods
  FOR EACH ROW
  EXECUTE FUNCTION lock_settlement_entries();

-- Add indexes for performance
CREATE INDEX settlement_periods_dates_idx ON settlement_periods(start_date, end_date);
CREATE INDEX settlement_periods_status_idx ON settlement_periods(status);
CREATE INDEX settlement_entries_settlement_id_idx ON settlement_entries(settlement_id);
CREATE INDEX settlement_entries_player_id_idx ON settlement_entries(player_id);