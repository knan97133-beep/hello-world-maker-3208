/**
 * PathTemplateBuilder.tsx
 * -------------------------------------------------------------
 * The instructor (or admin) builds the learning path by hand:
 * one template per skill + level, whose steps are picked from the content
 * they already published (courses, videos, books, projects, challenges,
 * assessments). When a skill becomes a student's current goal, the platform
 * copies this template into that student's personal path — AI never invents
 * a step.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Loader2, Plus, Route as RouteIcon, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { usePathTemplateItems, usePathTemplates, type Difficulty } from "@/lib/learning-path";
import { useSession } from "@/lib/session";
import { useSkills } from "@/lib/skills";

const LEVELS: Difficulty[] = ["easy", "medium", "hard"];

export function PathTemplateBuilder({ subjectIds }: { subjectIds?: string[] } = {}) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const queryClient = useQueryClient();
  const skills = useSkills();
  const templates = usePathTemplates();

  const [skillKey, setSkillKey] = useState("");
  const [level, setLevel] = useState<Difficulty>("easy");
  const [templateId, setTemplateId] = useState("");

  const items = usePathTemplateItems(templateId || undefined);
  const template = (templates.data ?? []).find((t) => t.id === templateId);

  /** Published content the instructor can put in a step. */
  const content = useQuery({
    queryKey: ["template-content", skillKey, subjectIds ?? "all"],
    enabled: Boolean(skillKey),
    queryFn: async () => {
      const scoped = <T,>(rows: T[] | null, get: (r: T) => string | null) =>
        (rows ?? []).filter((r) => !subjectIds || subjectIds.includes(get(r) ?? ""));

      const [resources, projects, challenges, subjects] = await Promise.all([
        supabase
          .from("resources")
          .select("id, subject_id, kind, title_ar, title_en, url, level")
          .eq("skill_key", skillKey)
          .eq("status", "published"),
        supabase
          .from("projects")
          .select("id, subject_id, title_ar, title_en, description_ar, description_en, level")
          .eq("skill_key", skillKey)
          .eq("status", "published"),
        supabase
          .from("challenges")
          .select("id, subject_id, title_ar, title_en, prompt_ar, prompt_en, level")
          .eq("skill_key", skillKey)
          .eq("status", "published"),
        supabase.from("subjects").select("id, code, name_ar, name_en").eq("skill_key", skillKey),
      ]);

      return {
        resources: scoped(resources.data, (r) => r.subject_id),
        projects: scoped(projects.data, (r) => r.subject_id),
        challenges: scoped(challenges.data, (r) => r.subject_id),
        subjects: scoped(subjects.data, (r) => r.id),
      };
    },
  });

  const createTemplate = useMutation({
    mutationFn: async () => {
      if (!user || !skillKey) throw new Error(ar ? "اختر المهارة أولاً" : "Pick a skill first");
      const name = (skills.data ?? []).find((s) => s.key === skillKey);
      const { data, error } = await supabase
        .from("path_templates")
        .insert({
          skill_key: skillKey,
          level,
          title_ar: `مسار ${name?.name_ar ?? skillKey}`,
          title_en: `${name?.name_en ?? skillKey} path`,
          created_by: user.id,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      setTemplateId(id);
      queryClient.invalidateQueries({ queryKey: ["path-templates"] });
      toast.success(ar ? "تم إنشاء المسار — أضف خطواته" : "Template created — add its steps");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const addStep = useMutation({
    mutationFn: async (step: {
      item_type: "resource" | "project" | "challenge" | "quiz";
      item_id: string | null;
      subject_id: string | null;
      title_ar: string;
      title_en: string;
      body_ar: string | null;
      body_en: string | null;
      level: Difficulty;
    }) => {
      if (!templateId) throw new Error(ar ? "اختر مساراً أولاً" : "Pick a template first");
      const { error } = await supabase.from("path_template_items").insert({
        template_id: templateId,
        step_order: (items.data ?? []).length,
        ...step,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["path-template-items", templateId] });
      toast.success(ar ? "تمت إضافة الخطوة" : "Step added");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const removeStep = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("path_template_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["path-template-items", templateId] }),
  });

  const move = useMutation({
    mutationFn: async ({ id, dir }: { id: string; dir: -1 | 1 }) => {
      const list = [...(items.data ?? [])];
      const i = list.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return;
      const a = list[i]!;
      const b = list[j]!;
      await supabase.from("path_template_items").update({ step_order: b.step_order }).eq("id", a.id);
      await supabase.from("path_template_items").update({ step_order: a.step_order }).eq("id", b.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["path-template-items", templateId] }),
  });

  const togglePublish = useMutation({
    mutationFn: async () => {
      if (!template) return;
      const { error } = await supabase
        .from("path_templates")
        .update({ published: !template.published })
        .eq("id", template.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["path-templates"] });
      toast.success(ar ? "تم تحديث حالة النشر" : "Publish state updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const typeLabel: Record<string, string> = {
    resource: ar ? "كورس/فيديو/كتاب" : "Course/Video/Book",
    project: ar ? "مشروع" : "Project",
    challenge: ar ? "تحدي" : "Challenge",
    quiz: ar ? "اختبار" : "Assessment",
  };

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <RouteIcon className="size-5 text-primary" />
        {ar ? "بناء مسار التعلّم" : "Learning path builder"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {ar
          ? "أنت من يحدد خطوات المسار لكل مهارة من محتواك المنشور — الطالب يستلم هذه الخطوات بالترتيب نفسه."
          : "You decide the steps of each skill's path from your published content — students receive them in this exact order."}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{ar ? "المهارة" : "Skill"}</Label>
          <Select value={skillKey} onValueChange={setSkillKey}>
            <SelectTrigger>
              <SelectValue placeholder={ar ? "اختر مهارة" : "Pick a skill"} />
            </SelectTrigger>
            <SelectContent>
              {(skills.data ?? []).map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {ar ? s.name_ar : s.name_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{ar ? "المستوى" : "Level"}</Label>
          <Select value={level} onValueChange={(v) => setLevel(v as Difficulty)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEVELS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button onClick={() => createTemplate.mutate()} disabled={!skillKey || createTemplate.isPending}>
            {createTemplate.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {ar ? "مسار جديد" : "New template"}
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        <Label className="text-xs text-muted-foreground">{ar ? "المسارات الموجودة" : "Existing templates"}</Label>
        <Select value={templateId} onValueChange={setTemplateId}>
          <SelectTrigger>
            <SelectValue placeholder={ar ? "اختر مساراً للتعديل" : "Pick a template to edit"} />
          </SelectTrigger>
          <SelectContent>
            {(templates.data ?? []).map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {(ar ? t.title_ar : t.title_en) || t.skill_key} · {t.level} ·{" "}
                {t.published ? (ar ? "منشور" : "published") : ar ? "مسودة" : "draft"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {template && (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">
              {ar ? "خطوات المسار" : "Path steps"} ({(items.data ?? []).length})
            </p>
            <Button size="sm" variant={template.published ? "secondary" : "default"} onClick={() => togglePublish.mutate()}>
              {template.published ? (ar ? "إلغاء النشر" : "Unpublish") : ar ? "نشر للطلاب" : "Publish to students"}
            </Button>
          </div>

          <ol className="mt-3 space-y-2">
            {(items.data ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">
                {ar ? "لا توجد خطوات بعد — أضفها من محتواك بالأسفل." : "No steps yet — add them from your content below."}
              </p>
            )}
            {(items.data ?? []).map((it, i) => (
              <li
                key={it.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {i + 1}. {ar ? it.title_ar : it.title_en}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {typeLabel[it.item_type]} · {it.level}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button size="icon" variant="ghost" onClick={() => move.mutate({ id: it.id, dir: -1 })}>
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => move.mutate({ id: it.id, dir: 1 })}>
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => removeStep.mutate(it.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-5 space-y-4">
            <p className="text-sm font-semibold">{ar ? "أضف خطوة من محتواك" : "Add a step from your content"}</p>
            {content.isLoading && <Loader2 className="size-5 animate-spin text-muted-foreground" />}

            {(content.data?.resources ?? []).map((r) => (
              <Row
                key={r.id}
                title={ar ? r.title_ar : r.title_en}
                meta={`${typeLabel['resource']} · ${r.kind} · ${r.level}`}
                label={ar ? "إضافة" : "Add"}
                onAdd={() =>
                  addStep.mutate({
                    item_type: "resource",
                    item_id: r.id,
                    subject_id: r.subject_id,
                    title_ar: r.title_ar,
                    title_en: r.title_en,
                    body_ar: r.url,
                    body_en: r.url,
                    level: r.level as Difficulty,
                  })
                }
              />
            ))}
            {(content.data?.challenges ?? []).map((c) => (
              <Row
                key={c.id}
                title={ar ? c.title_ar : c.title_en}
                meta={`${typeLabel['challenge']} · ${c.level}`}
                label={ar ? "إضافة" : "Add"}
                onAdd={() =>
                  addStep.mutate({
                    item_type: "challenge",
                    item_id: c.id,
                    subject_id: c.subject_id,
                    title_ar: c.title_ar,
                    title_en: c.title_en,
                    body_ar: c.prompt_ar,
                    body_en: c.prompt_en,
                    level: c.level as Difficulty,
                  })
                }
              />
            ))}
            {(content.data?.projects ?? []).map((p) => (
              <Row
                key={p.id}
                title={ar ? p.title_ar : p.title_en}
                meta={`${typeLabel['project']} · ${p.level}`}
                label={ar ? "إضافة" : "Add"}
                onAdd={() =>
                  addStep.mutate({
                    item_type: "project",
                    item_id: p.id,
                    subject_id: p.subject_id,
                    title_ar: p.title_ar,
                    title_en: p.title_en,
                    body_ar: p.description_ar,
                    body_en: p.description_en,
                    level: p.level as Difficulty,
                  })
                }
              />
            ))}
            {(content.data?.subjects ?? []).map((s) => (
              <Row
                key={s.id}
                title={ar ? `اختبار: ${s.name_ar}` : `Assessment: ${s.name_en}`}
                meta={typeLabel['quiz'] ?? ""}
                label={ar ? "إضافة" : "Add"}
                onAdd={() =>
                  addStep.mutate({
                    item_type: "quiz",
                    item_id: s.id,
                    subject_id: s.id,
                    title_ar: `اختبار: ${s.name_ar}`,
                    title_en: `Assessment: ${s.name_en}`,
                    body_ar: "أعد قياس مستواك في هذه المهارة بعد إنهاء الخطوات السابقة.",
                    body_en: "Re-measure this skill after finishing the steps above.",
                    level: template.level,
                  })
                }
              />
            ))}

            {content.data &&
              content.data.resources.length === 0 &&
              content.data.projects.length === 0 &&
              content.data.challenges.length === 0 &&
              content.data.subjects.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {ar
                    ? "لا يوجد محتوى منشور مرتبط بهذه المهارة — أضفه أولاً من إدارة المحتوى."
                    : "No published content linked to this skill yet — add it first in the content manager."}
                </p>
              )}
          </div>
        </>
      )}
    </section>
  );
}

function Row({
  title,
  meta,
  label,
  onAdd,
}: {
  title: string;
  meta: string;
  label: string;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </div>
      <Button size="sm" variant="outline" onClick={onAdd}>
        <Plus className="size-4" />
        {label}
      </Button>
    </div>
  );
}
