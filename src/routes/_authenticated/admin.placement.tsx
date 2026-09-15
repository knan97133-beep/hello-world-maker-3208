/**
 * _authenticated/admin.placement.tsx — /admin/placement
 * Manage the placement test questions used to build skill profiles.
 */
import { createFileRoute } from "@tanstack/react-router";
import { Target } from "lucide-react";

import { PlacementManager } from "@/components/app/PlacementManager";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/placement")({
  head: () => ({
    meta: [
      { title: "Placement Questions — InfoPath Admin" },
      { name: "description", content: "Manage the placement test questions that build each student's skill profile." },
      { property: "og:title", content: "Placement Questions — InfoPath" },
      { property: "og:description", content: "Add and edit placement test questions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPlacement,
});

function AdminPlacement() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <Target className="size-6 text-primary" />
          {ar ? "أسئلة تحديد المستوى" : "Placement questions"}
        </h1>
      </header>
      <PlacementManager />
    </div>
  );
}
