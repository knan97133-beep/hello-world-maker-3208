/**
 * _authenticated/admin.roles.tsx — /admin/roles
 * Assign the student / instructor / admin roles and subject ownership.
 */
import { createFileRoute } from "@tanstack/react-router";
import { UserCog } from "lucide-react";

import { RoleManager } from "@/components/app/RoleManager";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/roles")({
  head: () => ({
    meta: [
      { title: "Roles & Permissions — InfoPath Admin" },
      { name: "description", content: "Assign student, instructor and admin roles on InfoPath." },
      { property: "og:title", content: "Roles & Permissions — InfoPath" },
      { property: "og:description", content: "Control who can manage what." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminRoles,
});

function AdminRoles() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <UserCog className="size-6 text-primary" />
          {ar ? "الأدوار والصلاحيات" : "Roles & permissions"}
        </h1>
      </header>
      <RoleManager />
    </div>
  );
}
