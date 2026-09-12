/**
 * PathCards.tsx
 * -------------------------------------------------------------
 * Dashboard widgets for the personalised part of the loop:
 *   - CurrentGoalCard  : the skill the student is working on right now
 *   - LearningPathCard : the ordered steps (course -> challenge -> project -> assessment)
 *   - ProgressEvolutionCard : Initial vs Current vs Final skill profile
 *
 * The path only contains published content the instructor linked to a skill,
 * so it is never a random list of links.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Flag,
  FolderGit2,
  Loader2,
  MessageSquare,
  PlayCircle,
  RefreshCw,
  Route as RouteIcon,
  Send,
  Swords,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

import {
  rebuildLearningPath,
  sendPathUpdate,
  setPathItemStatus,
  TARGET_LEVEL,
  useLearningGoals,
  useLearningPath,
  usePathUpdates,
  useSkillSnapshots,
  type PathItem,
} from "@/lib/learning-path";
import { useSession } from "@/lib/session";
import { useSkillProfile, useSkills } from "@/lib/skills";
import { advanceLearningPath, applyGradedSubmissions, useMySubmissions } from "@/lib/submissions";


const stepIcon = {
  resource: BookOpen,
  challenge: Swords,
  project: FolderGit2,
  quiz: ClipboardCheck,
} as const;

/** The single most important goal right now (weakest skill). */
export function CurrentGoalCard() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const goals = useLearningGoals(user?.id);
  const profile = useSkillProfile(user?.id);
  const skills = useSkills();

  const active = (goals.data ?? []).filter((g) => g.status === "active");
  const goal = active[0];
  const levels = new Map((profile.data ?? []).map((r) => [r.skill_key, r.level]));
  const skill = (skills.data ?? []).find((s) => s.key === goal?.skill_key);
  const now = goal ? (levels.get(goal.skill_key) ?? 0) : 0;

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Flag className="size-5 text-primary" />
        {ar ? "هدف التعلّم الحالي" : "Current learning goal"}
      </h2>

      {!goal ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {ar
            ? "لا يوجد هدف بعد — أنهِ اختبار تحديد المستوى ليُبنى لك مسار."
            : "No goal yet — finish the placement test to get a path."}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-2xl font-extrabold">{ar ? skill?.name_ar : skill?.name_en}</p>
          <div className="flex items-center gap-3">
            <Progress value={now} className="h-2" />
            <span className="shrink-0 text-sm text-muted-foreground">
              {now}% → {goal.target_level ?? TARGET_LEVEL}%
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {ar
              ? `بدأت من ${goal.start_level}% — تابع خطوات المسار بالأسفل للوصول إلى الهدف.`
              : `Started at ${goal.start_level}% — follow the path below to reach the target.`}
          </p>
          {active.length > 1 && (
            <p className="text-xs text-muted-foreground">
              {ar ? "أهداف أخرى:" : "Other goals:"}{" "}
              {active
                .slice(1)
                .map((g) => {
                  const s = (skills.data ?? []).find((x) => x.key === g.skill_key);
                  return ar ? s?.name_ar : s?.name_en;
                })
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

/** The ordered personalised learning path (one active path at a time). */
export function LearningPathCard() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const queryClient = useQueryClient();
  const path = useLearningPath(user?.id);
  const goals = useLearningGoals(user?.id);
  const skills = useSkills();
  const profile = useSkillProfile(user?.id);
  const subjects = useQuery({
    queryKey: ["path-subjects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("id, code, name_ar, name_en");
      if (error) throw error;
      return data;
    },
  });

  const [busy, setBusy] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const all = path.data ?? [];
  const currentGoal = (goals.data ?? []).filter((g) => g.status === "active")[0];
  // Only ONE path is visible: the steps of the current goal.
  const scoped = currentGoal ? all.filter((i) => i.skill_key === currentGoal.skill_key) : [];
  const items = scoped.length > 0 ? scoped : all;
  const doneCount = items.filter((i) => i.status === "done").length;
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;
  const hasProfile = (profile.data?.length ?? 0) > 0;
  const allDone = items.length > 0 && doneCount === items.length;

  // Graded instructor feedback feeds the skill profile before anything else.
  useEffect(() => {
    if (!user) return;
    applyGradedSubmissions(user.id)
      .then((n) => {
        if (n > 0) {
          queryClient.invalidateQueries({ queryKey: ["skill-profile", user.id] });
          queryClient.invalidateQueries({ queryKey: ["progress", user.id] });
        }
      })
      .catch(() => undefined);
  }, [user, queryClient]);

  async function goNext() {
    if (!user) return;
    setAdvancing(true);
    try {
      const moved = await advanceLearningPath(user.id, ar ? "ar" : "en");
      queryClient.invalidateQueries({ queryKey: ["learning-path", user.id] });
      queryClient.invalidateQueries({ queryKey: ["learning-goals", user.id] });
      queryClient.invalidateQueries({ queryKey: ["recommendations", user.id] });
      queryClient.invalidateQueries({ queryKey: ["skill-snapshots", user.id] });
      toast.success(
        moved
          ? ar
            ? "تم فتح المسار التالي حسب أولويات الذكاء الاصطناعي"
            : "Next path opened based on the AI priority"
          : ar
            ? "أكمل كل خطوات المسار الحالي أولاً"
            : "Finish every step of the current path first",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setAdvancing(false);
    }
  }

  async function rebuild() {
    if (!user) return;
    setBusy(true);
    try {
      const n = await rebuildLearningPath(user.id);
      queryClient.invalidateQueries({ queryKey: ["learning-path", user.id] });
      queryClient.invalidateQueries({ queryKey: ["learning-goals", user.id] });
      toast.success(
        n === 0
          ? ar
            ? "لا يوجد محتوى منشور مرتبط بمهاراتك الضعيفة بعد"
            : "No published content linked to your weak skills yet"
          : ar
            ? "تم تحديث مسارك"
            : "Your path was updated",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  const invalidatePath = () =>
    queryClient.invalidateQueries({ queryKey: ["learning-path", user?.id] });


  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <RouteIcon className="size-5 text-primary" />
          {ar ? "مسار التعلّم الشخصي" : "Personalized learning path"}
        </h2>
        <Button variant="ghost" size="sm" onClick={rebuild} disabled={busy || !hasProfile}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          {ar ? "إعادة البناء" : "Rebuild"}
        </Button>
      </div>

      {items.length > 0 && (
        <div className="mt-4 flex items-center gap-3">
          <Progress value={pct} className="h-2" />
          <span className="shrink-0 text-xs text-muted-foreground">
            {doneCount}/{items.length}
          </span>
        </div>
      )}

      {allDone && (
        <div className="mt-4 rounded-xl border border-primary/40 bg-primary/5 p-4">
          <p className="text-sm font-semibold">
            {ar
              ? "أنهيت المسار الحالي — جاهز للانتقال إلى المهارة التالية."
              : "Current path finished — ready to move to the next skill."}
          </p>
          <Button size="sm" className="mt-2" onClick={goNext} disabled={advancing}>
            {advancing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowRight className="size-4" />
            )}
            {ar ? "المسار التالي" : "Next path"}
          </Button>
        </div>
      )}


      {!hasProfile ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {ar
            ? "أنهِ اختبار تحديد المستوى أولاً."
            : "Finish the placement test first."}
        </p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {ar
            ? "مسار هذه المهارة قيد التجهيز من الأستاذ — سيظهر هنا فور نشره."
            : "Your instructor is still preparing this skill's path — it appears here once published."}
        </p>
      ) : (
        <ol className="mt-4 space-y-3">
          {items.map((item, index) => (
            <PathStep
              key={item.id}
              item={item}
              index={index}
              ar={ar}
              subject={(subjects.data ?? []).find((s) => s.id === item.subject_id) ?? null}
              skillName={(() => {
                const s = (skills.data ?? []).find((x) => x.key === item.skill_key);
                return s ? (ar ? s.name_ar : s.name_en) : null;
              })()}
              onChanged={invalidatePath}
            />
          ))}
        </ol>
      )}


      <p className="mt-4 text-xs text-muted-foreground">
        {ar
          ? "المسار مبني من محتوى نشره الأستاذ لمهارتك الأضعف — انقر على أي خطوة لفتح المادة."
          : "The path is built from the content your instructor published for your weakest skill — click a step to open the subject."}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/subjects">{ar ? "تصفح كل المواد" : "Browse all subjects"}</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/placement">{ar ? "إعادة الاختبار لقياس تقدمي" : "Retake test to measure progress"}</Link>
        </Button>
      </div>

    </section>
  );
}

/** Initial vs current vs final skill profile — the "student evolution" view. */
export function ProgressEvolutionCard() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const snapshots = useSkillSnapshots(user?.id);
  const skills = useSkills();
  const profile = useSkillProfile(user?.id);

  const byPhase = (phase: string) =>
    new Map(
      (snapshots.data ?? []).filter((s) => s.phase === phase).map((s) => [s.skill_key, s.level]),
    );
  const initial = byPhase("initial");
  const final = byPhase("final");
  const current = new Map((profile.data ?? []).map((r) => [r.skill_key, r.level]));
  const hasInitial = initial.size > 0;

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <TrendingUp className="size-5 text-primary" />
        {ar ? "تطوّر مستواي" : "My progress evolution"}
      </h2>

      {!hasInitial ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {ar
            ? "سيظهر التطور بعد اختبار تحديد المستوى الأول."
            : "Your evolution appears after the first placement test."}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-xs text-muted-foreground">
                <th className="py-1 text-start">{ar ? "المهارة" : "Skill"}</th>
                <th className="py-1 text-start">{ar ? "البداية" : "Initial"}</th>
                <th className="py-1 text-start">{ar ? "الحالي" : "Current"}</th>
                <th className="py-1 text-start">{ar ? "النهائي" : "Final"}</th>
                <th className="py-1 text-start">{ar ? "الفرق" : "Δ"}</th>
              </tr>
            </thead>
            <tbody>
              {(skills.data ?? []).map((s) => {
                const a = initial.get(s.key) ?? 0;
                const c = current.get(s.key) ?? 0;
                const f = final.get(s.key);
                const delta = (f ?? c) - a;
                return (
                  <tr key={s.key} className="border-t border-border/60">
                    <td className="py-2 font-medium">{ar ? s.name_ar : s.name_en}</td>
                    <td className="py-2 text-muted-foreground">{a}%</td>
                    <td className="py-2">{c}%</td>
                    <td className="py-2 text-muted-foreground">{f === undefined ? "—" : `${f}%`}</td>
                    <td
                      className={`py-2 font-semibold ${delta > 0 ? "text-primary" : delta < 0 ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      {delta > 0 ? "+" : ""}
                      {delta}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
