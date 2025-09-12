/*
  # İlaç Hatırlatıcı Uygulaması - Tam Veritabanı Şeması

  1. Yeni Tablolar
    - `user_profiles` - Kullanıcı profil bilgileri
    - `groups` - İlaç grupları  
    - `medications` - İlaçlar ve zamanlamaları
    - `intake_logs` - İlaç alma kayıtları
    - `shares` - Aile paylaşımı

  2. Güvenlik
    - Tüm tablolarda RLS aktif
    - Kullanıcı bazlı erişim politikaları
    - Premium limit kontrolü

  3. Fonksiyonlar
    - Premium limit kontrolü
    - Otomatik timestamp güncellemeleri
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
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

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own profile"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Groups Table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own groups"
  ON groups
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Medications Table
CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid REFERENCES groups(id) ON DELETE SET NULL,
  name text NOT NULL,
  dose_value numeric,
  dose_unit text DEFAULT 'mg',
  form text DEFAULT 'Tablet',
  schedule jsonb NOT NULL,
  with_food text DEFAULT 'none' CHECK (with_food IN ('before', 'after', 'none')),
  notes text,
  prn boolean DEFAULT false,
  notification_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own medications"
  ON medications
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Intake Logs Table
CREATE TABLE IF NOT EXISTS intake_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  med_id uuid NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  ts timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('taken', 'missed', 'snoozed')),
  actor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE intake_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own intake logs"
  ON intake_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Shares Table
CREATE TABLE IF NOT EXISTS shares (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'caregiver', 'member')),
  scopes jsonb NOT NULL DEFAULT '{"view": true, "notify": false, "edit": false}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(owner_user_id, target_user_id)
);

ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own shares"
  ON shares
  FOR ALL
  TO authenticated
  USING (auth.uid() = owner_user_id OR auth.uid() = target_user_id)
  WITH CHECK (auth.uid() = owner_user_id OR auth.uid() = target_user_id);

-- Function to check medication limit for non-premium users
CREATE OR REPLACE FUNCTION check_medication_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_premium boolean;
  medication_count integer;
BEGIN
  -- Get user's premium status
  SELECT premium_active INTO user_premium
  FROM user_profiles
  WHERE user_id = NEW.user_id;

  -- If user is premium, allow unlimited medications
  IF user_premium = true THEN
    RETURN NEW;
  END IF;

  -- Count existing medications for non-premium user
  SELECT COUNT(*) INTO medication_count
  FROM medications
  WHERE user_id = NEW.user_id;

  -- Check if limit exceeded (3 medications for free users)
  IF medication_count >= 3 THEN
    RAISE EXCEPTION 'Free users can only have up to 3 medications. Upgrade to Premium for unlimited medications.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for medication limit
DROP TRIGGER IF EXISTS medication_limit_trigger ON medications;
CREATE TRIGGER medication_limit_trigger
  BEFORE INSERT ON medications
  FOR EACH ROW
  EXECUTE FUNCTION check_medication_limit();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for medications updated_at
DROP TRIGGER IF EXISTS update_medications_updated_at ON medications;
CREATE TRIGGER update_medications_updated_at
  BEFORE UPDATE ON medications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON medications(user_id);
CREATE INDEX IF NOT EXISTS idx_medications_group_id ON medications(group_id);
CREATE INDEX IF NOT EXISTS idx_intake_logs_user_id ON intake_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_intake_logs_med_id ON intake_logs(med_id);
CREATE INDEX IF NOT EXISTS idx_intake_logs_ts ON intake_logs(ts);
CREATE INDEX IF NOT EXISTS idx_groups_user_id ON groups(user_id);
CREATE INDEX IF NOT EXISTS idx_shares_owner_user_id ON shares(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_shares_target_user_id ON shares(target_user_id);