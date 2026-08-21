/**
 * _authenticated/placement.tsx — /placement
 * -------------------------------------------------------------
 * Step 1 of the InfoPath loop: the placement test.
 * The student answers questions grouped by skill; the score per skill
 * becomes the Skill Profile, which then feeds the AI recommendations.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { refreshRecommendations, saveSkillLevels } from "@/lib/skills";

export const Route = createFileRoute("/_authenticated/placement")({
  head: () => ({
    meta: [
      { title: "Placement test — InfoPath skill profile" },
      {
        name: "description",
        content:
          "Take the InfoPath placement test to build your skill profile and get a personalised AI learning path.",
      },
      { property: "og:title", content: "InfoPath Placement Test" },
      { property: "og:description", content: "Measure your IT skills and get a personal roadmap." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlacementPage,
});

function PlacementPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const data = useQuery({
    queryKey: ["placement-questions"],
    queryFn: async () => {
      const [questions, skills] = await Promise.all([
        supabase.from("placement_questions").select("*").order("sort_order"),
        supabase.from("skills").select("*").order("sort_order"),
      ]);
      if (questions.error) throw questions.error;
      if (skills.error) throw skills.error;
      return { questions: questions.data, skills: skills.data };
    },
  });

  const questions = data.data?.questions ?? [];
  const skills = data.data?.skills ?? [];
  const answered = Object.keys(answers).length;
  const pct = questions.length ? Math.round((answered / questions.length) * 100) : 0;

  async function submit() {
    if (!user) return;
    setSaving(true);
    try {
      // Score per skill = correct answers / questions of that skill.
      const totals: Record<string, { correct: number; total: number }> = {};
      for (const q of questions) {
        const bucket = (totals[q.skill_key] ??= { correct: 0, total: 0 });
        bucket.total += 1;
        if (answers[q.id] === q.correct_index) bucket.correct += 1;
      }
      const levels: Record<string, number> = {};
      for (const s of skills) {
        const b = totals[s.key];
        levels[s.key] = b && b.total ? Math.round((b.correct / b.total) * 100) : 0;
      }

      await saveSkillLevels(user.id, levels, "placement");
      queryClient.invalidateQueries({ queryKey: ["skill-profile", user.id] });

      toast.info(ar ? "جارٍ توليد التوصيات الذكية…" : "Generating AI recommendations…");
      await refreshRecommendations(user.id, ar ? "ar" : "en");
      queryClient.invalidateQueries({ queryKey: ["recommendations", user.id] });

      toast.success(ar ? "تم بناء ملف مهاراتك ومسارك" : "Your skill profile and path are ready");
      navigate({ to: "/dashboard" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(
        message === "NO_CREDITS"
          ? ar
            ? "رصيد الذكاء الاصطناعي غير كافٍ"
            : "AI credits exhausted"
          : message === "RATE_LIMIT"
            ? ar
              ? "طلبات كثيرة، حاول بعد قليل"
              : "Too many requests, try again shortly"
            : message,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <ClipboardCheck className="size-4" />
          {ar ? "الخطوة الأولى في مسارك" : "Step one of your path"}
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {ar ? "اختبار تحديد المستوى" : "Placement test"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {ar
            ? "أجب عن الأسئلة التالية لنقيس مستواك في كل مهارة، ثم يبني الذكاء الاصطناعي ملف مهاراتك ومسار تعلّم مخصص لك."
            : "Answer the questions below so we can measure each skill, then the AI builds your skill profile and a personalised learning path."}
        </p>
      </header>

      <div className="sticky top-0 z-10 rounded-xl border border-border/70 bg-card/95 p-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Progress value={pct} className="h-2" />
          <span className="shrink-0 text-xs text-muted-foreground">
            {answered}/{questions.length}
          </span>
        </div>
      </div>

      {data.isLoading ? (
        <p className="text-sm text-muted-foreground">{ar ? "جارِ التحميل…" : "Loading…"}</p>
      ) : (
        skills.map((skill) => {
          const list = questions.filter((q) => q.skill_key === skill.key);
          if (list.length === 0) return null;
          return (
            <section key={skill.key} className="rounded-2xl border border-border/70 bg-card p-5">
              <h2 className="text-lg font-bold">{ar ? skill.name_ar : skill.name_en}</h2>
              <div className="mt-4 space-y-5">
                {list.map((q, index) => {
                  const options = (ar ? q.options_ar : q.options_en) as string[];
                  return (
                    <div key={q.id}>
                      <p className="font-medium">
                        {index + 1}. {ar ? q.question_ar : q.question_en}
                      </p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {options.map((opt, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                            className={`rounded-xl border px-3 py-2 text-start text-sm transition-colors ${
                              answers[q.id] === i
                                ? "border-primary bg-primary/10 font-medium text-foreground"
                                : "border-border/70 hover:bg-secondary"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })
      )}

      <div className="flex items-center gap-3">
        <Button onClick={submit} disabled={saving || answered === 0}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {ar ? "احسب مستواي وابنِ مساري" : "Score me & build my path"}
        </Button>
        {answered < questions.length && (
          <span className="text-xs text-muted-foreground">
            {ar
              ? "الأسئلة غير المُجابة تُحتسب خطأ"
              : "Unanswered questions count as incorrect"}
          </span>
        )}
      </div>
    </div>
  );
}
