"use client";

import { getDirection, t } from "@kapas/localization";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect } from "react";

import { AppErrorBoundary } from "@/components/shell/error-boundary";
import { PortalShell } from "@/components/shell/portal-shell";
import { QueryProvider } from "@/providers/query-provider";
import { hydrateLocale, useLocaleStore } from "@/stores/locale-store";

export function AppProviders({ children }: { children: ReactNode }) {
  const locale = useLocaleStore((s) => s.locale);
  const pathname = usePathname();
  const isAuthPage = pathname === "/login";

  useEffect(() => {
    hydrateLocale();
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = getDirection(locale);
  }, [locale]);

  return (
    <QueryProvider>
      <AppErrorBoundary fallbackLabel={t(locale, "common.error")} retryLabel={t(locale, "common.retry")}>
        {isAuthPage ? children : <PortalShell>{children}</PortalShell>}
      </AppErrorBoundary>
    </QueryProvider>
  );
}
