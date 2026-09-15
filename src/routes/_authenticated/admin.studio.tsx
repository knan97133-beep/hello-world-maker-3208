/**
 * _authenticated/admin.studio.tsx — /admin/studio
 * AI content studio for the whole platform.
 */
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { AiContentStudio } from "@/components/app/AiContentStudio";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/studio")({
  head: () => ({
    meta: [
      { title: "AI Content Studio — InfoPath Admin" },
      { name: "description", content: "Generate content drafts with AI for any subject, then publish them." },
      { property: "og:title", content: "AI Content Studio — InfoPath Admin" },
      { property: "og:description", content: "AI drafts reviewed before publishing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminStudio,
});

function AdminStudio() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <Sparkles className="size-6 text-primary" />
          {ar ? "استوديو المحتوى بالذكاء" : "AI content studio"}
        </h1>
      </header>
      <AiContentStudio />
    </div>
  );
}
