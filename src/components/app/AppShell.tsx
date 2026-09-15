/**
 * AppShell.tsx
 * -------------------------------------------------------------
 * Layout for the signed-in student area: sidebar navigation
 * (dashboard, subjects, profile, admin), language switcher and sign-out.
 * Collapses into a top bar with a slide-down menu on mobile.
 */
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Code2,
  FolderKanban,
  GraduationCap,
  Languages,
  LayoutDashboard,
  LogOut,
  Menu,
  Route as RouteIcon,
  Send,
  Shield,
  Sparkles,
  Target,
  UserCog,
  User,
  Users,
  Workflow,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useIsAdmin, useIsInstructor, useSession, useSignOut } from "@/lib/session";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  ar: string;
  en: string;
  icon: typeof BookOpen;
  exact?: boolean;
};
type NavGroup = { ar: string; en: string; items: NavItem[] };

const studentNav: NavGroup[] = [
  {
    ar: "التعلّم",
    en: "Learning",
    items: [
      { to: "/dashboard", ar: "لوحة التحكم", en: "Dashboard", icon: LayoutDashboard },
      { to: "/placement", ar: "تحديد المستوى", en: "Placement test", icon: Target },
      { to: "/skills", ar: "ملف مهاراتي", en: "Skill profile", icon: BarChart3 },
      { to: "/path", ar: "مسار التعلّم", en: "Learning path", icon: RouteIcon },
    ],
  },
  {
    ar: "العمل",
    en: "Work",
    items: [
      { to: "/subjects", ar: "المواد", en: "Subjects", icon: BookOpen },
      { to: "/my-work", ar: "تسليماتي", en: "My submissions", icon: Send },
      { to: "/playground", ar: "بيئة التجربة", en: "Playground", icon: Code2 },
      { to: "/assistant", ar: "المساعد الذكي", en: "AI Assistant", icon: Sparkles },
    ],
  },
  {
    ar: "حسابي",
    en: "Account",
    items: [{ to: "/profile", ar: "الملف الشخصي", en: "Profile", icon: User }],
  },
];

const instructorGroup: NavGroup = {
  ar: "منطقة المدرّس",
  en: "Instructor",
  items: [
    { to: "/instructor", ar: "موادي", en: "My subjects", icon: GraduationCap, exact: true },
    { to: "/instructor/students", ar: "متابعة الطلاب", en: "Student follow-up", icon: Users },
    { to: "/instructor/reviews", ar: "مراجعة التسليمات", en: "Reviews", icon: ClipboardCheck },
    { to: "/instructor/paths", ar: "بناء المسارات", en: "Path builder", icon: Workflow },
    { to: "/instructor/studio", ar: "استوديو الذكاء", en: "AI studio", icon: Sparkles },
    { to: "/instructor/content", ar: "إدارة المحتوى", en: "Content", icon: FolderKanban },
  ],
};

const adminGroup: NavGroup = {
  ar: "لوحة المدير",
  en: "Admin",
  items: [
    { to: "/admin", ar: "الإحصائيات", en: "Statistics", icon: Shield, exact: true },
    { to: "/admin/subjects", ar: "المواد", en: "Subjects", icon: BookOpen },
    { to: "/admin/roles", ar: "الأدوار", en: "Roles", icon: UserCog },
    { to: "/admin/placement", ar: "أسئلة تحديد المستوى", en: "Placement", icon: Target },
    { to: "/admin/students", ar: "الطلاب والتسليمات", en: "Students", icon: Users },
    { to: "/admin/paths", ar: "قوالب المسارات", en: "Path templates", icon: Workflow },
    { to: "/admin/studio", ar: "استوديو الذكاء", en: "AI studio", icon: Sparkles },
    { to: "/admin/content", ar: "إدارة المحتوى", en: "Content", icon: FolderKanban },
  ],
};

const accountGroup: NavGroup = {
  ar: "حسابي",
  en: "Account",
  items: [{ to: "/profile", ar: "الملف الشخصي", en: "Profile", icon: User }],
};

export function AppShell({ children }: { children: ReactNode }) {
  const { lang, toggle, t } = useI18n();
  const ar = lang === "ar";
  const { user } = useSession();
  const { data: isAdmin } = useIsAdmin(user?.id);
  const { data: isInstructor } = useIsInstructor(user?.id);
  const signOut = useSignOut();
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  // Staff (instructor/admin) see only their own areas; students see the student area.
  const isStaff = Boolean(isInstructor) || Boolean(isAdmin);
  const groups: NavGroup[] = isStaff
    ? [
        ...(isInstructor ? [instructorGroup] : []),
        ...(isAdmin ? [adminGroup] : []),
        accountGroup,
      ]
    : studentNav;

  const links = (
    <nav className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.en} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
            {ar ? group.ar : group.en}
          </p>
          {group.items.map((item) => {
            const active = item.exact
              ? path === item.to
              : path === item.to || path.startsWith(item.to + "/");
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
        </div>
      ))}
    </nav>
  );



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
