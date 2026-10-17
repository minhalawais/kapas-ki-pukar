"use client";

import { t } from "@kapas/localization";

import { DemoControlPanel } from "@/components/demo/DemoControlPanel";
import { PageHeader } from "@/components/shell/page-header";
import { useLocaleStore } from "@/stores/locale-store";

export function DemoPageClient() {
  const locale = useLocaleStore((s) => s.locale);

  return (
    <section className="space-y-5">
      <PageHeader title={t(locale, "portal.demo.title")} description={t(locale, "portal.demo.body")} />
      <DemoControlPanel />
    </section>
  );
}
