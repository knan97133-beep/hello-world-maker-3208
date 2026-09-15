/**
 * _authenticated/instructor.index.tsx — /instructor
 * Instructor home: the subjects assigned to the signed-in instructor.
 */
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, GraduationCap, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { useMySubjects, useSession } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/instructor/")({
  head: () => ({
    meta: [
      { title: "Instructor Area — InfoPath" },
      { name: "description", content: "The subjects assigned to you on InfoPath." },
      { property: "og:title", content: "Instructor Area — InfoPath" },
      { property: "og:description", content: "Your assigned subjects at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InstructorHome,
});

function InstructorHome() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const mine = useMySubjects(user?.id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <GraduationCap className="size-6 text-primary" />
          {ar ? "منطقة المدرّس" : "Instructor Area"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ar
            ? "اختر ما تريد إدارته من القائمة الجانبية."
            : "Pick what you want to manage from the sidebar."}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ar ? "موادي" : "My subjects"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {mine.isLoading && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
          {!mine.isLoading && (mine.data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">
              {ar
                ? "لم تُسند إليك أي مادة بعد — تواصل مع مدير المنصة."
                : "No subjects assigned to you yet — contact the platform admin."}
            </p>
          )}
          {(mine.data ?? []).map((row) => {
            const s = row.subjects as {
              id: string;
              code: string;
              name_ar: string;
              name_en: string;
              year: number;
              semester: number;
            } | null;
            if (!s) return null;
            return (
              <div
                key={row.subject_id}
                className="flex items-center gap-3 rounded-xl border border-border/70 px-3 py-2.5"
              >
                <BookOpen className="size-4 text-primary" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{ar ? s.name_ar : s.name_en}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.code} · {ar ? "السنة" : "Year"} {s.year} · {ar ? "الفصل" : "Semester"}{" "}
                    {s.semester}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
