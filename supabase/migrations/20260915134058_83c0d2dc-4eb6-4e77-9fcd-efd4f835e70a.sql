-- ============ محتوى عملي: برمجة (CS101 سنة أولى فصل أول) ============
INSERT INTO resources (subject_id, skill_key, kind, level, title_ar, title_en, url, provider, is_free, duration_hours, status, source, sort_order)
SELECT id,'programming','course','easy','أساسيات بايثون بالتطبيق العملي','Python Basics by Practice','https://www.programiz.com/python-programming','Programiz',true,20,'published','manual',1 FROM subjects WHERE code='CS101';
INSERT INTO resources (subject_id, skill_key, kind, level, title_ar, title_en, url, provider, is_free, duration_hours, status, source, sort_order)
SELECT id,'programming','video','easy','سلسلة تمارين بايثون للمبتدئين','Python Exercises for Beginners','https://www.w3schools.com/python/python_exercises.asp','W3Schools',true,6,'published','manual',2 FROM subjects WHERE code='CS101';
INSERT INTO resources (subject_id, skill_key, kind, level, title_ar, title_en, url, provider, is_free, duration_hours, status, source, sort_order)
SELECT id,'programming','book','easy','كتاب Automate the Boring Stuff (فصول عملية)','Automate the Boring Stuff with Python','https://automatetheboringstuff.com/','No Starch Press',true,30,'published','manual',3 FROM subjects WHERE code='CS101';

INSERT INTO projects (subject_id, skill_key, level, title_ar, title_en, description_ar, description_en, points, status, source, sort_order)
SELECT id,'programming','easy','مشروع: آلة حاسبة بالطرفية','Project: CLI Calculator','ابنِ آلة حاسبة تعمل من سطر الأوامر: جمع وطرح وضرب وقسمة مع معالجة القسمة على صفر وإدخال خاطئ. سلّم رابط الكود أو ملف المشروع.','Build a command-line calculator: add, subtract, multiply, divide, with divide-by-zero and bad-input handling. Submit a code link or project file.',100,'published','manual',1 FROM subjects WHERE code='CS101';
INSERT INTO projects (subject_id, skill_key, level, title_ar, title_en, description_ar, description_en, points, status, source, sort_order)
SELECT id,'programming','easy','مشروع: لعبة تخمين الرقم','Project: Number Guessing Game','برنامج يختار رقماً عشوائياً من 1 إلى 100 وعلى اللاعب تخمينه مع تلميحات «أكبر/أصغر» وعدّ المحاولات.','A program picks a random number 1-100; the player guesses with higher/lower hints and an attempt counter.',100,'published','manual',2 FROM subjects WHERE code='CS101';

INSERT INTO challenges (subject_id, skill_key, level, title_ar, title_en, prompt_ar, prompt_en, points, status, source, sort_order)
SELECT id,'programming','easy','تحدي: FizzBuzz','Challenge: FizzBuzz','اطبع الأرقام من 1 إلى 100، لكن استبدل مضاعفات 3 بكلمة Fizz ومضاعفات 5 بـ Buzz ومضاعفات الاثنين بـ FizzBuzz.','Print 1-100, replacing multiples of 3 with Fizz, 5 with Buzz, and both with FizzBuzz.',50,'published','manual',1 FROM subjects WHERE code='CS101';
INSERT INTO challenges (subject_id, skill_key, level, title_ar, title_en, prompt_ar, prompt_en, points, status, source, sort_order)
SELECT id,'programming','easy','تحدي: قلب النص','Challenge: String Reversal','اكتب دالة تعكس نصاً يدخله المستخدم دون استخدام دوال جاهزة للعكس، واختبرها على 3 حالات.','Write a function that reverses user input without built-in reverse helpers; test 3 cases.',50,'published','manual',2 FROM subjects WHERE code='CS101';

INSERT INTO quiz_questions (subject_id, skill_key, level, question_ar, question_en, options_ar, options_en, correct_index, explanation_ar, explanation_en, status, source, sort_order)
SELECT id,'programming','easy','أي نوع بيانات يخزّن القيمة 3.14 في بايثون؟','Which type stores 3.14 in Python?',ARRAY['int','float','str','bool'],ARRAY['int','float','str','bool'],1,'الأرقام العشرية نوعها float.','Decimal numbers are floats.','published','manual',1 FROM subjects WHERE code='CS101';
INSERT INTO quiz_questions (subject_id, skill_key, level, question_ar, question_en, options_ar, options_en, correct_index, explanation_ar, explanation_en, status, source, sort_order)
SELECT id,'programming','easy','ماذا تطبع print(len("InfoPath"))؟','What does print(len("InfoPath")) output?',ARRAY['7','8','9','خطأ'],ARRAY['7','8','9','Error'],1,'الكلمة مكوّنة من 8 أحرف.','The word has 8 characters.','published','manual',2 FROM subjects WHERE code='CS101';
INSERT INTO quiz_questions (subject_id, skill_key, level, question_ar, question_en, options_ar, options_en, correct_index, explanation_ar, explanation_en, status, source, sort_order)
SELECT id,'programming','easy','أي حلقة تنفّذ الكتلة عدداً معلوماً من المرات؟','Which loop runs a known number of times?',ARRAY['while','for','if','try'],ARRAY['while','for','if','try'],1,'حلقة for مع range تتكرر عدداً محدداً.','A for loop with range repeats a fixed count.','published','manual',3 FROM subjects WHERE code='CS101';
INSERT INTO quiz_questions (subject_id, skill_key, level, question_ar, question_en, options_ar, options_en, correct_index, explanation_ar, explanation_en, status, source, sort_order)
SELECT id,'programming','easy','ما ناتج 7 // 2 في بايثون؟','What is 7 // 2 in Python?',ARRAY['3.5','3','4','2'],ARRAY['3.5','3','4','2'],1,'القسمة الصحيحة تهمل الباقي العشري.','Floor division drops the fraction.','published','manual',4 FROM subjects WHERE code='CS101';

