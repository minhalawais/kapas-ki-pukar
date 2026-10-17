import { t } from "@kapas/localization";
import { complaintService } from "@kapas/mock-services";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";

import { ActionDock } from "../../src/components/action-dock";
import { IsolateLtr } from "../../src/components/isolate-ltr";
import { PrimaryCta } from "../../src/components/primary-cta";
import { ScreenNotice } from "../../src/components/screen-notice";
import { ScreenShell } from "../../src/components/screen-shell";
import { IconBadge, SectionLabel, StatusPill } from "../../src/components/ui-primitives";
import { useAutoPromptId } from "../../src/hooks/use-prompt-playback";
import { isRTL } from "../../src/i18n/rtl";
import { useLocaleStore } from "../../src/stores/localeStore";
import { fontFamily, mobileType, semanticColors } from "../../src/theme/tokens";

export default function OfflineSavedScreen() {
  const router = useRouter();
  const locale = useLocaleStore((s) => s.locale);
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const query = useQuery({ queryKey: ["complaint", id], queryFn: () => complaintService.getById(id), enabled: id.length > 0 });
  const rtl = isRTL(locale);
  const family = rtl ? fontFamily.urduUi : fontFamily.ui;
  const headingFamily = rtl ? fontFamily.urduBold : fontFamily.uiBold;
  const align = rtl ? "right" : "left";
  const sent = query.data?.status === "Submitted";
  useAutoPromptId(sent ? "SC-success" : "SC-offline");

  return (
    <ScreenShell footer={<ActionDock><View style={{ gap: 10 }}><PrimaryCta labelKey="offline.saved.track" icon="time" onPress={() => router.replace(id ? `/complaints/${id}` : "/complaints")} disabled={!query.data} /><PrimaryCta labelKey="home.title" tone="secondary" icon="home" onPress={() => router.replace("/home")} /></View></ActionDock>}>
      <View style={{ alignItems: "center", gap: 14, paddingTop: 20 }}>
        <IconBadge icon={sent ? "checkmark" : "cloud-offline"} tone={sent ? "green" : "gold"} size={88} />
        <StatusPill label={t(locale, sent ? "status.worker.received" : "status.worker.savedOnDevice")} tone={sent ? "success" : "offline"} icon={sent ? "shield-checkmark" : "phone-portrait"} />
      </View>
      <Text style={{ color: semanticColors.textPrimary, fontSize: mobileType.h1.size, lineHeight: mobileType.h1.line, fontFamily: headingFamily, textAlign: align }}>{t(locale, sent ? "grievance.success.title" : "offline.saved.title")}</Text>
      <Text style={{ color: semanticColors.textSecondary, fontSize: mobileType.body.size, lineHeight: mobileType.body.line, fontFamily: family, textAlign: align }}>{t(locale, sent ? "grievance.success.body" : "offline.saved.body")}</Text>
      {!sent ? <ScreenNotice messageKey="offline.banner.saved" tone="warning" /> : null}
      {query.isLoading ? <ActivityIndicator color={semanticColors.actionPrimary} accessibilityLabel={t(locale, "common.loading")} /> : null}
      {query.isError ? <ScreenNotice messageKey="common.error" tone="error" /> : null}
      {query.isSuccess && !query.data ? <ScreenNotice messageKey="offline.saved.missing" tone="warning" /> : null}
      {query.data ? <View style={{ padding: 18, gap: 8, backgroundColor: semanticColors.surface, borderWidth: 1.5, borderColor: semanticColors.borderEssential, borderRadius: 8 }}><SectionLabel>{t(locale, "complaints.detail")}</SectionLabel><IsolateLtr value={query.data.trackingId} /></View> : null}
    </ScreenShell>
  );
}
