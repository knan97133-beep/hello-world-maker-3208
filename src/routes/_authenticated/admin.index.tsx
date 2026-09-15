/**
 * _authenticated/admin.index.tsx — /admin
 * Admin home: platform statistics only. Management lives on its own pages.
 */
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, FolderKanban, Shield, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — InfoPath" },
      { name: "description", content: "InfoPath platform statistics at a glance." },
      { property: "og:title", content: "Admin Dashboard — InfoPath" },
      { property: "og:description", content: "Subjects, resources, projects and questions counts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminHome,
});

function AdminHome() {
  const { lang } = useI18n();
  const ar = lang === "ar";

  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const tables = ["subjects", "resources", "projects", "challenges", "quiz_questions"] as const;
      const counts = await Promise.all(
        tables.map(async (t) => {
          const { count, error } = await supabase.from(t).select("*", { count: "exact", head: true });
          if (error) throw error;
          return count ?? 0;
        }),
      );
      return {
        subjects: counts[0],
        resources: counts[1],
        projects: counts[2],
        challenges: counts[3],
        questions: counts[4],
      };
    },
  });

  const cards = [
    { label: ar ? "المواد" : "Subjects", value: stats.data?.subjects, icon: BookOpen },
    { label: ar ? "المصادر" : "Resources", value: stats.data?.resources, icon: FolderKanban },
    { label: ar ? "المشاريع" : "Projects", value: stats.data?.projects, icon: FolderKanban },
    { label: ar ? "التحديات" : "Challenges", value: stats.data?.challenges, icon: Users },
    { label: ar ? "الأسئلة" : "Questions", value: stats.data?.questions, icon: BookOpen },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <Shield className="size-6 text-primary" />
          {ar ? "لوحة تحكم المدير" : "Admin Dashboard"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ar ? "اختر ما تريد إدارته من القائمة الجانبية." : "Pick what you want to manage from the sidebar."}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex flex-col gap-1 py-5">
              <c.icon className="size-4 text-primary" />
              <span className="text-2xl font-bold">{c.value ?? "—"}</span>
              <span className="text-xs text-muted-foreground">{c.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
