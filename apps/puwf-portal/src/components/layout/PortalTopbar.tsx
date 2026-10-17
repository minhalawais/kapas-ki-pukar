"use client";

import { t } from "@kapas/localization";
import { Menu, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useLocaleStore } from "@/stores/locale-store";

export function PortalTopbar({ onOpenNavigation }: { onOpenNavigation: () => void }) {
  const locale = useLocaleStore((s) => s.locale);
  const router = useRouter();
  const [search, setSearch] = useState("");

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const value = search.trim();
    if (!value) return;
    if (/^KP-/i.test(value)) router.push(`/complaints/${encodeURIComponent(value)}`);
    else router.push(`/dashboard?search=${encodeURIComponent(value)}`);
  }

  return (
    <header className="sticky top-0 z-30 flex min-h-14 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <button type="button" className="grid h-9 w-9 shrink-0 place-items-center rounded-control border border-border lg:hidden" aria-label={t(locale, "portal.topbar.menu")} onClick={onOpenNavigation}><Menu size={19} /></button>
      <form className="relative min-w-0 max-w-md flex-1" role="search" onSubmit={onSearch}>
        <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" size={17} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} className="h-9 w-full rounded-control border border-border bg-page ps-9 pe-3 text-sm text-ink placeholder:text-muted" placeholder={t(locale, "portal.topbar.search")} aria-label={t(locale, "portal.topbar.search")} />
      </form>
    </header>
  );
}
