/**
 * _authenticated/instructor.reviews.tsx — /instructor/reviews
 * Review queue: grade submissions, leave feedback and reply.
 */
import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck } from "lucide-react";

import { SubmissionReviewCard } from "@/components/app/SubmissionCards";
import { useI18n } from "@/lib/i18n";
import { useMySubjects, useSession } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/instructor/reviews")({
  head: () => ({
    meta: [
      { title: "Submission Reviews — InfoPath Instructor" },
      { name: "description", content: "Grade student submissions and send feedback on InfoPath." },
      { property: "og:title", content: "Submission Reviews — InfoPath" },
      { property: "og:description", content: "Grade, comment and reply to your students." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InstructorReviews,
});

function InstructorReviews() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const mine = useMySubjects(user?.id);
  const subjectIds = (mine.data ?? []).map((r) => r.subject_id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <ClipboardCheck className="size-6 text-primary" />
          {ar ? "مراجعة التسليمات" : "Submission reviews"}
        </h1>
      </header>
      <SubmissionReviewCard subjectIds={subjectIds} />
    </div>
  );
}
