/**
 * auth.tsx — /auth
 * -------------------------------------------------------------
 * Student login / sign-up portal. Admin accounts are rejected here
 * and redirected to /admin-login (role verified against `user_roles`).
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { AuthForm, isAdminUser } from "@/components/auth/AuthForm";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Student login & sign up — InfoPath" },
      {
        name: "description",
        content:
          "Sign in or create your free InfoPath student account to unlock your personal IT study roadmap, projects and AI assistant.",
      },
      { property: "og:title", content: "InfoPath — Student login" },
      {
        property: "og:description",
        content: "Access your personal IT roadmap, projects, quizzes and AI assistant.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useSession();

  // Already signed in? send each role to its own area.
  useEffect(() => {
    if (loading || !user) return;
    let active = true;
    isAdminUser(user.id).then((admin) => {
      if (active) navigate({ to: admin ? "/admin" : "/dashboard", replace: true });
    });
    return () => {
      active = false;
    };
  }, [loading, user, navigate]);

  return <AuthForm portal="student" />;
}
