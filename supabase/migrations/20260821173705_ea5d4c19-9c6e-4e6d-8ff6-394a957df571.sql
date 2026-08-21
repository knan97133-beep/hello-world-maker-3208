-- 1) skills
CREATE TABLE public.skills (
  key text PRIMARY KEY,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.skills TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skills TO authenticated;
GRANT ALL ON public.skills TO service_role;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skills public read" ON public.skills FOR SELECT USING (true);
CREATE POLICY "skills admin write" ON public.skills FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 2) placement questions
CREATE TABLE public.placement_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_key text NOT NULL REFERENCES public.skills(key) ON DELETE CASCADE,
  question_ar text NOT NULL,
  question_en text NOT NULL,
  options_ar text[] NOT NULL,
  options_en text[] NOT NULL,
  correct_index integer NOT NULL,
  level difficulty NOT NULL DEFAULT 'easy',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.placement_questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.placement_questions TO authenticated;
GRANT ALL ON public.placement_questions TO service_role;
ALTER TABLE public.placement_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "placement public read" ON public.placement_questions FOR SELECT USING (true);
CREATE POLICY "placement admin write" ON public.placement_questions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 3) skill profile
CREATE TABLE public.skill_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_key text NOT NULL REFERENCES public.skills(key) ON DELETE CASCADE,
  level integer NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'placement',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, skill_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skill_profile TO authenticated;
GRANT ALL ON public.skill_profile TO service_role;
ALTER TABLE public.skill_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own skill profile" ON public.skill_profile FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins read skill profile" ON public.skill_profile FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE TRIGGER skill_profile_updated_at BEFORE UPDATE ON public.skill_profile
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) recommendations
CREATE TABLE public.recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_key text REFERENCES public.skills(key) ON DELETE SET NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  body_ar text,
  body_en text,
  action_type text NOT NULL DEFAULT 'course',
  priority integer NOT NULL DEFAULT 1,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recommendations TO authenticated;
GRANT ALL ON public.recommendations TO service_role;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own recommendations" ON public.recommendations FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins read recommendations" ON public.recommendations FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE TRIGGER recommendations_updated_at BEFORE UPDATE ON public.recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) link subjects to a primary skill
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS skill_key text REFERENCES public.skills(key) ON DELETE SET NULL;

-- 6) seed skills
INSERT INTO public.skills (key, name_ar, name_en, icon, sort_order) VALUES
  ('programming', 'البرمجة', 'Programming', 'Code', 1),
  ('algorithms', 'الخوارزميات', 'Algorithms', 'Binary', 2),
  ('databases', 'قواعد البيانات', 'Databases', 'Database', 3),
  ('web', 'تطوير الويب', 'Web Development', 'Globe', 4),
  ('ai', 'الذكاء الاصطناعي', 'AI', 'Sparkles', 5),
  ('networks', 'الشبكات', 'Networks', 'Network', 6)
ON CONFLICT (key) DO NOTHING;

