import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  FileCheck2,
  GraduationCap,
  Route as RouteIcon,
  Sparkles,
  Target,
} from "lucide-react";

import heroImage from "@/assets/hero-roadmap.jpg";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InfoPath — Practical Learning Paths for IT Students" },
      {
        name: "description",
        content:
          "Assess your IT skills, follow instructor-built practical learning paths, submit projects and advance through verified assessments.",
      },
      { property: "og:title", content: "InfoPath — Build IT skills through real projects" },
      {
        property: "og:description",
        content: "A bilingual platform connecting skill assessment, instructor guidance, practical projects and measurable progress.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const journey = [
  { icon: Target, ar: "اختبار تحديد المستوى", en: "Placement assessment", arText: "اختبار موزّع على ست مهارات يكشف مستواك الحقيقي ونقاط الضعف.", enText: "An assessment across six skills reveals your actual level and gaps." },
  { icon: BarChart3, ar: "ملف مهاراتك", en: "Your skill profile", arText: "تظهر مهاراتك من الأضعف إلى الأقوى، ويصبح المجال الأضعف هدفك الحالي.", enText: "Skills are ordered weakest first, and the weakest becomes your current goal." },
  { icon: RouteIcon, ar: "مسار يجهّزه الأستاذ", en: "Instructor-built path", arText: "يختار النظام مساراً منشوراً من الأستاذ يناسب المهارة والمستوى؛ ولا يخترع الذكاء محتوى جديداً.", enText: "The system selects a published instructor path for your skill and level; AI does not invent the curriculum." },
  { icon: Code2, ar: "تعلّم ونفّذ", en: "Learn and build", arText: "تنتقل بين مصادر موثوقة وتحديات ومشاريع عملية، وتوثّق تقدّمك داخل المنصة.", enText: "Move through trusted resources, challenges and practical projects while documenting progress." },
  { icon: ClipboardCheck, ar: "تسليم ومراجعة", en: "Submit and review", arText: "ترسل المشروع للأستاذ، وتحصل على درجة وملاحظات ومحادثة مرتبطة بالتسليم.", enText: "Submit work to your instructor and receive a grade, feedback and a linked discussion." },
  { icon: FileCheck2, ar: "اختبار ثم انتقال", en: "Assess and advance", arText: "بعد إنهاء المسار تجتاز اختباراً؛ النجاح بنسبة 50% ينقلك إلى أضعف مهارة تالية.", enText: "Finish with an assessment; scoring 50% advances you to the next weakest skill." },
];