-- ============ برمجة كائنية (CS102 سنة أولى فصل ثاني) ============
INSERT INTO resources (subject_id, skill_key, kind, level, title_ar, title_en, url, provider, is_free, duration_hours, status, source, sort_order)
SELECT id,'programming','course','medium','البرمجة الكائنية OOP عملياً','Object-Oriented Programming in Practice','https://www.programiz.com/python-programming/object-oriented-programming','Programiz',true,15,'published','manual',1 FROM subjects WHERE code='CS102';
INSERT INTO resources (subject_id, skill_key, kind, level, title_ar, title_en, url, provider, is_free, duration_hours, status, source, sort_order)
SELECT id,'programming','video','medium','تمارين الأصناف والكائنات','Classes and Objects Exercises','https://www.w3schools.com/python/python_classes.asp','W3Schools',true,5,'published','manual',2 FROM subjects WHERE code='CS102';

INSERT INTO projects (subject_id, skill_key, level, title_ar, title_en, description_ar, description_en, points, status, source, sort_order)
SELECT id,'programming','medium','مشروع: نظام إدارة مكتبة مصغّر','Project: Mini Library System','صمّم أصناف Book وMember وLibrary مع إعارة وإرجاع وبحث، وحفظ البيانات في ملف. سلّم المشروع مع ملف README يشرح التصميم.','Design Book, Member, Library classes with borrow/return/search and file persistence. Submit with a README explaining the design.',150,'published','manual',1 FROM subjects WHERE code='CS102';
INSERT INTO projects (subject_id, skill_key, level, title_ar, title_en, description_ar, description_en, points, status, source, sort_order)
SELECT id,'programming','medium','مشروع: حساب بنكي مع وراثة','Project: Bank Account with Inheritance','صنف Account أساسي وصنفان يرثانه (Savings/Checking) مع إيداع وسحب وحد أدنى للرصيد.','Base Account class plus Savings/Checking subclasses with deposit, withdraw, and minimum-balance rules.',120,'published','manual',2 FROM subjects WHERE code='CS102';

INSERT INTO challenges (subject_id, skill_key, level, title_ar, title_en, prompt_ar, prompt_en, points, status, source, sort_order)
SELECT id,'programming','medium','تحدي: صنف مستطيل','Challenge: Rectangle Class','أنشئ صنف Rectangle بخاصيتي الطول والعرض ودالتي المساحة والمحيط، واختبره على 3 مستطيلات.','Create a Rectangle class with width/height, area() and perimeter(); test 3 rectangles.',60,'published','manual',1 FROM subjects WHERE code='CS102';

INSERT INTO quiz_questions (subject_id, skill_key, level, question_ar, question_en, options_ar, options_en, correct_index, explanation_ar, explanation_en, status, source, sort_order)
SELECT id,'programming','medium','ما اسم الدالة التي تُستدعى عند إنشاء كائن في بايثون؟','Which method runs when a Python object is created?',ARRAY['__init__','__main__','__str__','__new__'],ARRAY['__init__','__main__','__str__','__new__'],0,'الباني __init__ يهيّئ الكائن.','The __init__ constructor initializes the object.','published','manual',1 FROM subjects WHERE code='CS102';
INSERT INTO quiz_questions (subject_id, skill_key, level, question_ar, question_en, options_ar, options_en, correct_index, explanation_ar, explanation_en, status, source, sort_order)
SELECT id,'programming','medium','الوراثة تسمح بـ...','Inheritance allows...',ARRAY['إخفاء البيانات','إعادة استخدام خصائص صنف في صنف آخر','تسريع التنفيذ','منع الأخطاء'],ARRAY['hiding data','reusing a class''s properties in another class','faster execution','preventing errors'],1,'الصنف الابن يرث خصائص الأب ويوسّعها.','A child class reuses and extends its parent.','published','manual',2 FROM subjects WHERE code='CS102';
INSERT INTO quiz_questions (subject_id, skill_key, level, question_ar, question_en, options_ar, options_en, correct_index, explanation_ar, explanation_en, status, source, sort_order)
SELECT id,'programming','medium','self في دوال الصنف تشير إلى...','self in class methods refers to...',ARRAY['الصنف نفسه','الكائن الحالي','المتغير العام','الملف'],ARRAY['the class itself','the current object','the global variable','the file'],1,'self هو مرجع للكائن الذي استدعى الدالة.','self references the calling instance.','published','manual',3 FROM subjects WHERE code='CS102';
INSERT INTO quiz_questions (subject_id, skill_key, level, question_ar, question_en, options_ar, options_en, correct_index, explanation_ar, explanation_en, status, source, sort_order)
SELECT id,'programming','medium','التغليف (Encapsulation) يعني...','Encapsulation means...',ARRAY['جمع البيانات ودوالها وحمايتها داخل الصنف','كتابة كل شيء في ملف واحد','استخدام حلقات متداخلة','حذف المتغيرات'],ARRAY['bundling data with its methods and protecting it inside the class','writing everything in one file','nested loops','deleting variables'],0,'التغليف يحمي الحالة الداخلية للكائن.','Encapsulation protects an object''s internal state.','published','manual',4 FROM subjects WHERE code='CS102';

