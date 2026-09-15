/**
 * _authenticated/instructor.content.tsx — /instructor/content
 * Manage courses, videos, books, projects and challenges.
 */
import { createFileRoute } from "@tanstack/react-router";
import { FolderKanban } from "lucide-react";

import { ContentManager } from "@/components/app/ContentManager";
import { useI18n } from "@/lib/i18n";
import { useMySubjects, useSession } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/instructor/content")({
  head: () => ({
    meta: [
      { title: "Content Manager — InfoPath Instructor" },
      { name: "description", content: "Add and publish courses, videos, books, projects and challenges." },
      { property: "og:title", content: "Content Manager — InfoPath" },
      { property: "og:description", content: "Manage the content of your subjects." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InstructorContent,
});

function InstructorContent() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const mine = useMySubjects(user?.id);
  const subjectIds = (mine.data ?? []).map((r) => r.subject_id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <FolderKanban className="size-6 text-primary" />
          {ar ? "إدارة المحتوى" : "Content manager"}
        </h1>
      </header>
      <ContentManager subjectIds={subjectIds} />
    </div>
  );
}
