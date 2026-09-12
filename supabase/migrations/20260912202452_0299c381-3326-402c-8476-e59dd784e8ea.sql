
CREATE TABLE public.path_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_key text NOT NULL REFERENCES public.skills(key),
  level difficulty NOT NULL DEFAULT 'easy',
  title_ar text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  published boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.path_templates TO authenticated;
GRANT ALL ON public.path_templates TO service_role;
ALTER TABLE public.path_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read published or own templates" ON public.path_templates
  FOR SELECT TO authenticated
  USING (published OR created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "instructors create templates" ON public.path_templates
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND (public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "owners update templates" ON public.path_templates
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "owners delete templates" ON public.path_templates
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER path_templates_updated_at BEFORE UPDATE ON public.path_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.path_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.path_templates(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id),
  item_type progress_item NOT NULL,
  item_id uuid,
  title_ar text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  body_ar text,
  body_en text,
  level difficulty NOT NULL DEFAULT 'easy',
  step_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.path_template_items TO authenticated;
GRANT ALL ON public.path_template_items TO service_role;
ALTER TABLE public.path_template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read template items" ON public.path_template_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.path_templates t WHERE t.id = template_id
    AND (t.published OR t.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "owners write template items" ON public.path_template_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.path_templates t WHERE t.id = template_id
    AND (t.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.path_templates t WHERE t.id = template_id
    AND (t.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))));


CREATE TABLE public.path_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path_item_id uuid REFERENCES public.learning_path_items(id) ON DELETE CASCADE,
  skill_key text REFERENCES public.skills(key),
  percent integer NOT NULL DEFAULT 0,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.path_updates TO authenticated;
GRANT ALL ON public.path_updates TO service_role;
ALTER TABLE public.path_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read own or my students updates" ON public.path_updates
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR author_id = auth.uid()
    OR public.is_my_student(auth.uid(), user_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "write updates" ON public.path_updates
  FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND (user_id = auth.uid()
    OR public.is_my_student(auth.uid(), user_id) OR public.has_role(auth.uid(), 'admin')));

CREATE INDEX path_updates_user_idx ON public.path_updates(user_id, created_at DESC);


ALTER TABLE public.learning_path_items
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS progress_note text,
  ADD COLUMN IF NOT EXISTS progress_percent integer NOT NULL DEFAULT 0;
