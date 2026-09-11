/**
 * StudentProgressCard.tsx
 * -------------------------------------------------------------
 * Instructor / admin view of the students who submitted work in their
 * subjects: skill profile (weakest first), current learning goal,
 * learning-path completion and the average grade of graded submissions.
 */
import { Loader2, TrendingUp, Users } from "lucide-react";

import { useI18n } from "@/lib/i18n";
import { useSkills } from "@/lib/skills";
import { useStudentsProgress } from "@/lib/submissions";

export function StudentProgressCard({ subjectIds }: { subjectIds: string[] }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const students = useStudentsProgress(subjectIds);
  const skills = useSkills();

  const skillName = (key: string) => {
    const s = (skills.data ?? []).find((x) => x.key === key);
    return s ? (ar ? s.name_ar : s.name_en) : key;
  };

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Users className="size-5 text-primary" />
        {ar ? "نتائج تقدّم الطلاب" : "Student progress results"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {ar
          ? "مستوى كل طالب في المهارات، هدفه الحالي، وما أنجزه من مسار التعلّم."
          : "Each student's skill levels, current goal and learning-path completion."}
      </p>

      {students.isLoading ? (
        <Loader2 className="mt-4 size-5 animate-spin text-muted-foreground" />
      ) : (students.data ?? []).length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {ar ? "لا يوجد طلاب سلّموا أعمالاً بعد." : "No students have submitted work yet."}
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {(students.data ?? []).map((s) => (
            <div key={s.userId} className="rounded-xl border border-border/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{s.name ?? (ar ? "طالب" : "Student")}</p>
                  {s.currentGoal && (
                    <p className="text-xs text-muted-foreground">
                      {ar ? "الهدف الحالي" : "Current goal"}: {skillName(s.currentGoal)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="rounded-md bg-secondary px-2 py-0.5">
                    {ar ? "المسار" : "Path"}: {s.pathDone}/{s.pathTotal}
                  </span>
                  {s.averageGrade !== null && (
                    <span className="flex items-center gap-1 rounded-md bg-primary/15 px-2 py-0.5 font-semibold text-primary">
                      <TrendingUp className="size-3.5" />
                      {ar ? "المعدل" : "Avg"}: {s.averageGrade}/100
                    </span>
                  )}
                </div>
              </div>

              {s.skills.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {s.skills.map((k) => (
                    <div key={k.skill_key} className="flex items-center gap-2">
                      <span className="w-36 shrink-0 truncate text-xs text-muted-foreground">
                        {skillName(k.skill_key)}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(100, Math.max(0, k.level))}%` }}
                        />
                      </div>
                      <span className="w-9 text-end text-xs font-semibold">{k.level}%</span>
                    </div>
                  ))}
                </div>
              )}

              {s.submissions.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {s.submissions.slice(0, 4).map((sub) => (
                    <li key={sub.id} className="truncate">
                      • {sub.title} — {sub.grade !== null ? `${sub.grade}/100` : sub.status}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
