/**
 * _authenticated/admin.subjects.tsx — /admin/subjects
 * Create, edit and delete the academic subjects of the platform.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

type SubjectForm = {
  id?: string;
  code: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  year: number;
  semester: number;
  skills: string;
};

const emptyForm: SubjectForm = {
  code: "",
  name_ar: "",
  name_en: "",
  description_ar: "",
  description_en: "",
  year: 1,
  semester: 1,
  skills: "",
};

export const Route = createFileRoute("/_authenticated/admin/subjects")({
  head: () => ({
    meta: [
      { title: "Manage Subjects — InfoPath Admin" },
      { name: "description", content: "Create, edit and delete the academic subjects on InfoPath." },
      { property: "og:title", content: "Manage Subjects — InfoPath" },
      { property: "og:description", content: "Full control over the study plan subjects." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminSubjects,
});

function AdminSubjects() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SubjectForm>(emptyForm);
  const [editing, setEditing] = useState(false);

  const subjects = useQuery({
    queryKey: ["admin-subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("year")
        .order("semester")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (value: SubjectForm) => {
      const payload = {
        code: value.code.trim(),
        name_ar: value.name_ar.trim(),
        name_en: value.name_en.trim(),
        description_ar: value.description_ar.trim() || null,
        description_en: value.description_en.trim() || null,
        year: Number(value.year),
        semester: Number(value.semester),
        skills: value.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const query = value.id
        ? supabase.from("subjects").update(payload).eq("id", value.id)
        : supabase.from("subjects").insert(payload);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(ar ? "تم الحفظ" : "Saved");
      setForm(emptyForm);
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["admin-subjects"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(ar ? "تم الحذف" : "Deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-subjects"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <BookOpen className="size-6 text-primary" />
          {ar ? "إدارة المواد" : "Manage subjects"}
        </h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {editing ? (ar ? "تعديل مادة" : "Edit subject") : ar ? "إضافة مادة جديدة" : "Add a new subject"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate(form);
            }}
          >
            <Field label={ar ? "الرمز" : "Code"}>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            </Field>
            <Field label={ar ? "المهارات (مفصولة بفاصلة)" : "Skills (comma separated)"}>
              <Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
            </Field>
            <Field label={ar ? "الاسم بالعربية" : "Arabic name"}>
              <Input
                value={form.name_ar}
                onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                required
              />
            </Field>
            <Field label={ar ? "الاسم بالإنجليزية" : "English name"}>
              <Input
                value={form.name_en}
                onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                required
              />
            </Field>
            <Field label={ar ? "الوصف بالعربية" : "Arabic description"}>
              <Textarea
                rows={2}
                value={form.description_ar}
                onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
              />
            </Field>
            <Field label={ar ? "الوصف بالإنجليزية" : "English description"}>
              <Textarea
                rows={2}
                value={form.description_en}
                onChange={(e) => setForm({ ...form, description_en: e.target.value })}
              />
            </Field>
            <Field label={ar ? "السنة" : "Year"}>
              <Input
                type="number"
                min={1}
                max={5}
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
              />
            </Field>
            <Field label={ar ? "الفصل" : "Semester"}>
              <Input
                type="number"
                min={1}
                max={2}
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}
              />
            </Field>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                {ar ? "حفظ" : "Save"}
              </Button>
              {editing && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setForm(emptyForm);
                    setEditing(false);
                  }}
                >
                  {ar ? "إلغاء" : "Cancel"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ar ? "كل المواد" : "All subjects"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {subjects.isLoading && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
          {subjects.data?.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{ar ? s.name_ar : s.name_en}</p>
                <p className="text-xs text-muted-foreground">
                  {s.code} · {ar ? "السنة" : "Year"} {s.year} · {ar ? "الفصل" : "Semester"} {s.semester}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Edit"
                  onClick={() => {
                    setEditing(true);
                    setForm({
                      id: s.id,
                      code: s.code,
                      name_ar: s.name_ar,
                      name_en: s.name_en,
                      description_ar: s.description_ar ?? "",
                      description_en: s.description_en ?? "",
                      year: s.year,
                      semester: s.semester,
                      skills: (s.skills ?? []).join(", "),
                    });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => remove.mutate(s.id)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
