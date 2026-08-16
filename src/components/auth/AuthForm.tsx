/**
 * AuthForm.tsx
 * -------------------------------------------------------------
 * Shared bilingual sign-in form used by the two separate login
 * portals: students (/auth) and administrators (/admin-login).
 *
 * After a successful Supabase sign-in the user's role is verified
 * against the `user_roles` table (source of truth, protected by RLS).
 * If the role does not match the portal, the session is immediately
 * signed out and an explanatory message is shown — a student can
 * never enter through the admin portal and vice-versa.
 */
import { Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap, Loader2, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useI18n } from "@/lib/i18n";

export type Portal = "student" | "admin";

/** Reads the role of a user from `user_roles` (RLS: own rows readable). */
export async function isAdminUser(userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export function AuthForm({ portal }: { portal: Portal }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const navigate = useNavigate();
  const admin = portal === "admin";

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  /** Verify role matches the portal, otherwise sign out with a message. */
  async function routeByRole(userId: string) {
    const isAdmin = await isAdminUser(userId);
    if (admin && !isAdmin) {
      await supabase.auth.signOut();
      toast.error(
        ar
          ? "هذا الحساب ليس حساب مدير. استخدم صفحة دخول الطالب."
          : "This account is not an administrator. Please use the student login page.",
      );
      return;
    }
    if (!admin && isAdmin) {
      await supabase.auth.signOut();
      toast.error(
        ar
          ? "هذا حساب مدير. سجّل الدخول من صفحة دخول المدير."
          : "This is an administrator account. Please sign in from the admin login page.",
      );
      return;
    }
    navigate({ to: admin ? "/admin" : "/dashboard", replace: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup" && !admin) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: fullName } },
        });
        if (error) throw error;
        if (data.session?.user) {
          await routeByRole(data.session.user.id);
        } else {
          toast.success(
            ar
              ? "تم إنشاء الحساب! تفقّد بريدك لتأكيد الحساب."
              : "Account created! Check your email to confirm it.",
          );
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) await routeByRole(data.user.id);
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
    const { data } = await supabase.auth.getUser();
    if (data.user) await routeByRole(data.user.id);
    setBusy(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-hero-radial px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-accent-gradient text-primary-foreground">
            {admin ? <Shield className="size-5" /> : <GraduationCap className="size-5" />}
          </span>
          <span className="text-xl font-extrabold tracking-tight">InfoPath</span>
        </Link>

        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-lg sm:p-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
            {admin
              ? ar
                ? "بوابة المدير"
                : "Administrator portal"
              : ar
                ? "بوابة الطالب"
                : "Student portal"}
          </span>

          <h1 className="mt-3 text-2xl font-bold tracking-tight">
            {admin
              ? ar
                ? "دخول المدير"
                : "Admin log in"
              : mode === "login"
                ? ar
                  ? "دخول الطالب"
                  : "Student log in"
                : ar
                  ? "إنشاء حساب طالب"
                  : "Create your student account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {admin
              ? ar
                ? "هذه الصفحة مخصصة لحسابات الإدارة فقط."
                : "This page is reserved for administrator accounts only."
              : ar
                ? "ادخل إلى خارطة طريقك الأكاديمية ومساعدك الذكي."
                : "Access your academic roadmap and AI assistant."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" && !admin && (
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
                placeholder={admin ? "admin@infopath.app" : "student@university.edu"}
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
              {mode === "login" || admin
                ? ar
                  ? "دخول"
                  : "Log in"
                : ar
                  ? "إنشاء الحساب"
                  : "Sign up"}
            </Button>
          </form>

          {!admin && (
            <>
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
            </>
          )}

          <div className="mt-6 border-t border-border/70 pt-4 text-center text-sm">
            {admin ? (
              <Link to="/auth" className="font-semibold text-primary hover:underline">
                {ar ? "دخول الطالب ←" : "Student login →"}
              </Link>
            ) : (
              <Link to="/admin-login" className="font-semibold text-primary hover:underline">
                {ar ? "دخول المدير ←" : "Admin login →"}
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
