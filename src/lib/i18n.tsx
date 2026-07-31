/**
 * i18n.tsx
 * -------------------------------------------------------------
 * Bilingual (Arabic / English) support for InfoPath.
 * - Stores the chosen language in localStorage ("infopath-lang").
 * - Exposes `useI18n()` returning { lang, dir, t, setLang, toggle }.
 * - `t("key")` looks up a string from the dictionary below.
 * Server rendering defaults to Arabic to avoid hydration mismatch;
 * the stored preference is applied after mount.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "ar" | "en";

type Dict = Record<string, { ar: string; en: string }>;

/** All UI strings live here so both languages stay in sync. */
export const dict: Dict = {
  brand: { ar: "InfoPath", en: "InfoPath" },
  tagline: {
    ar: "المساعد الأكاديمي الذكي لطلاب المعلوماتية",
    en: "Smart Academic Assistant for IT Students",
  },
  nav_features: { ar: "المميزات", en: "Features" },
  nav_how: { ar: "كيف يعمل", en: "How it works" },
  nav_why: { ar: "لماذا InfoPath", en: "Why InfoPath" },
  nav_ai: { ar: "المساعد الذكي", en: "AI Assistant" },
  nav_login: { ar: "تسجيل الدخول", en: "Log in" },
  nav_start: { ar: "ابدأ الآن", en: "Get started" },

  hero_badge: { ar: "مشروع تخرج – هندسة المعلوماتية", en: "IT Engineering Capstone" },
  hero_title: {
    ar: "خارطة طريق عملية من السنة الأولى حتى سوق العمل",
    en: "A practical roadmap from year one to your first job",
  },
  hero_sub: {
    ar: "اختر سنتك الدراسية وفصلك وموادك، واحصل على كورسات ومشاريع وتحديات واختبارات ومتابعة دقيقة لتقدمك، مع مساعد ذكي يرافقك في كل خطوة.",
    en: "Pick your academic year, semester and subjects, then get curated courses, projects, challenges, quizzes and progress tracking — with an AI assistant beside you at every step.",
  },
  hero_cta: { ar: "ابدأ الآن مجاناً", en: "Start now — free" },
  hero_cta2: { ar: "استكشف المواد", en: "Explore subjects" },
  stat_years: { ar: "سنوات دراسية", en: "Academic years" },
  stat_subjects: { ar: "مادة ومسار", en: "Subjects & tracks" },
  stat_ai: { ar: "مساعد ذكي متاح", en: "AI assistant" },

  why_title: { ar: "لماذا أنشأنا InfoPath؟", en: "Why we built InfoPath" },
  why_sub: {
    ar: "يتخرج كثير من طلاب المعلوماتية بمعرفة نظرية قوية وخبرة عملية محدودة. InfoPath يربط كل مادة جامعية بمخرجات عملية حقيقية.",
    en: "Many IT students graduate with strong theory but little hands-on experience. InfoPath links every university subject to real, practical outcomes.",
  },
  why_1_t: { ar: "فجوة بين الجامعة والسوق", en: "University–industry gap" },
  why_1_d: {
    ar: "المنهج يشرح المفاهيم، لكن السوق يطلب مشاريع ومهارات. نحن نترجم كل مادة إلى مهارات قابلة للقياس.",
    en: "Curricula teach concepts; employers want projects and skills. We translate each subject into measurable skills.",
  },
  why_2_t: { ar: "تشتت المصادر", en: "Scattered resources" },
  why_2_d: {
    ar: "المصادر المجانية كثيرة ومبعثرة. نجمع أفضلها ونرتبها حسب المادة والفصل.",
    en: "Free resources are plentiful but scattered. We curate the best and organise them by subject and semester.",
  },
  why_3_t: { ar: "غياب التوجيه", en: "No clear guidance" },
  why_3_d: {
    ar: "الطالب لا يعرف ماذا يتعلم بعد ماذا. الخارطة والمساعد الذكي يرسمان الترتيب الصحيح.",
    en: "Students rarely know what to learn next. The roadmap and AI assistant define the right order.",
  },

  features_title: { ar: "مميزات المنصة", en: "Platform features" },
  features_sub: {
    ar: "كل ما يحتاجه الطالب في مكان واحد، من أول محاضرة حتى أول وظيفة.",
    en: "Everything a student needs in one place, from first lecture to first job.",
  },
  f1_t: { ar: "خارطة طريق لكل سنة", en: "Roadmap per year" },
  f1_d: {
    ar: "خمس سنوات، فصلان لكل سنة، ومواد مرتبة بمسار تعلم واضح.",
    en: "Five years, two semesters each, subjects ordered into a clear learning path.",
  },
  f2_t: { ar: "كورسات وكتب وفيديوهات", en: "Courses, books & videos" },
  f2_d: {
    ar: "مصادر مجانية مختارة بعناية مع فيديوهات YouTube وكتب مقترحة لكل مادة.",
    en: "Hand-picked free resources, YouTube videos and recommended books per subject.",
  },
  f3_t: { ar: "مشاريع عملية وتحديات", en: "Projects & challenges" },
  f3_d: {
    ar: "مشاريع تطبيقية وتحديات برمجية متدرجة الصعوبة تبني معرضك المهني.",
    en: "Applied projects and graded coding challenges that build your portfolio.",
  },
  f4_t: { ar: "اختبارات قصيرة", en: "Quick quizzes" },
  f4_d: {
    ar: "اختبر فهمك بعد كل مادة واحصل على نتيجة فورية ونقاط ضعفك.",
    en: "Test your understanding after each subject with instant scoring and weak-point analysis.",
  },
  f5_t: { ar: "تتبّع التقدم", en: "Progress tracking" },
  f5_d: {
    ar: "نسبة إنجاز لكل مادة وفصل وسنة، مع سجل كامل لنشاطك.",
    en: "Completion rates per subject, semester and year, with a full activity log.",
  },
  f6_t: { ar: "لوحة تحكم للمدير", en: "Admin dashboard" },
  f6_d: {
    ar: "إدارة كاملة للمواد والكورسات والمشاريع والتحديات والطلاب.",
    en: "Full management of subjects, courses, projects, challenges and students.",
  },

  ai_badge: { ar: "الميزة الأهم", en: "Flagship feature" },
  ai_title: { ar: "مساعد ذكي داخل المنصة", en: "An AI assistant inside the platform" },
  ai_sub: {
    ar: "ليس مجرد دردشة: مساعد يفهم سنتك وموادك ومستواك.",
    en: "More than a chatbot: an assistant that understands your year, subjects and level.",
  },
  ai_1: { ar: "يجيب عن أسئلتك ويشرح المواد بأسلوب مبسط", en: "Answers questions and explains subjects simply" },
  ai_2: { ar: "يقترح كورسات ومشاريع تناسب مستواك", en: "Suggests courses and projects for your level" },
  ai_3: { ar: "ينشئ خطة تعلم أسبوعية مخصصة", en: "Builds a personalised weekly study plan" },
  ai_4: { ar: "يولّد اختبارات تلقائياً من أي مادة", en: "Generates quizzes automatically from any subject" },
  ai_5: { ar: "يحلل كودك ويعطي ملاحظات لتحسينه", en: "Reviews your code and gives improvement feedback" },
  ai_6: { ar: "يلخص المحاضرات ويساعد في حل الأخطاء البرمجية", en: "Summarises lectures and helps debug your code" },
  ai_7: { ar: "ينصحك بخطوات الاستعداد لسوق العمل", en: "Coaches you on getting job-ready" },

  how_title: { ar: "كيف يعمل الموقع؟", en: "How it works" },
  how_sub: { ar: "أربع خطوات فقط تفصلك عن خارطتك.", en: "Four steps to your personal roadmap." },
  s1_t: { ar: "أنشئ حسابك", en: "Create your account" },
  s1_d: { ar: "تسجيل سريع بالبريد الجامعي أو الشخصي.", en: "Quick sign-up with your university or personal email." },
  s2_t: { ar: "اختر سنتك وفصلك", en: "Pick year & semester" },
  s2_d: { ar: "من السنة الأولى حتى الخامسة، الفصل الأول أو الثاني.", en: "Year one to five, first or second semester." },
  s3_t: { ar: "ادخل إلى المواد", en: "Open your subjects" },
  s3_d: { ar: "لكل مادة كورسات ومشاريع وتحديات واختبار.", en: "Each subject holds courses, projects, challenges and a quiz." },
  s4_t: { ar: "تابع تقدمك", en: "Track your progress" },
  s4_d: { ar: "أنجز، اجمع النقاط، وشاهد نسبتك ترتفع.", en: "Complete tasks, earn points, watch your progress grow." },

  cta_title: { ar: "جاهز لبناء خبرتك العملية؟", en: "Ready to build real experience?" },
  cta_sub: {
    ar: "ابدأ اليوم واحصل على خارطة طريق تناسب سنتك الدراسية.",
    en: "Start today and get a roadmap tailored to your academic year.",
  },

  footer_about: {
    ar: "منصة تعليمية لمساعدة طلاب المعلوماتية على اكتساب الخبرة العملية أثناء الدراسة.",
    en: "An academic platform helping IT students gain practical experience while they study.",
  },
  footer_links: { ar: "روابط", en: "Links" },
  footer_platform: { ar: "المنصة", en: "Platform" },
  footer_contact: { ar: "تواصل", en: "Contact" },
  footer_rights: { ar: "جميع الحقوق محفوظة", en: "All rights reserved" },
  footer_project: { ar: "مشروع تخرج جامعي", en: "University graduation project" },
  lang_switch: { ar: "EN", en: "عربي" },
};

type Ctx = {
  lang: Lang;
  dir: "rtl" | "ltr";
  t: (key: keyof typeof dict | string) => string;
  setLang: (l: Lang) => void;
  toggle: () => void;
};

const I18nContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "infopath-lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  // Apply the stored preference after hydration (avoids SSR mismatch).
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === "ar" || stored === "en") setLangState(stored);
  }, []);

  // Keep <html lang/dir> in sync with the active language.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const value = useMemo<Ctx>(() => {
    const setLang = (l: Lang) => {
      setLangState(l);
      window.localStorage.setItem(STORAGE_KEY, l);
    };
    return {
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      t: (key) => dict[key as string]?.[lang] ?? (key as string),
      setLang,
      toggle: () => setLang(lang === "ar" ? "en" : "ar"),
    };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
