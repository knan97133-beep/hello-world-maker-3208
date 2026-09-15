/**
 * _authenticated/admin.students.tsx — /admin/students
 * Platform-wide student progress and submission reviews.
 */
import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";

import { StudentProgressCard } from "@/components/app/StudentProgressCard";
import { SubmissionReviewCard } from "@/components/app/SubmissionCards";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/students")({
  head: () => ({
    meta: [
      { title: "Students — InfoPath Admin" },
      { name: "description", content: "Platform-wide student progress and submission reviews on InfoPath." },
      { property: "og:title", content: "Students — InfoPath Admin" },
      { property: "og:description", content: "Progress, submissions and feedback across the platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminStudents,
});

function AdminStudents() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <Users className="size-6 text-primary" />
          {ar ? "الطلاب والتسليمات" : "Students & submissions"}
        </h1>
      </header>
      <StudentProgressCard subjectIds={[]} />
      <SubmissionReviewCard subjectIds={[]} />
    </div>
  );
}
