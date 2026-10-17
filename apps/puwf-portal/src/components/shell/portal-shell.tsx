"use client";

import { t } from "@kapas/localization";
import { type ReactNode, useState } from "react";

import { PortalFooter } from "@/components/layout/PortalFooter";
import { PortalSidebar } from "@/components/layout/PortalSidebar";
import { PortalTopbar } from "@/components/layout/PortalTopbar";
import { useLocaleStore } from "@/stores/locale-store";

export function PortalShell({ children }: { children: ReactNode }) {
  const locale = useLocaleStore((s) => s.locale);
  const [navigationOpen, setNavigationOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-page">
      <a href="#main-content" className="skip-link">
        {t(locale, "a11y.skipToContent")}
      </a>
      <PortalSidebar open={navigationOpen} onClose={() => setNavigationOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <PortalTopbar onOpenNavigation={() => setNavigationOpen(true)} />
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 px-4 pb-16 pt-5 outline-none sm:px-6 lg:px-8 lg:pb-16 lg:pt-6">
          {children}
        </main>
        <PortalFooter />
      </div>
    </div>
  );
}
