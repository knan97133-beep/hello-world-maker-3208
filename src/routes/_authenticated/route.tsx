/**
 * _authenticated/route.tsx
 * -------------------------------------------------------------
 * Pathless layout guarding the whole student area.
 * Rendered client-side only because the Supabase session lives in
 * localStorage; unauthenticated visitors are redirected to /auth.
 */
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppShell } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
