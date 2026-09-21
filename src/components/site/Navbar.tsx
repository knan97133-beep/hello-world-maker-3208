/**
 * Navbar.tsx
 * Sticky top navigation for the public site: brand, section links,
 * language switcher and auth actions. Fully responsive.
 */
import { Link } from "@tanstack/react-router";
import { GraduationCap, Languages, Menu, X } from "lucide-react";
import { useState } from "react";

import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

const sections = [
  { href: "#journey", key: "nav_how" },
  { href: "#practice", key: "nav_features" },
  { href: "#ai", key: "nav_ai" },
];

export function Navbar() {
  const { t, toggle } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-accent-gradient text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">InfoPath</span>
        </Link>

        <ul className="hidden items-center gap-6 md:flex">
          {sections.map((s) => (
            <li key={s.href}>
              <a
                href={s.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {t(s.key)}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggle} aria-label="Switch language">
            <Languages className="size-4" />
            {t("lang_switch")}
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:inline-flex" asChild>
            <Link to="/auth">{t("nav_login")}</Link>
          </Button>
          <Button size="sm" className="hidden sm:inline-flex" asChild>
            <Link to="/auth">{t("nav_start")}</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {sections.map((s) => (
              <li key={s.href}>
                <a
                  href={s.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  {t(s.key)}
                </a>
              </li>
            ))}
            <li className="mt-2 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link to="/auth">{t("nav_login")}</Link>
              </Button>
              <Button size="sm" className="flex-1" asChild>
                <Link to="/auth">{t("nav_start")}</Link>
              </Button>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
