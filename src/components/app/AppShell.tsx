/**
 * AppShell.tsx
 * -------------------------------------------------------------
 * Layout for the signed-in student area: sidebar navigation
 * (dashboard, subjects, profile, admin), language switcher and sign-out.
 * Collapses into a top bar with a slide-down menu on mobile.
 */
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  GraduationCap,
  Languages,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  Sparkles,
  Target,

  User,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useIsAdmin, useSession, useSignOut } from "@/lib/session";
import { cn } from "@/lib/utils";

type NavItem = { to: string; ar: string; en: string; icon: typeof BookOpen };

const items: NavItem[] = [
  { to: "/dashboard", ar: "لوحة التحكم", en: "Dashboard", icon: LayoutDashboard },
  { to: "/placement", ar: "تحديد المستوى", en: "Placement test", icon: Target },
  { to: "/subjects", ar: "المواد", en: "Subjects", icon: BookOpen },
  { to: "/assistant", ar: "المساعد الذكي", en: "AI Assistant", icon: Sparkles },
  { to: "/profile", ar: "الملف الشخصي", en: "Profile", icon: User },
];


export function AppShell({ children }: { children: ReactNode }) {
  const { lang, toggle, t } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const { data: isAdmin } = useIsAdmin(user?.id);
  const signOut = useSignOut();
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  const nav = isAdmin
    ? [...items, { to: "/admin", ar: "لوحة المدير", en: "Admin", icon: Shield }]
    : items;

  const links = (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => {
        const active = path === item.to || path.startsWith(item.to + "/");
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <item.icon className="size-4" />
            {ar ? item.ar : item.en}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-e border-border/70 bg-card p-4 lg:flex">
        <Link to="/" className="mb-6 flex items-center gap-2 px-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-accent-gradient text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">InfoPath</span>
        </Link>
        {links}
        <div className="mt-auto flex flex-col gap-2 pt-4">
          <Button variant="ghost" size="sm" onClick={toggle} className="justify-start">
            <Languages className="size-4" />
            {t("lang_switch")}
          </Button>
          <Button variant="outline" size="sm" onClick={signOut} className="justify-start">
            <LogOut className="size-4" />
            {ar ? "تسجيل الخروج" : "Sign out"}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex h-16 items-center justify-between border-b border-border/70 bg-card px-4 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-accent-gradient text-primary-foreground">
              <GraduationCap className="size-4" />
            </span>
            <span className="font-extrabold">InfoPath</span>
          </Link>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={toggle}>
              <Languages className="size-4" />
              {t("lang_switch")}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)} aria-label="Menu">
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </header>
        {open && (
          <div className="border-b border-border/70 bg-card p-4 lg:hidden">
            {links}
            <Button variant="outline" size="sm" onClick={signOut} className="mt-3 w-full">
              <LogOut className="size-4" />
              {ar ? "تسجيل الخروج" : "Sign out"}
            </Button>
          </div>
        )}

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      </div>
    </div>
  );
}
