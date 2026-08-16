/**
 * admin-login.tsx — /admin-login
 * -------------------------------------------------------------
 * Dedicated administrator sign-in portal. Only accounts holding the
 * `admin` role in `user_roles` are allowed through; student accounts
 * are signed out again with a clear message. No sign-up here —
 * admin roles are granted from the database / admin dashboard only.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { AuthForm, isAdminUser } from "@/components/auth/AuthForm";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "Administrator login — InfoPath" },
      {
        name: "description",
        content:
          "Secure administrator sign-in for InfoPath: manage subjects, content, students and platform statistics.",
      },
      { property: "og:title", content: "InfoPath — Administrator login" },
      {
        property: "og:description",
        content: "Sign in to the InfoPath admin dashboard to manage curriculum and students.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { user, loading } = useSession();

  useEffect(() => {
    if (loading || !user) return;
    let active = true;
    isAdminUser(user.id).then((admin) => {
      if (active && admin) navigate({ to: "/admin", replace: true });
    });
    return () => {
      active = false;
    };
  }, [loading, user, navigate]);

  return <AuthForm portal="admin" />;
}
