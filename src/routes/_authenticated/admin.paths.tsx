/**
 * _authenticated/admin.paths.tsx — /admin/paths
 * Platform-wide learning path templates.
 */
import { createFileRoute } from "@tanstack/react-router";
import { Workflow } from "lucide-react";

import { PathTemplateBuilder } from "@/components/app/PathTemplateBuilder";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/paths")({
  head: () => ({
    meta: [
      { title: "Path Templates — InfoPath Admin" },
      { name: "description", content: "Design the learning path templates used across InfoPath." },
      { property: "og:title", content: "Path Templates — InfoPath Admin" },
      { property: "og:description", content: "Ordered steps students follow per skill and level." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPaths,
});

function AdminPaths() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <Workflow className="size-6 text-primary" />
          {ar ? "قوالب المسارات" : "Path templates"}
        </h1>
      </header>
      <PathTemplateBuilder />
    </div>
  );
}
