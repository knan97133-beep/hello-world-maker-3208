/**
 * _authenticated/admin.content.tsx — /admin/content
 * Manage all courses, videos, books, projects and challenges.
 */
import { createFileRoute } from "@tanstack/react-router";
import { FolderKanban } from "lucide-react";

import { ContentManager } from "@/components/app/ContentManager";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/content")({
  head: () => ({
    meta: [
      { title: "Content Manager — InfoPath Admin" },
      { name: "description", content: "Manage every course, video, book, project and challenge on InfoPath." },
      { property: "og:title", content: "Content Manager — InfoPath Admin" },
      { property: "og:description", content: "Platform-wide content management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminContent,
});

function AdminContent() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <FolderKanban className="size-6 text-primary" />
          {ar ? "إدارة المحتوى" : "Content manager"}
        </h1>
      </header>
      <ContentManager />
    </div>
  );
}
