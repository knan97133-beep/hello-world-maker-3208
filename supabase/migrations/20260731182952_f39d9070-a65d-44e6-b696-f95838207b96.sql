-- ===== Enums =====
CREATE TYPE public.app_role AS ENUM ('admin','student');
CREATE TYPE public.resource_kind AS ENUM ('course','video','book','article');
CREATE TYPE public.difficulty AS ENUM ('easy','medium','hard');
CREATE TYPE public.progress_item AS ENUM ('resource','project','challenge','quiz');

-- ===== updated_at helper =====
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ===== profiles =====
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  university text,
  avatar_url text,
  current_year int CHECK (current_year BETWEEN 1 AND 5),
  current_semester int CHECK (current_semester IN (1,2)),
  bio text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== user_roles =====
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- new user -> profile + student role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== subjects =====
CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  description_ar text,
  description_en text,
  year int NOT NULL CHECK (year BETWEEN 1 AND 5),
  semester int NOT NULL CHECK (semester IN (1,2)),
  skills text[] NOT NULL DEFAULT '{}',
  icon text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subjects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subjects public read" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "subjects admin write" ON public.subjects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== resources =====
CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  kind public.resource_kind NOT NULL DEFAULT 'course',
  title_ar text NOT NULL,
  title_en text NOT NULL,
  provider text,
  url text,
  duration_hours numeric,
  is_free boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.resources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resources public read" ON public.resources FOR SELECT USING (true);
CREATE POLICY "resources admin write" ON public.resources FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ===== projects =====
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  description_ar text,
  description_en text,
  level public.difficulty NOT NULL DEFAULT 'easy',
  points int NOT NULL DEFAULT 10,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects public read" ON public.projects FOR SELECT USING (true);
CREATE POLICY "projects admin write" ON public.projects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ===== challenges =====
CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  prompt_ar text,
  prompt_en text,
  level public.difficulty NOT NULL DEFAULT 'easy',
  points int NOT NULL DEFAULT 5,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.challenges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenges TO authenticated;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "challenges public read" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "challenges admin write" ON public.challenges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ===== quiz questions =====
CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  question_ar text NOT NULL,
  question_en text NOT NULL,
  options_ar text[] NOT NULL,
  options_en text[] NOT NULL,
  correct_index int NOT NULL,
  explanation_ar text,
  explanation_en text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quiz_questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz public read" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "quiz admin write" ON public.quiz_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ===== student progress =====
CREATE TABLE public.progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  item_type public.progress_item NOT NULL,
  item_id uuid,
  completed boolean NOT NULL DEFAULT true,
  score int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_type, item_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.progress TO authenticated;
GRANT ALL ON public.progress TO service_role;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own progress" ON public.progress FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER progress_updated_at BEFORE UPDATE ON public.progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== seed subjects =====
INSERT INTO public.subjects (code,name_ar,name_en,description_ar,description_en,year,semester,skills,icon,sort_order) VALUES
('CS101','مقدمة في البرمجة','Introduction to Programming','أساسيات البرمجة والخوارزميات باستخدام لغة C.','Programming fundamentals and algorithms with C.',1,1,ARRAY['C','Algorithms','Problem Solving'],'Code',1),
('MATH101','رياضيات متقطعة','Discrete Mathematics','المنطق والمجموعات والعلاقات ونظرية الرسوم.','Logic, sets, relations and graph theory.',1,1,ARRAY['Logic','Sets','Graphs'],'Sigma',2),
('CS102','البرمجة الكينونية','Object Oriented Programming','مبادئ OOP باستخدام Java وتصميم الأصناف.','OOP principles with Java and class design.',1,2,ARRAY['Java','OOP','UML'],'Boxes',3),
('WEB201','تطوير الويب','Web Development','HTML و CSS و JavaScript وبناء واجهات متجاوبة.','HTML, CSS, JavaScript and responsive interfaces.',2,1,ARRAY['HTML','CSS','JavaScript'],'Globe',4),
('DS201','هياكل المعطيات','Data Structures','القوائم والأشجار والأكوام والجداول الهاشية.','Lists, trees, heaps and hash tables.',2,1,ARRAY['Data Structures','Complexity','C++'],'Network',5),
('DB301','قواعد البيانات','Databases','النمذجة العلائقية و SQL والتطبيع.','Relational modeling, SQL and normalization.',2,2,ARRAY['SQL','ERD','Normalization'],'Database',6),
('OS301','نظم التشغيل','Operating Systems','العمليات والخيوط والذاكرة وأنظمة الملفات.','Processes, threads, memory and file systems.',3,1,ARRAY['Linux','Concurrency','Memory'],'Cpu',7),
('NET301','شبكات الحاسوب','Computer Networks','نموذج OSI وبروتوكولات TCP/IP والتوجيه.','OSI model, TCP/IP protocols and routing.',3,1,ARRAY['TCP/IP','Routing','HTTP'],'Router',8),
('SE302','هندسة البرمجيات','Software Engineering','دورة حياة البرمجيات و Agile والاختبار.','Software lifecycle, Agile and testing.',3,2,ARRAY['Agile','Testing','Git'],'Layers',9),
('AI401','الذكاء الاصطناعي','Artificial Intelligence','البحث والتعلم الآلي والشبكات العصبية.','Search, machine learning and neural networks.',4,1,ARRAY['Python','ML','Neural Networks'],'Brain',10),
('SEC402','أمن المعلومات','Information Security','التشفير وثغرات الويب واختبار الاختراق.','Cryptography, web vulnerabilities and pentesting.',4,2,ARRAY['Cryptography','OWASP','Pentesting'],'ShieldCheck',11),
('CAP501','مشروع التخرج','Graduation Project','تخطيط وتنفيذ وتوثيق مشروع برمجي كامل.','Plan, build and document a complete software project.',5,1,ARRAY['Project Management','Documentation','Full Stack'],'GraduationCap',12);