-- ============ خوارزميات: رياضيات متقطعة (MATH101) + هياكل معطيات (DS201) ============
INSERT INTO resources (subject_id, skill_key, kind, level, title_ar, title_en, url, provider, is_free, duration_hours, status, source, sort_order)
SELECT id,'algorithms','course','easy','المنطق الرياضي والبراهين بالأمثلة','Discrete Logic and Proofs by Example','https://www.khanacademy.org/computing/computer-science/cryptography','Khan Academy',true,10,'published','manual',1 FROM subjects WHERE code='MATH101';
INSERT INTO resources (subject_id, skill_key, kind, level, title_ar, title_en, url, provider, is_free, duration_hours, status, source, sort_order)
SELECT id,'algorithms','course','medium','هياكل البيانات عملياً: مكدس، طابور، قائمة','Data Structures in Practice: Stack, Queue, List','https://www.programiz.com/dsa','Programiz',true,18,'published','manual',1 FROM subjects WHERE code='DS201';

INSERT INTO challenges (subject_id, skill_key, level, title_ar, title_en, prompt_ar, prompt_en, points, status, source, sort_order)
SELECT id,'algorithms','easy','تحدي: التحقق من عدد أولي','Challenge: Prime Checker','اكتب دالة تفحص هل الرقم أولي، وحسّنها لتفحص حتى الجذر التربيعي فقط. قارن زمن التنفيذ قبل وبعد.','Write a primality test, then optimize it to check up to the square root. Compare runtimes.',60,'published','manual',1 FROM subjects WHERE code='MATH101';
INSERT INTO challenges (subject_id, skill_key, level, title_ar, title_en, prompt_ar, prompt_en, points, status, source, sort_order)
SELECT id,'algorithms','medium','تحدي: مكدس للأقواس المتوازنة','Challenge: Balanced Brackets Stack','باستخدام مكدس، افحص هل نص يحوي أقواساً متوازنة ()[]{}.','Using a stack, check whether a string has balanced ()[]{} brackets.',80,'published','manual',1 FROM subjects WHERE code='DS201';

INSERT INTO projects (subject_id, skill_key, level, title_ar, title_en, description_ar, description_en, points, status, source, sort_order)
SELECT id,'algorithms','medium','مشروع: مقارنة خوارزميات الترتيب','Project: Sorting Algorithms Benchmark','نفّذ فقاعي ودمج وسريع، وقس زمن كل واحدة على قوائم بأحجام مختلفة، واعرض النتائج في جدول مع استنتاجاتك.','Implement bubble, merge, and quick sort; time each on different input sizes; present results in a table with your conclusions.',150,'published','manual',1 FROM subjects WHERE code='DS201';

INSERT INTO quiz_questions (subject_id, skill_key, level, question_ar, question_en, options_ar, options_en, correct_index, explanation_ar, explanation_en, status, source, sort_order)
SELECT id,'algorithms','medium','ما التعقيد الزمني للبحث الثنائي؟','What is binary search time complexity?',ARRAY['O(n)','O(log n)','O(n log n)','O(1)'],ARRAY['O(n)','O(log n)','O(n log n)','O(1)'],1,'كل خطوة تشطّر نطاق البحث للنصف.','Each step halves the search range.','published','manual',1 FROM subjects WHERE code='DS201';
INSERT INTO quiz_questions (subject_id, skill_key, level, question_ar, question_en, options_ar, options_en, correct_index, explanation_ar, explanation_en, status, source, sort_order)
SELECT id,'algorithms','medium','المكدس يعمل بمبدأ...','A stack works on the principle of...',ARRAY['FIFO','LIFO','عشوائي','أولوية'],ARRAY['FIFO','LIFO','random','priority'],1,'آخر عنصر يدخل هو أول عنصر يخرج.','Last in, first out.','published','manual',2 FROM subjects WHERE code='DS201';
INSERT INTO quiz_questions (subject_id, skill_key, level, question_ar, question_en, options_ar, options_en, correct_index, explanation_ar, explanation_en, status, source, sort_order)
SELECT id,'algorithms','easy','العدد الأولي هو عدد...','A prime number is...',ARRAY['يقبل القسمة على 2','لا يقبل القسمة إلا على 1 ونفسه','زوجي دائماً','أكبر من 100'],ARRAY['divisible by 2','divisible only by 1 and itself','always even','greater than 100'],1,'تعريف العدد الأولي.','Definition of a prime.','published','manual',1 FROM subjects WHERE code='MATH101';
INSERT INTO quiz_questions (subject_id, skill_key, level, question_ar, question_en, options_ar, options_en, correct_index, explanation_ar, explanation_en, status, source, sort_order)
SELECT id,'algorithms','medium','أي بنية تناسب تنفيذ «تراجع» Undo؟','Which structure fits an Undo feature?',ARRAY['طابور','مكدس','شجرة','جدول تجزئة'],ARRAY['queue','stack','tree','hash table'],1,'التراجع يعكس آخر عملية أولاً — مكدس.','Undo reverses the last action first — a stack.','published','manual',3 FROM subjects WHERE code='DS201';

