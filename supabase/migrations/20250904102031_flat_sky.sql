/*
  # Create user profiles table

  1. New Tables
    - `user_profiles`
      - `user_id` (uuid, primary key, references auth.users)
      - `full_name` (text, required)
      - `dob` (date, required)
      - `phone` (text, required)
      - `consent_at` (timestamptz, default now)
      - `locale` (text, default 'tr')
      - `premium_active` (boolean, default false)
      - `created_at` (timestamptz, default now)

  2. Security
    - Enable RLS on `user_profiles` table
    - Add policy for users to manage their own profile
*/

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

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own profile"
  ON public.user_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);