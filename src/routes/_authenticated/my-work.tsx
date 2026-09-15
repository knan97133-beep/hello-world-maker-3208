/**
 * _authenticated/my-work.tsx — /my-work
 * The student's submissions: what was sent to the instructor,
 * the grade, the feedback and the discussion thread.
 */
import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";

import { MySubmissionsCard } from "@/components/app/SubmissionCards";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/my-work")({
  head: () => ({
    meta: [
      { title: "My Submissions — InfoPath" },
      {
        name: "description",
        content: "Your InfoPath project and challenge submissions with instructor grades and feedback.",
      },
      { property: "og:title", content: "My Submissions — InfoPath" },
      { property: "og:description", content: "Grades, feedback and messages from your instructor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyWorkPage,
});

function MyWorkPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <Send className="size-6 text-primary" />
          {ar ? "تسليماتي" : "My submissions"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ar
            ? "أعمالك المرسلة إلى الأستاذ مع الدرجات والملاحظات."
            : "Your work sent to the instructor with grades and feedback."}
        </p>
      </header>

      <MySubmissionsCard />
    </div>
  );
}
