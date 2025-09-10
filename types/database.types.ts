export interface UserProfile {
  id: string;
  full_name: string;
  birth_date: string;
  phone: string;
  address?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicationGroup {
  id: string;
  created_by: string;
  name: string;
  created_at: string;
}

export interface MedicationSchedule {
  mode: 'times' | 'interval';
  times?: string[]; // HH:mm format
  everyHours?: number;
  daysOfWeek: number[]; // 1=Monday, 2=Tuesday, etc.
  startDate: string;
  endDate?: string;
  timezone: string;
}

export interface Medication {
  id: string;
  created_by: string;
  group_id?: string;
  name: string;
  dose_value?: number;
  dose_unit?: string;
  form?: string;
  schedule: MedicationSchedule;
  with_food: 'before' | 'after' | 'none';
  notes?: string;
  prn: boolean;
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface IntakeLog {
  id: string;
  user_id: string;
  med_id: string;
  ts: string;
  status: 'taken' | 'missed' | 'snoozed';
  actor_user_id: string;
  created_at: string;
}

export interface Share {
  id: string;
  owner_id: string;
  shared_with_id: string;
  role: 'owner' | 'caregiver' | 'member';
  scopes: {
    view: boolean;
    notify: boolean;
    edit: boolean;
  };
  status: 'pending' | 'accepted' | 'revoked';
  created_at: string;
}