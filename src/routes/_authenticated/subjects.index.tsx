/**
 * _authenticated/subjects.tsx — /subjects
 * -------------------------------------------------------------
 * Browse every subject, filtered by academic year and semester.
 */
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Lock } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useUnlockState } from "@/lib/unlock";

export const Route = createFileRoute("/_authenticated/subjects/")({
  head: () => ({
    meta: [
      { title: "Subjects — InfoPath IT curriculum roadmap" },
      {
        name: "description",
        content:
          "Browse all information technology subjects by academic year and semester, each with courses, projects, challenges and quizzes.",
      },
      { property: "og:title", content: "InfoPath Subjects" },
      { property: "og:description", content: "IT subjects by year and semester." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SubjectsPage,
});

function SubjectsPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [year, setYear] = useState<number | null>(null);
  const [semester, setSemester] = useState<number | null>(null);

  const subjects = useQuery({
    queryKey: ["all-subjects"],
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

  const list = (subjects.data ?? []).filter(
    (s) => (year === null || s.year === year) && (semester === null || s.semester === semester),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {ar ? "المواد الدراسية" : "Subjects"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ar
            ? "اختر السنة والفصل لعرض المواد المرتبطة بهما."
            : "Filter by year and semester to see the matching subjects."}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={year === null ? "default" : "outline"} onClick={() => setYear(null)}>
          {ar ? "كل السنوات" : "All years"}
        </Button>
        {[1, 2, 3, 4, 5].map((y) => (
          <Button key={y} size="sm" variant={year === y ? "default" : "outline"} onClick={() => setYear(y)}>
            {ar ? `السنة ${y}` : `Year ${y}`}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={semester === null ? "default" : "outline"}
          onClick={() => setSemester(null)}
        >
          {ar ? "كل الفصول" : "All semesters"}
        </Button>
        {[1, 2].map((s) => (
          <Button
            key={s}
            size="sm"
            variant={semester === s ? "default" : "outline"}
            onClick={() => setSemester(s)}
          >
            {ar ? `الفصل ${s}` : `Semester ${s}`}
          </Button>
        ))}
      </div>

      {subjects.isLoading ? (
        <p className="text-sm text-muted-foreground">{ar ? "جارِ التحميل…" : "Loading…"}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((s) => (
            <Link
              key={s.id}
              to="/subjects/$code"
              params={{ code: s.code }}
              className="group rounded-2xl border border-border/70 bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-bold group-hover:text-primary">{ar ? s.name_ar : s.name_en}</h2>
                <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-mono">{s.code}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {ar ? s.description_ar : s.description_en}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {ar ? `السنة ${s.year} · الفصل ${s.semester}` : `Year ${s.year} · Semester ${s.semester}`}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
