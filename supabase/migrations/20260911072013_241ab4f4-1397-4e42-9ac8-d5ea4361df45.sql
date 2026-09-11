CREATE OR REPLACE FUNCTION public.is_my_student(_instructor uuid, _student uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.submissions s
    JOIN public.subject_instructors si ON si.subject_id = s.subject_id
    WHERE s.user_id = _student AND si.user_id = _instructor
  );
$$;

CREATE POLICY "instructors read their students skill profile"
ON public.skill_profile FOR SELECT TO authenticated
USING (public.is_my_student(auth.uid(), user_id));

CREATE POLICY "instructors read their students goals"
ON public.learning_goals FOR SELECT TO authenticated
USING (public.is_my_student(auth.uid(), user_id));

CREATE POLICY "instructors read their students path"
ON public.learning_path_items FOR SELECT TO authenticated
USING (public.is_my_student(auth.uid(), user_id));

CREATE POLICY "instructors read their students profile"
ON public.profiles FOR SELECT TO authenticated
USING (public.is_my_student(auth.uid(), id));