-- seed a few resources / projects / challenges / quiz for the first subject
INSERT INTO public.resources (subject_id,kind,title_ar,title_en,provider,url,duration_hours,sort_order)
SELECT id,'course','أساسيات البرمجة بلغة C','C Programming Fundamentals','freeCodeCamp','https://www.freecodecamp.org/',12,1 FROM public.subjects WHERE code='CS101';
INSERT INTO public.resources (subject_id,kind,title_ar,title_en,provider,url,duration_hours,sort_order)
SELECT id,'video','دورة C كاملة','Full C Course','YouTube','https://www.youtube.com/watch?v=KJgsSFOSQv0',4,2 FROM public.subjects WHERE code='CS101';
INSERT INTO public.resources (subject_id,kind,title_ar,title_en,provider,url,sort_order)
SELECT id,'book','لغة البرمجة C','The C Programming Language','K&R','https://en.wikipedia.org/wiki/The_C_Programming_Language',3 FROM public.subjects WHERE code='CS101';

INSERT INTO public.projects (subject_id,title_ar,title_en,description_ar,description_en,level,points,sort_order)
SELECT id,'آلة حاسبة طرفية','Terminal Calculator','بناء آلة حاسبة تدعم العمليات الأساسية.','Build a calculator supporting basic operations.','easy',10,1 FROM public.subjects WHERE code='CS101';
INSERT INTO public.projects (subject_id,title_ar,title_en,description_ar,description_en,level,points,sort_order)
SELECT id,'نظام إدارة طلاب','Student Management System','برنامج لإدارة سجلات الطلاب باستخدام الملفات.','A file-based student records manager.','medium',20,2 FROM public.subjects WHERE code='CS101';

INSERT INTO public.challenges (subject_id,title_ar,title_en,prompt_ar,prompt_en,level,points,sort_order)
SELECT id,'عكس سلسلة نصية','Reverse a String','اكتب دالة تعكس سلسلة نصية دون استخدام مكتبات جاهزة.','Write a function that reverses a string without libraries.','easy',5,1 FROM public.subjects WHERE code='CS101';
INSERT INTO public.challenges (subject_id,title_ar,title_en,prompt_ar,prompt_en,level,points,sort_order)
SELECT id,'الأعداد الأولية','Prime Numbers','اطبع كل الأعداد الأولية حتى N بكفاءة.','Print all primes up to N efficiently.','medium',10,2 FROM public.subjects WHERE code='CS101';

INSERT INTO public.quiz_questions (subject_id,question_ar,question_en,options_ar,options_en,correct_index,explanation_ar,explanation_en,sort_order)
SELECT id,'ما هو ناتج sizeof(int) على معظم الأنظمة 64-bit؟','What is sizeof(int) on most 64-bit systems?',
 ARRAY['2 بايت','4 بايت','8 بايت','يعتمد على المترجم فقط'],ARRAY['2 bytes','4 bytes','8 bytes','Compiler only'],1,
 'حجم int عادة 4 بايت.','int is typically 4 bytes.',1 FROM public.subjects WHERE code='CS101';
INSERT INTO public.quiz_questions (subject_id,question_ar,question_en,options_ar,options_en,correct_index,explanation_ar,explanation_en,sort_order)
SELECT id,'أي رمز يستخدم للتعليق في لغة C؟','Which symbol starts a comment in C?',
 ARRAY['#','//','<!--','**'],ARRAY['#','//','<!--','**'],1,'التعليق السطري يبدأ بـ //','Line comments start with //',2 FROM public.subjects WHERE code='CS101';