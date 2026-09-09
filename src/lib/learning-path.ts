/**
 * learning-path.ts
 * -------------------------------------------------------------
 * The deterministic part of the InfoPath loop:
 *
 *   Placement Test -> Skill Profile -> Learning Goals -> Learning Path
 *   -> Content (course/video/challenge/project) -> Assessment
 *   -> Skill update -> new goals / recommendations
 *
 * A *Learning Path* is NOT a random list of links: it is built from the
 * student's weakest skills and only uses PUBLISHED platform content that the
 * instructor/admin linked to that skill and difficulty level.
 * AI `recommendations` stay separate — they are optional extras.
 */
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type Difficulty = "easy" | "medium" | "hard";

/** Level a student must reach before a skill counts as "solid". */
export const TARGET_LEVEL = 70;

/** Difficulty the student should start with, given their current level. */
export function difficultyForLevel(level: number): Difficulty {
  if (level < 40) return "easy";
  if (level < TARGET_LEVEL) return "medium";
  return "hard";
}

export type PathItem = {
  id: string;
  skill_key: string | null;
  subject_id: string | null;
  item_type: "resource" | "project" | "challenge" | "quiz";
  item_id: string | null;
  title_ar: string;
  title_en: string;
  body_ar: string | null;
  body_en: string | null;
  level: Difficulty;
  step_order: number;
  status: string;
};

/** The student's active learning goals (weak skills), weakest first. */
export function useLearningGoals(userId: string | undefined) {
  return useQuery({
    queryKey: ["learning-goals", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_goals")
        .select("*")
        .eq("user_id", userId!)
        .order("priority");
      if (error) throw error;
      return data;
    },
  });
}

/** Ordered steps of the personalised learning path. */
export function useLearningPath(userId: string | undefined) {
  return useQuery({
    queryKey: ["learning-path", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_path_items")
        .select("*")
        .eq("user_id", userId!)
        .order("step_order");
      if (error) throw error;
      return (data ?? []) as PathItem[];
    },
  });
}

