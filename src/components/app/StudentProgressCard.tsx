/**
 * StudentProgressCard.tsx
 * -------------------------------------------------------------
 * Instructor / admin follow-up view: for every student who works in their
 * subjects they see the skill profile (weakest first), the current learning
 * goal, the step the student is working on right now, the progress updates the
 * student posted — and they can reply to those updates directly.
 */
import { useQueryClient } from "@tanstack/react-query";
import { Clock, Loader2, Send, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { sendPathUpdate } from "@/lib/learning-path";
import { useSession } from "@/lib/session";
import { useSkills } from "@/lib/skills";
import { useStudentsProgress } from "@/lib/submissions";

function daysSince(date: string | null | undefined) {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
}

function ReplyBox({ studentId, ar }: { studentId: string; ar: boolean }) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!user || !text.trim()) return;
    setBusy(true);
    try {
      await sendPathUpdate({
        studentId,
        authorId: user.id,
        pathItemId: null,
        skillKey: null,
        percent: 0,
        body: text,
      });
      setText("");
      queryClient.invalidateQueries({ queryKey: ["students-progress"] });
      toast.success(ar ? "تم إرسال ملاحظتك للطالب" : "Your note was sent to the student");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2">
      <Textarea
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={ar ? "اكتب ملاحظة أو سؤال للطالب…" : "Write a note or a question for the student…"}
      />
      <Button size="sm" className="mt-2" onClick={send} disabled={busy || !text.trim()}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {ar ? "إرسال" : "Send"}
      </Button>
    </div>
  );
}

export function StudentProgressCard({ subjectIds }: { subjectIds: string[] }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
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
        {ar ? "متابعة تقدّم الطلاب" : "Student follow-up"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {ar
          ? "الخطوة التي يعمل عليها كل طالب الآن، تحديثاته، ومستواه في المهارات — ويمكنك الرد عليه."
          : "What each student is working on now, their updates and skill levels — and you can reply."}
      </p>

      {students.isLoading ? (
        <Loader2 className="mt-4 size-5 animate-spin text-muted-foreground" />
      ) : (students.data ?? []).length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {ar ? "لا يوجد طلاب سلّموا أعمالاً بعد." : "No students have submitted work yet."}
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {(students.data ?? []).map((s) => {
            const idleDays = daysSince(s.lastUpdate?.created_at ?? s.currentStep?.started_at ?? null);
            const stalled = idleDays !== null && idleDays >= 7;
            return (
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

                {s.currentStep && (
                  <div className="mt-3 rounded-lg bg-secondary/40 px-3 py-2 text-sm">
                    <p className="font-medium">
                      {ar ? "يعمل الآن على" : "Working on"}:{" "}
                      {ar ? s.currentStep.title_ar : s.currentStep.title_en}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {s.currentStep.progress_percent ?? 0}% ·{" "}
                      {s.currentStep.started_at
                        ? ar
                          ? `بدأ منذ ${daysSince(s.currentStep.started_at)} يوم`
                          : `started ${daysSince(s.currentStep.started_at)} day(s) ago`
                        : ar
                          ? "لم يبدأ بعد"
                          : "not started yet"}
                    </p>
                  </div>
                )}

                {stalled && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-destructive">
                    <Clock className="size-3.5" />
                    {ar
                      ? `بلا أي تحديث منذ ${idleDays} يوم — تابعه.`
                      : `No update for ${idleDays} days — follow up.`}
                  </p>
                )}

                {s.updates.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {s.updates.map((u) => (
                      <div
                        key={u.id}
                        className={`rounded-lg px-3 py-2 text-sm ${
                          u.author_id === user?.id ? "bg-primary/10" : "border border-border/70 bg-card"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{u.body}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {u.author_id === user?.id ? (ar ? "أنا" : "Me") : (s.name ?? (ar ? "الطالب" : "Student"))}{" "}
                          · {u.percent}% · {new Date(u.created_at).toLocaleString(ar ? "ar" : "en")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <ReplyBox studentId={s.userId} ar={ar} />

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
            );
          })}
        </div>
      )}
    </section>
  );
}
