/**
 * _authenticated/skills.tsx — /skills
 * Skill profile (weakest first) plus the single current learning goal
 * decided from the placement test and the AI recommendation.
 */
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";

import { SkillProfileCard } from "@/components/app/LearningLoop";
import { CurrentGoalCard } from "@/components/app/PathCards";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/skills")({
  head: () => ({
    meta: [
      { title: "My Skill Profile — InfoPath" },
      {
        name: "description",
        content: "See your InfoPath skill levels from weakest to strongest and the current learning goal.",
      },
      { property: "og:title", content: "My Skill Profile — InfoPath" },
      { property: "og:description", content: "Skill levels and the area to start from." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SkillsPage,
});

function SkillsPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <BarChart3 className="size-6 text-primary" />
          {ar ? "ملف مهاراتي" : "My skill profile"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ar
            ? "مستوياتك من الأضعف إلى الأقوى، وهدف التعلّم الحالي."
            : "Your levels from weakest to strongest, and the current learning goal."}
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <SkillProfileCard />
        <CurrentGoalCard />
      </div>
    </div>
  );
}
