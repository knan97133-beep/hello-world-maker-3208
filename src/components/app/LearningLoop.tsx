/**
 * LearningLoop.tsx
 * -------------------------------------------------------------
 * Dashboard widgets for the connected InfoPath loop:
 *   Skill Profile (levels per skill)  +  AI Recommendations (learning path).
 * Both read from `skill_profile` / `recommendations` and offer a button to
 * regenerate the path from the latest assessment results.
 */
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, RefreshCw, Sparkles, Target } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { refreshRecommendations, useRecommendations, useSkillProfile, useSkills } from "@/lib/skills";

/** Bars showing the student's measured level in every skill. */
export function SkillProfileCard() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const skills = useSkills();
  const profile = useSkillProfile(user?.id);

  const levels = new Map((profile.data ?? []).map((r) => [r.skill_key, r.level]));
  const hasProfile = (profile.data?.length ?? 0) > 0;

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Target className="size-5 text-primary" />
          {ar ? "ملف مهاراتي" : "Skill Profile"}
        </h2>
        <Button variant={hasProfile ? "ghost" : "default"} size="sm" asChild>
          <Link to="/placement">
            {hasProfile
              ? ar
                ? "إعادة الاختبار"
                : "Retake test"
              : ar
                ? "اختبار تحديد المستوى"
                : "Take placement test"}
          </Link>
        </Button>
      </div>

      {!hasProfile ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {ar
            ? "لم تُحدد مستواك بعد. ابدأ باختبار تحديد المستوى ليبني الذكاء الاصطناعي مسارك."
            : "No level measured yet. Take the placement test so the AI can build your path."}
        </p>
      ) : (
        <>
          <p className="mt-3 text-xs text-muted-foreground">
            {ar
              ? "المهارات مرتبة من الأضعف إلى الأقوى — تبدأ من الأضعف، وعند التساوي تبدأ بالمهارة الأساس."
              : "Skills are ordered weakest first — ties start from the more foundational skill."}
          </p>
          <ul className="mt-4 space-y-3">
            {[...(skills.data ?? [])]
              .sort((a, b) => {
                const la = levels.get(a.key) ?? 0;
                const lb = levels.get(b.key) ?? 0;
                return la - lb || a.sort_order - b.sort_order;
              })
              .map((s, index) => {
                const level = levels.get(s.key) ?? 0;
                return (
                  <li key={s.key}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium">
                        {ar ? s.name_ar : s.name_en}
                        {index === 0 && (
                          <span className="ms-2 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                            {ar ? "ابدأ من هنا" : "Start here"}
                          </span>
                        )}
                      </span>
                      <span className="text-muted-foreground">{level}%</span>
                    </div>
                    <Progress value={level} className="h-2" />
                  </li>
                );
              })}
          </ul>
        </>
      )}

    </section>
  );
}

/** The AI-generated learning path, ordered by priority. */
export function RecommendationsCard() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const queryClient = useQueryClient();
  const recs = useRecommendations(user?.id);
  const profile = useSkillProfile(user?.id);
  const [busy, setBusy] = useState(false);

  async function regenerate() {
    if (!user) return;
    setBusy(true);
    try {
      await refreshRecommendations(user.id, ar ? "ar" : "en");
      queryClient.invalidateQueries({ queryKey: ["recommendations", user.id] });
      toast.success(ar ? "تم تحديث توصياتك" : "Recommendations updated");
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
      setBusy(false);
    }
  }

  async function toggleDone(id: string, done: boolean) {
    const { error } = await supabase.from("recommendations").update({ done }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["recommendations", user?.id] });
  }

  const list = recs.data ?? [];
  const canGenerate = (profile.data?.length ?? 0) > 0;

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Sparkles className="size-5 text-primary" />
          {ar ? "مسار التعلّم المقترح" : "Personalized learning path"}
        </h2>
        <Button variant="ghost" size="sm" onClick={regenerate} disabled={busy || !canGenerate}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          {ar ? "تحديث" : "Refresh"}
        </Button>
      </div>

      {!canGenerate ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {ar
            ? "أنهِ اختبار تحديد المستوى أولاً للحصول على توصيات."
            : "Finish the placement test first to get recommendations."}
        </p>
      ) : list.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {ar ? "اضغط تحديث لتوليد توصياتك." : "Press refresh to generate your recommendations."}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {list.map((r) => (
            <li
              key={r.id}
              className={`rounded-xl border border-border/70 p-4 ${r.done ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{ar ? r.title_ar : r.title_en}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{ar ? r.body_ar : r.body_en}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-md bg-secondary px-2 py-0.5">{r.action_type}</span>
                    {r.skill_key && (
                      <span className="rounded-md bg-secondary px-2 py-0.5">{r.skill_key}</span>
                    )}
                    <span>
                      {ar ? "الأولوية" : "Priority"} {r.priority}
                    </span>
                  </div>
                </div>
                <Button
                  variant={r.done ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => toggleDone(r.id, !r.done)}
                >
                  <CheckCircle2 className="size-4" />
                  {r.done ? (ar ? "منجز" : "Done") : ar ? "تم" : "Mark done"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
