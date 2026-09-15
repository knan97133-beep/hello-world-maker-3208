/**
 * _authenticated/admin.tsx
 * Layout for the admin area: guards the role and renders the selected
 * admin page. Each management feature lives on its own route.
 */
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Loader2, Shield } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { useIsAdmin, useSession } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const { data: isAdmin, isLoading } = useIsAdmin(user?.id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-3 py-10">
          <Shield className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {ar
              ? "هذه الصفحة مخصصة لمدير المنصة فقط."
              : "This page is restricted to platform administrators."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return <Outlet />;
}
