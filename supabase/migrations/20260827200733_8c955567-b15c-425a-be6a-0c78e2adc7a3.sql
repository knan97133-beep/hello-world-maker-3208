CREATE TABLE public.subject_instructors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subject_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subject_instructors TO authenticated;
GRANT ALL ON public.subject_instructors TO service_role;

ALTER TABLE public.subject_instructors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage subject instructors" ON public.subject_instructors
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "instructors read own assignments" ON public.subject_instructors
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_subject_instructor(_user_id uuid, _subject_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subject_instructors
    WHERE user_id = _user_id AND subject_id = _subject_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_subject_instructor(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_subject_instructor(uuid, uuid) TO authenticated, service_role;

CREATE POLICY "instructors write own resources" ON public.resources
FOR ALL TO authenticated
USING (public.is_subject_instructor(auth.uid(), subject_id))
WITH CHECK (public.is_subject_instructor(auth.uid(), subject_id));

CREATE POLICY "instructors write own projects" ON public.projects
FOR ALL TO authenticated
USING (public.is_subject_instructor(auth.uid(), subject_id))
WITH CHECK (public.is_subject_instructor(auth.uid(), subject_id));

CREATE POLICY "instructors write own challenges" ON public.challenges
FOR ALL TO authenticated
USING (public.is_subject_instructor(auth.uid(), subject_id))
WITH CHECK (public.is_subject_instructor(auth.uid(), subject_id));

CREATE POLICY "instructors write own quiz questions" ON public.quiz_questions
FOR ALL TO authenticated
USING (public.is_subject_instructor(auth.uid(), subject_id))
WITH CHECK (public.is_subject_instructor(auth.uid(), subject_id));

CREATE POLICY "instructors update own subjects" ON public.subjects
FOR UPDATE TO authenticated
USING (public.is_subject_instructor(auth.uid(), id))
WITH CHECK (public.is_subject_instructor(auth.uid(), id));