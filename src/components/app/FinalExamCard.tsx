/**
 * FinalExamCard.tsx
 * -------------------------------------------------------------
 * The exam the student takes right after finishing every step of the
 * current learning path. Questions come from the subjects that path
 * covered. Passing (>= PASS_SCORE) records the grade, feeds the skill profile
 * and unlocks the next path.
 */
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardCheck, Loader2, RotateCcw, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { PASS_SCORE, saveFinalExam, useFinalExamQuestions, useFinalExamResult } from "@/lib/final-exam";
import { useSession } from "@/lib/session";
import { applyGradedSubmissions } from "@/lib/submissions";

export function FinalExamCard({
  skillKey,
  skillName,
  subjectIds,
  onPassed,
}: {
  skillKey: string;
  skillName: string | null;
  subjectIds: string[];
  onPassed: () => void;
}) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const queryClient = useQueryClient();
  const questions = useFinalExamQuestions(subjectIds, true);
  const result = useFinalExamResult(user?.id, skillKey);

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [retake, setRetake] = useState(false);

  const list = questions.data ?? [];
  const answered = list.filter((q) => answers[q.id] !== undefined).length;
  const last = result.data;
  const showForm = retake || !last;

  async function submit() {
    if (!user || list.length === 0) return;
    setBusy(true);
    try {
      const correct = list.filter((q) => answers[q.id] === q.correct_index).length;
      const score = Math.round((correct / list.length) * 100);
      await saveFinalExam({
        userId: user.id,
        skillKey,
        subjectId: list[0]?.subject_id ?? null,
        title: ar ? `اختبار إنهاء مسار ${skillName ?? skillKey}` : `End-of-path exam: ${skillName ?? skillKey}`,
        score,
        correct,
        total: list.length,
      });
      await applyGradedSubmissions(user.id);
      setRetake(false);
      setAnswers({});
      queryClient.invalidateQueries({ queryKey: ["final-exam-result", user.id, skillKey] });
      queryClient.invalidateQueries({ queryKey: ["skill-profile", user.id] });
      queryClient.invalidateQueries({ queryKey: ["submissions", user.id] });
      if (score >= PASS_SCORE) {
        toast.success(ar ? `نجحت بنسبة ${score}% — المسار التالي مفتوح` : `Passed with ${score}% — next path unlocked`);
        onPassed();
      } else {
        toast.error(
          ar
            ? `نتيجتك ${score}% — أعد مراجعة المادة ثم أعد الاختبار.`
            : `You scored ${score}% — review the material and try again.`,
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-primary/40 bg-primary/5 p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold">
        <ClipboardCheck className="size-4 text-primary" />
        {ar ? "اختبار إنهاء المسار" : "End-of-path exam"}
        {skillName && <span className="text-muted-foreground">· {skillName}</span>}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {ar
          ? `أنهيت كل خطوات المسار — اجتز هذا الاختبار بنسبة ${PASS_SCORE}% لفتح المسار التالي.`
          : `You finished every step — pass this exam with ${PASS_SCORE}% to unlock the next path.`}
      </p>

      {questions.isLoading ? (
        <Loader2 className="mt-3 size-5 animate-spin text-muted-foreground" />
      ) : list.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {ar
            ? "لا توجد أسئلة منشورة لمواد هذا المسار بعد — تواصل مع الأستاذ."
            : "No published questions for this path's subjects yet — ask your instructor."}
        </p>
      ) : !showForm && last ? (
        <div className="mt-3 space-y-2">
          <p className={`flex items-center gap-2 text-sm font-semibold ${last.passed ? "text-primary" : "text-destructive"}`}>
            {last.passed ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
            {ar ? "نتيجتك" : "Your score"}: {last.grade ?? 0}% —{" "}
            {last.passed ? (ar ? "ناجح" : "Passed") : ar ? "تحتاج إعادة" : "Retake needed"}
          </p>
          <Button size="sm" variant="outline" onClick={() => setRetake(true)}>
            <RotateCcw className="size-4" />
            {ar ? "إعادة الاختبار" : "Retake exam"}
          </Button>
        </div>
      ) : (
        <div className="mt-3 space-y-4">
          {list.map((q, i) => {
            const options = ar ? q.options_ar : q.options_en;
            return (
              <div key={q.id} className="rounded-lg border border-border/70 bg-card p-3">
                <p className="text-sm font-medium">
                  {i + 1}. {ar ? q.question_ar : q.question_en}
                </p>
                <div className="mt-2 grid gap-1.5">
                  {options.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: idx }))}
                      className={`rounded-lg border px-3 py-2 text-start text-sm transition-colors ${
                        answers[q.id] === idx
                          ? "border-primary bg-primary/10 font-medium"
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
          <Button size="sm" onClick={submit} disabled={busy || answered < list.length}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ClipboardCheck className="size-4" />}
            {ar ? `إرسال الإجابات (${answered}/${list.length})` : `Submit answers (${answered}/${list.length})`}
          </Button>
        </div>
      )}
    </div>
  );
}
