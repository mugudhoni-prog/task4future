-- Profiles: one row per account, holds name/age/gender and nutrition goal
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  age int NOT NULL DEFAULT 0,
  gender text NOT NULL DEFAULT 'male',
  height_cm numeric NOT NULL DEFAULT 175,
  current_kg numeric NOT NULL DEFAULT 65,
  target_kg numeric NOT NULL DEFAULT 72,
  goal_type text NOT NULL DEFAULT 'gain',
  activity_level numeric NOT NULL DEFAULT 1.55,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Tasks with punch history and weekday schedule
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  emoji text,
  history jsonb NOT NULL DEFAULT '{}'::jsonb,
  days int[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_select_own" ON public.tasks FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "tasks_insert_own" ON public.tasks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "tasks_update_own" ON public.tasks FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "tasks_delete_own" ON public.tasks FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX tasks_user_id_idx ON public.tasks (user_id);

-- Food log entries
CREATE TABLE public.food_entries (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  date_iso date NOT NULL,
  name text NOT NULL,
  emoji text,
  grams numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'g',
  macros jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_entries TO authenticated;
GRANT ALL ON public.food_entries TO service_role;
ALTER TABLE public.food_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "food_select_own" ON public.food_entries FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "food_insert_own" ON public.food_entries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "food_delete_own" ON public.food_entries FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX food_entries_user_id_idx ON public.food_entries (user_id);

-- Activity log entries
CREATE TABLE public.activity_entries (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  date_iso date NOT NULL,
  activity_name text NOT NULL,
  emoji text,
  minutes int NOT NULL DEFAULT 0,
  calories_burned int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_entries TO authenticated;
GRANT ALL ON public.activity_entries TO service_role;
ALTER TABLE public.activity_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_select_own" ON public.activity_entries FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "activity_insert_own" ON public.activity_entries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "activity_delete_own" ON public.activity_entries FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX activity_entries_user_id_idx ON public.activity_entries (user_id);

-- Auto-create a profile row when a new account signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
