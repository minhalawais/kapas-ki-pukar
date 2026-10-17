import { goldenScenarioIds, type GoldenScenarioId } from "@kapas/domain";
import { t, type MessageKey } from "@kapas/localization";
import { demoService } from "@kapas/mock-services";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Switch, Text, View } from "react-native";

import { IsolateLtr } from "../../components/isolate-ltr";
import { LightTopBar } from "../../components/navigation/light-top-bar";
import { PrimaryCta } from "../../components/primary-cta";
import { ScreenNotice } from "../../components/screen-notice";
import { ScreenShell } from "../../components/screen-shell";
import { IconBadge, SectionLabel } from "../../components/ui-primitives";
import { isRTL } from "../../i18n/rtl";
import { useConnectivityStore } from "../../stores/connectivityStore";
import { useGrievanceDraftStore } from "../../stores/grievanceDraftStore";
import { useLocaleStore } from "../../stores/localeStore";
import { fontFamily, mobileType, semanticColors } from "../../theme/tokens";

function SettingRow({ label, value, disabled, onChange }: { label: string; value: boolean; disabled?: boolean; onChange: (value: boolean) => void }) {
  const locale = useLocaleStore((s) => s.locale);
  const rtl = isRTL(locale);
  return (
    <View style={{ minHeight: 64, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: semanticColors.border, flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
      <Text style={{ flex: 1, color: semanticColors.textPrimary, fontSize: mobileType.body.size, lineHeight: mobileType.body.line, fontFamily: rtl ? fontFamily.urduUi : fontFamily.ui, textAlign: rtl ? "right" : "left" }}>{label}</Text>
      <Switch value={value} disabled={disabled} onValueChange={onChange} trackColor={{ false: semanticColors.border, true: semanticColors.voiceActive }} thumbColor={semanticColors.surface} accessibilityLabel={label} />
    </View>
  );
}

export function DemoControls() {
  const locale = useLocaleStore((s) => s.locale);
  const queryClient = useQueryClient();
  const family = isRTL(locale) ? fontFamily.urduUi : fontFamily.ui;
  const align = isRTL(locale) ? "right" : "left";
  const state = useConnectivityStore((s) => s.state);
  const pendingCount = useConnectivityStore((s) => s.pendingCount);
  const setOffline = useConnectivityStore((s) => s.setOffline);
  const simulateReconnect = useConnectivityStore((s) => s.simulateReconnect);
  const queueOne = useConnectivityStore((s) => s.queueOne);
  const processQueue = useConnectivityStore((s) => s.processQueue);
  const resetDemo = useConnectivityStore((s) => s.resetDemo);
  const refreshQueue = useConnectivityStore((s) => s.refreshQueue);
  const [scenarioId, setScenarioId] = useState<GoldenScenarioId>("GS-01");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const reconnecting = state === "reconnecting" || busy === "reconnect";
  const offline = state === "offline-demo";
  const flags = demoService.getFlags();
  const scenarios = demoService.listScenarios();

  async function run(action: string, work: () => Promise<void>) {
    setError(false);
    setBusy(action);
    try {
      await work();
      await refreshQueue();
      await queryClient.invalidateQueries({ queryKey: ["my-complaints"] });
      await queryClient.invalidateQueries({ queryKey: ["complaint"] });
      if (action === "reset") {
        useGrievanceDraftStore.getState().resetAfterSubmit();
      }
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  }

  function cycleScenario() {
    const index = goldenScenarioIds.indexOf(scenarioId);
    const next = goldenScenarioIds[(index + 1) % goldenScenarioIds.length] ?? "GS-01";
    setScenarioId(next);
  }

  const selected = scenarios.find((item) => item.id === scenarioId);

  return (
    <ScreenShell header={<LightTopBar titleKey="demo.mobile.title" />} scroll>
      <View style={{ flexDirection: isRTL(locale) ? "row-reverse" : "row", alignItems: "center", gap: 14 }}>
        <IconBadge icon="settings" tone="teal" size={64} />
      <Text
        style={{
          color: semanticColors.textPrimary,
          fontSize: mobileType.body.size,
          lineHeight: mobileType.body.line,
          fontFamily: family,
          textAlign: align,
        }}
      >
        {t(locale, "demo.mobile.body")}
      </Text>
      </View>
      <Text
        style={{
          color: semanticColors.textSecondary,
          fontSize: mobileType.helper.size,
          lineHeight: mobileType.helper.line,
          fontFamily: family,
          textAlign: align,
        }}
      >
        {t(locale, "portal.demo.bridgeNote")}
      </Text>
      <View style={{ gap: 4, padding: 14, backgroundColor: semanticColors.surfaceMuted, borderRadius: 8 }}>
        <Text
          style={{
            color: semanticColors.textSecondary,
            fontSize: mobileType.helper.size,
            lineHeight: mobileType.helper.line,
            fontFamily: family,
            textAlign: align,
          }}
        >
          {t(locale, "demo.mobile.waiting")}
        </Text>
        <IsolateLtr value={String(pendingCount)} />
      </View>
      <Text
        style={{
          color: semanticColors.textPrimary,
          fontSize: mobileType.helper.size,
          lineHeight: mobileType.helper.line,
          fontFamily: family,
          textAlign: align,
        }}
      >
        {selected ? `${selected.id} · ${t(locale, selected.labelKey as MessageKey)} · ${selected.trackingId}` : ""}
      </Text>
      {error ? <ScreenNotice messageKey="common.error" tone="error" /> : null}
      <SectionLabel>{t(locale, "portal.demo.scenario")}</SectionLabel>
      <PrimaryCta
        labelKey="portal.demo.cycleScenario"
        tone="secondary"
        icon="swap-horizontal"
        disabled={busy !== null}
        onPress={cycleScenario}
      />
      <PrimaryCta
        labelKey="portal.demo.load"
        icon="download"
        disabled={busy !== null}
        loading={busy === "load"}
        onPress={() => {
          void run("load", async () => {
            await demoService.loadScenario(scenarioId);
          });
        }}
      />
      <PrimaryCta
        labelKey="portal.demo.inject"
        tone="secondary"
        icon="add-circle"
        disabled={busy !== null}
        loading={busy === "inject"}
        onPress={() => {
          void run("inject", async () => {
            await demoService.injectScenarioComplaint(scenarioId);
          });
        }}
      />
      <PrimaryCta
        labelKey="portal.demo.advanceTracking"
        tone="secondary"
        icon="play-forward"
        disabled={busy !== null}
        loading={busy === "advance"}
        onPress={() => {
          void run("advance", async () => {
            await demoService.advanceScenario(scenarioId, "next");
          });
        }}
      />
      <SectionLabel>{t(locale, "demo.mobile.offline")}</SectionLabel>
      <View style={{ paddingHorizontal: 14, backgroundColor: semanticColors.surface, borderWidth: 1, borderColor: semanticColors.border, borderRadius: 8 }}>
        <SettingRow label={offline ? t(locale, "demo.mobile.offline") : t(locale, "demo.mobile.reconnect")} value={offline} disabled={reconnecting || busy !== null} onChange={(next) => { void run(next ? "offline" : "reconnect", () => next ? setOffline(true) : simulateReconnect()); }} />
      </View>
      <SectionLabel>AI</SectionLabel>
      <View style={{ paddingHorizontal: 14, backgroundColor: semanticColors.surface, borderWidth: 1, borderColor: semanticColors.border, borderRadius: 8 }}>
        <SettingRow label={t(locale, "portal.demo.aiFailureOn")} value={flags.aiFailure} disabled={busy !== null} onChange={(next) => { void run("ai", async () => { demoService.setAiFailure(next); }); }} />
        <SettingRow label={t(locale, "portal.demo.lowConfidenceOn")} value={flags.aiConfidenceOverride === "low"} disabled={busy !== null} onChange={(next) => { void run("confidence", async () => { demoService.setAiConfidence(next ? "low" : null); }); }} />
      </View>
      <SectionLabel>{t(locale, "demo.mobile.waiting")}</SectionLabel>
      <PrimaryCta
        labelKey="demo.mobile.queueOne"
        tone="secondary"
        icon="cloud-upload"
        disabled={reconnecting || busy !== null}
        loading={busy === "queue"}
        onPress={() => {
          void run("queue", () => queueOne());
        }}
      />
      <PrimaryCta
        labelKey="demo.mobile.process"
        tone="secondary"
        icon="sync"
        disabled={reconnecting || busy !== null || pendingCount === 0}
        loading={busy === "process"}
        onPress={() => {
          void run("process", () => processQueue());
        }}
      />
      <PrimaryCta
        labelKey="portal.demo.reset"
        tone="danger"
        icon="trash"
        disabled={reconnecting || busy !== null}
        loading={busy === "reset"}
        onPress={() => {
          void run("reset", () => resetDemo());
        }}
      />
    </ScreenShell>
  );
}
