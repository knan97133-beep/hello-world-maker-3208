/**
 * _authenticated/admin.tsx
 * -------------------------------------------------------------
 * Admin dashboard: platform statistics and full management of
 * academic subjects (create, edit, delete). Visible only to users
 * holding the `admin` role; everyone else sees an access notice.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, FolderKanban, Loader2, Pencil, Plus, Shield, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useIsAdmin, useSession } from "@/lib/session";

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

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — InfoPath" },
      { name: "description", content: "Manage InfoPath subjects, content and platform statistics." },
      { property: "og:title", content: "Admin Dashboard — InfoPath" },
      { property: "og:description", content: "Manage subjects, content and statistics on InfoPath." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin(user?.id);
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SubjectForm>(emptyForm);
  const [editing, setEditing] = useState(false);

  const stats = useQuery({
    queryKey: ["admin-stats"],
    enabled: Boolean(isAdmin),
    queryFn: async () => {
      const tables = ["subjects", "resources", "projects", "challenges", "quiz_questions"] as const;
      const counts = await Promise.all(
        tables.map(async (t) => {
          const { count, error } = await supabase.from(t).select("*", { count: "exact", head: true });
          if (error) throw error;
          return count ?? 0;
        }),
      );
      return {
        subjects: counts[0],
        resources: counts[1],
        projects: counts[2],
        challenges: counts[3],
        questions: counts[4],
      };
    },
  });

  const subjects = useQuery({
    queryKey: ["admin-subjects"],
    enabled: Boolean(isAdmin),
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

  if (roleLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-3 py-10">
          <Shield className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {ar
              ? "هذه الصفحة مخصصة لمدير المنصة فقط."
              : "This page is restricted to platform administrators."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const cards = [
    { label: ar ? "المواد" : "Subjects", value: stats.data?.subjects, icon: BookOpen },
    { label: ar ? "المصادر" : "Resources", value: stats.data?.resources, icon: FolderKanban },
    { label: ar ? "المشاريع" : "Projects", value: stats.data?.projects, icon: FolderKanban },
    { label: ar ? "التحديات" : "Challenges", value: stats.data?.challenges, icon: Users },
    { label: ar ? "الأسئلة" : "Questions", value: stats.data?.questions, icon: BookOpen },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <Shield className="size-6 text-primary" />
          {ar ? "لوحة تحكم المدير" : "Admin Dashboard"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ar ? "إدارة محتوى المنصة ومتابعة الإحصائيات." : "Manage platform content and track statistics."}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex flex-col gap-1 py-5">
              <c.icon className="size-4 text-primary" />
              <span className="text-2xl font-bold">{c.value ?? "—"}</span>
              <span className="text-xs text-muted-foreground">{c.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

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
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
              />
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
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete"
                  onClick={() => remove.mutate(s.id)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <ContentManager />
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
