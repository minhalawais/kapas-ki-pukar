import { t } from "@kapas/localization";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { ActionDock } from "../../src/components/action-dock";
import { PrimaryCta } from "../../src/components/primary-cta";
import { ScreenNotice } from "../../src/components/screen-notice";
import { ScreenShell } from "../../src/components/screen-shell";
import { StatusPill } from "../../src/components/ui-primitives";
import { isRTL } from "../../src/i18n/rtl";
import { productionSyncService, type SyncQueueItem } from "../../src/services/productionSyncService";
import { useConnectivityStore } from "../../src/stores/connectivityStore";
import { useGrievanceDraftStore } from "../../src/stores/grievanceDraftStore";
import { useLocaleStore } from "../../src/stores/localeStore";
import { fontFamily, mobileType, semanticColors } from "../../src/theme/tokens";

const formatMb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const safeFileName = (value: string) => value.split(/[\\/]/u).at(-1)?.split("").filter((character) => {
  const code = character.charCodeAt(0);
  return code >= 32 && code !== 127 && !(code >= 0x202a && code <= 0x202e) && !(code >= 0x2066 && code <= 0x2069);
}).join("").slice(0, 120) || "attachment";

export default function SendingScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const locale = useLocaleStore((state) => state.locale);
  const connectivity = useConnectivityStore((state) => state.state);
  const [item, setItem] = useState<SyncQueueItem | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [submittingTooLong, setSubmittingTooLong] = useState(false);
  const rtl = isRTL(locale);
  const family = rtl ? fontFamily.urduUi : fontFamily.ui;
  const align = rtl ? "right" : "left";

  useEffect(() => {
    let mounted = true;
    const refresh = () => {
      void productionSyncService.get(id).then((next) => { if (mounted) setItem(next); });
    };
    refresh();
    void productionSyncService.process();
    const unsubscribe = productionSyncService.subscribe(refresh);
    return () => { mounted = false; unsubscribe(); };
  }, [id]);

  useEffect(() => {
    if (item?.referenceNumber || item?.status !== "submitting") {
      setSubmittingTooLong(false);
      return;
    }
    const timer = setTimeout(() => setSubmittingTooLong(true), 45_000);
    return () => clearTimeout(timer);
  }, [id, item?.referenceNumber, item?.status]);

  useEffect(() => {
    if (item?.completionStatus !== "completed" || !item.referenceNumber) return;
    if (useGrievanceDraftStore.getState().draft?.id === id) useGrievanceDraftStore.getState().resetAfterSubmit();
    router.replace(`/grievance/success?id=${id}`);
  }, [id, item?.completionStatus, item?.referenceNumber, router]);

  const totals = useMemo(() => {
    const total = item?.media.reduce((sum, media) => sum + media.totalBytes, 0) ?? 0;
    const sent = item?.media.reduce((sum, media) => sum + media.uploadedBytes, 0) ?? 0;
    const uploaded = item?.media.filter((media) => media.state === "uploaded").length ?? 0;
    return { total, sent, uploaded, count: item?.media.length ?? 0, percent: total ? Math.round((sent / total) * 100) : 100 };
  }, [item]);

  const blocked = item?.status === "blocked" || item?.status === "retryable_failed";
  const needsAttention =
    blocked
    || Boolean(item?.referenceNumber && item?.lastErrorCode)
    || (submittingTooLong && item?.status === "submitting" && !item.referenceNumber);
  const offline = connectivity === "offline-demo";
  const retry = async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      await productionSyncService.retryFailed(id);
      await productionSyncService.process();
      setItem(await productionSyncService.get(id));
    } finally {
      setRetrying(false);
    }
  };
  return (
    <ScreenShell footer={<ActionDock><View style={{ gap: 10 }}>
      {needsAttention ? <PrimaryCta labelKey="sending.retry" icon="refresh" loading={retrying} onPress={() => { void retry(); }} /> : null}
      <PrimaryCta labelKey="sending.home" tone="secondary" icon="home" onPress={() => router.replace("/home")} />
    </View></ActionDock>}>
      <View style={{ alignItems: "center", gap: 12, paddingTop: 20 }}>
        {!needsAttention || retrying ? <ActivityIndicator size="large" color={semanticColors.actionPrimary} /> : null}
        <StatusPill
          label={t(locale, needsAttention && !retrying ? "sending.attentionStatus" : offline ? "sending.savedLocally" : "sending.inProgress")}
          tone={needsAttention && !retrying ? "critical" : offline ? "offline" : "progress"}
          icon={needsAttention && !retrying ? "alert-circle" : offline ? "phone-portrait" : "cloud-upload"}
        />
      </View>
      <Text style={{ color: semanticColors.textPrimary, fontSize: mobileType.h1.size, lineHeight: mobileType.h1.line,
        fontFamily: rtl ? fontFamily.urduBold : fontFamily.uiBold, textAlign: align }}>
        {t(locale, "sending.title")}
      </Text>
      <Text style={{ color: semanticColors.textSecondary, fontSize: mobileType.body.size,
        lineHeight: mobileType.body.line, fontFamily: family, textAlign: align }}>
        {t(locale, offline ? "sending.offlineBody" : "sending.body")}
      </Text>
      <View style={{ padding: 18, gap: 12, backgroundColor: semanticColors.surface, borderWidth: 1,
        borderColor: semanticColors.border, borderRadius: 12 }} accessibilityLiveRegion="polite">
        <Text style={{ color: semanticColors.textPrimary, fontFamily: family, textAlign: align }}>
          ✓ {t(locale, "sending.stage.localSaved")}
        </Text>
        <Text style={{ color: semanticColors.textPrimary, fontFamily: family, textAlign: align }}>
          {item?.status === "acknowledged" ? "✓" : "…"} {t(locale, "sending.stage.complaint")}
        </Text>
        <Text style={{ color: semanticColors.textPrimary, fontFamily: family, textAlign: align }}>
          {item?.referenceNumber ? "✓" : "…"} {t(locale, "sending.stage.acknowledgement")}
        </Text>
        <Text style={{ color: semanticColors.textPrimary, fontFamily: family, textAlign: align }}>
          {t(locale, "grievance.uploadProgress")} ({totals.uploaded}/{totals.count}) · {formatMb(totals.sent)} / {formatMb(totals.total)}
        </Text>
        <View style={{ height: 8, borderRadius: 4, overflow: "hidden", backgroundColor: semanticColors.border }}>
          <View style={{ height: 8, width: `${totals.percent}%`, backgroundColor: semanticColors.actionPrimary }} />
        </View>
        {item?.media.map((media) => (
          <View key={media.id} style={{ gap: 4 }}>
            <Text numberOfLines={1} style={{ color: semanticColors.textPrimary, fontFamily: family, textAlign: align }}>{safeFileName(media.originalName)}</Text>
            <Text style={{ color: semanticColors.textSecondary, fontFamily: family, textAlign: align }}>
              {t(locale, `grievance.evidence.state.${media.state}` as Parameters<typeof t>[1])} · {media.totalBytes ? Math.round(media.uploadedBytes / media.totalBytes * 100) : 0}%
            </Text>
          </View>
        ))}
      </View>
      {needsAttention ? <ScreenNotice messageKey="sending.needsAttention" tone="error" /> : null}
      <ScreenNotice messageKey="sending.backgroundNote" tone="warning" />
    </ScreenShell>
  );
}
