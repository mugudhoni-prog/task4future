ALTER TABLE public.activity_entries
ADD COLUMN details jsonb NOT NULL DEFAULT '{}'::jsonb;