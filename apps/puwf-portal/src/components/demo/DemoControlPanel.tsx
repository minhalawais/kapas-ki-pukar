"use client";

import { goldenScenarioTrackingIds, type GoldenScenarioId } from "@kapas/domain";
import { t, type MessageKey } from "@kapas/localization";
import { demoService, type DemoFlags } from "@kapas/mock-services";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { useLocaleStore } from "@/stores/locale-store";

const fieldClass =
  "mt-1 h-input w-full rounded-control border border-border bg-surface px-2 text-sm text-ink";

export function DemoControlPanel() {
  const locale = useLocaleStore((s) => s.locale);
  const queryClient = useQueryClient();
  const scenarios = demoService.listScenarios();
  const [scenarioId, setScenarioId] = useState<GoldenScenarioId>("GS-01");
  const [flags, setFlags] = useState<DemoFlags>(demoService.getFlags());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const trackingId = goldenScenarioTrackingIds[scenarioId];

  const refresh = useCallback(async () => {
    await demoService.hydrate();
    setFlags(demoService.getFlags());
    await queryClient.invalidateQueries();
  }, [queryClient]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function run(work: () => Promise<unknown> | void) {
    setBusy(true);
    setError(false);
    try {
      await work();
      await refresh();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-sm font-semibold text-ink">{t(locale, "portal.demo.status")}</h2>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
          <div>
            <dt className="text-xs text-muted">{t(locale, "portal.demo.scenario")}</dt>
            <dd>{flags.activeScenarioId ?? t(locale, "portal.demo.none")}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">{t(locale, "portal.table.id")}</dt>
            <dd>
              {flags.activeScenarioId && flags.activeScenarioId in goldenScenarioTrackingIds
                ? goldenScenarioTrackingIds[flags.activeScenarioId as GoldenScenarioId]
                : t(locale, "portal.demo.none")}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">{t(locale, "portal.demo.injected")}</dt>
            <dd>{t(locale, flags.portalInjected ? "common.yes" : "common.no")}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">{t(locale, "portal.demo.offline")}</dt>
            <dd>{t(locale, flags.offline ? "common.yes" : "common.no")}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted">{t(locale, "portal.demo.bridgeNote")}</p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-ink">{t(locale, "portal.demo.scenario")}</h2>
        <label className="mt-3 block text-xs text-muted">
          {t(locale, "portal.demo.load")}
          <select
            className={fieldClass}
            value={scenarioId}
            onChange={(event) => setScenarioId(event.target.value as GoldenScenarioId)}
          >
            {scenarios.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id} · {t(locale, item.labelKey as MessageKey)} · {item.trackingId}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" disabled={busy} onClick={() => void run(() => demoService.loadScenario(scenarioId))}>
            {t(locale, "portal.demo.load")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => void run(() => demoService.injectScenarioComplaint(scenarioId))}
          >
            {t(locale, "portal.demo.inject")}
          </Button>
          <Link href={`/complaints/${trackingId}`} className="inline-flex h-9 items-center px-3 text-sm text-action">
            {t(locale, "portal.demo.openCase")}
          </Link>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-ink">{t(locale, "portal.demo.advance")}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={busy}
            onClick={() => void run(() => demoService.advanceScenario(scenarioId, "next"))}
          >
            {t(locale, "portal.demo.advanceCase")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => void run(() => demoService.advanceScenario(scenarioId, "worker-track"))}
          >
            {t(locale, "portal.demo.advanceTracking")}
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-ink">{t(locale, "portal.demo.simulate")}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => void run(() => demoService.setAiFailure(!flags.aiFailure))}
          >
            {t(locale, flags.aiFailure ? "portal.demo.aiFailureOff" : "portal.demo.aiFailureOn")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() =>
              void run(() => demoService.setAiConfidence(flags.aiConfidenceOverride === "low" ? null : "low"))
            }
          >
            {t(locale, flags.aiConfidenceOverride === "low" ? "portal.demo.lowConfidenceOff" : "portal.demo.lowConfidenceOn")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => void run(() => demoService.setAiDelay(flags.aiDelayMs > 0 ? 0 : 1200))}
          >
            {t(locale, flags.aiDelayMs > 0 ? "portal.demo.delayOff" : "portal.demo.delayOn")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => void run(() => demoService.setOffline(!flags.offline))}
          >
            {t(locale, flags.offline ? "portal.demo.offlineOff" : "portal.demo.offlineOn")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy || !flags.offline}
            onClick={() => void run(() => demoService.simulateReconnect())}
          >
            {t(locale, "portal.demo.reconnect")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => void run(() => demoService.generateAdditionalComplaints(5))}
          >
            {t(locale, "portal.demo.generateExtra")}
          </Button>
        </div>
      </Card>

      {error ? <p className="text-xs text-critical">{t(locale, "common.error")}</p> : null}

      <Button type="button" variant="destructive" disabled={busy} onClick={() => setConfirmReset(true)}>
        {t(locale, "portal.demo.reset")}
      </Button>

      <Dialog
        open={confirmReset}
        title={t(locale, "portal.demo.reset")}
        onClose={() => setConfirmReset(false)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setConfirmReset(false)}>
              {t(locale, "common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => {
                setConfirmReset(false);
                void run(() => demoService.reset());
              }}
            >
              {t(locale, "common.confirm")}
            </Button>
          </>
        }
      >
        <p>{t(locale, "portal.demo.resetConfirm")}</p>
      </Dialog>
    </div>
  );
}
