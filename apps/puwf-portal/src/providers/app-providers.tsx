"use client";

import { getDirection, t } from "@kapas/localization";
import { configureMockRuntime, createWebStorageAdapter, ensurePersistenceSchema, hydrateDemoRuntime } from "@kapas/mock-services";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

import { AppErrorBoundary } from "@/components/shell/error-boundary";
import { PortalShell } from "@/components/shell/portal-shell";
import { QueryProvider } from "@/providers/query-provider";
import { hydrateLocale, useLocaleStore } from "@/stores/locale-store";

if (typeof window !== "undefined") {
  configureMockRuntime({
    portalStore: createWebStorageAdapter(),
    demoStore: createWebStorageAdapter(),
  });
}

export function AppProviders({ children }: { children: ReactNode }) {
  const locale = useLocaleStore((s) => s.locale);
  const pathname = usePathname();
  const [persistenceReady, setPersistenceReady] = useState(false);
  const isAuthPage = pathname === "/login";

  useEffect(() => {
    hydrateLocale();
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      await ensurePersistenceSchema();
      await hydrateDemoRuntime();
      if (active) {
        setPersistenceReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = getDirection(locale);
  }, [locale]);

  if (!persistenceReady) {
    return null;
  }

  return (
    <QueryProvider>
      <AppErrorBoundary fallbackLabel={t(locale, "common.error")} retryLabel={t(locale, "common.retry")}>
        {isAuthPage ? children : <PortalShell>{children}</PortalShell>}
      </AppErrorBoundary>
    </QueryProvider>
  );
}
