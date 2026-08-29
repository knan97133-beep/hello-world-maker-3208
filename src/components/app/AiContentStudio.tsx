/**
 * AiContentStudio.tsx
 * -------------------------------------------------------------
 * Instructor / admin tool: Generate -> Review -> Approve -> Publish.
 *
 * The AI proposes drafts (course lessons, quiz questions, challenges,
 * projects) or external web resources. Nothing reaches the students
 * automatically: items are stored as `draft` with source `ai`, and only the
 * instructor's "Publish" action flips them to `published`.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Save, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { generateContentDraft, type DraftItem } from "@/lib/content-ai.functions";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useSkills } from "@/lib/skills";

type Kind = "course" | "quiz" | "challenge" | "project" | "external";
type Level = "easy" | "medium" | "hard";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function AiContentStudio({ subjectIds }: { subjectIds?: string[] } = {}) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const queryClient = useQueryClient();
  const skills = useSkills();

  const [subjectId, setSubjectId] = useState("");
  const [kind, setKind] = useState<Kind>("course");
  const [skillKey, setSkillKey] = useState("");
  const [level, setLevel] = useState<Level>("easy");
  const [topic, setTopic] = useState("");
  const [drafts, setDrafts] = useState<DraftItem[]>([]);

  const subjects = useQuery({
    queryKey: ["ai-studio-subjects", subjectIds ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("subjects")
        .select("id, code, name_ar, name_en, skill_key")
        .order("year")
        .order("semester");
      if (subjectIds)
        query = query.in("id", subjectIds.length ? subjectIds : ["00000000-0000-0000-0000-000000000000"]);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const pending = useQuery({
    queryKey: ["pending-content", subjectId],
    enabled: Boolean(subjectId),
    queryFn: async () => {
      const [resources, projects, challenges, quiz, external] = await Promise.all([
        supabase.from("resources").select("id, title_ar, title_en, status, source").eq("subject_id", subjectId).eq("status", "draft"),
        supabase.from("projects").select("id, title_ar, title_en, status, source").eq("subject_id", subjectId).eq("status", "draft"),
        supabase.from("challenges").select("id, title_ar, title_en, status, source").eq("subject_id", subjectId).eq("status", "draft"),
        supabase.from("quiz_questions").select("id, question_ar, question_en, status, source").eq("subject_id", subjectId).eq("status", "draft"),
        supabase.from("external_resources").select("id, title, url, provider, approved").eq("subject_id", subjectId),
      ]);
      return {
        rows: [
          ...(resources.data ?? []).map((r) => ({ table: "resources" as const, id: r.id, title: ar ? r.title_ar : r.title_en })),
          ...(projects.data ?? []).map((r) => ({ table: "projects" as const, id: r.id, title: ar ? r.title_ar : r.title_en })),
          ...(challenges.data ?? []).map((r) => ({ table: "challenges" as const, id: r.id, title: ar ? r.title_ar : r.title_en })),
          ...(quiz.data ?? []).map((r) => ({ table: "quiz_questions" as const, id: r.id, title: ar ? r.question_ar : r.question_en })),
        ],
        external: external.data ?? [],
      };
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["pending-content", subjectId] });
    queryClient.invalidateQueries({ queryKey: ["admin-content", subjectId] });
    queryClient.invalidateQueries({ queryKey: ["subject-content"] });
  };

  const generate = useMutation({
    mutationFn: async () => {
      const skill = (skills.data ?? []).find((s) => s.key === skillKey);
      return generateContentDraft({
        data: { kind, topic: topic.trim(), skill_name: skill?.name_en ?? "general", level },
      });
    },
    onSuccess: (items) => {
      setDrafts(items);
      toast.success(ar ? "تم توليد مسودات — راجعها قبل النشر" : "Drafts generated — review before publishing");
    },
    onError: (e: Error) =>
      toast.error(
        e.message === "NO_CREDITS"
          ? ar
            ? "رصيد الذكاء الاصطناعي غير كافٍ"
            : "AI credits exhausted"
          : e.message === "RATE_LIMIT"
            ? ar
              ? "طلبات كثيرة، حاول بعد قليل"
              : "Too many requests"
            : e.message,
      ),
  });

  /** Stores the reviewed drafts as `draft` rows (or external references). */
  const saveDrafts = useMutation({
    mutationFn: async () => {
      if (!subjectId) throw new Error(ar ? "اختر مادة أولاً" : "Pick a subject first");
      const base = { subject_id: subjectId, skill_key: skillKey || null, created_by: user?.id ?? null };

      if (kind === "external") {
        const rows = drafts.map((d) => ({
          subject_id: subjectId,
          skill_key: skillKey || null,
          title: d.title_en || d.title_ar,
          url: d.url ?? "",
          provider: d.provider ?? null,
          summary: d.body_en || d.body_ar || null,
          level,
          approved: false,
          created_by: user?.id ?? null,
        })).filter((r) => r.url);
        if (!rows.length) throw new Error(ar ? "لا توجد روابط صالحة" : "No valid links");
        const { error } = await supabase.from("external_resources").insert(rows);
        if (error) throw error;
        return rows.length;
      }

      if (kind === "quiz") {
        const rows = drafts
          .filter((d) => d.options_en?.length && d.options_ar?.length)
          .map((d) => ({
            ...base,
            question_ar: d.title_ar,
            question_en: d.title_en,
            options_ar: d.options_ar!,
            options_en: d.options_en!,
            correct_index: d.correct_index ?? 0,
            explanation_ar: d.body_ar,
            explanation_en: d.body_en,
            level,
            status: "draft" as const,
            source: "ai" as const,
          }));
        if (!rows.length) throw new Error(ar ? "لا توجد أسئلة صالحة" : "No valid questions");
        const { error } = await supabase.from("quiz_questions").insert(rows);
        if (error) throw error;
        return rows.length;
      }

      if (kind === "challenge" || kind === "project") {
        const table = kind === "challenge" ? "challenges" : "projects";
        const rows = drafts.map((d) =>
          kind === "challenge"
            ? { ...base, title_ar: d.title_ar, title_en: d.title_en, prompt_ar: d.body_ar, prompt_en: d.body_en, level, status: "draft" as const, source: "ai" as const }
            : { ...base, title_ar: d.title_ar, title_en: d.title_en, description_ar: d.body_ar, description_en: d.body_en, level, status: "draft" as const, source: "ai" as const },
        );
        const { error } = await supabase.from(table).insert(rows as never);
        if (error) throw error;
        return rows.length;
      }

      // course -> resources
      const rows = drafts.map((d) => ({
        ...base,
        kind: d.url?.includes("youtu") ? ("video" as const) : ("course" as const),
        title_ar: d.title_ar,
        title_en: d.title_en,
        provider: d.provider ?? null,
        url: d.url ?? null,
        is_free: true,
        level,
        status: "draft" as const,
        source: "ai" as const,
      }));
      const { error } = await supabase.from("resources").insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: (n) => {
      toast.success(ar ? `تم حفظ ${n} عنصر كمسودة` : `${n} item(s) saved as draft`);
      setDrafts([]);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publish = useMutation({
    mutationFn: async (input: { table: "resources" | "projects" | "challenges" | "quiz_questions"; id: string }) => {
      const { error } = await supabase.from(input.table).update({ status: "published" }).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(ar ? "تم النشر للطلاب" : "Published to students");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeDraft = useMutation({
    mutationFn: async (input: { table: "resources" | "projects" | "challenges" | "quiz_questions"; id: string }) => {
      const { error } = await supabase.from(input.table).delete().eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  const approveExternal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("external_resources").update({ approved: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(ar ? "تم اعتماد المصدر الخارجي" : "External resource approved");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" />
          {ar ? "توليد المحتوى بالذكاء الاصطناعي (توليد ← مراجعة ← نشر)" : "AI content studio (generate → review → publish)"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{ar ? "المادة" : "Subject"}</Label>
            <select className={selectClass} value={subjectId} onChange={(e) => {
              setSubjectId(e.target.value);
              const s = subjects.data?.find((x) => x.id === e.target.value);
              if (s?.skill_key) setSkillKey(s.skill_key);
            }}>
              <option value="">{ar ? "— اختر مادة —" : "— pick a subject —"}</option>
              {subjects.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {ar ? s.name_ar : s.name_en}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{ar ? "نوع المحتوى" : "Content type"}</Label>
            <select className={selectClass} value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
              <option value="course">{ar ? "كورس / دروس" : "Course / lessons"}</option>
              <option value="quiz">{ar ? "أسئلة اختبار" : "Quiz questions"}</option>
              <option value="challenge">{ar ? "تحديات" : "Challenges"}</option>
              <option value="project">{ar ? "مشاريع" : "Projects"}</option>
              <option value="external">{ar ? "بحث عن مصادر خارجية" : "External resources search"}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{ar ? "المهارة" : "Skill"}</Label>
            <select className={selectClass} value={skillKey} onChange={(e) => setSkillKey(e.target.value)}>
              <option value="">{ar ? "— اختر مهارة —" : "— pick a skill —"}</option>
              {(skills.data ?? []).map((s) => (
                <option key={s.key} value={s.key}>
                  {ar ? s.name_ar : s.name_en}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{ar ? "مستوى الصعوبة" : "Difficulty"}</Label>
            <select className={selectClass} value={level} onChange={(e) => setLevel(e.target.value as Level)}>
              <option value="easy">{ar ? "سهل" : "Easy"}</option>
              <option value="medium">{ar ? "متوسط" : "Medium"}</option>
              <option value="hard">{ar ? "صعب" : "Hard"}</option>
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">{ar ? "الموضوع" : "Topic"}</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={ar ? "مثال: مقدمة في الخوارزميات والتعقيد" : "e.g. Introduction to algorithms & complexity"}
            />
          </div>
        </div>

        <Button onClick={() => generate.mutate()} disabled={generate.isPending || topic.trim().length < 2}>
          {generate.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {ar ? "توليد مسودة" : "Generate draft"}
        </Button>

        {/* ---- Review step ---- */}
        {drafts.length > 0 && (
          <section className="space-y-3 rounded-xl border border-border/70 p-4">
            <h3 className="text-sm font-semibold">
              {ar ? "مراجعة المسودات قبل الحفظ" : "Review drafts before saving"}
            </h3>
            <ul className="space-y-2">
              {drafts.map((d, i) => (
                <li key={i} className="rounded-lg border border-border/70 p-3">
                  <p className="text-sm font-medium">{ar ? d.title_ar : d.title_en}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{ar ? d.body_ar : d.body_en}</p>
                  {d.url && (
                    <a href={d.url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-primary underline">
                      {d.url}
                    </a>
                  )}
                  {d.options_en && (
                    <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                      {(ar ? d.options_ar! : d.options_en).map((o, oi) => (
                        <li key={oi} className={oi === (d.correct_index ?? 0) ? "font-semibold text-foreground" : ""}>
                          {oi + 1}. {o}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setDrafts(drafts.filter((_, x) => x !== i))}
                  >
                    <Trash2 className="size-4 text-destructive" />
                    {ar ? "استبعاد" : "Discard"}
                  </Button>
                </li>
              ))}
            </ul>
            <Button onClick={() => saveDrafts.mutate()} disabled={saveDrafts.isPending || !subjectId}>
              {saveDrafts.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {kind === "external"
                ? ar ? "حفظ كمصادر خارجية" : "Save as external resources"
                : ar ? "حفظ كمسودة" : "Save as draft"}
            </Button>
          </section>
        )}

        {/* ---- Pending approval ---- */}
        {subjectId && (
          <section className="space-y-3 rounded-xl border border-border/70 p-4">
            <h3 className="text-sm font-semibold">
              {ar ? "بانتظار الاعتماد والنشر" : "Awaiting approval & publishing"}
            </h3>
            {pending.isLoading ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : (pending.data?.rows.length ?? 0) === 0 ? (
              <p className="text-xs text-muted-foreground">{ar ? "لا توجد مسودات." : "No drafts."}</p>
            ) : (
              <ul className="space-y-2">
                {pending.data!.rows.map((r) => (
                  <li key={`${r.table}-${r.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{r.table}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" onClick={() => publish.mutate({ table: r.table, id: r.id })}>
                        <CheckCircle2 className="size-4" />
                        {ar ? "نشر" : "Publish"}
                      </Button>
                      <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => removeDraft.mutate({ table: r.table, id: r.id })}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <h3 className="pt-2 text-sm font-semibold">{ar ? "مصادر خارجية" : "External resources"}</h3>
            {(pending.data?.external.length ?? 0) === 0 ? (
              <p className="text-xs text-muted-foreground">{ar ? "لا توجد مصادر خارجية." : "No external resources."}</p>
            ) : (
              <ul className="space-y-2">
                {pending.data!.external.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{e.title}</p>
                      <a href={e.url} target="_blank" rel="noreferrer" className="truncate text-xs text-primary underline">
                        {e.provider ? `${e.provider} · ` : ""}{e.url}
                      </a>
                    </div>
                    {e.approved ? (
                      <span className="shrink-0 rounded-md bg-secondary px-2 py-0.5 text-xs">{ar ? "معتمد" : "Approved"}</span>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => approveExternal.mutate(e.id)}>
                        <CheckCircle2 className="size-4" />
                        {ar ? "اعتماد" : "Approve"}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </CardContent>
    </Card>
  );
}
