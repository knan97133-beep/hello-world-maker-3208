/**
 * auth.tsx — /auth
 * -------------------------------------------------------------
 * Combined login / sign-up screen (bilingual, RTL-aware).
 * - Email + password via Supabase auth.
 * - Google sign-in via the Lovable managed OAuth helper.
 * Signed-in users are sent straight to the dashboard.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "InfoPath — Login & Sign up for IT students" },
      {
        name: "description",
        content:
          "Sign in or create your free InfoPath account to unlock your personal IT study roadmap, projects and AI assistant.",
      },
      { property: "og:title", content: "InfoPath — Login & Sign up" },
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
  const { lang } = useI18n();
  const ar = lang === "ar";
  const navigate = useNavigate();
  const { user, loading } = useSession();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  // Already signed in? go to the dashboard.
  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        if (data.session) {
          navigate({ to: "/dashboard", replace: true });
        } else {
          toast.success(
            ar
              ? "تم إنشاء الحساب! تفقّد بريدك لتأكيد الحساب."
              : "Account created! Check your email to confirm it.",
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error(result.error.message);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-hero-radial px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-accent-gradient text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          <span className="text-xl font-extrabold tracking-tight">InfoPath</span>
        </Link>

        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-lg sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "login"
              ? ar
                ? "تسجيل الدخول"
                : "Log in"
              : ar
                ? "إنشاء حساب جديد"
                : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ar
              ? "ادخل إلى خارطة طريقك الأكاديمية ومساعدك الذكي."
              : "Access your academic roadmap and AI assistant."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">{ar ? "الاسم الكامل" : "Full name"}</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder={ar ? "أحمد محمد" : "Jane Doe"}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{ar ? "البريد الإلكتروني" : "Email"}</Label>
              <Input
                id="email"
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="student@university.edu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{ar ? "كلمة المرور" : "Password"}</Label>
              <Input
                id="password"
                type="password"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              {mode === "login"
                ? ar
                  ? "دخول"
                  : "Log in"
                : ar
                  ? "إنشاء الحساب"
                  : "Sign up"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">{ar ? "أو" : "or"}</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={busy}>
            {ar ? "المتابعة عبر Google" : "Continue with Google"}
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login"
              ? ar
                ? "ليس لديك حساب؟"
                : "No account yet?"
              : ar
                ? "لديك حساب بالفعل؟"
                : "Already have an account?"}{" "}
            <button
              type="button"
              className="font-semibold text-primary hover:underline"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
            >
              {mode === "login"
                ? ar
                  ? "أنشئ حساباً"
                  : "Sign up"
                : ar
                  ? "سجّل الدخول"
                  : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
