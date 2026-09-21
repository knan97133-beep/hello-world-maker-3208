/**
 * Footer.tsx
 * Professional site footer: brand blurb, link columns and legal line.
 */
import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-secondary/50">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-accent-gradient text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            <span className="text-lg font-extrabold">InfoPath</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {t("footer_about")}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">{t("footer_platform")}</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><a className="hover:text-foreground" href="#journey">{t("nav_how")}</a></li>
            <li><a className="hover:text-foreground" href="#practice">{t("nav_features")}</a></li>
            <li><a className="hover:text-foreground" href="#ai">{t("nav_ai")}</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">{t("footer_links")}</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link className="hover:text-foreground" to="/auth">{t("nav_login")}</Link></li>
            <li><Link className="hover:text-foreground" to="/auth">{t("nav_start")}</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row">
          <span>© {year} InfoPath — {t("footer_rights")}</span>
          <span>{t("footer_project")}</span>
        </div>
      </div>
    </footer>
  );
}
