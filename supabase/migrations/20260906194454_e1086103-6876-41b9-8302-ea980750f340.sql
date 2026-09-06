CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  skill_key text REFERENCES public.skills(key) ON DELETE SET NULL,
  item_type public.progress_item NOT NULL DEFAULT 'project',
  item_id uuid,
  title text NOT NULL DEFAULT '',
  content text,
  url text,
  status text NOT NULL DEFAULT 'pending',
  grade integer,
  feedback text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read own submissions"
ON public.submissions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Students create own submissions"
ON public.submissions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students edit own pending submissions"
ON public.submissions FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Students delete own pending submissions"
ON public.submissions FOR DELETE TO authenticated
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Reviewers read subject submissions"
ON public.submissions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR (subject_id IS NOT NULL AND public.is_subject_instructor(auth.uid(), subject_id)));

CREATE POLICY "Reviewers grade subject submissions"
ON public.submissions FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR (subject_id IS NOT NULL AND public.is_subject_instructor(auth.uid(), subject_id)))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR (subject_id IS NOT NULL AND public.is_subject_instructor(auth.uid(), subject_id)));

CREATE TRIGGER submissions_updated_at
BEFORE UPDATE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX submissions_user_idx ON public.submissions(user_id);
CREATE INDEX submissions_subject_idx ON public.submissions(subject_id);
CREATE INDEX submissions_status_idx ON public.submissions(status);