/** Initial / current / final skill snapshots used by the progress comparison. */
export function useSkillSnapshots(userId: string | undefined) {
  return useQuery({
    queryKey: ["skill-snapshots", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skill_snapshots")
        .select("phase, skill_key, level, created_at")
        .eq("user_id", userId!)
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Stores a snapshot of the whole skill profile (initial / current / final). */
export async function saveSkillSnapshot(
  userId: string,
  phase: "initial" | "current" | "final",
  levels: Record<string, number>,
) {
  const rows = Object.entries(levels).map(([skill_key, level]) => ({
    user_id: userId,
    phase,
    skill_key,
    level: Math.round(level),
  }));
  if (rows.length === 0) return;
  // one snapshot set per phase: replace the previous one
  await supabase.from("skill_snapshots").delete().eq("user_id", userId).eq("phase", phase);
  const { error } = await supabase.from("skill_snapshots").insert(rows);
  if (error) throw error;
}

/** Marks a path step done (and re-opens it when `done` is false). */
export async function setPathItemStatus(id: string, status: "todo" | "in_progress" | "done") {
  const { error } = await supabase.from("learning_path_items").update({ status }).eq("id", id);
  if (error) throw error;
}

/**
 * Rebuilds goals + path from the current skill profile.
 * Only published content that is tagged with the skill is used, ordered as
 * Course/Video -> Challenge -> Project -> Assessment for every weak skill.
 * Completed steps are preserved so the student never loses progress.
 */
export async function rebuildLearningPath(userId: string) {
  const [{ data: skills }, { data: profile }] = await Promise.all([
    supabase.from("skills").select("key, name_ar, name_en").order("sort_order"),
    supabase.from("skill_profile").select("skill_key, level").eq("user_id", userId),
  ]);

  const levels = new Map((profile ?? []).map((r) => [r.skill_key, r.level]));
  if (levels.size === 0) return 0;

  // 1) Goals = every skill below the target, weakest first.
  const weak = (skills ?? [])
    .map((s) => ({ ...s, level: levels.get(s.key) ?? 0 }))
    .filter((s) => s.level < TARGET_LEVEL)
    .sort((a, b) => a.level - b.level)
    .slice(0, 4);

  if (weak.length === 0) {
    await supabase.from("learning_goals").update({ status: "reached" }).eq("user_id", userId);
    return 0;
  }

  await supabase.from("learning_goals").upsert(
    weak.map((s, i) => ({
      user_id: userId,
      skill_key: s.key,
      start_level: s.level,
      target_level: TARGET_LEVEL,
      status: "active",
      priority: i + 1,
    })),
    { onConflict: "user_id,skill_key" },
  );

  const { data: goals } = await supabase
    .from("learning_goals")
    .select("id, skill_key")
    .eq("user_id", userId);
  const goalId = new Map((goals ?? []).map((g) => [g.skill_key, g.id]));

  // 2) Collect published content for those skills.
  const keys = weak.map((s) => s.key);
  const [resources, challenges, projects, subjects] = await Promise.all([
    supabase
      .from("resources")
      .select("id, subject_id, skill_key, kind, title_ar, title_en, url, level")
      .in("skill_key", keys)
      .eq("status", "published")
      .order("sort_order"),
    supabase
      .from("challenges")
      .select("id, subject_id, skill_key, title_ar, title_en, prompt_ar, prompt_en, level")
      .in("skill_key", keys)
      .eq("status", "published")
      .order("sort_order"),
    supabase
      .from("projects")
      .select("id, subject_id, skill_key, title_ar, title_en, description_ar, description_en, level")
      .in("skill_key", keys)
      .eq("status", "published")
      .order("sort_order"),
    supabase
      .from("subjects")
      .select("id, code, name_ar, name_en, description_ar, description_en, skill_key, year, semester, sort_order")
      .in("skill_key", keys)
      .order("year")
      .order("semester")
      .order("sort_order"),
  ]);


  // 3) Keep finished steps, rebuild the open ones.
  await supabase
    .from("learning_path_items")
    .delete()
    .eq("user_id", userId)
    .neq("status", "done");

  const { data: kept } = await supabase
    .from("learning_path_items")
    .select("item_type, item_id")
    .eq("user_id", userId);
  const keptSet = new Set((kept ?? []).map((k) => `${k.item_type}:${k.item_id}`));

  const rows: Record<string, unknown>[] = [];
  let order = 0;

  for (const skill of weak) {
    const want = difficultyForLevel(skill.level);
    const gid = goalId.get(skill.key) ?? null;

    const pick = <T extends { level: string }>(list: T[] | null, max: number) => {
      const arr = list ?? [];
      const preferred = arr.filter((x) => x.level === want);
      return (preferred.length ? preferred : arr).slice(0, max);
    };

    // Course / video / book first…
    for (const r of pick((resources.data ?? []).filter((x) => x.skill_key === skill.key), 2)) {
      if (keptSet.has(`resource:${r.id}`)) continue;
      rows.push({
        user_id: userId,
        goal_id: gid,
        skill_key: skill.key,
        subject_id: r.subject_id,
        item_type: "resource",
        item_id: r.id,
        title_ar: r.title_ar,
        title_en: r.title_en,
        body_ar: r.url,
        body_en: r.url,
        level: r.level,
        step_order: order++,
      });
    }

    // …then a challenge…
    for (const c of pick((challenges.data ?? []).filter((x) => x.skill_key === skill.key), 1)) {
      if (keptSet.has(`challenge:${c.id}`)) continue;
      rows.push({
        user_id: userId,
        goal_id: gid,
        skill_key: skill.key,
        subject_id: c.subject_id,
        item_type: "challenge",
        item_id: c.id,
        title_ar: c.title_ar,
        title_en: c.title_en,
        body_ar: c.prompt_ar,
        body_en: c.prompt_en,
        level: c.level,
        step_order: order++,
      });
    }

    // …then a project…
    for (const p of pick((projects.data ?? []).filter((x) => x.skill_key === skill.key), 1)) {
      if (keptSet.has(`project:${p.id}`)) continue;
      rows.push({
        user_id: userId,
        goal_id: gid,
        skill_key: skill.key,
        subject_id: p.subject_id,
        item_type: "project",
        item_id: p.id,
        title_ar: p.title_ar,
        title_en: p.title_en,
        body_ar: p.description_ar,
        body_en: p.description_en,
        level: p.level,
        step_order: order++,
      });
    }

    // …and finally the subject assessment that measures the skill again.
    const subject = (subjects.data ?? []).find((s) => s.skill_key === skill.key);
    if (subject && !keptSet.has(`quiz:${subject.id}`)) {
      rows.push({
        user_id: userId,
        goal_id: gid,
        skill_key: skill.key,
        subject_id: subject.id,
        item_type: "quiz",
        item_id: subject.id,
        title_ar: `اختبار: ${subject.name_ar}`,
        title_en: `Assessment: ${subject.name_en}`,
        body_ar: "أعد قياس مستواك في هذه المهارة بعد إنهاء الخطوات السابقة.",
        body_en: "Re-measure this skill after finishing the steps above.",
        level: want,
        step_order: order++,
      });
    }
  }

  if (rows.length === 0) return 0;
  const { error } = await supabase.from("learning_path_items").insert(rows as never);
  if (error) throw error;
  return rows.length;
}
