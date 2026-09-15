/**
 * PathTemplateBuilder.tsx
 * -------------------------------------------------------------
 * The instructor (or admin) builds the learning path by hand:
 * one template per skill + level, whose steps are picked from the content
 * they already published. When a skill becomes a student's current goal,
 * the platform copies this template into that student's personal path.
 *
 * Layout: a gallery of template cards → pick one (or create new) →
 * two-pane editor: current steps on one side, content library on the other.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  CheckCircle2,
  CircleDashed,
  Code2,
  ClipboardList,
  GraduationCap,
  Loader2,
  Plus,
  Route as RouteIcon,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const LEVEL_LABEL: Record<Difficulty, { ar: string; en: string }> = {
  easy: { ar: "مبتدئ", en: "Beginner" },
  medium: { ar: "متوسط", en: "Intermediate" },
  hard: { ar: "متقدم", en: "Advanced" },
};

type StepType = "resource" | "project" | "challenge" | "quiz";

export function PathTemplateBuilder({ subjectIds }: { subjectIds?: string[] } = {}) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const queryClient = useQueryClient();
  const skills = useSkills();
  const templates = usePathTemplates();

  const [templateId, setTemplateId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [newLevel, setNewLevel] = useState<Difficulty>("easy");

  const items = usePathTemplateItems(templateId || undefined);
  const template = (templates.data ?? []).find((t) => t.id === templateId);

  const skillName = (key: string) => {
    const s = (skills.data ?? []).find((x) => x.key === key);
    return s ? (ar ? s.name_ar : s.name_en) : key;
  };

  /** Step counts per template, for the gallery cards. */
  const stepCounts = useQuery({
    queryKey: ["path-template-step-counts"],
    queryFn: async () => {
      const { data } = await supabase.from("path_template_items").select("template_id");
      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        counts[row.template_id] = (counts[row.template_id] ?? 0) + 1;
      }
      return counts;
    },
  });

  /** Published content the instructor can put in a step. */
  const content = useQuery({
    queryKey: ["template-content", template?.skill_key, subjectIds ?? "all"],
    enabled: Boolean(template?.skill_key),
    queryFn: async () => {
      const skillKey = template!.skill_key;
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

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["path-templates"] });
    queryClient.invalidateQueries({ queryKey: ["path-template-items", templateId] });
    queryClient.invalidateQueries({ queryKey: ["path-template-step-counts"] });
  };

  const createTemplate = useMutation({
    mutationFn: async () => {
      if (!user || !newSkill) throw new Error(ar ? "اختر المهارة أولاً" : "Pick a skill first");
      const { data, error } = await supabase
        .from("path_templates")
        .insert({
          skill_key: newSkill,
          level: newLevel,
          title_ar: `مسار ${skillName(newSkill)} — ${LEVEL_LABEL[newLevel].ar}`,
          title_en: `${skillName(newSkill)} path — ${LEVEL_LABEL[newLevel].en}`,
          created_by: user.id,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      setTemplateId(id);
      setCreateOpen(false);
      invalidateAll();
      toast.success(ar ? "تم إنشاء المسار — أضف خطواته الآن" : "Template created — now add its steps");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const addStep = useMutation({
    mutationFn: async (step: {
      item_type: StepType;
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
      invalidateAll();
      toast.success(ar ? "أُضيفت الخطوة إلى المسار" : "Step added to the path");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const removeStep = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("path_template_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
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
      invalidateAll();
      toast.success(
        template?.published
          ? ar ? "أصبح مسودة — لن يُسند لطلاب جدد" : "Now a draft — won't be assigned to new students"
          : ar ? "نُشر — سيصل للطلاب عند الحاجة" : "Published — students will receive it when needed",
      );
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const typeMeta: Record<StepType, { ar: string; en: string; icon: typeof BookOpen }> = {
    resource: { ar: "تعلّم", en: "Learn", icon: BookOpen },
    challenge: { ar: "تحدي", en: "Challenge", icon: Code2 },
    project: { ar: "مشروع", en: "Project", icon: ClipboardList },
    quiz: { ar: "اختبار", en: "Assessment", icon: GraduationCap },
  };

  return (
    <section className="space-y-6">
      {/* Intro */}
      <div className="rounded-2xl border border-border/70 bg-card p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <RouteIcon className="size-5 text-primary" />
          {ar ? "بناء مسارات التعلّم" : "Learning path builder"}
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {ar
            ? "كل مسار هو سلسلة خطوات (تعلّم ← تحديات ← مشاريع ← اختبار) تبنيها من محتواك المنشور. عندما تصبح مهارةٌ ما هدفاً لطالب، يستلم نسخة من المسار المنشور الخاص بها — الذكاء يختار أي مسار يناسبه، وأنت من يحدد محتواه."
            : "Each path is an ordered chain of steps (learn → challenges → projects → assessment) built from your published content. When a skill becomes a student's goal, they receive a copy of its published path — AI picks which path fits, you decide what's in it."}
        </p>
      </div>

      {/* Template gallery */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            {ar ? "مساراتك" : "Your paths"} ({(templates.data ?? []).length})
          </h3>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            {ar ? "مسار جديد" : "New path"}
          </Button>
        </div>

        {templates.isLoading && <Loader2 className="size-5 animate-spin text-muted-foreground" />}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(templates.data ?? []).map((t) => {
            const active = t.id === templateId;
            const count = stepCounts.data?.[t.id] ?? 0;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplateId(active ? "" : t.id)}
                className={`rounded-2xl border p-4 text-start transition-colors ${
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border/70 bg-card hover:border-primary/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold leading-snug">{ar ? t.title_ar : t.title_en}</p>
                  {t.published ? (
                    <Badge className="shrink-0 gap-1">
                      <CheckCircle2 className="size-3" />
                      {ar ? "منشور" : "Live"}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="shrink-0 gap-1">
                      <CircleDashed className="size-3" />
                      {ar ? "مسودة" : "Draft"}
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {skillName(t.skill_key)} · {LEVEL_LABEL[t.level as Difficulty]?.[ar ? "ar" : "en"] ?? t.level}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {count} {ar ? "خطوة" : "steps"}
                </p>
              </button>
            );
          })}
          {(templates.data ?? []).length === 0 && !templates.isLoading && (
            <p className="col-span-full rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {ar
                ? "لا توجد مسارات بعد — اضغط «مسار جديد» لبناء أول مسار."
                : "No paths yet — press “New path” to build your first one."}
            </p>
          )}
        </div>
      </div>

      {/* Editor */}
      {template && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Current steps */}
          <div className="rounded-2xl border border-border/70 bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold">{ar ? "خطوات المسار" : "Path steps"}</h3>
                <p className="text-xs text-muted-foreground">
                  {ar ? "الطالب ينفذها بهذا الترتيب من الأعلى للأسفل" : "Students follow this order, top to bottom"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={template.published ? "secondary" : "default"}
                  onClick={() => togglePublish.mutate()}
                  disabled={togglePublish.isPending}
                >
                  {template.published ? (ar ? "إيقاف النشر" : "Unpublish") : ar ? "نشر للطلاب" : "Publish"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setTemplateId("")}>
                  <X className="size-4" />
                  {ar ? "إغلاق" : "Close"}
                </Button>
              </div>
            </div>

            <ol className="mt-4 space-y-2">
              {(items.data ?? []).length === 0 && (
                <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  {ar
                    ? "المسار فارغ — أضف خطوات من مكتبة المحتوى بجانبه."
                    : "Empty path — add steps from the content library beside it."}
                </p>
              )}
              {(items.data ?? []).map((it, i) => {
                const meta = typeMeta[it.item_type as StepType] ?? typeMeta.resource;
                const Icon = meta.icon;
                return (
                  <li
                    key={it.id}
                    className="flex items-center gap-3 rounded-xl border border-border/70 px-3 py-2"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{ar ? it.title_ar : it.title_en}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Icon className="size-3" />
                        {ar ? meta.ar : meta.en} · {LEVEL_LABEL[it.level as Difficulty]?.[ar ? "ar" : "en"] ?? it.level}
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
                );
              })}
            </ol>
          </div>

          {/* Content library */}
          <div className="rounded-2xl border border-border/70 bg-card p-5">
            <h3 className="font-semibold">{ar ? "مكتبة المحتوى" : "Content library"}</h3>
            <p className="text-xs text-muted-foreground">
              {ar
                ? `محتواك المنشور في مهارة «${skillName(template.skill_key)}» — اضغط إضافة ليصبح خطوة في المسار.`
                : `Your published content for “${skillName(template.skill_key)}” — press add to make it a step.`}
            </p>

            <div className="mt-4 space-y-4">
              {content.isLoading && <Loader2 className="size-5 animate-spin text-muted-foreground" />}

              <LibraryGroup
                title={ar ? "تعلّم (كورسات / فيديوهات / كتب)" : "Learn (courses / videos / books)"}
                icon={BookOpen}
              >
                {(content.data?.resources ?? []).map((r) => (
                  <AddRow
                    key={r.id}
                    title={ar ? r.title_ar : r.title_en}
                    meta={`${r.kind} · ${LEVEL_LABEL[r.level as Difficulty]?.[ar ? "ar" : "en"] ?? r.level}`}
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
              </LibraryGroup>

              <LibraryGroup title={ar ? "تحديات" : "Challenges"} icon={Code2}>
                {(content.data?.challenges ?? []).map((c) => (
                  <AddRow
                    key={c.id}
                    title={ar ? c.title_ar : c.title_en}
                    meta={LEVEL_LABEL[c.level as Difficulty]?.[ar ? "ar" : "en"] ?? c.level}
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
              </LibraryGroup>

              <LibraryGroup title={ar ? "مشاريع" : "Projects"} icon={ClipboardList}>
                {(content.data?.projects ?? []).map((p) => (
                  <AddRow
                    key={p.id}
                    title={ar ? p.title_ar : p.title_en}
                    meta={LEVEL_LABEL[p.level as Difficulty]?.[ar ? "ar" : "en"] ?? p.level}
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
              </LibraryGroup>

              <LibraryGroup title={ar ? "اختبار نهائي" : "Final assessment"} icon={GraduationCap}>
                {(content.data?.subjects ?? []).map((s) => (
                  <AddRow
                    key={s.id}
                    title={ar ? `اختبار: ${s.name_ar}` : `Assessment: ${s.name_en}`}
                    meta={ar ? "يقيس مستوى الطالب بعد إنهاء الخطوات" : "Re-measures the student after the steps"}
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
              </LibraryGroup>

              {content.data &&
                content.data.resources.length === 0 &&
                content.data.projects.length === 0 &&
                content.data.challenges.length === 0 &&
                content.data.subjects.length === 0 && (
                  <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                    {ar
                      ? "لا يوجد محتوى منشور لهذه المهارة بعد — أضفه أولاً من «إدارة المحتوى» أو «استوديو الذكاء»."
                      : "No published content for this skill yet — add it first in Content manager or the AI studio."}
                  </p>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ar ? "مسار جديد" : "New path"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{ar ? "المهارة" : "Skill"}</Label>
              <Select value={newSkill} onValueChange={setNewSkill}>
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
              <Label>{ar ? "المستوى" : "Level"}</Label>
              <Select value={newLevel} onValueChange={(v) => setNewLevel(v as Difficulty)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {LEVEL_LABEL[l][ar ? "ar" : "en"]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={() => createTemplate.mutate()}
              disabled={!newSkill || createTemplate.isPending}
            >
              {createTemplate.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {ar ? "إنشاء وفتح المحرر" : "Create and open editor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function LibraryGroup({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof BookOpen;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children.filter(Boolean) : [children].filter(Boolean);
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" />
        {title}
      </p>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground/70">—</p>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </div>
  );
}

function AddRow({
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
