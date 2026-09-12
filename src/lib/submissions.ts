/**
 * submissions.ts
 * -------------------------------------------------------------
 * Instructor follow-up loop:
 *
 *   Instructor creates a Project/Challenge tagged with a skill
 *   -> Student submits a solution           (submissions, status = pending)
 *   -> Instructor grades it                 (grade + feedback, status = reviewed)
 *   -> The grade is recorded in the student's file (progress) and blended
 *      into the Skill Profile               (status = completed)
 *   -> When the whole Learning Path is done, the next goal is opened
 *      automatically (one path at a time).
 */
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { rebuildLearningPath, saveSkillSnapshot } from "@/lib/learning-path";
import { refreshRecommendations, saveSkillLevels } from "@/lib/skills";

export type SubmissionStatus = "pending" | "reviewed" | "completed";

export type Submission = {
  id: string;
  user_id: string;
  subject_id: string | null;
  skill_key: string | null;
  item_type: "resource" | "project" | "challenge" | "quiz";
  item_id: string | null;
  title: string;
  content: string | null;
  url: string | null;
  status: string;
  grade: number | null;
  feedback: string | null;
  reviewed_at: string | null;
  created_at: string;
};

/** Everything the signed-in student submitted, newest first. */
export function useMySubmissions(userId: string | undefined) {
  return useQuery({
    queryKey: ["submissions", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Submission[];
    },
  });
}

/** Submissions the signed-in instructor/admin is allowed to review. */
export function useReviewQueue(subjectIds: string[], enabled = true) {
  return useQuery({
    queryKey: ["review-queue", [...subjectIds].sort().join(",")],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*, subjects:subject_id(code, name_ar, name_en)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as (Submission & {
        subjects: { code: string; name_ar: string; name_en: string } | null;
      })[];

      // student names come from `profiles` (no FK between submissions and profiles)
      const ids = [...new Set(rows.map((r) => r.user_id))];
      const names = new Map<string, string | null>();
      if (ids.length > 0) {
        const { data: people } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", ids);
        for (const p of people ?? []) names.set(p.id, p.full_name);
      }

      return rows.map((r) => ({
        ...r,
        profiles: { full_name: names.get(r.user_id) ?? null },
      }));
    },
  });
}


