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
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Flag,
  FolderGit2,
  Loader2,
  RefreshCw,
  Route as RouteIcon,
  Swords,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n";
import {
  rebuildLearningPath,
  setPathItemStatus,
  TARGET_LEVEL,
  useLearningGoals,
  useLearningPath,
  useSkillSnapshots,
  type PathItem,
} from "@/lib/learning-path";
import { useSession } from "@/lib/session";
import { useSkillProfile, useSkills } from "@/lib/skills";

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

/** The ordered personalised learning path. */
export function LearningPathCard() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const queryClient = useQueryClient();
  const path = useLearningPath(user?.id);
  const skills = useSkills();
  const profile = useSkillProfile(user?.id);
  const [busy, setBusy] = useState(false);

  const items = path.data ?? [];
  const doneCount = items.filter((i) => i.status === "done").length;
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;
  const hasProfile = (profile.data?.length ?? 0) > 0;

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

  async function toggle(item: PathItem) {
    await setPathItemStatus(item.id, item.status === "done" ? "todo" : "done");
    queryClient.invalidateQueries({ queryKey: ["learning-path", user?.id] });
  }

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

      {!hasProfile ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {ar
            ? "أنهِ اختبار تحديد المستوى أولاً."
            : "Finish the placement test first."}
        </p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {ar
            ? "اضغط «إعادة البناء» لتوليد خطوات المسار من محتوى المنصة."
            : "Press “Rebuild” to generate the steps from the platform content."}
        </p>
      ) : (
        <ol className="mt-4 space-y-3">
          {items.map((item, index) => {
            const Icon = stepIcon[item.item_type] ?? BookOpen;
            const skill = (skills.data ?? []).find((s) => s.key === item.skill_key);
            const body = ar ? item.body_ar : item.body_en;
            const isLink = typeof body === "string" && body.startsWith("http");
            return (
              <li
                key={item.id}
                className={`rounded-xl border border-border/70 p-4 ${item.status === "done" ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-semibold">
                      <span className="text-xs text-muted-foreground">{index + 1}.</span>
                      <Icon className="size-4 text-primary" />
                      {ar ? item.title_ar : item.title_en}
                    </p>
                    {body && !isLink && (
                      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                    )}
                    {isLink && (
                      <a
                        href={body}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block truncate text-sm text-primary underline"
                      >
                        {body}
                      </a>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-md bg-secondary px-2 py-0.5">{item.item_type}</span>
                      <span className="rounded-md bg-secondary px-2 py-0.5">{item.level}</span>
                      {skill && (
                        <span className="rounded-md bg-secondary px-2 py-0.5">
                          {ar ? skill.name_ar : skill.name_en}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant={item.status === "done" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => toggle(item)}
                  >
                    <CheckCircle2 className="size-4" />
                    {item.status === "done" ? (ar ? "منجز" : "Done") : ar ? "تم" : "Mark done"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        {ar
          ? "المسار = محتوى أساسي مخصص لك. التوصيات = مواد إضافية اختيارية."
          : "Path = your required personalised content. Recommendations = optional extras."}
      </p>
      <Button variant="ghost" size="sm" className="mt-2" asChild>
        <Link to="/subjects">{ar ? "تصفح كل المواد" : "Browse all subjects"}</Link>
      </Button>
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
