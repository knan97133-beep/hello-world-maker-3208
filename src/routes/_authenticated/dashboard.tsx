/**
 * _authenticated/dashboard.tsx — /dashboard
 * -------------------------------------------------------------
 * Student home: greeting, year/semester picker, progress summary
 * and quick links into the subjects of the selected semester.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Flame, Target, Trophy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useProfile, useSession } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — InfoPath student roadmap" },
      {
        name: "description",
        content:
          "Your InfoPath dashboard: pick your academic year and semester, track completion and jump into your subjects.",
      },
      { property: "og:title", content: "InfoPath Dashboard" },
      { property: "og:description", content: "Track your IT study roadmap progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const years = [1, 2, 3, 4, 5];
const semesters = [1, 2];

function Dashboard() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const { data: profile } = useProfile(user?.id);
  const queryClient = useQueryClient();

  const year = profile?.current_year ?? 1;
  const semester = profile?.current_semester ?? 1;

  const subjects = useQuery({
    queryKey: ["subjects", year, semester],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("year", year)
        .eq("semester", semester)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const progress = useQuery({
    queryKey: ["progress", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("progress")
        .select("id, item_type, completed, subject_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
  });

  async function updatePlan(patch: { current_year?: number; current_semester?: number }) {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
  }

  const done = progress.data?.filter((p) => p.completed).length ?? 0;
  const quizzes = progress.data?.filter((p) => p.item_type === "quiz").length ?? 0;
  const subjectCount = subjects.data?.length ?? 0;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-muted-foreground">
          {ar ? "مرحباً بك مجدداً" : "Welcome back"}
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {profile?.full_name || user?.email}
        </h1>
      </header>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Trophy className="size-5" />}
          label={ar ? "عناصر مُنجزة" : "Completed items"}
          value={done}
        />
        <StatCard
          icon={<Target className="size-5" />}
          label={ar ? "اختبارات مجتازة" : "Quizzes taken"}
          value={quizzes}
        />
        <StatCard
          icon={<BookOpen className="size-5" />}
          label={ar ? "مواد هذا الفصل" : "Subjects this term"}
          value={subjectCount}
        />
      </div>

      {/* The connected loop: skill profile -> AI recommendations */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SkillProfileCard />
        <RecommendationsCard />
      </div>



      {/* Year / semester picker */}
      <section className="rounded-2xl border border-border/70 bg-card p-5">
        <h2 className="text-lg font-bold">
          {ar ? "اختر سنتك وفصلك الدراسي" : "Choose your year & semester"}
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-sm text-muted-foreground">
              {ar ? "السنة الدراسية" : "Academic year"}
            </p>
            <div className="flex flex-wrap gap-2">
              {years.map((y) => (
                <Button
                  key={y}
                  size="sm"
                  variant={y === year ? "default" : "outline"}
                  onClick={() => updatePlan({ current_year: y })}
                >
                  {ar ? `السنة ${y}` : `Year ${y}`}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm text-muted-foreground">
              {ar ? "الفصل الدراسي" : "Semester"}
            </p>
            <div className="flex flex-wrap gap-2">
              {semesters.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={s === semester ? "default" : "outline"}
                  onClick={() => updatePlan({ current_semester: s })}
                >
                  {ar ? `الفصل ${s}` : `Semester ${s}`}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Subjects of the selected semester */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{ar ? "مواد الفصل" : "Semester subjects"}</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/subjects">{ar ? "كل المواد" : "All subjects"}</Link>
          </Button>
        </div>
        {subjects.isLoading ? (
          <p className="text-sm text-muted-foreground">{ar ? "جارِ التحميل…" : "Loading…"}</p>
        ) : subjectCount === 0 ? (
          <p className="text-sm text-muted-foreground">
            {ar ? "لا توجد مواد لهذا الفصل بعد." : "No subjects for this semester yet."}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {subjects.data!.map((s) => {
              const items = progress.data?.filter((p) => p.subject_id === s.id).length ?? 0;
              return (
                <Link
                  key={s.id}
                  to="/subjects/$code"
                  params={{ code: s.code }}
                  className="group rounded-2xl border border-border/70 bg-card p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold group-hover:text-primary">
                      {ar ? s.name_ar : s.name_en}
                    </h3>
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-mono">
                      {s.code}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {ar ? s.description_ar : s.description_en}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <Progress value={Math.min(items * 20, 100)} className="h-2" />
                    <Flame className="size-4 text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-2 text-3xl font-extrabold">{value}</p>
    </div>
  );
}