-- ============ ويب (WEB201) ============
INSERT INTO resources (subject_id, skill_key, kind, level, title_ar, title_en, url, provider, is_free, duration_hours, status, source, sort_order)
SELECT id,'web','course','easy','HTML و CSS بالمشاريع','HTML & CSS by Building Projects','https://www.freecodecamp.org/learn/2022/responsive-web-design/','freeCodeCamp',true,25,'published','manual',1 FROM subjects WHERE code='WEB201';
INSERT INTO resources (subject_id, skill_key, kind, level, title_ar, title_en, url, provider, is_free, duration_hours, status, source, sort_order)
SELECT id,'web','video','easy','جافاسكربت للمبتدئين بالتطبيق','JavaScript for Beginners by Doing','https://javascript.info/','javascript.info',true,15,'published','manual',2 FROM subjects WHERE code='WEB201';

INSERT INTO projects (subject_id, skill_key, level, title_ar, title_en, description_ar, description_en, points, status, source, sort_order)
SELECT id,'web','easy','مشروع: موقع شخصي (Portfolio)','Project: Personal Portfolio Site','ابنِ موقعاً شخصياً من 3 صفحات (رئيسية، مشاريع، تواصل) بـ HTML/CSS متجاوب مع الجوال. يمكنك تجربته أولاً في مختبر الكود داخل المنصة.','Build a 3-page personal site (home, projects, contact) in responsive HTML/CSS. Try it first in the built-in code playground.',150,'published','manual',1 FROM subjects WHERE code='WEB201';
INSERT INTO projects (subject_id, skill_key, level, title_ar, title_en, description_ar, description_en, points, status, source, sort_order)
SELECT id,'web','easy','مشروع: قائمة مهام تفاعلية','Project: Interactive To-Do List','صفحة واحدة بجافاسكربت: إضافة مهمة، حذفها، تعليمها كمنجزة، وحفظها في localStorage.','A one-page JavaScript app: add, delete, complete tasks, persisted in localStorage.',120,'published','manual',2 FROM subjects WHERE code='WEB201';

INSERT INTO challenges (subject_id, skill_key, level, title_ar, title_en, prompt_ar, prompt_en, points, status, source, sort_order)
SELECT id,'web','easy','تحدي: بطاقة تعريف بـ CSS','Challenge: CSS Profile Card','صمّم بطاقة تعريف (صورة، اسم، وصف، زر) بتأثير hover — نفّذها في مختبر الكود وأرفق لقطة شاشة.','Design a profile card (photo, name, bio, button) with a hover effect — build it in the code playground and attach a screenshot.',50,'published','manual',1 FROM subjects WHERE code='WEB201';

INSERT INTO quiz_questions (subject_id, skill_key, level, question_ar, question_en, options_ar, options_en, correct_index, explanation_ar, explanation_en, status, source, sort_order)
SELECT id,'web','easy','أي وسم يُنشئ رابطاً في HTML؟','Which tag creates a link in HTML?',ARRAY['<link>','<a>','<href>','<url>'],ARRAY['<link>','<a>','<href>','<url>'],1,'الوسم <a> مع href ينشئ الرابط.','The <a> tag with href creates links.','published','manual',1 FROM subjects WHERE code='WEB201';
INSERT INTO quiz_questions (subject_id, skill_key, level, question_ar, question_en, options_ar, options_en, correct_index, explanation_ar, explanation_en, status, source, sort_order)
SELECT id,'web','easy','أي خاصية CSS تغيّر لون النص؟','Which CSS property changes text color?',ARRAY['font-size','color','background','text-align'],ARRAY['font-size','color','background','text-align'],1,'color تتحكم بلون النص.','color sets the text color.','published','manual',2 FROM subjects WHERE code='WEB201';
INSERT INTO quiz_questions (subject_id, skill_key, level, question_ar, question_en, options_ar, options_en, correct_index, explanation_ar, explanation_en, status, source, sort_order)
SELECT id,'web','easy','localStorage يحفظ البيانات...','localStorage stores data...',ARRAY['في الخادم','في المتصفح حتى بعد الإغلاق','في الذاكرة المؤقتة فقط','في قاعدة البيانات'],ARRAY['on the server','in the browser even after closing','in temporary memory only','in the database'],1,'تبقى البيانات محفوظة في متصفح المستخدم.','Data persists in the user''s browser.','published','manual',3 FROM subjects WHERE code='WEB201';
INSERT INTO quiz_questions (subject_id, skill_key, level, question_ar, question_en, options_ar, options_en, correct_index, explanation_ar, explanation_en, status, source, sort_order)
SELECT id,'web','easy','Flexbox يُستخدم أساساً لـ...','Flexbox is mainly used for...',ARRAY['الصور','توزيع العناصر في اتجاه واحد','الرسوم','التخزين'],ARRAY['images','laying out items in one direction','drawing','storage'],1,'Flexbox يرتّب العناصر في صف أو عمود بمرونة.','Flexbox lays out items in a row or column.','published','manual',4 FROM subjects WHERE code='WEB201';

-- ============ قواعد بيانات (DB301) ============
INSERT INTO resources (subject_id, skill_key, kind, level, title_ar, title_en, url, provider, is_free, duration_hours, status, source, sort_order)
SELECT id,'databases','course','medium','SQL بالتدريب العملي','SQL by Practice','https://www.sqlbolt.com/','SQLBolt',true,12,'published','manual',1 FROM subjects WHERE code='DB301';
INSERT INTO resources (subject_id, skill_key, kind, level, title_ar, title_en, url, provider, is_free, duration_hours, status, source, sort_order)
SELECT id,'databases','video','medium','تمارين استعلامات تفاعلية','Interactive Query Exercises','https://pgexercises.com/','PostgreSQL Exercises',true,8,'published','manual',2 FROM subjects WHERE code='DB301';

