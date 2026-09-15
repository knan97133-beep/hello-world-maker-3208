/**
 * _authenticated/instructor.studio.tsx — /instructor/studio
 * AI content studio: draft content the instructor reviews and publishes.
 */
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { AiContentStudio } from "@/components/app/AiContentStudio";
import { useI18n } from "@/lib/i18n";
import { useMySubjects, useSession } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/instructor/studio")({
  head: () => ({
    meta: [
      { title: "AI Content Studio — InfoPath Instructor" },
      { name: "description", content: "Generate content drafts with AI, then review and publish them." },
      { property: "og:title", content: "AI Content Studio — InfoPath" },
      { property: "og:description", content: "AI drafts, instructor approval." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InstructorStudio,
});

function InstructorStudio() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const mine = useMySubjects(user?.id);
  const subjectIds = (mine.data ?? []).map((r) => r.subject_id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <Sparkles className="size-6 text-primary" />
          {ar ? "استوديو المحتوى بالذكاء" : "AI content studio"}
        </h1>
      </header>
      <AiContentStudio subjectIds={subjectIds} />
    </div>
  );
}
