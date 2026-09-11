REVOKE ALL ON FUNCTION public.is_my_student(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_my_student(uuid, uuid) TO authenticated, service_role;