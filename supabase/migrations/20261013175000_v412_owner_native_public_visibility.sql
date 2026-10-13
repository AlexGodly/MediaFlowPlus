-- MediaFlow Plus only: opt-in visibility for owner-native Community views.
-- The canonical media remains mediaflow_states. These are permission flags only.
ALTER TABLE public.mfp_profiles ADD COLUMN IF NOT EXISTS show_library boolean NOT NULL DEFAULT false;
ALTER TABLE public.mfp_profiles ADD COLUMN IF NOT EXISTS show_history boolean NOT NULL DEFAULT false;
ALTER TABLE public.mfp_profiles ADD COLUMN IF NOT EXISTS show_personal_order boolean NOT NULL DEFAULT false;
ALTER TABLE public.mfp_profiles ADD COLUMN IF NOT EXISTS show_old_system boolean NOT NULL DEFAULT false;
ALTER TABLE public.mfp_profiles ADD COLUMN IF NOT EXISTS show_statistics boolean NOT NULL DEFAULT false;
ALTER TABLE public.mfp_profiles ADD COLUMN IF NOT EXISTS show_ratings boolean NOT NULL DEFAULT false;
ALTER TABLE public.mfp_profiles ADD COLUMN IF NOT EXISTS show_levels boolean NOT NULL DEFAULT false;
-- No duplicate public media schema created. Existing state_data RLS untouched.
