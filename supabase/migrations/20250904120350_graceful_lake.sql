/*
  # Complete medication reminder app schema

  1. New Tables
    - `user_profiles` - User profile information with KVKK consent
    - `groups` - Medication groups for organization
    - `medications` - Medication details with flexible scheduling
    - `intake_logs` - Medication intake tracking
    - `shares` - Family sharing system for caregivers
    - `push_tokens` - Device tokens for notifications

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add sharing policies for family members

  3. Business Logic
    - Free users limited to 3 medications
    - Premium users have unlimited medications
    - Medication scheduling with times or intervals
    - Family sharing with role-based permissions
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  dob date NOT NULL,
  phone text NOT NULL,
  consent_at timestamptz NOT NULL DEFAULT now(),
  locale text DEFAULT 'tr',
  premium_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Medications table
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

-- Intake logs table
CREATE TABLE IF NOT EXISTS public.intake_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  med_id uuid NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  ts timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('taken','missed','snoozed')),
  actor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Shares table for family sharing
CREATE TABLE IF NOT EXISTS public.shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','caregiver','member')),
  scopes jsonb NOT NULL DEFAULT '{"view":true,"notify":true,"edit":false}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Push tokens table for notifications
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('ios','android','web')),
  token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform, token)
);

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can manage own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for groups
CREATE POLICY "Users can manage own groups" ON public.groups
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for medications
CREATE POLICY "Users can manage own medications" ON public.medications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Shared medication view policy
CREATE POLICY "Users can view shared medications" ON public.medications
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM public.shares s
      WHERE s.owner_user_id = medications.user_id
        AND s.target_user_id = auth.uid()
        AND s.status = 'accepted'
        AND (s.scopes->>'view')::boolean = true
    )
  );

-- RLS Policies for intake_logs
CREATE POLICY "Users can manage own logs" ON public.intake_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Shared logs view policy
CREATE POLICY "Users can view shared logs" ON public.intake_logs
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM public.shares s
      WHERE s.owner_user_id = intake_logs.user_id
        AND s.target_user_id = auth.uid()
        AND s.status = 'accepted'
        AND (s.scopes->>'view')::boolean = true
    )
  );

-- RLS Policies for shares
CREATE POLICY "Users can manage shares as owner" ON public.shares
  FOR ALL USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can view shares as target" ON public.shares
  FOR SELECT USING (auth.uid() = target_user_id);

CREATE POLICY "Users can update shares as target" ON public.shares
  FOR UPDATE USING (auth.uid() = target_user_id) WITH CHECK (auth.uid() = target_user_id);

-- RLS Policies for push_tokens
CREATE POLICY "Users can manage own push tokens" ON public.push_tokens
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Function to check medication limit for free users
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

-- Trigger for medication limit
DROP TRIGGER IF EXISTS trg_med_limit ON public.medications;
CREATE TRIGGER trg_med_limit 
  BEFORE INSERT ON public.medications
  FOR EACH ROW EXECUTE FUNCTION public.check_med_limit();

-- Function to update medication updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_medication_timestamp() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating medication timestamp
DROP TRIGGER IF EXISTS trg_update_medication_timestamp ON public.medications;
CREATE TRIGGER trg_update_medication_timestamp
  BEFORE UPDATE ON public.medications
  FOR EACH ROW EXECUTE FUNCTION public.update_medication_timestamp();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON public.medications(user_id);
CREATE INDEX IF NOT EXISTS idx_medications_group_id ON public.medications(group_id);
CREATE INDEX IF NOT EXISTS idx_intake_logs_user_id ON public.intake_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_intake_logs_med_id ON public.intake_logs(med_id);
CREATE INDEX IF NOT EXISTS idx_intake_logs_ts ON public.intake_logs(ts);
CREATE INDEX IF NOT EXISTS idx_shares_owner_user_id ON public.shares(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_shares_target_user_id ON public.shares(target_user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);