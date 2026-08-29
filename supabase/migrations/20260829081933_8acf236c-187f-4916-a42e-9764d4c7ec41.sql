-- 1) content status + skill/difficulty linkage
CREATE TYPE public.content_status AS ENUM ('draft', 'published');
CREATE TYPE public.content_source AS ENUM ('manual', 'ai', 'external');

ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS skill_key text REFERENCES public.skills(key),
  ADD COLUMN IF NOT EXISTS level public.difficulty NOT NULL DEFAULT 'easy',
  ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS source public.content_source NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS skill_key text REFERENCES public.skills(key),
  ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS source public.content_source NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS skill_key text REFERENCES public.skills(key),
  ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS source public.content_source NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.quiz_questions
  ADD COLUMN IF NOT EXISTS skill_key text REFERENCES public.skills(key),
  ADD COLUMN IF NOT EXISTS level public.difficulty NOT NULL DEFAULT 'easy',
  ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS source public.content_source NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- backfill skill_key from the parent subject
UPDATE public.resources r SET skill_key = s.skill_key FROM public.subjects s WHERE s.id = r.subject_id AND r.skill_key IS NULL;
UPDATE public.projects p SET skill_key = s.skill_key FROM public.subjects s WHERE s.id = p.subject_id AND p.skill_key IS NULL;
UPDATE public.challenges c SET skill_key = s.skill_key FROM public.subjects s WHERE s.id = c.subject_id AND c.skill_key IS NULL;
UPDATE public.quiz_questions q SET skill_key = s.skill_key FROM public.subjects s WHERE s.id = q.subject_id AND q.skill_key IS NULL;

-- 2) public read policies now only expose published content
DROP POLICY IF EXISTS "resources public read" ON public.resources;
CREATE POLICY "resources published read" ON public.resources FOR SELECT USING (status = 'published');
CREATE POLICY "resources staff read drafts" ON public.resources FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_subject_instructor(auth.uid(), subject_id));

DROP POLICY IF EXISTS "projects public read" ON public.projects;
CREATE POLICY "projects published read" ON public.projects FOR SELECT USING (status = 'published');
CREATE POLICY "projects staff read drafts" ON public.projects FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_subject_instructor(auth.uid(), subject_id));

DROP POLICY IF EXISTS "challenges public read" ON public.challenges;
CREATE POLICY "challenges published read" ON public.challenges FOR SELECT USING (status = 'published');
CREATE POLICY "challenges staff read drafts" ON public.challenges FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_subject_instructor(auth.uid(), subject_id));

DROP POLICY IF EXISTS "quiz public read" ON public.quiz_questions;
CREATE POLICY "quiz published read" ON public.quiz_questions FOR SELECT USING (status = 'published');
CREATE POLICY "quiz staff read drafts" ON public.quiz_questions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_subject_instructor(auth.uid(), subject_id));

-- 3) learning goals
CREATE TABLE public.learning_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_key text NOT NULL REFERENCES public.skills(key),
  start_level integer NOT NULL DEFAULT 0,
  target_level integer NOT NULL DEFAULT 70,
  status text NOT NULL DEFAULT 'active',
  priority integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, skill_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_goals TO authenticated;
GRANT ALL ON public.learning_goals TO service_role;
ALTER TABLE public.learning_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own learning goals" ON public.learning_goals FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins read learning goals" ON public.learning_goals FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER learning_goals_updated_at BEFORE UPDATE ON public.learning_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) personalized learning path steps
CREATE TABLE public.learning_path_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id uuid REFERENCES public.learning_goals(id) ON DELETE CASCADE,
  skill_key text REFERENCES public.skills(key),
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  item_type public.progress_item NOT NULL DEFAULT 'resource',
  item_id uuid,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  body_ar text,
  body_en text,
  level public.difficulty NOT NULL DEFAULT 'easy',
  step_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'todo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_path_items TO authenticated;
GRANT ALL ON public.learning_path_items TO service_role;
ALTER TABLE public.learning_path_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own path items" ON public.learning_path_items FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins read path items" ON public.learning_path_items FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER learning_path_items_updated_at BEFORE UPDATE ON public.learning_path_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) external resources found by instructors (not platform courses until approved)
CREATE TABLE public.external_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
  skill_key text REFERENCES public.skills(key),
  title text NOT NULL,
  url text NOT NULL,
  provider text,
  summary text,
  level public.difficulty NOT NULL DEFAULT 'easy',
  approved boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.external_resources TO authenticated;
GRANT ALL ON public.external_resources TO service_role;
ALTER TABLE public.external_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "external resources staff manage" ON public.external_resources FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_subject_instructor(auth.uid(), subject_id))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_subject_instructor(auth.uid(), subject_id));
CREATE POLICY "external resources approved read" ON public.external_resources FOR SELECT TO authenticated
  USING (approved = true);

-- 6) skill snapshots for initial / current / final comparison
CREATE TABLE public.skill_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phase text NOT NULL DEFAULT 'initial',
  skill_key text NOT NULL REFERENCES public.skills(key),
  level integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skill_snapshots TO authenticated;
GRANT ALL ON public.skill_snapshots TO service_role;
ALTER TABLE public.skill_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own skill snapshots" ON public.skill_snapshots FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins read skill snapshots" ON public.skill_snapshots FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX skill_snapshots_user_phase_idx ON public.skill_snapshots (user_id, phase);