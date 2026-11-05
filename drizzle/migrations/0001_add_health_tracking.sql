CREATE TABLE public.weight_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date_iso date NOT NULL,
  weight_kg numeric NOT NULL,
  waist_cm numeric,
  chest_cm numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX weight_entries_user_date_idx ON public.weight_entries (user_id, date_iso);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weight_entries TO authenticated;
GRANT ALL ON public.weight_entries TO service_role;
ALTER TABLE public.weight_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY weight_select_own ON public.weight_entries FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY weight_insert_own ON public.weight_entries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY weight_update_own ON public.weight_entries FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY weight_delete_own ON public.weight_entries FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.water_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date_iso date NOT NULL,
  ml integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date_iso)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.water_entries TO authenticated;
GRANT ALL ON public.water_entries TO service_role;
ALTER TABLE public.water_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY water_select_own ON public.water_entries FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY water_insert_own ON public.water_entries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY water_update_own ON public.water_entries FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY water_delete_own ON public.water_entries FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.sleep_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date_iso date NOT NULL,
  hours numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date_iso)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sleep_entries TO authenticated;
GRANT ALL ON public.sleep_entries TO service_role;
ALTER TABLE public.sleep_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY sleep_select_own ON public.sleep_entries FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY sleep_insert_own ON public.sleep_entries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY sleep_update_own ON public.sleep_entries FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY sleep_delete_own ON public.sleep_entries FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.mood_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date_iso date NOT NULL,
  mood integer NOT NULL CHECK (mood >= 1 AND mood <= 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date_iso)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mood_entries TO authenticated;
GRANT ALL ON public.mood_entries TO service_role;
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY mood_select_own ON public.mood_entries FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY mood_insert_own ON public.mood_entries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY mood_update_own ON public.mood_entries FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY mood_delete_own ON public.mood_entries FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.rest_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date_iso date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date_iso)
);
GRANT SELECT, INSERT, DELETE ON public.rest_days TO authenticated;
GRANT ALL ON public.rest_days TO service_role;
ALTER TABLE public.rest_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY rest_select_own ON public.rest_days FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY rest_insert_own ON public.rest_days FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY rest_delete_own ON public.rest_days FOR DELETE TO authenticated USING (user_id = auth.uid());

ALTER TABLE public.food_entries ADD COLUMN meal text NOT NULL DEFAULT 'other';
ALTER TABLE public.profiles ADD COLUMN favorites jsonb NOT NULL DEFAULT '[]'::jsonb;