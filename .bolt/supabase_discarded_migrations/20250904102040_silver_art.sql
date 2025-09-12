/*
  # Create medications table with premium limit

  1. New Tables
    - `medications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `group_id` (uuid, optional, references groups)
      - `name` (text, required)
      - `dose_value` (numeric, optional)
      - `dose_unit` (text, optional)
      - `form` (text, optional)
      - `schedule` (jsonb, required - contains timing info)
      - `with_food` (text, enum: before/after/none)
      - `notes` (text, optional)
      - `prn` (boolean, default false)
      - `notification_enabled` (boolean, default true)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

  2. Functions
    - `check_med_limit()` - Prevents free users from adding more than 3 medications

  3. Security
    - Enable RLS on `medications` table
    - Add policies for users to manage their own medications
    - Add policies for shared access via family sharing
*/

CREATE TABLE IF NOT EXISTS public.medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  name text NOT NULL,
  dose_value numeric,
  dose_unit text,
  form text,
  schedule jsonb NOT NULL,
  with_food text CHECK (with_food IN ('before','after','none')) DEFAULT 'none',
  notes text,
  prn boolean DEFAULT false,
  notification_enabled boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Premium guard: free users ≤ 3 meds
CREATE OR REPLACE FUNCTION public.check_med_limit() RETURNS trigger AS $$
DECLARE
  med_count int;
  is_premium boolean;
BEGIN
  SELECT premium_active INTO is_premium FROM public.user_profiles WHERE user_id = NEW.user_id;
  IF COALESCE(is_premium, false) = false THEN
    SELECT count(*) INTO med_count FROM public.medications WHERE user_id = NEW.user_id;
    IF med_count >= 3 THEN
      RAISE EXCEPTION 'Free plan allows up to 3 medications';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_med_limit ON public.medications;
CREATE TRIGGER trg_med_limit BEFORE INSERT ON public.medications
FOR EACH ROW EXECUTE FUNCTION public.check_med_limit();

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own medications"
  ON public.medications
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Shared medications view access"
  ON public.medications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS(
      SELECT 1 FROM public.shares s
      WHERE s.owner_user_id = medications.user_id
        AND s.target_user_id = auth.uid()
        AND s.status = 'accepted'
        AND (s.scopes->>'view')::boolean = true
    )
  );