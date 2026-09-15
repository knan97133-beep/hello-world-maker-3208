/**
 * _authenticated/path.tsx — /path
 * Dedicated page for the student's single active learning path
 * and the level evolution after each assessment.
 */
import { createFileRoute } from "@tanstack/react-router";
import { Route as Compass } from "lucide-react";

import { LearningPathCard, ProgressEvolutionCard } from "@/components/app/PathCards";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/path")({
  head: () => ({
    meta: [
      { title: "My Learning Path — InfoPath" },
      {
        name: "description",
        content: "Follow your personalised InfoPath learning path step by step and track your level evolution.",
      },
      { property: "og:title", content: "My Learning Path — InfoPath" },
      { property: "og:description", content: "Your active learning path, step by step." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PathPage,
});

function PathPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <Compass className="size-6 text-primary" />
          {ar ? "مسار التعلّم الشخصي" : "My learning path"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ar
            ? "خطوة واحدة في كل مرة — أنهِ المسار ثم اجتز اختبار الإنهاء."
            : "One step at a time — finish the path then pass the end-of-path exam."}
        </p>
      </header>

      <LearningPathCard />
      <ProgressEvolutionCard />
    </div>
  );
}