INSERT INTO projects (subject_id, skill_key, level, title_ar, title_en, description_ar, description_en, points, status, source, sort_order)
SELECT id,'databases','medium','مشروع: قاعدة بيانات متجر إلكتروني','Project: Online Store Database','صمّم مخططاً (منتجات، زبائن، طلبات، تفاصيل الطلب) بمفاتيح وعلاقات صحيحة، واكتب 10 استعلامات عليه منها JOIN وGROUP BY.','Design a schema (products, customers, orders, order_items) with proper keys/relations, and write 10 queries including JOIN and GROUP BY.',150,'published','manual',1 FROM subjects WHERE code='DB301';

INSERT INTO challenges (subject_id, skill_key, level, title_ar, title_en, prompt_ar, prompt_en, points, status, source, sort_order)
SELECT id,'databases','medium','تحدي: استعلام بربط جدولين','Challenge: Two-Table JOIN Query','على جدولي students وcourses اكتب استعلاماً يعرض اسم كل طالب مع عدد مواده المسجلة.','On students and courses tables, write a query showing each student with their enrolled course count.',70,'published','manual',1 FROM subjects WHERE code='DB301';

INSERT INTO quiz_questions (subject_id, skill_key, level, question_ar, question_en, options_ar, options_en, correct_index, explanation_ar, explanation_en, status, source, sort_order)
SELECT id,'databases','medium','المفتاح الأساسي يجب أن يكون...','A primary key must be...',ARRAY['قابلاً للتكرار','فريداً وغير فارغ','نصاً دائماً','اختيارياً'],ARRAY['duplicable','unique and not null','always text','optional'],1,'الأساسي يميّز كل صف بشكل فريد.','A primary key uniquely identifies each row.','published','manual',1 FROM subjects WHERE code='DB301';
INSERT INTO quiz_questions (subject_id, skill_key, level, question_ar, question_en, options_ar, options_en, correct_index, explanation_ar, explanation_en, status, source, sort_order)
SELECT id,'databases','medium','أي جملة تجمع صفوف جدولين حسب علاقة؟','Which clause combines rows from two tables by relation?',ARRAY['GROUP BY','JOIN','ORDER BY','LIMIT'],ARRAY['GROUP BY','JOIN','ORDER BY','LIMIT'],1,'JOIN تربط الجداول عبر المفاتيح.','JOIN links tables via keys.','published','manual',2 FROM subjects WHERE code='DB301';
INSERT INTO quiz_questions (subject_id, skill_key, level, question_ar, question_en, options_ar, options_en, correct_index, explanation_ar, explanation_en, status, source, sort_order)
SELECT id,'databases','medium','COUNT(*) تُرجع...','COUNT(*) returns...',ARRAY['عدد الأعمدة','عدد الصفوف','مجموع القيم','آخر صف'],ARRAY['number of columns','number of rows','sum of values','last row'],1,'COUNT(*) تحسب عدد الصفوف.','COUNT(*) counts rows.','published','manual',3 FROM subjects WHERE code='DB301';
INSERT INTO quiz_questions (subject_id, skill_key, level, question_ar, question_en, options_ar, options_en, correct_index, explanation_ar, explanation_en, status, source, sort_order)
SELECT id,'databases','medium','التطبيع (Normalization) يهدف إلى...','Normalization aims to...',ARRAY['تسريع القراءة فقط','تقليل التكرار وحماية سلامة البيانات','حذف الجداول','زيادة الحجم'],ARRAY['faster reads only','reducing redundancy and protecting integrity','dropping tables','more storage'],1,'التطبيع يمنع تكرار البيانات وتعارضها.','Normalization prevents redundancy and anomalies.','published','manual',4 FROM subjects WHERE code='DB301';

-- ============ شبكات (NET301) + ذكاء اصطناعي (AI401) ============
INSERT INTO resources (subject_id, skill_key, kind, level, title_ar, title_en, url, provider, is_free, duration_hours, status, source, sort_order)
SELECT id,'networks','course','medium','أساسيات الشبكات بمختبرات عملية','Networking Basics with Hands-on Labs','https://www.cisco.com/c/en/us/training-events/training-certifications/certifications/entry/ccst-networking.html','Cisco',true,20,'published','manual',1 FROM subjects WHERE code='NET301';
INSERT INTO resources (subject_id, skill_key, kind, level, title_ar, title_en, url, provider, is_free, duration_hours, status, source, sort_order)
SELECT id,'ai','course','medium','تعلم الآلة عملياً بـ scikit-learn','Hands-on Machine Learning with scikit-learn','https://scikit-learn.org/stable/tutorial/index.html','scikit-learn',true,15,'published','manual',1 FROM subjects WHERE code='AI401';

INSERT INTO projects (subject_id, skill_key, level, title_ar, title_en, description_ar, description_en, points, status, source, sort_order)
SELECT id,'networks','medium','مشروع: تصميم شبكة جامعة صغيرة','Project: Small Campus Network Design','صمّم مخطط شبكة لثلاثة مبانٍ (عنونة IP، شبكات فرعية، توجيه) واشرح اختياراتك في تقرير قصير.','Design a 3-building campus network (IP addressing, subnets, routing) with a short report justifying your choices.',140,'published','manual',1 FROM subjects WHERE code='NET301';
INSERT INTO projects (subject_id, skill_key, level, title_ar, title_en, description_ar, description_en, points, status, source, sort_order)
SELECT id,'ai','medium','مشروع: مصنّف بيانات بسيط','Project: Simple Data Classifier','درّب نموذج تصنيف على مجموعة Iris أو Titanic، وقيّم دقته بمصفوفة الارتباك، واشرح النتائج.','Train a classifier on the Iris or Titanic dataset, evaluate with a confusion matrix, and explain the results.',150,'published','manual',1 FROM subjects WHERE code='AI401';