-- 7) seed placement questions (3 per skill)
INSERT INTO public.placement_questions (skill_key, question_ar, question_en, options_ar, options_en, correct_index, level, sort_order) VALUES
('programming','ما هي نتيجة التعبير 7 % 3 في معظم لغات البرمجة؟','What is the result of 7 % 3 in most programming languages?', ARRAY['1','2','3','0'], ARRAY['1','2','3','0'], 0,'easy',1),
('programming','أي مما يلي يمثل بنية تكرار؟','Which of the following is a loop structure?', ARRAY['if','for','switch','return'], ARRAY['if','for','switch','return'], 1,'easy',2),
('programming','ما الفرق بين المتغير المحلي والعام؟','What defines a local variable?', ARRAY['متاح في كل البرنامج','متاح داخل نطاقه فقط','ثابت لا يتغير','يخزن في قاعدة البيانات'], ARRAY['Available everywhere','Available only within its scope','Constant value','Stored in a database'], 1,'medium',3),
('algorithms','ما تعقيد البحث الثنائي Binary Search؟','What is the time complexity of Binary Search?', ARRAY['O(n)','O(log n)','O(n^2)','O(1)'], ARRAY['O(n)','O(log n)','O(n^2)','O(1)'], 1,'medium',1),
('algorithms','أي خوارزمية ترتيب لها تعقيد O(n log n) في الحالة المتوسطة؟','Which sorting algorithm averages O(n log n)?', ARRAY['Bubble Sort','Merge Sort','Selection Sort','Insertion Sort'], ARRAY['Bubble Sort','Merge Sort','Selection Sort','Insertion Sort'], 1,'medium',2),
('algorithms','ما بنية المعطيات التي تعمل بمبدأ LIFO؟','Which data structure follows LIFO?', ARRAY['Queue','Stack','Tree','Graph'], ARRAY['Queue','Stack','Tree','Graph'], 1,'easy',3),
('databases','ما الغرض من المفتاح الأساسي Primary Key؟','What is the purpose of a Primary Key?', ARRAY['تسريع الشبكة','تعريف السجل بشكل فريد','تشفير البيانات','تنسيق العرض'], ARRAY['Speed up the network','Uniquely identify a row','Encrypt data','Format output'], 1,'easy',1),
('databases','أي أمر SQL يُستخدم لاسترجاع البيانات؟','Which SQL statement retrieves data?', ARRAY['INSERT','SELECT','UPDATE','DROP'], ARRAY['INSERT','SELECT','UPDATE','DROP'], 1,'easy',2),
('databases','ما وظيفة JOIN؟','What does a JOIN do?', ARRAY['حذف جدول','دمج صفوف من جدولين وفق شرط','إنشاء فهرس','نسخ احتياطي'], ARRAY['Delete a table','Combine rows from two tables on a condition','Create an index','Back up data'], 1,'medium',3),
('web','ما الوسم المستخدم لإنشاء رابط في HTML؟','Which HTML tag creates a link?', ARRAY['<link>','<a>','<href>','<url>'], ARRAY['<link>','<a>','<href>','<url>'], 1,'easy',1),
('web','ما الخاصية التي تغيّر لون النص في CSS؟','Which CSS property changes text color?', ARRAY['background','color','font-size','border'], ARRAY['background','color','font-size','border'], 1,'easy',2),
('web','ما وظيفة fetch في JavaScript؟','What does fetch() do in JavaScript?', ARRAY['تنسيق الصفحة','إرسال طلب شبكة','إنشاء متغير','ترتيب مصفوفة'], ARRAY['Style the page','Make a network request','Create a variable','Sort an array'], 1,'medium',3),
('ai','ما المقصود بالتعلم المُوجّه Supervised Learning؟','What is Supervised Learning?', ARRAY['تعلم من بيانات مُعنونة','تعلم بدون بيانات','تعلم بالمكافأة فقط','ترتيب البيانات'], ARRAY['Learning from labeled data','Learning with no data','Reward-only learning','Sorting data'], 0,'medium',1),
('ai','أي مما يلي مكتبة تعلم آلي؟','Which of these is a machine learning library?', ARRAY['React','TensorFlow','Bootstrap','Nginx'], ARRAY['React','TensorFlow','Bootstrap','Nginx'], 1,'easy',2),
('ai','ما المقصود بالـ Overfitting؟','What is Overfitting?', ARRAY['النموذج يحفظ بيانات التدريب ويفشل بالتعميم','النموذج بسيط جداً','نقص البيانات','خطأ في الشبكة'], ARRAY['Model memorizes training data and fails to generalize','Model is too simple','Lack of data','Network error'], 0,'hard',3),
('networks','ما المنفذ الافتراضي لبروتوكول HTTP؟','What is the default HTTP port?', ARRAY['21','80','443','22'], ARRAY['21','80','443','22'], 1,'easy',1),
('networks','ما وظيفة DNS؟','What does DNS do?', ARRAY['تشفير البيانات','تحويل أسماء النطاقات إلى عناوين IP','توجيه الطاقة','ضغط الملفات'], ARRAY['Encrypt data','Translate domain names to IP addresses','Route power','Compress files'], 1,'easy',2),
('networks','أي طبقة في نموذج OSI مسؤولة عن التوجيه Routing؟','Which OSI layer handles routing?', ARRAY['Physical','Data Link','Network','Application'], ARRAY['Physical','Data Link','Network','Application'], 2,'medium',3);