/**
 * final-exam.ts
 * -------------------------------------------------------------
 * End-of-path assessment: when a student finishes every step of the
 * current learning path, they must pass a short exam built from the
 * quiz questions of the subjects covered by that path. Passing it
 * (>= PASS_SCORE) records the grade in their file, blends it into the
 * skill profile and unlocks the next path.
 */
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const PASS_SCORE = 60;

export type ExamQuestion = {
  id: string;
  subject_id: string;
  question_ar: string;
  question_en: string;
  options_ar: string[];
  options_en: string[];
  correct_index: number;
  explanation_ar: string | null;
  explanation_en: string | null;
};

/** Questions of the subjects the finished path covered (max 10). */
export function useFinalExamQuestions(subjectIds: string[], enabled: boolean) {
  const key = [...new Set(subjectIds)].sort().join(",");
  return useQuery({
    queryKey: ["final-exam", key],
    enabled: enabled && subjectIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select(
          "id, subject_id, question_ar, question_en, options_ar, options_en, correct_index, explanation_ar, explanation_en",
        )
        .in("subject_id", [...new Set(subjectIds)])
        .eq("status", "published")
        .order("sort_order")
        .limit(10);
      if (error) throw error;
      return (data ?? []) as ExamQuestion[];
    },
  });
}

/** The latest end-of-path exam result for one skill. */
export function useFinalExamResult(userId: string | undefined, skillKey: string | undefined) {
  return useQuery({
    queryKey: ["final-exam-result", userId, skillKey],
    enabled: Boolean(userId && skillKey),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("id, grade, created_at")
        .eq("user_id", userId!)
        .eq("skill_key", skillKey!)
        .eq("item_type", "quiz")
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      const row = (data ?? [])[0] ?? null;
      return row ? { ...row, passed: (row.grade ?? 0) >= PASS_SCORE } : null;
    },
  });
}

/** Stores the exam attempt as a graded submission (self-graded quiz). */
export async function saveFinalExam(input: {
  userId: string;
  skillKey: string;
  subjectId: string | null;
  title: string;
  score: number;
  correct: number;
  total: number;
}) {
  const grade = Math.max(0, Math.min(100, Math.round(input.score)));
  const { error } = await supabase.from("submissions").insert({
    user_id: input.userId,
    skill_key: input.skillKey,
    subject_id: input.subjectId,
    item_type: "quiz",
    item_id: null,
    title: input.title,
    content: `${input.correct}/${input.total}`,
    status: "completed",
    grade,
    reviewed_at: new Date().toISOString(),
  });
  if (error) throw error;
  return grade;
}