INSERT INTO challenges (subject_id, skill_key, level, title_ar, title_en, prompt_ar, prompt_en, points, status, source, sort_order)
SELECT id,'networks','medium','تحدي: حساب الشبكات الفرعية','Challenge: Subnet Calculation','للشبكة 192.168.1.0/26 حدّد: قناع الشبكة، عدد المضيفين، عنوان البث.','For 192.168.1.0/26 determine: subnet mask, host count, broadcast address.',70,'published','manual',1 FROM subjects WHERE code='NET301';
INSERT INTO challenges (subject_id, skill_key, level, title_ar, title_en, prompt_ar, prompt_en, points, status, source, sort_order)
SELECT id,'ai','medium','تحدي: تنظيف بيانات ناقصة','Challenge: Cleaning Missing Data','حمّل مجموعة بيانات فيها قيم ناقصة، وعالجها بثلاث طرق مختلفة وقارن أثرها على دقة نموذج بسيط.','Load a dataset with missing values, handle them three different ways, and compare the effect on a simple model''s accuracy.',80,'published','manual',1 FROM subjects WHERE code='AI401';

INSERT INTO quiz_questions (subject_id, skill_key, level, question_ar, question_en, options_ar, options_en, correct_index, explanation_ar, explanation_en, status, source, sort_order)
SELECT id,'networks','medium','أي بروتوكول يترجم أسماء النطاقات إلى عناوين IP؟','Which protocol resolves domain names to IPs?',ARRAY['HTTP','DNS','FTP','SMTP'],ARRAY['HTTP','DNS','FTP','SMTP'],1,'DNS يترجم الأسماء إلى عناوين.','DNS resolves names to addresses.','published','manual',1 FROM subjects WHERE code='NET301';
INSERT INTO quiz_questions (subject_id, skill_key, level, question_ar, question_en, options_ar, options_en, correct_index, explanation_ar, explanation_en, status, source, sort_order)
SELECT id,'ai','medium','التعلم الموجّه يتطلب...','Supervised learning requires...',ARRAY['بيانات بلا وسوم','بيانات موسومة','حواسيب قوية فقط','إنترنت'],ARRAY['unlabeled data','labeled data','powerful computers only','internet'],1,'التعلم الموجّه يحتاج أمثلة مع إجاباتها.','Supervised learning needs labeled examples.','published','manual',1 FROM subjects WHERE code='AI401';

-- ============ قوالب مسارات منشورة لكل مهارة ============
DO $$
DECLARE
  t uuid;
