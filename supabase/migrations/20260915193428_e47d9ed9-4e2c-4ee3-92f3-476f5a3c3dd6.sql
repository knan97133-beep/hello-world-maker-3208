INSERT INTO public.subject_instructors (subject_id, user_id)
SELECT s.id, ur.user_id
FROM public.subjects s
CROSS JOIN (SELECT user_id FROM public.user_roles WHERE role = 'instructor') ur
WHERE NOT EXISTS (
  SELECT 1 FROM public.subject_instructors si
  WHERE si.subject_id = s.id AND si.user_id = ur.user_id
);