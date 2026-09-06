/**
 * _authenticated/dashboard.tsx — /dashboard
 * -------------------------------------------------------------
 * Student home: skill profile (weakest first), the single active goal,
 * the personalised path built from instructor-published content, and
 * the level evolution after each assessment.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Target, Trophy } from "lucide-react";

import { SkillProfileCard } from "@/components/app/LearningLoop";
import {
  CurrentGoalCard,
  LearningPathCard,
  ProgressEvolutionCard,
} from "@/components/app/PathCards";
import { MySubmissionsCard } from "@/components/app/SubmissionCards";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useProfile, useSession } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — InfoPath student roadmap" },
      {
        name: "description",
        content:
          "Your InfoPath dashboard: see your skill profile, the weakest area to start from and your personalised learning path.",
      },
      { property: "og:title", content: "InfoPath Dashboard" },
      { property: "og:description", content: "Track your IT study roadmap progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const { data: profile } = useProfile(user?.id);

  const progress = useQuery({
    queryKey: ["progress", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("progress")
        .select("id, item_type, completed, subject_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
  });

  const done = progress.data?.filter((p) => p.completed).length ?? 0;
  const quizzes = progress.data?.filter((p) => p.item_type === "quiz").length ?? 0;
  const subjectsTouched = new Set((progress.data ?? []).map((p) => p.subject_id)).size;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-muted-foreground">
          {ar ? "مرحباً بك مجدداً" : "Welcome back"}
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {profile?.full_name || user?.email}
        </h1>
      </header>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Trophy className="size-5" />}
          label={ar ? "عناصر مُنجزة" : "Completed items"}
          value={done}
        />
        <StatCard
          icon={<Target className="size-5" />}
          label={ar ? "اختبارات مجتازة" : "Quizzes taken"}
          value={quizzes}
        />
        <StatCard
          icon={<BookOpen className="size-5" />}
          label={ar ? "مواد بدأت بها" : "Subjects started"}
          value={subjectsTouched}
        />
      </div>

      {/* The connected loop: skill profile -> goal -> path -> evolution */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SkillProfileCard />
        <CurrentGoalCard />
      </div>

      <LearningPathCard />

      <MySubmissionsCard />

      <ProgressEvolutionCard />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-2 text-3xl font-extrabold">{value}</p>
    </div>
  );
}
