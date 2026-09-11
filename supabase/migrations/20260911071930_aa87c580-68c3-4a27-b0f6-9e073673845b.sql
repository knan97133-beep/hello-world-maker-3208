CREATE TABLE public.submission_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX submission_messages_submission_idx ON public.submission_messages(submission_id, created_at);

GRANT SELECT, INSERT ON public.submission_messages TO authenticated;
GRANT ALL ON public.submission_messages TO service_role;

ALTER TABLE public.submission_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read submission messages"
ON public.submission_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.id = submission_id
      AND (
        s.user_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
        OR (s.subject_id IS NOT NULL AND public.is_subject_instructor(auth.uid(), s.subject_id))
      )
  )
);

CREATE POLICY "Participants can write submission messages"
ON public.submission_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.id = submission_id
      AND (
        s.user_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
        OR (s.subject_id IS NOT NULL AND public.is_subject_instructor(auth.uid(), s.subject_id))
      )
  )
);