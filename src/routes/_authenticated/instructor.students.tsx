/**
 * _authenticated/instructor.students.tsx — /instructor/students
 * Follow-up page: student progress, current step and stalled alerts.
 */
import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";

import { StudentProgressCard } from "@/components/app/StudentProgressCard";
import { useI18n } from "@/lib/i18n";
import { useMySubjects, useSession } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/instructor/students")({
  head: () => ({
    meta: [
      { title: "Student Progress — InfoPath Instructor" },
      { name: "description", content: "Follow how your students progress through their learning paths." },
      { property: "og:title", content: "Student Progress — InfoPath" },
      { property: "og:description", content: "Current step, updates and stalled students." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InstructorStudents,
});

function InstructorStudents() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const mine = useMySubjects(user?.id);
  const subjectIds = (mine.data ?? []).map((r) => r.subject_id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <Users className="size-6 text-primary" />
          {ar ? "متابعة الطلاب" : "Student follow-up"}
        </h1>
      </header>
      <StudentProgressCard subjectIds={subjectIds} />
    </div>
  );
}
