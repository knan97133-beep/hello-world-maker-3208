/**
 * _authenticated/instructor.tsx
 * Layout for the instructor area: guards the role and renders the
 * selected instructor page. Each feature lives on its own route.
 */
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { GraduationCap, Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { useIsAdmin, useIsInstructor, useSession } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/instructor")({
  component: InstructorLayout,
});

function InstructorLayout() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const { data: isInstructor, isLoading } = useIsInstructor(user?.id);
  const { data: isAdmin } = useIsAdmin(user?.id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isInstructor && !isAdmin) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-3 py-10">
          <GraduationCap className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {ar ? "هذه الصفحة مخصصة للمدرّسين." : "This page is restricted to instructors."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return <Outlet />;
}
