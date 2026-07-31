/**
 * index.tsx — InfoPath landing page (bilingual AR/EN).
 * Sections: hero, why, features, AI assistant, how it works, CTA.
 */
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  Compass,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Map,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  UserPlus,
} from "lucide-react";

import heroImage from "@/assets/hero-roadmap.jpg";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InfoPath — Smart Academic Assistant for IT Students" },
      {
        name: "description",
        content:
          "InfoPath turns every IT university subject into a practical roadmap: courses, projects, challenges, quizzes, progress tracking and an AI study assistant.",
      },
      { property: "og:title", content: "InfoPath — Smart Academic Assistant for IT Students" },
      {
        property: "og:description",
        content:
          "A bilingual academic platform giving IT students a year-by-year roadmap with courses, projects, challenges and an AI assistant.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { t, dir } = useI18n();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const features = [
    { icon: Map, t: "f1_t", d: "f1_d" },
    { icon: BookOpen, t: "f2_t", d: "f2_d" },
    { icon: Target, t: "f3_t", d: "f3_d" },
    { icon: ListChecks, t: "f4_t", d: "f4_d" },
    { icon: TrendingUp, t: "f5_t", d: "f5_d" },
    { icon: LayoutDashboard, t: "f6_t", d: "f6_d" },
  ];

  const why = [
    { icon: Compass, t: "why_1_t", d: "why_1_d" },
    { icon: BookOpen, t: "why_2_t", d: "why_2_d" },
    { icon: GraduationCap, t: "why_3_t", d: "why_3_d" },
  ];

  const steps = [
    { icon: UserPlus, t: "s1_t", d: "s1_d" },
    { icon: Compass, t: "s2_t", d: "s2_d" },
    { icon: BookOpen, t: "s3_t", d: "s3_d" },
    { icon: Trophy, t: "s4_t", d: "s4_d" },
  ];

  const aiPoints = ["ai_1", "ai_2", "ai_3", "ai_4", "ai_5", "ai_6", "ai_7"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* ---------------------------------------------- Hero */}
        <section className="relative overflow-hidden bg-hero-gradient text-primary-foreground">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:py-28 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-4 py-1.5 text-xs font-medium">
                <Sparkles className="size-3.5" />
                {t("hero_badge")}
              </span>
              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
                {t("hero_title")}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-primary-foreground/85 md:text-lg">
                {t("hero_sub")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3" id="start">
                <Button size="lg" variant="secondary" className="font-semibold">
                  {t("hero_cta")}
                  <Arrow className="size-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/40 bg-transparent font-semibold text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  asChild
                >
                  <a href="#features">{t("hero_cta2")}</a>
                </Button>
              </div>

              <dl className="mt-12 grid max-w-md grid-cols-3 gap-6">
                {[
                  { v: "5", k: "stat_years" },
                  { v: "50+", k: "stat_subjects" },
                  { v: "24/7", k: "stat_ai" },
                ].map((s) => (
                  <div key={s.k}>
                    <dt className="text-2xl font-extrabold">{s.v}</dt>
                    <dd className="mt-1 text-xs text-primary-foreground/75">{t(s.k)}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative">
              <img
                src={heroImage}
                alt={t("tagline")}
                width={1280}
                height={960}
                className="w-full rounded-3xl border border-primary-foreground/15 shadow-soft"
              />
            </div>
          </div>
        </section>

        {/* ---------------------------------------------- Why */}
        <section id="why" className="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading title={t("why_title")} sub={t("why_sub")} />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {why.map((item) => (
              <article
                key={item.t}
                className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-soft"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <item.icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-bold">{t(item.t)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(item.d)}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------- Features */}
        <section id="features" className="border-y border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <SectionHeading title={t("features_title")} sub={t("features_sub")} />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <article key={f.t} className="rounded-2xl border border-border bg-card p-6">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-accent-gradient text-primary-foreground">
                    <f.icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold">{t(f.t)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(f.d)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------- AI assistant */}
        <section id="ai" className="mx-auto max-w-6xl px-4 py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground">
                <Sparkles className="size-3.5" />
                {t("ai_badge")}
              </span>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight md:text-4xl">
                {t("ai_title")}
              </h2>
              <p className="mt-3 text-muted-foreground">{t("ai_sub")}</p>
              <ul className="mt-8 space-y-3">
                {aiPoints.map((p) => (
                  <li key={p} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                    <span className="text-sm leading-relaxed">{t(p)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Simple chat mock-up illustrating the assistant */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <span className="flex size-10 items-center justify-center rounded-xl bg-accent-gradient text-primary-foreground">
                  <Bot className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-bold">InfoPath AI</p>
                  <p className="text-xs text-muted-foreground">{t("tagline")}</p>
                </div>
              </div>
              <div className="mt-5 space-y-4 text-sm">
                <p className="ms-auto w-fit max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground">
                  {t("ai_3")}
                </p>
                <p className="w-fit max-w-[90%] rounded-2xl bg-secondary px-4 py-2.5 text-secondary-foreground">
                  {t("ai_2")}
                </p>
                <p className="ms-auto w-fit max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground">
                  {t("ai_5")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------- How it works */}
        <section id="how" className="border-y border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <SectionHeading title={t("how_title")} sub={t("how_sub")} />
            <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <li key={s.t} className="relative rounded-2xl border border-border bg-card p-6">
                  <span className="absolute -top-3 inline-flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <s.icon className="mt-2 size-6 text-primary" />
                  <h3 className="mt-4 font-bold">{t(s.t)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(s.d)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------------------------------------------- Final CTA */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="rounded-3xl bg-hero-gradient px-6 py-14 text-center text-primary-foreground shadow-soft">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">{t("cta_title")}</h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">{t("cta_sub")}</p>
            <Button size="lg" variant="secondary" className="mt-8 font-semibold">
              {t("hero_cta")}
              <Arrow className="size-4" />
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/** Shared section heading used across the landing page. */
function SectionHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h2>
      <p className="mt-3 text-muted-foreground">{sub}</p>
    </div>
  );
}
