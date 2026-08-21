/**
 * skills.ts
 * -------------------------------------------------------------
 * The InfoPath learning loop:
 *   Placement test -> Skill Profile -> AI Recommendation -> Learning Path
 *   -> Courses/Videos/Books -> Projects/Challenges -> Assessment
 *   -> Skill level update -> new recommendations
 *
 * This module holds the shared data hooks and the two write operations that
 * close the loop: `saveSkillLevels` (from a test) and `refreshRecommendations`.
 */
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { generateRecommendations } from "@/lib/recommend.functions";

export type SkillRow = { key: string; name_ar: string; name_en: string; sort_order: number };

/** All skills tracked by the platform. */
export function useSkills() {
  return useQuery({
    queryKey: ["skills"],
    queryFn: async () => {
      const { data, error } = await supabase.from("skills").select("*").order("sort_order");
      if (error) throw error;
      return data as SkillRow[];
    },
  });
}

/** The signed-in student's level (0-100) per skill. */
export function useSkillProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["skill-profile", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skill_profile")
        .select("skill_key, level, source, updated_at")
        .eq("user_id", userId!);
      if (error) throw error;
      return data;
    },
  });
}

/** The student's current AI recommendations, most important first. */
export function useRecommendations(userId: string | undefined) {
  return useQuery({
    queryKey: ["recommendations", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recommendations")
        .select("*")
        .eq("user_id", userId!)
        .order("done")
        .order("priority")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Writes (or blends) skill levels after a test.
 * `placement` overwrites; an `assessment` averages with the previous level so
 * one bad quiz does not erase months of progress.
 */
export async function saveSkillLevels(
  userId: string,
  levels: Record<string, number>,
  source: "placement" | "assessment",
) {
  const { data: existing } = await supabase
    .from("skill_profile")
    .select("skill_key, level")
    .eq("user_id", userId);
  const prev = new Map((existing ?? []).map((r) => [r.skill_key, r.level]));

  const rows = Object.entries(levels).map(([skill_key, level]) => {
    const before = prev.get(skill_key);
    const next =
      source === "assessment" && before !== undefined
        ? Math.round(before * 0.5 + level * 0.5)
        : Math.round(level);
    return { user_id: userId, skill_key, level: Math.max(0, Math.min(100, next)), source };
  });

  const { error } = await supabase
    .from("skill_profile")
    .upsert(rows, { onConflict: "user_id,skill_key" });
  if (error) throw error;
}

/**
 * Regenerates the AI recommendations from the current skill profile.
 * Old, untouched suggestions are replaced so the path always reflects the
 * latest assessment results.
 */
export async function refreshRecommendations(userId: string, lang: "ar" | "en") {
  const [{ data: skills }, { data: profile }, { data: subjects }] = await Promise.all([
    supabase.from("skills").select("key, name_en").order("sort_order"),
    supabase.from("skill_profile").select("skill_key, level").eq("user_id", userId),
    supabase.from("subjects").select("id, code, name_en, skill_key").order("year"),
  ]);

  const levels = new Map((profile ?? []).map((r) => [r.skill_key, r.level]));
  const payload = (skills ?? []).map((s) => ({
    key: s.key,
    name_en: s.name_en,
    level: levels.get(s.key) ?? 0,
  }));
  if (payload.length === 0) throw new Error("No skills configured");

  const recs = await generateRecommendations({
    data: {
      lang,
      skills: payload,
      subjects: (subjects ?? []).map((s) => ({
        code: s.code,
        name_en: s.name_en,
        skill_key: s.skill_key ?? null,
      })),
    },
  });

  const byCode = new Map((subjects ?? []).map((s) => [s.code.toUpperCase(), s.id]));

  await supabase.from("recommendations").delete().eq("user_id", userId).eq("done", false);

  const rows = recs.map((r) => ({
    user_id: userId,
    skill_key: r.skill_key,
    subject_id: r.subject_code ? (byCode.get(r.subject_code.toUpperCase()) ?? null) : null,
    title_ar: r.title_ar,
    title_en: r.title_en,
    body_ar: r.body_ar,
    body_en: r.body_en,
    action_type: r.action_type,
    priority: r.priority ?? 1,
  }));
  if (rows.length === 0) return 0;

  const { error } = await supabase.from("recommendations").insert(rows);
  if (error) throw error;
  return rows.length;
}
