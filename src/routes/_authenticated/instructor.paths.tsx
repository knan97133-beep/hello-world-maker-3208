/**
 * _authenticated/instructor.paths.tsx — /instructor/paths
 * Build and publish the learning path templates students receive.
 */
import { createFileRoute } from "@tanstack/react-router";
import { Workflow } from "lucide-react";

import { PathTemplateBuilder } from "@/components/app/PathTemplateBuilder";
import { useI18n } from "@/lib/i18n";
import { useMySubjects, useSession } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/instructor/paths")({
  head: () => ({
    meta: [
      { title: "Path Builder — InfoPath Instructor" },
      { name: "description", content: "Design the ordered learning path templates your students follow." },
      { property: "og:title", content: "Path Builder — InfoPath" },
      { property: "og:description", content: "Order courses, challenges, projects and exams." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InstructorPaths,
});

function InstructorPaths() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const mine = useMySubjects(user?.id);
  const subjectIds = (mine.data ?? []).map((r) => r.subject_id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <Workflow className="size-6 text-primary" />
          {ar ? "بناء المسارات" : "Path builder"}
        </h1>
      </header>
      <PathTemplateBuilder subjectIds={subjectIds} />
    </div>
  );
}
