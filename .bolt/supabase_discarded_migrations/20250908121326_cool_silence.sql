/*
  # Complete Database Schema for Medication Reminder App

  1. New Tables
    - `user_profiles` - User profile information
    - `groups` - Medication groups for organization
    - `medications` - Medication details with schedule
    - `intake_logs` - Medication intake history
    - `shares` - Family sharing system

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Proper foreign key constraints

  3. Features
    - JSONB schedule for flexible medication timing
    - Premium user limits
    - Family sharing capabilities
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  dob date NOT NULL,
  phone text NOT NULL,
  consent_at timestamptz DEFAULT now(),
  locale text DEFAULT 'tr',
  premium_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid REFERENCES groups(id) ON DELETE SET NULL,
  name text NOT NULL,
  dose_value numeric,
  dose_unit text,
  form text,
  schedule jsonb NOT NULL,
  with_food text DEFAULT 'none' CHECK (with_food IN ('before', 'after', 'none')),
  notes text,
  prn boolean DEFAULT false,
  notification_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create intake_logs table
CREATE TABLE IF NOT EXISTS intake_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  med_id uuid NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  ts timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('taken', 'missed', 'snoozed')),
  actor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create shares table
CREATE TABLE IF NOT EXISTS shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'caregiver', 'member')),
  scopes jsonb NOT NULL DEFAULT '{"view": true, "notify": false, "edit": false}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(owner_user_id, target_user_id)
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for user_profiles
CREATE POLICY "Users can manage own profile"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS Policies for groups
CREATE POLICY "Users can manage own groups"
  ON groups
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS Policies for medications
CREATE POLICY "Users can manage own medications"
  ON medications
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS Policies for intake_logs
CREATE POLICY "Users can manage own intake logs"
  ON intake_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS Policies for shares
CREATE POLICY "Users can manage shares they own"
  ON shares
  FOR ALL
  TO authenticated
  USING (auth.uid() = owner_user_id OR auth.uid() = target_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_groups_user_id ON groups(user_id);
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON medications(user_id);
CREATE INDEX IF NOT EXISTS idx_medications_group_id ON medications(group_id);
CREATE INDEX IF NOT EXISTS idx_intake_logs_user_id ON intake_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_intake_logs_med_id ON intake_logs(med_id);
CREATE INDEX IF NOT EXISTS idx_intake_logs_ts ON intake_logs(ts);
CREATE INDEX IF NOT EXISTS idx_shares_owner_user_id ON shares(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_shares_target_user_id ON shares(target_user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for medications table
DROP TRIGGER IF EXISTS update_medications_updated_at ON medications;
CREATE TRIGGER update_medications_updated_at
  BEFORE UPDATE ON medications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();