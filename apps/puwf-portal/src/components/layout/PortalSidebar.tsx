"use client";

import { t } from "@kapas/localization";
import { Database, Inbox, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/layout/BrandMark";
import { Button } from "@/components/ui/button";
import { useLocaleStore } from "@/stores/locale-store";

const NAV = [
  { href: "/dashboard", key: "portal.nav.dashboard" as const, icon: Inbox },
  { href: "/data-management", key: "portal.nav.dataManagement" as const, icon: Database },
];

export function PortalSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  return (
    <>
      {open ? <button type="button" className="fixed inset-0 z-40 bg-ink/35 lg:hidden" aria-label={t(locale, "common.close")} onClick={onClose} /> : null}
      <aside data-open={open} className="portal-sidebar fixed inset-y-0 start-0 z-50 flex w-sidebar shrink-0 flex-col bg-institutional px-4 py-5 text-[color:var(--on-institutional)] transition-transform duration-panel lg:sticky lg:top-0 lg:z-20 lg:h-dvh">
      <div className="flex items-start justify-between gap-3">
      <Link href="/dashboard" className="flex min-w-0 items-start gap-2" onClick={onClose}>
        <BrandMark size={32} />
        <span className="min-w-0">
          <span className="block text-sm font-semibold leading-5">{t(locale, "app.name")}</span>
          <span className="mt-0.5 block text-xs leading-4 opacity-80">{t(locale, "portal.role")}</span>
        </span>
      </Link>
      <button type="button" className="grid h-9 w-9 shrink-0 place-items-center rounded-control hover:bg-white/10 lg:hidden" aria-label={t(locale, "common.close")} onClick={onClose}><X size={19} /></button>
      </div>
      <nav className="mt-6 flex flex-col gap-1" aria-label={t(locale, "app.name")}>
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-10 items-center gap-3 rounded-control px-3 py-2 text-sm transition-colors duration-fast ${
                active ? "bg-white/12 font-semibold" : "opacity-80 hover:bg-white/5 hover:opacity-100"
              }`}
              onClick={onClose}
            >
              <Icon aria-hidden size={18} />
              {t(locale, item.key)}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex justify-end pt-4">
        <div className="flex rounded-control border border-white/20 bg-white/10 p-0.5" aria-label={t(locale, "portal.topbar.language")}>
          <Button
            type="button"
            variant="ghost"
            className={`h-7 border-0 px-2 text-xs text-[color:var(--on-institutional)] hover:bg-white/10 ${locale === "en" ? "bg-white text-institutional shadow-sm hover:bg-white" : ""}`}
            aria-pressed={locale === "en"}
            aria-label={t(locale, "a11y.languageEnglish")}
            onClick={() => setLocale("en")}
          >
            {t(locale, "locale.english")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={`h-7 border-0 px-2 font-urdu text-xs text-[color:var(--on-institutional)] hover:bg-white/10 ${locale === "ur" ? "bg-white text-institutional shadow-sm hover:bg-white" : ""}`}
            aria-pressed={locale === "ur"}
            aria-label={t(locale, "a11y.languageUrdu")}
            onClick={() => setLocale("ur")}
          >
            {t(locale, "locale.urdu")}
          </Button>
        </div>
      </div>
      <div className="mt-3 border-t border-white/15 pt-3 text-[11px] leading-4 opacity-65">{t(locale, "portal.sidebar.privacy")}</div>
    </aside>
    </>
  );
}
