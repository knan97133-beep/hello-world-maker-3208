/**
 * ContentManager.tsx
 * -------------------------------------------------------------
 * Admin-only content editor. Lets the administrator pick a subject
 * and then add / delete its resources (YouTube videos, courses,
 * books, articles), projects and coding challenges.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

type Kind = "video" | "course" | "book" | "article";
type Level = "easy" | "medium" | "hard";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

/**
 * @param subjectIds When provided, only these subjects can be edited
 * (used by the instructor area, which is limited to assigned subjects).
 */
export function ContentManager({ subjectIds }: { subjectIds?: string[] } = {}) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const queryClient = useQueryClient();
  const [subjectId, setSubjectId] = useState<string>("");

  const subjects = useQuery({
    queryKey: ["admin-subjects-select", subjectIds ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("subjects")
        .select("id, code, name_ar, name_en, year, semester")
        .order("year")
        .order("semester");
      if (subjectIds) query = query.in("id", subjectIds.length ? subjectIds : ["00000000-0000-0000-0000-000000000000"]);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });


  const items = useQuery({
    queryKey: ["admin-content", subjectId],
    enabled: Boolean(subjectId),
    queryFn: async () => {
      const [resources, projects, challenges] = await Promise.all([
        supabase.from("resources").select("*").eq("subject_id", subjectId).order("sort_order"),
        supabase.from("projects").select("*").eq("subject_id", subjectId).order("sort_order"),
        supabase.from("challenges").select("*").eq("subject_id", subjectId).order("sort_order"),
      ]);
      const err = resources.error || projects.error || challenges.error;
      if (err) throw err;
      return {
        resources: resources.data ?? [],
        projects: projects.data ?? [],
        challenges: challenges.data ?? [],
      };
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-content", subjectId] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    queryClient.invalidateQueries({ queryKey: ["subject-content"] });
  };

  const remove = useMutation({
    mutationFn: async (input: { table: "resources" | "projects" | "challenges"; id: string }) => {
      const { error } = await supabase.from(input.table).delete().eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(ar ? "تم الحذف" : "Deleted");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ---- resource form -------------------------------------------------
  const emptyResource = {
    kind: "video" as Kind,
    title_ar: "",
    title_en: "",
    provider: "YouTube",
    url: "",
    duration_hours: "",
  };
  const [resource, setResource] = useState(emptyResource);

  const addResource = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("resources").insert({
        subject_id: subjectId,
        kind: resource.kind,
        title_ar: resource.title_ar.trim() || resource.title_en.trim(),
        title_en: resource.title_en.trim() || resource.title_ar.trim(),
        provider: resource.provider.trim() || null,
        url: resource.url.trim() || null,
        duration_hours: resource.duration_hours ? Number(resource.duration_hours) : null,
        is_free: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(ar ? "تمت الإضافة" : "Added");
      setResource(emptyResource);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ---- project / challenge forms --------------------------------------
  const emptyTask = {
    title_ar: "",
    title_en: "",
    body_ar: "",
    body_en: "",
    level: "easy" as Level,
    points: 10,
  };
  const [project, setProject] = useState(emptyTask);
  const [challenge, setChallenge] = useState({ ...emptyTask, points: 5 });

  const addProject = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("projects").insert({
        subject_id: subjectId,
        title_ar: project.title_ar.trim() || project.title_en.trim(),
        title_en: project.title_en.trim() || project.title_ar.trim(),
        description_ar: project.body_ar.trim() || null,
        description_en: project.body_en.trim() || null,
        level: project.level,
        points: Number(project.points) || 10,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(ar ? "تمت الإضافة" : "Added");
      setProject(emptyTask);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addChallenge = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("challenges").insert({
        subject_id: subjectId,
        title_ar: challenge.title_ar.trim() || challenge.title_en.trim(),
        title_en: challenge.title_en.trim() || challenge.title_ar.trim(),
        prompt_ar: challenge.body_ar.trim() || null,
        prompt_en: challenge.body_en.trim() || null,
        level: challenge.level,
        points: Number(challenge.points) || 5,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(ar ? "تمت الإضافة" : "Added");
      setChallenge({ ...emptyTask, points: 5 });
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const selectClass =
    "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {ar ? "إدارة محتوى المادة (دروس، مشاريع، تحديات)" : "Subject content (lessons, projects, challenges)"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Field label={ar ? "اختر المادة" : "Select subject"}>
          <select
            className={selectClass}
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            <option value="">{ar ? "— اختر مادة —" : "— pick a subject —"}</option>
            {subjects.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {ar ? s.name_ar : s.name_en} ({ar ? "سنة" : "Y"}
                {s.year}/{ar ? "فصل" : "S"}
                {s.semester})
              </option>
            ))}
          </select>
        </Field>

        {!subjectId && (
          <p className="text-sm text-muted-foreground">
            {ar
              ? "اختر مادة أولاً لعرض وإضافة محتواها."
              : "Pick a subject to view and add its content."}
          </p>
        )}

        {subjectId && (
          <>
            {/* ---------- Resources / YouTube lessons ---------- */}
            <section className="space-y-3 rounded-xl border border-border/70 p-4">
              <h3 className="text-sm font-semibold">
                {ar ? "درس / كورس / فيديو يوتيوب" : "Lesson / course / YouTube video"}
              </h3>
              <form
                className="grid gap-3 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  addResource.mutate();
                }}
              >
                <Field label={ar ? "النوع" : "Type"}>
                  <select
                    className={selectClass}
                    value={resource.kind}
                    onChange={(e) => setResource({ ...resource, kind: e.target.value as Kind })}
                  >
                    <option value="video">{ar ? "فيديو" : "Video"}</option>
                    <option value="course">{ar ? "كورس" : "Course"}</option>
                    <option value="book">{ar ? "كتاب" : "Book"}</option>
                    <option value="article">{ar ? "مقال" : "Article"}</option>
                  </select>
                </Field>
                <Field label={ar ? "رابط يوتيوب / الرابط" : "YouTube / link URL"}>
                  <Input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={resource.url}
                    onChange={(e) => setResource({ ...resource, url: e.target.value })}
                    required
                  />
                </Field>
                <Field label={ar ? "العنوان بالعربية" : "Arabic title"}>
                  <Input
                    value={resource.title_ar}
                    onChange={(e) => setResource({ ...resource, title_ar: e.target.value })}
                    required
                  />
                </Field>
                <Field label={ar ? "العنوان بالإنجليزية" : "English title"}>
                  <Input
                    value={resource.title_en}
                    onChange={(e) => setResource({ ...resource, title_en: e.target.value })}
                  />
                </Field>
                <Field label={ar ? "المصدر" : "Provider"}>
                  <Input
                    value={resource.provider}
                    onChange={(e) => setResource({ ...resource, provider: e.target.value })}
                  />
                </Field>
                <Field label={ar ? "المدة (ساعات)" : "Duration (hours)"}>
                  <Input
                    type="number"
                    step="0.25"
                    min="0"
                    value={resource.duration_hours}
                    onChange={(e) => setResource({ ...resource, duration_hours: e.target.value })}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={addResource.isPending}>
                    {addResource.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                    {ar ? "إضافة الدرس" : "Add lesson"}
                  </Button>
                </div>
              </form>
              <ItemList
                loading={items.isLoading}
                rows={(items.data?.resources ?? []).map((r) => ({
                  id: r.id,
                  title: ar ? r.title_ar : r.title_en,
                  sub: [r.kind, r.provider, r.url].filter(Boolean).join(" · "),
                }))}
                onDelete={(id) => remove.mutate({ table: "resources", id })}
                emptyLabel={ar ? "لا توجد دروس بعد." : "No lessons yet."}
              />
            </section>

            {/* ---------- Projects ---------- */}
            <section className="space-y-3 rounded-xl border border-border/70 p-4">
              <h3 className="text-sm font-semibold">{ar ? "مشروع عملي" : "Practical project"}</h3>
              <TaskForm
                ar={ar}
                value={project}
                onChange={setProject}
                pending={addProject.isPending}
                onSubmit={() => addProject.mutate()}
                selectClass={selectClass}
              />
              <ItemList
                loading={items.isLoading}
                rows={(items.data?.projects ?? []).map((p) => ({
                  id: p.id,
                  title: ar ? p.title_ar : p.title_en,
                  sub: `${p.level} · ${p.points} ${ar ? "نقطة" : "pts"}`,
                }))}
                onDelete={(id) => remove.mutate({ table: "projects", id })}
                emptyLabel={ar ? "لا توجد مشاريع بعد." : "No projects yet."}
              />
            </section>

            {/* ---------- Challenges ---------- */}
            <section className="space-y-3 rounded-xl border border-border/70 p-4">
              <h3 className="text-sm font-semibold">{ar ? "تحدٍ برمجي" : "Coding challenge"}</h3>
              <TaskForm
                ar={ar}
                value={challenge}
                onChange={setChallenge}
                pending={addChallenge.isPending}
                onSubmit={() => addChallenge.mutate()}
                selectClass={selectClass}
              />
              <ItemList
                loading={items.isLoading}
                rows={(items.data?.challenges ?? []).map((c) => ({
                  id: c.id,
                  title: ar ? c.title_ar : c.title_en,
                  sub: `${c.level} · ${c.points} ${ar ? "نقطة" : "pts"}`,
                }))}
                onDelete={(id) => remove.mutate({ table: "challenges", id })}
                emptyLabel={ar ? "لا توجد تحديات بعد." : "No challenges yet."}
              />
            </section>
          </>
        )}
      </CardContent>
    </Card>
  );
}

type Task = {
  title_ar: string;
  title_en: string;
  body_ar: string;
  body_en: string;
  level: Level;
  points: number;
};

function TaskForm({
  ar,
  value,
  onChange,
  pending,
  onSubmit,
  selectClass,
}: {
  ar: boolean;
  value: Task;
  onChange: (v: Task) => void;
  pending: boolean;
  onSubmit: () => void;
  selectClass: string;
}) {
  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Field label={ar ? "العنوان بالعربية" : "Arabic title"}>
        <Input
          value={value.title_ar}
          onChange={(e) => onChange({ ...value, title_ar: e.target.value })}
          required
        />
      </Field>
      <Field label={ar ? "العنوان بالإنجليزية" : "English title"}>
        <Input
          value={value.title_en}
          onChange={(e) => onChange({ ...value, title_en: e.target.value })}
        />
      </Field>
      <Field label={ar ? "الوصف بالعربية" : "Arabic description"}>
        <Textarea
          rows={2}
          value={value.body_ar}
          onChange={(e) => onChange({ ...value, body_ar: e.target.value })}
        />
      </Field>
      <Field label={ar ? "الوصف بالإنجليزية" : "English description"}>
        <Textarea
          rows={2}
          value={value.body_en}
          onChange={(e) => onChange({ ...value, body_en: e.target.value })}
        />
      </Field>
      <Field label={ar ? "المستوى" : "Level"}>
        <select
          className={selectClass}
          value={value.level}
          onChange={(e) => onChange({ ...value, level: e.target.value as Level })}
        >
          <option value="easy">{ar ? "سهل" : "Easy"}</option>
          <option value="medium">{ar ? "متوسط" : "Medium"}</option>
          <option value="hard">{ar ? "صعب" : "Hard"}</option>
        </select>
      </Field>
      <Field label={ar ? "النقاط" : "Points"}>
        <Input
          type="number"
          min={1}
          value={value.points}
          onChange={(e) => onChange({ ...value, points: Number(e.target.value) })}
        />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          {ar ? "إضافة" : "Add"}
        </Button>
      </div>
    </form>
  );
}

function ItemList({
  loading,
  rows,
  onDelete,
  emptyLabel,
}: {
  loading: boolean;
  rows: { id: string; title: string; sub: string }[];
  onDelete: (id: string) => void;
  emptyLabel: string;
}) {
  if (loading) return <Loader2 className="size-5 animate-spin text-muted-foreground" />;
  if (rows.length === 0) return <p className="text-xs text-muted-foreground">{emptyLabel}</p>;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li
          key={r.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{r.title}</p>
            <p className="truncate text-xs text-muted-foreground">{r.sub}</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => onDelete(r.id)}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
