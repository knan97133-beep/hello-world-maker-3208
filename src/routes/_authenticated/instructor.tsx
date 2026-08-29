/**
 * _authenticated/instructor.tsx
 * -------------------------------------------------------------
 * Instructor area: shows the subjects assigned to the signed-in
 * instructor and lets them manage the content of those subjects only
 * (courses, videos, books, projects, challenges). Platform-wide
 * management stays in the admin dashboard.
 */
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, GraduationCap, Loader2 } from "lucide-react";

import { AiContentStudio } from "@/components/app/AiContentStudio";
import { ContentManager } from "@/components/app/ContentManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { useIsAdmin, useIsInstructor, useMySubjects, useSession } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/instructor")({
  head: () => ({
    meta: [
      { title: "Instructor Area — InfoPath" },
      { name: "description", content: "Manage the content of the subjects assigned to you on InfoPath." },
      { property: "og:title", content: "Instructor Area — InfoPath" },
      { property: "og:description", content: "Manage your assigned subjects' courses, videos, projects and challenges." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InstructorPage,
});

function InstructorPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const { data: isInstructor, isLoading } = useIsInstructor(user?.id);
  const { data: isAdmin } = useIsAdmin(user?.id);
  const mine = useMySubjects(user?.id);

  if (isLoading || mine.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isInstructor && !isAdmin) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-3 py-10">
          <GraduationCap className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {ar ? "هذه الصفحة مخصصة للمدرّسين." : "This page is restricted to instructors."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const subjectIds = (mine.data ?? []).map((row) => row.subject_id);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <GraduationCap className="size-6 text-primary" />
          {ar ? "منطقة المدرّس" : "Instructor Area"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ar
            ? "تدير هنا محتوى المواد المسندة إليك فقط."
            : "Here you manage the content of the subjects assigned to you only."}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ar ? "موادي" : "My subjects"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {subjectIds.length === 0 && (
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
                    {s.code} · {ar ? "السنة" : "Year"} {s.year} · {ar ? "الفصل" : "Semester"} {s.semester}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <AiContentStudio subjectIds={subjectIds} />

      <ContentManager subjectIds={subjectIds} />
    </div>
  );
}