BEGIN
  -- برمجة (مبتدئ)
  INSERT INTO path_templates (skill_key, level, title_ar, title_en, published)
  VALUES ('programming','easy','مسار البرمجة للمبتدئين','Programming Starter Path', true) RETURNING id INTO t;
  INSERT INTO path_template_items (template_id, subject_id, item_type, item_id, title_ar, title_en, body_ar, body_en, level, step_order)
    SELECT t, r.subject_id, 'resource', r.id, r.title_ar, r.title_en, r.url, r.url, r.level, row_number() OVER (ORDER BY r.sort_order) - 1
    FROM resources r WHERE r.skill_key='programming' AND r.level='easy' AND r.status='published';
  INSERT INTO path_template_items (template_id, subject_id, item_type, item_id, title_ar, title_en, body_ar, body_en, level, step_order)
    SELECT t, c.subject_id, 'challenge', c.id, c.title_ar, c.title_en, c.prompt_ar, c.prompt_en, c.level,
           10 + row_number() OVER (ORDER BY c.sort_order)
    FROM challenges c WHERE c.skill_key='programming' AND c.level='easy' AND c.status='published';
  INSERT INTO path_template_items (template_id, subject_id, item_type, item_id, title_ar, title_en, body_ar, body_en, level, step_order)
    SELECT t, p.subject_id, 'project', p.id, p.title_ar, p.title_en, p.description_ar, p.description_en, p.level,
           20 + row_number() OVER (ORDER BY p.sort_order)
    FROM projects p WHERE p.skill_key='programming' AND p.level='easy' AND p.status='published';
  INSERT INTO path_template_items (template_id, subject_id, item_type, item_id, title_ar, title_en, body_ar, body_en, level, step_order)
    SELECT t, s.id, 'quiz', s.id, 'اختبار: '||s.name_ar, 'Assessment: '||s.name_en,
           'أعد قياس مستواك في البرمجة بعد إنهاء الخطوات السابقة.', 'Re-measure your programming level after the steps above.', 'easy', 30
    FROM subjects s WHERE s.code='CS101';

  -- برمجة (متوسط)
  INSERT INTO path_templates (skill_key, level, title_ar, title_en, published)
  VALUES ('programming','medium','مسار البرمجة الكائنية','OOP Path', true) RETURNING id INTO t;
  INSERT INTO path_template_items (template_id, subject_id, item_type, item_id, title_ar, title_en, body_ar, body_en, level, step_order)
    SELECT t, r.subject_id, 'resource', r.id, r.title_ar, r.title_en, r.url, r.url, r.level, row_number() OVER (ORDER BY r.sort_order) - 1
    FROM resources r WHERE r.skill_key='programming' AND r.level='medium' AND r.status='published';
  INSERT INTO path_template_items (template_id, subject_id, item_type, item_id, title_ar, title_en, body_ar, body_en, level, step_order)
    SELECT t, c.subject_id, 'challenge', c.id, c.title_ar, c.title_en, c.prompt_ar, c.prompt_en, c.level,
           10 + row_number() OVER (ORDER BY c.sort_order)
    FROM challenges c WHERE c.skill_key='programming' AND c.level='medium' AND c.status='published';
  INSERT INTO path_template_items (template_id, subject_id, item_type, item_id, title_ar, title_en, body_ar, body_en, level, step_order)
    SELECT t, p.subject_id, 'project', p.id, p.title_ar, p.title_en, p.description_ar, p.description_en, p.level,
           20 + row_number() OVER (ORDER BY p.sort_order)
    FROM projects p WHERE p.skill_key='programming' AND p.level='medium' AND p.status='published';
  INSERT INTO path_template_items (template_id, subject_id, item_type, item_id, title_ar, title_en, body_ar, body_en, level, step_order)
    SELECT t, s.id, 'quiz', s.id, 'اختبار: '||s.name_ar, 'Assessment: '||s.name_en,
           'أعد قياس مستواك بعد إنهاء الخطوات.', 'Re-measure your level after the steps.', 'medium', 30
    FROM subjects s WHERE s.code='CS102';

  -- خوارزميات
  INSERT INTO path_templates (skill_key, level, title_ar, title_en, published)
  VALUES ('algorithms','medium','مسار الخوارزميات وهياكل البيانات','Algorithms & Data Structures Path', true) RETURNING id INTO t;
  INSERT INTO path_template_items (template_id, subject_id, item_type, item_id, title_ar, title_en, body_ar, body_en, level, step_order)
    SELECT t, r.subject_id, 'resource', r.id, r.title_ar, r.title_en, r.url, r.url, r.level, row_number() OVER (ORDER BY r.sort_order) - 1
    FROM resources r WHERE r.skill_key='algorithms' AND r.status='published';
  INSERT INTO path_template_items (template_id, subject_id, item_type, item_id, title_ar, title_en, body_ar, body_en, level, step_order)
    SELECT t, c.subject_id, 'challenge', c.id, c.title_ar, c.title_en, c.prompt_ar, c.prompt_en, c.level,
           10 + row_number() OVER (ORDER BY c.sort_order)
    FROM challenges c WHERE c.skill_key='algorithms' AND c.status='published';
  INSERT INTO path_template_items (template_id, subject_id, item_type, item_id, title_ar, title_en, body_ar, body_en, level, step_order)
    SELECT t, p.subject_id, 'project', p.id, p.title_ar, p.title_en, p.description_ar, p.description_en, p.level,
           20 + row_number() OVER (ORDER BY p.sort_order)
    FROM projects p WHERE p.skill_key='algorithms' AND p.status='published';
  INSERT INTO path_template_items (template_id, subject_id, item_type, item_id, title_ar, title_en, body_ar, body_en, level, step_order)
    SELECT t, s.id, 'quiz', s.id, 'اختبار: '||s.name_ar, 'Assessment: '||s.name_en,
           'أعد قياس مستواك في الخوارزميات.', 'Re-measure your algorithms level.', 'medium', 30
    FROM subjects s WHERE s.code='DS201';

  -- ويب
  INSERT INTO path_templates (skill_key, level, title_ar, title_en, published)
  VALUES ('web','easy','مسار تطوير الويب العملي','Hands-on Web Development Path', true) RETURNING id INTO t;
  INSERT INTO path_template_items (template_id, subject_id, item_type, item_id, title_ar, title_en, body_ar, body_en, level, step_order)
    SELECT t, r.subject_id, 'resource', r.id, r.title_ar, r.title_en, r.url, r.url, r.level, row_number() OVER (ORDER BY r.sort_order) - 1
    FROM resources r WHERE r.skill_key='web' AND r.status='published';
  INSERT INTO path_template_items (template_id, subject_id, item_type, item_id, title_ar, title_en, body_ar, body_en, level, step_order)
    SELECT t, c.subject_id, 'challenge', c.id, c.title_ar, c.title_en, c.prompt_ar, c.prompt_en, c.level,
           10 + row_number() OVER (ORDER BY c.sort_order)
    FROM challenges c WHERE c.skill_key='web' AND c.status='published';
  INSERT INTO path_template_items (template_id, subject_id, item_type, item_id, title_ar, title_en, body_ar, body_en, level, step_order)
    SELECT t, p.subject_id, 'project', p.id, p.title_ar, p.title_en, p.description_ar, p.description_en, p.level,
           20 + row_number() OVER (ORDER BY p.sort_order)
    FROM projects p WHERE p.skill_key='web' AND p.status='published';
  INSERT INTO path_template_items (template_id, subject_id, item_type, item_id, title_ar, title_en, body_ar, body_en, level, step_order)
    SELECT t, s.id, 'quiz', s.id, 'اختبار: '||s.name_ar, 'Assessment: '||s.name_en,
           'أعد قياس مستواك في تطوير الويب.', 'Re-measure your web level.', 'easy', 30
    FROM subjects s WHERE s.code='WEB201';

  -- قواعد بيانات
  INSERT INTO path_templates (skill_key, level, title_ar, title_en, published)
  VALUES ('databases','medium','مسار قواعد البيانات','Databases Path', true) RETURNING id INTO t;
  INSERT INTO path_template_items (template_id, subject_id, item_type, item_id, title_ar, title_en, body_ar, body_en, level, step_order)
    SELECT t, r.subject_id, 'resource', r.id, r.title_ar, r.title_en, r.url, r.url, r.level, row_number() OVER (ORDER BY r.sort_order) - 1
    FROM resources r WHERE r.skill_key='databases' AND r.status='published';
  INSERT INTO path_template_items (template_id, subject_id, item_type, item_id, title_ar, title_en, body_ar, body_en, level, step_order)
    SELECT t, c.subject_id, 'challenge', c.id, c.title_ar, c.title_en, c.prompt_ar, c.prompt_en, c.level,
           10 + row_number() OVER (ORDER BY c.sort_order)
    FROM challenges c WHERE c.skill_key='databases' AND c.status='published';
  INSERT INTO path_template_items (template_id, subject_id, item_type, item_id, title_ar, title_en, body_ar, body_en, level, step_order)
    SELECT t, p.subject_id, 'project', p.id, p.title_ar, p.title_en, p.description_ar, p.description_en, p.level,
           20 + row_number() OVER (ORDER BY p.sort_order)
    FROM projects p WHERE p.skill_key='databases' AND p.status='published';
  INSERT INTO path_template_items (template_id, subject_id, item_type, item_id, title_ar, title_en, body_ar, body_en, level, step_order)
    SELECT t, s.id, 'quiz', s.id, 'اختبار: '||s.name_ar, 'Assessment: '||s.name_en,
           'أعد قياس مستواك في قواعد البيانات.', 'Re-measure your databases level.', 'medium', 30
    FROM subjects s WHERE s.code='DB301';

  -- شبكات
  INSERT INTO path_templates (skill_key, level, title_ar, title_en, published)
  VALUES ('networks','medium','مسار الشبكات العملي','Hands-on Networks Path', true) RETURNING id INTO t;
  INSERT INTO path_template_items (template_id, subject_id, item_type, item_id, title_ar, title_en, body_ar, body_en, level, step_order)
    SELECT t, r.subject_id, 'resource', r.id, r.title_ar, r.title_en, r.url, r.url, r.level, row_number() OVER (ORDER BY r.sort_order) - 1
    FROM resources r WHERE r.skill_key='networks' AND r.status='published';
  INSERT INTO path_template_items (template_id, subject_id, item_type, item_id, title_ar, title_en, body_ar, body_en, level, step_order)
    SELECT t, c.subject_id, 'challenge', c.id, c.title_ar, c.title_en, c.prompt_ar, c.prompt_en, c.level,
           10 + row_number() OVER (ORDER BY c.sort_order)
    FROM challenges c WHERE c.skill_key='networks' AND c.status='published';
  INSERT INTO path_template_items (template_id, subject_id, item_type, item_id, title_ar, title_en, body_ar, body_en, level, step_order)
    SELECT t, p.subject_id, 'project', p.id, p.title_ar, p.title_en, p.description_ar, p.description_en, p.level,
           20 + row_number() OVER (ORDER BY p.sort_order)
    FROM projects p WHERE p.skill_key='networks' AND p.status='published';
  INSERT INTO path_template_items (template_id, subject_id, item_type, item_id, title_ar, title_en, body_ar, body_en, level, step_order)
    SELECT t, s.id, 'quiz', s.id, 'اختبار: '||s.name_ar, 'Assessment: '||s.name_en,
           'أعد قياس مستواك في الشبكات.', 'Re-measure your networks level.', 'medium', 30
    FROM subjects s WHERE s.code='NET301';

  -- ذكاء اصطناعي
  INSERT INTO path_templates (skill_key, level, title_ar, title_en, published)
  VALUES ('ai','medium','مسار الذكاء الاصطناعي التطبيقي','Applied AI Path', true) RETURNING id INTO t;
  INSERT INTO path_template_items (template_id, subject_id, item_type, item_id, title_ar, title_en, body_ar, body_en, level, step_order)
    SELECT t, r.subject_id, 'resource', r.id, r.title_ar, r.title_en, r.url, r.url, r.level, row_number() OVER (ORDER BY r.sort_order) - 1
    FROM resources r WHERE r.skill_key='ai' AND r.status='published';
  INSERT INTO path_template_items (template_id, subject_id, item_type, item_id, title_ar, title_en, body_ar, body_en, level, step_order)
    SELECT t, c.subject_id, 'challenge', c.id, c.title_ar, c.title_en, c.prompt_ar, c.prompt_en, c.level,
           10 + row_number() OVER (ORDER BY c.sort_order)
    FROM challenges c WHERE c.skill_key='ai' AND c.status='published';
  INSERT INTO path_template_items (template_id, subject_id, item_type, item_id, title_ar, title_en, body_ar, body_en, level, step_order)
    SELECT t, p.subject_id, 'project', p.id, p.title_ar, p.title_en, p.description_ar, p.description_en, p.level,
           20 + row_number() OVER (ORDER BY p.sort_order)
    FROM projects p WHERE p.skill_key='ai' AND p.status='published';
  INSERT INTO path_template_items (template_id, subject_id, item_type, item_id, title_ar, title_en, body_ar, body_en, level, step_order)
    SELECT t, s.id, 'quiz', s.id, 'اختبار: '||s.name_ar, 'Assessment: '||s.name_en,
           'أعد قياس مستواك في الذكاء الاصطناعي.', 'Re-measure your AI level.', 'medium', 30
    FROM subjects s WHERE s.code='AI401';
END $$;