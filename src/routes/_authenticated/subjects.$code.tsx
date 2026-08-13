/**
 * _authenticated/subjects.$code.tsx — /subjects/:code
 * -------------------------------------------------------------
 * Subject detail: description, skills, resources (courses / videos /
 * books), projects, challenges, a short quiz and the student's
 * completion percentage. Every checkbox writes to `progress`.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BookMarked, CheckCircle2, Circle, ExternalLink, Lock, Video } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { PASS_MARK, useUnlockState } from "@/lib/unlock";

export const Route = createFileRoute("/_authenticated/subjects/$code")({
  head: () => ({
    meta: [
      { title: "Subject details — InfoPath" },
      {
        name: "description",
        content:
          "Courses, videos, books, projects, coding challenges and a quiz for this IT subject, with live progress tracking.",
      },
      { property: "og:title", content: "Subject details — InfoPath" },
      {
        property: "og:description",
        content: "Everything you need to master this subject in one page.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SubjectDetail,
});

function SubjectDetail() {
  const { code } = Route.useParams();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const queryClient = useQueryClient();
  const unlock = useUnlockState(user?.id);



  const subject = useQuery({
    queryKey: ["subject", code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("code", code)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const subjectId = subject.data?.id;

  const content = useQuery({
    queryKey: ["subject-content", subjectId],
    enabled: Boolean(subjectId),
    queryFn: async () => {
      const [resources, projects, challenges, questions] = await Promise.all([
        supabase.from("resources").select("*").eq("subject_id", subjectId!).order("sort_order"),
        supabase.from("projects").select("*").eq("subject_id", subjectId!).order("sort_order"),
        supabase.from("challenges").select("*").eq("subject_id", subjectId!).order("sort_order"),
        supabase
          .from("quiz_questions")
          .select("*")
          .eq("subject_id", subjectId!)
          .order("sort_order"),
      ]);
      const err =
        resources.error || projects.error || challenges.error || questions.error;
      if (err) throw err;
      return {
        resources: resources.data ?? [],
        projects: projects.data ?? [],
        challenges: challenges.data ?? [],
        questions: questions.data ?? [],
      };
    },
  });

  const progress = useQuery({
    queryKey: ["subject-progress", subjectId, user?.id],
    enabled: Boolean(subjectId && user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("progress")
        .select("*")
        .eq("subject_id", subjectId!)
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
  });

  const toggle = useMutation({
    mutationFn: async (input: {
      itemType: "resource" | "project" | "challenge";
      itemId: string;
      done: boolean;
    }) => {
      if (!user || !subjectId) return;
      if (input.done) {
        const { error } = await supabase
          .from("progress")
          .delete()
          .eq("user_id", user.id)
          .eq("item_type", input.itemType)
          .eq("item_id", input.itemId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("progress").insert({
          user_id: user.id,
          subject_id: subjectId,
          item_type: input.itemType,
          item_id: input.itemId,
          completed: true,
        });
        if (error) throw error;
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["subject-progress", subjectId, user?.id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const isDone = (id: string) =>
    Boolean(progress.data?.some((p) => p.item_id === id && p.completed));

  if (subject.isLoading) {
    return <p className="text-sm text-muted-foreground">{ar ? "جارِ التحميل…" : "Loading…"}</p>;
  }
  if (!subject.data) {
    return (
      <div className="space-y-3">
        <p>{ar ? "المادة غير موجودة." : "Subject not found."}</p>
        <Button asChild variant="outline">
          <Link to="/subjects">{ar ? "العودة للمواد" : "Back to subjects"}</Link>
        </Button>
      </div>
    );
  }

  const s = subject.data;

  // Sequential progression: a locked term cannot be opened yet.
  if (!unlock.loading && !unlock.isUnlocked(s.year, s.semester)) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border/70 bg-card p-8 text-center">
        <Lock className="mx-auto size-8 text-muted-foreground" />
        <h1 className="mt-3 text-xl font-bold">{ar ? "هذه المادة مقفلة" : "This subject is locked"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {ar
            ? `لفتح السنة ${s.year} / الفصل ${s.semester} عليك اجتياز اختبارات الفصل السابق بعلامة ${PASS_MARK}% على الأقل.`
            : `To open Year ${s.year} / Semester ${s.semester} you must pass every quiz of the previous term with at least ${PASS_MARK}%.`}
        </p>
        <Button asChild className="mt-5">
          <Link to="/subjects">{ar ? "العودة للمواد" : "Back to subjects"}</Link>
        </Button>
      </div>
    );
  }

  const total =
    (content.data?.resources.length ?? 0) +
    (content.data?.projects.length ?? 0) +
    (content.data?.challenges.length ?? 0);
  const completed = progress.data?.filter((p) => p.completed && p.item_type !== "quiz").length ?? 0;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-border/70 bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-mono">{s.code}</span>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
              {ar ? s.name_ar : s.name_en}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {ar ? `السنة ${s.year} · الفصل ${s.semester}` : `Year ${s.year} · Semester ${s.semester}`}
            </p>
          </div>
          <div className="min-w-[160px]">
            <p className="mb-1 text-sm text-muted-foreground">
              {ar ? "نسبة الإنجاز" : "Completion"} — {percent}%
            </p>
            <Progress value={percent} className="h-2" />
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {ar ? s.description_ar : s.description_en}
        </p>
        {s.skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {s.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Resources */}
      <Section title={ar ? "الكورسات والفيديوهات والكتب" : "Courses, videos & books"}>
        {content.data?.resources.length ? (
          <ul className="space-y-2">
            {content.data.resources.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-4"
              >
                <button
                  onClick={() =>
                    toggle.mutate({ itemType: "resource", itemId: r.id, done: isDone(r.id) })
                  }
                  className="flex min-w-0 items-center gap-3 text-start"
                >
                  {isDone(r.id) ? (
                    <CheckCircle2 className="size-5 shrink-0 text-primary" />
                  ) : (
                    <Circle className="size-5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{ar ? r.title_ar : r.title_en}</span>
                    <span className="block text-xs text-muted-foreground">
                      {r.kind === "video" ? <Video className="me-1 inline size-3" /> : null}
                      {r.kind === "book" ? <BookMarked className="me-1 inline size-3" /> : null}
                      {r.provider}
                      {r.duration_hours ? ` · ${r.duration_hours}h` : ""}
                    </span>
                  </span>
                </button>
                {r.url && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-primary"
                    aria-label="Open resource"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <Empty ar={ar} />
        )}
      </Section>

      {/* Projects */}
      <Section title={ar ? "مشاريع عملية" : "Practical projects"}>
        {content.data?.projects.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {content.data.projects.map((p) => (
              <button
                key={p.id}
                onClick={() => toggle.mutate({ itemType: "project", itemId: p.id, done: isDone(p.id) })}
                className="rounded-xl border border-border/70 bg-card p-4 text-start transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{ar ? p.title_ar : p.title_en}</span>
                  {isDone(p.id) ? (
                    <CheckCircle2 className="size-5 text-primary" />
                  ) : (
                    <Circle className="size-5 text-muted-foreground" />
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {ar ? p.description_ar : p.description_en}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {p.level} · {p.points} {ar ? "نقطة" : "pts"}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <Empty ar={ar} />
        )}
      </Section>

      {/* Challenges */}
      <Section title={ar ? "تحديات برمجية" : "Coding challenges"}>
        {content.data?.challenges.length ? (
          <ul className="space-y-2">
            {content.data.challenges.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() =>
                    toggle.mutate({ itemType: "challenge", itemId: c.id, done: isDone(c.id) })
                  }
                  className="flex w-full items-start gap-3 rounded-xl border border-border/70 bg-card p-4 text-start"
                >
                  {isDone(c.id) ? (
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                  ) : (
                    <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                  )}
                  <span>
                    <span className="block font-medium">{ar ? c.title_ar : c.title_en}</span>
                    <span className="block text-sm text-muted-foreground">
                      {ar ? c.prompt_ar : c.prompt_en}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <Empty ar={ar} />
        )}
      </Section>

      {/* Quiz */}
      <Section title={ar ? "اختبار قصير" : "Quick quiz"}>
        {content.data?.questions.length ? (
          <Quiz
            ar={ar}
            questions={content.data.questions}
            onFinish={async (correct, totalQuestions) => {
              if (!user || !subjectId) return;
              // Stored as a percentage so unlocking rules can compare it to PASS_MARK.
              const percentScore = Math.round((correct / totalQuestions) * 100);
              const { error } = await supabase.from("progress").upsert(
                {
                  user_id: user.id,
                  subject_id: subjectId,
                  item_type: "quiz",
                  item_id: subjectId,
                  completed: true,
                  score: percentScore,
                },
                { onConflict: "user_id,item_type,item_id" },
              );
              if (error) {
                toast.error(error.message);
                return;
              }
              queryClient.invalidateQueries({ queryKey: ["subject-progress", subjectId, user.id] });
              queryClient.invalidateQueries({ queryKey: ["unlock-state", user.id] });
              toast[percentScore >= PASS_MARK ? "success" : "error"](
                percentScore >= PASS_MARK
                  ? ar
                    ? `نجحت بعلامة ${percentScore}%`
                    : `Passed with ${percentScore}%`
                  : ar
                    ? `علامتك ${percentScore}% — تحتاج ${PASS_MARK}% للنجاح`
                    : `You scored ${percentScore}% — ${PASS_MARK}% required`,
              );
            }}

          />
        ) : (
          <Empty ar={ar} />
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ ar }: { ar: boolean }) {
  return (
    <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
      {ar ? "سيتم إضافة المحتوى قريباً." : "Content coming soon."}
    </p>
  );
}

type QuizQuestion = {
  id: string;
  question_ar: string;
  question_en: string;
  options_ar: string[];
  options_en: string[];
  correct_index: number;
  explanation_ar: string | null;
  explanation_en: string | null;
};

/** Simple multiple-choice quiz with instant scoring. */
function Quiz({
  ar,
  questions,
  onFinish,
}: {
  ar: boolean;
  questions: QuizQuestion[];
  onFinish: (correct: number, totalQuestions: number) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = questions.filter((q) => answers[q.id] === q.correct_index).length;

  return (
    <div className="space-y-4">
      {questions.map((q, qi) => (
        <div key={q.id} className="rounded-xl border border-border/70 bg-card p-4">
          <p className="font-medium">
            {qi + 1}. {ar ? q.question_ar : q.question_en}
          </p>
          <div className="mt-3 grid gap-2">
            {(ar ? q.options_ar : q.options_en).map((opt, oi) => {
              const chosen = answers[q.id] === oi;
              const correct = submitted && oi === q.correct_index;
              const wrong = submitted && chosen && oi !== q.correct_index;
              return (
                <button
                  key={oi}
                  disabled={submitted}
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                  className={[
                    "rounded-lg border px-3 py-2 text-start text-sm transition-colors",
                    correct
                      ? "border-primary bg-primary/10"
                      : wrong
                        ? "border-destructive bg-destructive/10"
                        : chosen
                          ? "border-primary"
                          : "border-border hover:bg-secondary",
                  ].join(" ")}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {submitted && (
            <p className="mt-2 text-xs text-muted-foreground">
              {ar ? q.explanation_ar : q.explanation_en}
            </p>
          )}
        </div>
      ))}

      {submitted ? (
        <p className="font-semibold">
          {ar
            ? `نتيجتك: ${score} من ${questions.length}`
            : `Your score: ${score} / ${questions.length}`}
        </p>
      ) : (
        <Button
          onClick={() => {
            setSubmitted(true);
            onFinish(score, questions.length);
          }}
          disabled={Object.keys(answers).length !== questions.length}
        >
          {ar ? "إنهاء الاختبار" : "Submit quiz"}
        </Button>
      )}
    </div>
  );
}