function HomePage() {
  const { lang, dir, t } = useI18n();
  const ar = lang === "ar";
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-hero-gradient text-primary-foreground">
          <div className="mx-auto grid min-h-[640px] max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-[1.08fr_.92fr] lg:py-20">
            <div className="relative z-10">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-4 py-2 text-xs font-bold">
                <Sparkles className="size-4" /> {t("hero_badge")}
              </p>
              <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight md:text-6xl">{t("hero_title")}</h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-primary-foreground/80 md:text-lg">{t("hero_sub")}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" variant="secondary" className="font-bold" asChild>
                  <Link to="/auth">{t("hero_cta")}<Arrow className="size-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent font-bold text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild>
                  <a href="#journey">{t("hero_cta2")}</a>
                </Button>
              </div>
              <dl className="mt-12 grid max-w-xl grid-cols-3 border-t border-primary-foreground/20 pt-6">
                {[
                  { value: "6", label: t("stat_years") },
                  { value: "19", label: t("stat_subjects") },
                  { value: "8", label: t("stat_ai") },
                ].map((item) => (
                  <div key={item.label} className="border-e border-primary-foreground/20 px-4 first:ps-0 last:border-e-0">
                    <dt className="text-2xl font-extrabold md:text-3xl">{item.value}</dt>
                    <dd className="mt-1 text-xs text-primary-foreground/70">{item.label}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="relative">
              <img src={heroImage} alt={ar ? "شبكة تعلم تقنية مترابطة" : "Connected technology learning network"} width={1280} height={960} className="aspect-[4/3] w-full rounded-lg border border-primary-foreground/20 object-cover shadow-soft" />
              <div className="absolute -bottom-5 start-5 max-w-xs rounded-lg border border-primary-foreground/20 bg-brand-deep/95 p-4 shadow-soft backdrop-blur">
                <p className="text-xs font-bold text-brand-teal">{ar ? "هدفك الحالي" : "Current goal"}</p>
                <p className="mt-1 text-sm font-semibold">{ar ? "قواعد البيانات — ابدأ من هنا" : "Databases — start here"}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary-foreground/15"><div className="h-full w-2/5 bg-brand-teal" /></div>
              </div>
            </div>
          </div>
        </section>

        <section id="journey" className="scroll-mt-20 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <SectionHeading eyebrow={ar ? "كيف يعمل InfoPath" : "How InfoPath works"} title={t("how_title")} sub={t("how_sub")} />
            <div className="relative mt-16">
              <div className="absolute bottom-0 start-7 top-0 hidden w-px bg-border md:block" />
              <ol className="space-y-5">
                {journey.map((step, index) => (
                  <li key={step.en} className="relative grid gap-4 border-b border-border py-7 md:grid-cols-[3.5rem_1fr_1.35fr] md:items-center md:gap-8">
                    <span className="relative z-10 flex size-14 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-card"><step.icon className="size-6" /></span>
                    <div><span className="text-xs font-extrabold text-primary">{String(index + 1).padStart(2, "0")}</span><h3 className="mt-1 text-xl font-bold">{ar ? step.ar : step.en}</h3></div>
                    <p className="leading-7 text-muted-foreground">{ar ? step.arText : step.enText}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="practice" className="scroll-mt-20 border-y border-border bg-secondary/55 py-20 md:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-extrabold text-primary">{ar ? "خبرة عملية قابلة للإثبات" : "Provable practical experience"}</p>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight md:text-5xl">{ar ? "لا تُغلق خطوة بمجرد الضغط على «تم»" : "A step is not complete just because you clicked Done"}</h2>
              <p className="mt-5 max-w-xl leading-8 text-muted-foreground">{ar ? "المشاريع والتحديات تحتاج تسليماً حقيقياً. يراجع الأستاذ العمل، يضيف الدرجة والملاحظات، ثم تنعكس النتيجة على ملف مهاراتك." : "Projects and challenges require real submissions. Your instructor reviews the work, adds a grade and feedback, and the result updates your skill profile."}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: Code2, title: ar ? "مشروع عملي" : "Practical project", text: ar ? "تبني حلاً وترفع رابط العمل أو ملفاته." : "Build a solution and submit its link or files." },
                { icon: GraduationCap, title: ar ? "مراجعة الأستاذ" : "Instructor review", text: ar ? "درجة وملاحظات ومحادثة حول التسليم." : "A grade, feedback and submission discussion." },
                { icon: BarChart3, title: ar ? "تقدم موثّق" : "Verified progress", text: ar ? "النتيجة تُسجّل في مهارتك وتؤثر على المسار." : "The result updates your skill and future path." },
              ].map((item) => (
                <article key={item.title} className="border-t-4 border-primary bg-card p-6 shadow-card">
                  <item.icon className="size-6 text-primary" />
                  <h3 className="mt-5 font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="ai" className="scroll-mt-20 py-20 md:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-2 lg:items-center">
            <div className="bg-brand-deep p-8 text-primary-foreground md:p-10">
              <div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-lg bg-brand-teal text-accent-foreground"><Bot className="size-6" /></span><div><p className="font-bold">InfoPath AI</p><p className="text-xs text-primary-foreground/65">{ar ? "يدعم القرار ولا يستبدل الأستاذ" : "Supports decisions, never replaces the instructor"}</p></div></div>
              <div className="mt-8 space-y-4">
                <p className="ms-auto max-w-[85%] rounded-lg bg-primary px-4 py-3 text-sm">{ar ? "ما هي المهارة التي أبدأ بها؟" : "Which skill should I start with?"}</p>
                <p className="max-w-[92%] rounded-lg bg-primary-foreground/10 px-4 py-3 text-sm leading-6">{ar ? "بناءً على اختبارك، قواعد البيانات هي الأولوية. اخترت لك مسار الأستاذ المنشور المناسب لمستواك." : "Based on your assessment, databases are the priority. I selected the instructor-published path for your level."}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-extrabold text-primary">{ar ? "دور واضح للذكاء" : "A clear role for AI"}</p>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight md:text-5xl">{ar ? "الذكاء يقترح، والأستاذ يصمّم ويعتمد" : "AI recommends; instructors design and approve"}</h2>
              <p className="mt-5 leading-8 text-muted-foreground">{ar ? "يحلل الذكاء نتائجك ويرتّب الأولويات ويشرح الصعوبات. أمّا محتوى المسار ومشاريعه واختباراته فيبنيها الأستاذ وينشرها للطلاب." : "AI analyses results, prioritises skills and explains difficult topics. Instructors build and publish the path content, projects and assessments."}</p>
              <ul className="mt-7 space-y-3">
                {[ar ? "المسار من محتوى الأستاذ المنشور فقط" : "Paths only use instructor-published content", ar ? "الأستاذ يعدّل مسار كل طالب عند الحاجة" : "Instructors can adjust each student's path", ar ? "الانتقال يعتمد على إنجاز واختبار حقيقي" : "Advancement requires completion and a real assessment"].map((point) => <li key={point} className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" /><span>{point}</span></li>)}
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-brand-deep py-20 text-primary-foreground">
          <div className="mx-auto flex max-w-4xl flex-col items-center px-4 text-center">
            <Sparkles className="size-7 text-brand-teal" />
            <h2 className="mt-5 text-3xl font-extrabold md:text-5xl">{t("cta_title")}</h2>
            <p className="mt-4 max-w-2xl leading-7 text-primary-foreground/75">{t("cta_sub")}</p>
            <Button size="lg" variant="secondary" className="mt-8 font-bold" asChild><Link to="/auth">{t("hero_cta")}<Arrow className="size-4" /></Link></Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function SectionHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return <div className="max-w-3xl"><p className="text-sm font-extrabold text-primary">{eyebrow}</p><h2 className="mt-3 text-3xl font-extrabold leading-tight md:text-5xl">{title}</h2><p className="mt-4 max-w-2xl leading-7 text-muted-foreground">{sub}</p></div>;
}