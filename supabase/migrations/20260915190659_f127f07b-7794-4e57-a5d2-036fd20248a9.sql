CREATE POLICY "instructors insert student path steps"
ON public.learning_path_items FOR INSERT TO authenticated
WITH CHECK (public.is_my_student(auth.uid(), user_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "instructors update student path steps"
ON public.learning_path_items FOR UPDATE TO authenticated
USING (public.is_my_student(auth.uid(), user_id) OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.is_my_student(auth.uid(), user_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "instructors delete student path steps"
ON public.learning_path_items FOR DELETE TO authenticated
USING (public.is_my_student(auth.uid(), user_id) OR public.has_role(auth.uid(), 'admin'));