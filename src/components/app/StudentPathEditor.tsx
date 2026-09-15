/**
 * StudentPathEditor.tsx
 * -------------------------------------------------------------
 * The instructor reviews and edits ONE student's personal learning path.
 * The path is first proposed by the platform (AI orders the weak skills and
 * the instructor's template supplies the steps); here the instructor can
 * reorder, remove or add steps for that specific student before/while they
 * work on it.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import type { Difficulty, PathItem } from "@/lib/learning-path";

export function StudentPathEditor({
  studentId,
  skillKey,
  subjectIds,
}: {
  studentId: string;
  skillKey: string | null;
  subjectIds: string[];
}) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const path = useQuery({
    queryKey: ["student-path", studentId],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_path_items")
        .select("*")
        .eq("user_id", studentId)
        .order("step_order");
      if (error) throw error;
      return (data ?? []) as PathItem[];
    },
  });

  const content = useQuery({
    queryKey: ["student-path-content", skillKey, [...subjectIds].sort().join(",")],
    enabled: open && Boolean(skillKey),
    queryFn: async () => {
      const scoped = <T,>(rows: T[] | null, get: (r: T) => string | null) =>
        (rows ?? []).filter((r) => subjectIds.length === 0 || subjectIds.includes(get(r) ?? ""));

      const [resources, projects, challenges] = await Promise.all([
        supabase
          .from("resources")
          .select("id, subject_id, title_ar, title_en, url, level")
          .eq("skill_key", skillKey!)
          .eq("status", "published"),
        supabase
          .from("projects")
          .select("id, subject_id, title_ar, title_en, description_ar, description_en, level")
          .eq("skill_key", skillKey!)
          .eq("status", "published"),
        supabase
          .from("challenges")
          .select("id, subject_id, title_ar, title_en, prompt_ar, prompt_en, level")
          .eq("skill_key", skillKey!)
          .eq("status", "published"),
      ]);

      return {
        resources: scoped(resources.data, (r) => r.subject_id),
        projects: scoped(projects.data, (r) => r.subject_id),
        challenges: scoped(challenges.data, (r) => r.subject_id),
      };
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["student-path", studentId] });

  const addStep = useMutation({
    mutationFn: async (step: {
      item_type: "resource" | "project" | "challenge";
      item_id: string;
      subject_id: string | null;
      title_ar: string;
      title_en: string;
      body_ar: string | null;
      body_en: string | null;
      level: Difficulty;
    }) => {
      const list = path.data ?? [];
      const { error } = await supabase.from("learning_path_items").insert({
        user_id: studentId,
        skill_key: skillKey,
        status: "todo",
        step_order: list.length > 0 ? Math.max(...list.map((s) => s.step_order)) + 1 : 0,
        ...step,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      refresh();
      toast.success(ar ? "تمت إضافة الخطوة لمسار الطالب" : "Step added to the student's path");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const removeStep = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("learning_path_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const move = useMutation({
    mutationFn: async ({ id, dir }: { id: string; dir: -1 | 1 }) => {
      const list = [...(path.data ?? [])];
      const i = list.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return;
      const a = list[i]!;
      const b = list[j]!;
      await supabase.from("learning_path_items").update({ step_order: b.step_order }).eq("id", a.id);
      await supabase.from("learning_path_items").update({ step_order: a.step_order }).eq("id", b.id);
    },
    onSuccess: refresh,
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const typeLabel: Record<string, string> = {
    resource: ar ? "كورس/فيديو/كتاب" : "Course/Video/Book",
    project: ar ? "مشروع" : "Project",
    challenge: ar ? "تحدي" : "Challenge",
    quiz: ar ? "اختبار" : "Assessment",
  };
  const statusLabel: Record<string, string> = {
    todo: ar ? "لم يبدأ" : "Not started",
    in_progress: ar ? "قيد العمل" : "In progress",
    submitted: ar ? "بانتظار المراجعة" : "Waiting for review",
    done: ar ? "مكتمل" : "Completed",
  };

  return (
    <div className="mt-3">
      <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
        <Pencil className="size-4" />
        {ar ? "تعديل مسار الطالب" : "Edit student's path"}
      </Button>

      {open && (
        <div className="mt-3 rounded-xl border border-border/70 p-3">
          <p className="text-xs text-muted-foreground">
            {ar
              ? "هذا المسار مقترح تلقائياً من مستوى الطالب وقوالبك — عدّل ترتيبه أو خطواته كما تراه مناسباً."
              : "This path is proposed from the student's level and your templates — reorder or change its steps as you see fit."}
          </p>

          {path.isLoading ? (
            <Loader2 className="mt-3 size-5 animate-spin text-muted-foreground" />
          ) : (path.data ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {ar ? "لا توجد خطوات في مسار هذا الطالب بعد." : "This student has no path steps yet."}
            </p>
          ) : (
            <ol className="mt-3 space-y-2">
              {(path.data ?? []).map((it, i) => (
                <li
                  key={it.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {i + 1}. {ar ? it.title_ar : it.title_en}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {typeLabel[it.item_type]} · {it.level} ·{" "}
                      {statusLabel[it.status] ?? it.status}
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
          )}

          {skillKey && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold">
                {ar ? "أضف خطوة من محتواك المنشور" : "Add a step from your published content"}
              </p>
              {content.isLoading && <Loader2 className="size-5 animate-spin text-muted-foreground" />}

              {(content.data?.resources ?? []).map((r) => (
                <AddRow
                  key={r.id}
                  title={ar ? r.title_ar : r.title_en}
                  meta={`${typeLabel['resource']} · ${r.level}`}
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
                <AddRow
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
                <AddRow
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
            </div>
          )}
        </div>
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
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2">
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
