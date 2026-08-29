/**
 * PlacementManager.tsx
 * -------------------------------------------------------------
 * Admin CRUD for the placement-test question bank.
 * Each question belongs to a skill and a difficulty level; the student's
 * score per skill becomes the Skill Profile that drives the whole path.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useSkills } from "@/lib/skills";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

const empty = {
  skill_key: "",
  question_ar: "",
  question_en: "",
  options_ar: ["", "", "", ""],
  options_en: ["", "", "", ""],
  correct_index: 0,
  level: "easy" as "easy" | "medium" | "hard",
};

export function PlacementManager() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const queryClient = useQueryClient();
  const skills = useSkills();
  const [form, setForm] = useState(empty);
  const [filter, setFilter] = useState("");

  const questions = useQuery({
    queryKey: ["admin-placement"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("placement_questions")
        .select("*")
        .order("skill_key")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-placement"] });
    queryClient.invalidateQueries({ queryKey: ["placement-questions"] });
  };

  const add = useMutation({
    mutationFn: async () => {
      if (!form.skill_key) throw new Error(ar ? "اختر مهارة" : "Pick a skill");
      if (!form.question_en.trim() || !form.question_ar.trim())
        throw new Error(ar ? "اكتب نص السؤال بالعربية والإنجليزية" : "Write the question in both languages");
      if (form.options_en.some((o) => !o.trim()) || form.options_ar.some((o) => !o.trim()))
        throw new Error(ar ? "أكمل الخيارات الأربعة" : "Fill all four options");
      const { error } = await supabase.from("placement_questions").insert({
        ...form,
        sort_order: (questions.data?.filter((q) => q.skill_key === form.skill_key).length ?? 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(ar ? "تمت إضافة السؤال" : "Question added");
      setForm(empty);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("placement_questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(ar ? "تم الحذف" : "Deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const list = (questions.data ?? []).filter((q) => !filter || q.skill_key === filter);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="size-4 text-primary" />
          {ar ? "بنك أسئلة تحديد المستوى" : "Placement question bank"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{ar ? "المهارة" : "Skill"}</Label>
            <select
              className={selectClass}
              value={form.skill_key}
              onChange={(e) => setForm({ ...form, skill_key: e.target.value })}
            >
              <option value="">{ar ? "— اختر —" : "— pick —"}</option>
              {(skills.data ?? []).map((s) => (
                <option key={s.key} value={s.key}>
                  {ar ? s.name_ar : s.name_en}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{ar ? "المستوى" : "Level"}</Label>
            <select
              className={selectClass}
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value as typeof form.level })}
            >
              <option value="easy">{ar ? "سهل" : "Easy"}</option>
              <option value="medium">{ar ? "متوسط" : "Medium"}</option>
              <option value="hard">{ar ? "صعب" : "Hard"}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{ar ? "السؤال (عربي)" : "Question (Arabic)"}</Label>
            <Input value={form.question_ar} onChange={(e) => setForm({ ...form, question_ar: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{ar ? "السؤال (إنجليزي)" : "Question (English)"}</Label>
            <Input value={form.question_en} onChange={(e) => setForm({ ...form, question_en: e.target.value })} />
          </div>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-2 sm:col-span-2">
              <Input
                placeholder={`${ar ? "خيار" : "Option"} ${i + 1} (AR)`}
                value={form.options_ar[i]}
                onChange={(e) => {
                  const next = [...form.options_ar];
                  next[i] = e.target.value;
                  setForm({ ...form, options_ar: next });
                }}
              />
              <div className="flex items-center gap-2">
                <Input
                  placeholder={`${ar ? "خيار" : "Option"} ${i + 1} (EN)`}
                  value={form.options_en[i]}
                  onChange={(e) => {
                    const next = [...form.options_en];
                    next[i] = e.target.value;
                    setForm({ ...form, options_en: next });
                  }}
                />
                <label className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <input
                    type="radio"
                    name="correct"
                    checked={form.correct_index === i}
                    onChange={() => setForm({ ...form, correct_index: i })}
                  />
                  {ar ? "صحيح" : "Correct"}
                </label>
              </div>
            </div>
          ))}
        </div>

        <Button onClick={() => add.mutate()} disabled={add.isPending}>
          {add.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          {ar ? "إضافة سؤال" : "Add question"}
        </Button>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">
              {ar ? "الأسئلة الحالية" : "Existing questions"} ({list.length})
            </h3>
            <select className={`${selectClass} max-w-[220px]`} value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">{ar ? "كل المهارات" : "All skills"}</option>
              {(skills.data ?? []).map((s) => (
                <option key={s.key} value={s.key}>
                  {ar ? s.name_ar : s.name_en}
                </option>
              ))}
            </select>
          </div>
          {questions.isLoading ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          ) : (
            <ul className="space-y-2">
              {list.map((q) => (
                <li key={q.id} className="flex items-start justify-between gap-3 rounded-lg border border-border/70 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{ar ? q.question_ar : q.question_en}</p>
                    <p className="text-xs text-muted-foreground">
                      {q.skill_key} · {q.level}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => remove.mutate(q.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
