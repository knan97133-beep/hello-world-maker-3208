UPDATE public.subjects SET skill_key = CASE
  WHEN code IN ('CS101','CS102','OS301','SE302','CAP501','oop') THEN 'programming'
  WHEN code IN ('DS201','MATH101') THEN 'algorithms'
  WHEN code = 'DB301' THEN 'databases'
  WHEN code = 'WEB201' THEN 'web'
  WHEN code = 'AI401' THEN 'ai'
  WHEN code IN ('NET301','SEC402') THEN 'networks'
  ELSE skill_key END
WHERE skill_key IS NULL;