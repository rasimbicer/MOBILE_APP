/*
  # Create family sharing system

  1. New Tables
    - `shares`
      - `id` (uuid, primary key)
      - `owner_user_id` (uuid, references auth.users)
      - `target_user_id` (uuid, references auth.users)
      - `role` (text, enum: owner/caregiver/member)
      - `scopes` (jsonb, permissions: view/notify/edit)
      - `status` (text, enum: pending/accepted/revoked)
      - `created_at` (timestamptz, default now)

  2. Security
    - Enable RLS on `shares` table
    - Add policies for users to manage their own shares
*/

CREATE TABLE IF NOT EXISTS public.shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','caregiver','member')),
  scopes jsonb NOT NULL DEFAULT '{"view":true,"notify":true,"edit":false}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_user_id, target_user_id)
);

ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage shares they own"
  ON public.shares
  FOR ALL
  TO authenticated
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can view shares targeting them"
  ON public.shares
  FOR SELECT
  TO authenticated
  USING (auth.uid() = target_user_id);

CREATE POLICY "Users can update shares targeting them"
  ON public.shares
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = target_user_id)
  WITH CHECK (auth.uid() = target_user_id);