export type SubmissionMessage = {
  id: string;
  submission_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

/** The conversation between the student and the instructor on one submission. */
export function useSubmissionMessages(submissionId: string | undefined) {
  return useQuery({
    queryKey: ["submission-messages", submissionId],
    enabled: Boolean(submissionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submission_messages")
        .select("*")
        .eq("submission_id", submissionId!)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as SubmissionMessage[];
    },
  });
}

/** Posts one message (student question or instructor note) on a submission. */
export async function sendSubmissionMessage(input: {
  submissionId: string;
  senderId: string;
  body: string;
}) {
  const body = input.body.trim();
  if (!body) return;
  const { error } = await supabase.from("submission_messages").insert({
    submission_id: input.submissionId,
    sender_id: input.senderId,
    body,
  });
  if (error) throw error;
}

/** Progress of every student who submitted work in the instructor's subjects. */
export function useStudentsProgress(subjectIds: string[], enabled = true) {
  return useQuery({
    queryKey: ["students-progress", [...subjectIds].sort().join(",")],
    enabled,
    queryFn: async () => {
      const { data: subs, error } = await supabase
        .from("submissions")
        .select("id, user_id, title, status, grade, skill_key, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = subs ?? [];
      const ids = [...new Set(rows.map((r) => r.user_id))];
      if (ids.length === 0) return [];

      const [people, levels, goals, steps, updates] = await Promise.all([
        supabase.from("profiles").select("id, full_name, university").in("id", ids),
        supabase.from("skill_profile").select("user_id, skill_key, level").in("user_id", ids),
        supabase
          .from("learning_goals")
          .select("user_id, skill_key, status, priority")
          .in("user_id", ids)
          .eq("status", "active"),
        supabase
          .from("learning_path_items")
          .select("id, user_id, status, title_ar, title_en, started_at, progress_percent, step_order")
          .in("user_id", ids)
          .order("step_order"),
        supabase
          .from("path_updates")
          .select("id, user_id, author_id, body, percent, created_at")
          .in("user_id", ids)
          .order("created_at", { ascending: false }),
      ]);

      return ids.map((id) => {
        const mySteps = (steps.data ?? []).filter((s) => s.user_id === id);
        const done = mySteps.filter((s) => s.status === "done").length;
        const graded = rows.filter((r) => r.user_id === id && r.grade !== null);
        const current = mySteps.find((s) => s.status !== "done") ?? null;
        const myUpdates = (updates.data ?? []).filter((u) => u.user_id === id);
        return {
          userId: id,
          name: (people.data ?? []).find((p) => p.id === id)?.full_name ?? null,
          university: (people.data ?? []).find((p) => p.id === id)?.university ?? null,
          skills: (levels.data ?? [])
            .filter((l) => l.user_id === id)
            .sort((a, b) => a.level - b.level),
          currentGoal:
            (goals.data ?? [])
              .filter((g) => g.user_id === id)
              .sort((a, b) => a.priority - b.priority)[0]?.skill_key ?? null,
          currentStep: current,
          lastUpdate: myUpdates[0] ?? null,
          updates: myUpdates.slice(0, 5),
          pathDone: done,
          pathTotal: mySteps.length,
          submissions: rows.filter((r) => r.user_id === id),
          averageGrade:
            graded.length > 0
              ? Math.round(graded.reduce((sum, g) => sum + (g.grade ?? 0), 0) / graded.length)
              : null,
        };
      });
    },
  });
}


/** The student sends a solution for a path step / project / challenge. */
export async function submitWork(input: {
  userId: string;
  title: string;
  subjectId: string | null;
  skillKey: string | null;
  itemType: "project" | "challenge" | "quiz" | "resource";
  itemId: string | null;
  content: string;
  url: string;
}) {
  const { error } = await supabase.from("submissions").insert({
    user_id: input.userId,
    title: input.title,
    subject_id: input.subjectId,
    skill_key: input.skillKey,
    item_type: input.itemType,
    item_id: input.itemId,
    content: input.content || null,
    url: input.url || null,
    status: "pending",
  });
  if (error) throw error;
}

/** The instructor grades a submission (Pending -> Reviewed / Completed). */
export async function reviewSubmission(input: {
  id: string;
  reviewerId: string;
  grade: number;
  feedback: string;
  status: SubmissionStatus;
}) {
  const { error } = await supabase
    .from("submissions")
    .update({
      grade: Math.max(0, Math.min(100, Math.round(input.grade))),
      feedback: input.feedback || null,
      status: input.status,
      reviewed_by: input.reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.id);
  if (error) throw error;
}

/**
 * Records every graded submission in the student's file (`progress`) and
 * blends the grade into the Skill Profile. Runs client-side for the signed-in
 * student, so RLS keeps every write scoped to their own rows.
 * Returns how many new grades were applied.
 */
export async function applyGradedSubmissions(userId: string) {
  const { data: graded } = await supabase
    .from("submissions")
    .select("id, skill_key, subject_id, item_type, grade, status")
    .eq("user_id", userId)
    .not("grade", "is", null)
    .in("status", ["reviewed", "completed"]);

  const rows = graded ?? [];
  if (rows.length === 0) return 0;

  const { data: existing } = await supabase
    .from("progress")
    .select("item_id")
    .eq("user_id", userId);
  const already = new Set((existing ?? []).map((p) => p.item_id));

  const fresh = rows.filter((r) => !already.has(r.id));
  if (fresh.length === 0) return 0;

  // 1) student file: one progress row per graded submission
  const progressRows = fresh
    .filter((r) => r.subject_id)
    .map((r) => ({
      user_id: userId,
      subject_id: r.subject_id!,
      item_type: r.item_type,
      item_id: r.id,
      completed: true,
      score: r.grade,
    }));
  if (progressRows.length > 0) {
    await supabase.from("progress").insert(progressRows as never);
  }

  // 2) skill profile: average the grades per skill and blend them in
  const bySkill = new Map<string, number[]>();
  for (const r of fresh) {
    if (!r.skill_key || r.grade === null) continue;
    bySkill.set(r.skill_key, [...(bySkill.get(r.skill_key) ?? []), r.grade]);
  }
  const levels: Record<string, number> = {};
  for (const [key, list] of bySkill) {
    levels[key] = list.reduce((a, b) => a + b, 0) / list.length;
  }
  if (Object.keys(levels).length > 0) {
    await saveSkillLevels(userId, levels, "assessment");
  }

  return fresh.length;
}

/**
 * One path at a time: when every step of the current path is done, the goal is
 * closed, the profile is snapshotted and the next path (next weakest skill) is
 * generated together with fresh AI priorities.
 */
export async function advanceLearningPath(userId: string, lang: "ar" | "en") {
  const { data: items } = await supabase
    .from("learning_path_items")
    .select("id, status")
    .eq("user_id", userId);

  const list = items ?? [];
  if (list.length === 0 || list.some((i) => i.status !== "done")) return false;

  const { data: profile } = await supabase
    .from("skill_profile")
    .select("skill_key, level")
    .eq("user_id", userId);
  const levels = Object.fromEntries((profile ?? []).map((r) => [r.skill_key, r.level]));
  await saveSkillSnapshot(userId, "current", levels);

  // close the goals that reached the target
  const { data: goals } = await supabase
    .from("learning_goals")
    .select("id, skill_key, target_level")
    .eq("user_id", userId)
    .eq("status", "active");
  for (const g of goals ?? []) {
    const now = levels[g.skill_key] ?? 0;
    if (now >= (g.target_level ?? 70)) {
      // improved enough -> close it, the next weakest skill becomes the goal
      await supabase.from("learning_goals").update({ status: "reached" }).eq("id", g.id);
    } else {
      // not improved -> repeat the same skill: re-open its steps
      await supabase
        .from("learning_path_items")
        .update({ status: "todo" })
        .eq("user_id", userId)
        .eq("skill_key", g.skill_key);
    }
  }


  await rebuildLearningPath(userId);
  try {
    await refreshRecommendations(userId, lang);
  } catch {
    // AI extras are optional — the deterministic path is already updated.
  }
  return true;
}
