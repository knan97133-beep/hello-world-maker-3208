/**
 * unlock.ts
 * -------------------------------------------------------------
 * Sequential-progression rules for InfoPath.
 *
 * Rule agreed with the product owner:
 *   A term (year + semester) is *passed* when the student scored 60% or
 *   more in the quiz of every subject of that term that actually has a
 *   quiz. The next term unlocks only after the previous one is passed.
 *   Term 1 of year 1 is always open, and an administrator can unlock any
 *   term manually (rows in `semester_unlocks`).
 */
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const PASS_MARK = 60;

/** All terms in study order: year 1 sem 1, year 1 sem 2, year 2 sem 1 … */
export const TERMS: { year: number; semester: number }[] = [1, 2, 3, 4, 5].flatMap((year) =>
  [1, 2].map((semester) => ({ year, semester })),
);

export const termKey = (year: number, semester: number) => `${year}-${semester}`;

export type UnlockState = {
  loading: boolean;
  /** Is this term available to the student? */
  isUnlocked: (year: number, semester: number) => boolean;
  /** Has the student passed every quiz of this term? */
  isPassed: (year: number, semester: number) => boolean;
  /** Quiz percentage per subject id (undefined = not attempted). */
  scoreOf: (subjectId: string) => number | undefined;
  /** Subjects of a term that still need a passing quiz. */
  remaining: (year: number, semester: number) => number;
};

/** Computes which terms are open for the given student. */
export function useUnlockState(userId: string | undefined): UnlockState {
  const query = useQuery({
    queryKey: ["unlock-state", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const [subjects, questions, quizProgress, manual] = await Promise.all([
        supabase.from("subjects").select("id, year, semester"),
        supabase.from("quiz_questions").select("subject_id"),
        supabase
          .from("progress")
          .select("subject_id, score")
          .eq("user_id", userId!)
          .eq("item_type", "quiz"),
        supabase.from("semester_unlocks").select("year, semester").eq("user_id", userId!),
      ]);
      const err = subjects.error || questions.error || quizProgress.error || manual.error;
      if (err) throw err;

      const quizCount = new Map<string, number>();
      for (const q of questions.data ?? []) {
        quizCount.set(q.subject_id, (quizCount.get(q.subject_id) ?? 0) + 1);
      }
      const scores = new Map<string, number>();
      for (const p of quizProgress.data ?? []) {
        if (p.subject_id) scores.set(p.subject_id, p.score ?? 0);
      }
      return {
        subjects: subjects.data ?? [],
        quizCount,
        scores,
        manual: new Set((manual.data ?? []).map((m) => termKey(m.year, m.semester))),
      };
    },
  });

  const data = query.data;

  const isPassed = (year: number, semester: number) => {
    if (!data) return false;
    const list = data.subjects.filter(
      (s) => s.year === year && s.semester === semester && (data.quizCount.get(s.id) ?? 0) > 0,
    );
    if (list.length === 0) return false;
    return list.every((s) => (data.scores.get(s.id) ?? -1) >= PASS_MARK);
  };

  const remaining = (year: number, semester: number) => {
    if (!data) return 0;
    return data.subjects.filter(
      (s) =>
        s.year === year &&
        s.semester === semester &&
        (data.quizCount.get(s.id) ?? 0) > 0 &&
        (data.scores.get(s.id) ?? -1) < PASS_MARK,
    ).length;
  };

  const isUnlocked = (year: number, semester: number) => {
    const index = TERMS.findIndex((t) => t.year === year && t.semester === semester);
    if (index <= 0) return true; // first term (or unknown term) is always open
    if (!data) return false;
    if (data.manual.has(termKey(year, semester))) return true;
    const prev = TERMS[index - 1]!;
    return isPassed(prev.year, prev.semester);
  };

  return {
    loading: query.isLoading,
    isUnlocked,
    isPassed,
    remaining,
    scoreOf: (subjectId: string) => data?.scores.get(subjectId),
  };
}
