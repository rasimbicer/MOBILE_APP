/*
  # Create intake logs table

  1. New Tables
    - `intake_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `med_id` (uuid, references medications)
      - `ts` (timestamptz, required - when medication should be/was taken)
      - `status` (text, enum: taken/missed/snoozed)
      - `actor_user_id` (uuid, references auth.users - who performed the action)
      - `created_at` (timestamptz, default now)

  2. Security
    - Enable RLS on `intake_logs` table
    - Add policies for users to manage their own logs
    - Add policies for shared access via family sharing
*/

CREATE TABLE IF NOT EXISTS public.intake_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  med_id uuid NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  ts timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('taken','missed','snoozed')),
  actor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.intake_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own intake logs"
  ON public.intake_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Shared intake logs view access"
  ON public.intake_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS(
      SELECT 1 FROM public.shares s
      WHERE s.owner_user_id = intake_logs.user_id
        AND s.target_user_id = auth.uid()
        AND s.status = 'accepted'
        AND (s.scopes->>'view')::boolean = true
    )
  );