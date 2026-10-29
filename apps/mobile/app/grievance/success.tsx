import { t } from "@kapas/localization";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";

import { ActionDock } from "../../src/components/action-dock";
import { ComplaintReferenceDisplay } from "../../src/components/complaint-reference-display";
import { PrimaryCta } from "../../src/components/primary-cta";
import { ScreenNotice } from "../../src/components/screen-notice";
import { ScreenShell } from "../../src/components/screen-shell";
import { ScreenLoadingState } from "../../src/components/screen-states";
import { IconBadge, SectionLabel, StatusPill } from "../../src/components/ui-primitives";
import { useAutoPromptId } from "../../src/hooks/use-prompt-playback";
import { isRTL } from "../../src/i18n/rtl";
import { getWorkerComplaintByDraftId } from "../../src/services/workerApi";
import { useLocaleStore } from "../../src/stores/localeStore";
import { fontFamily, mobileType, semanticColors } from "../../src/theme/tokens";

export default function SuccessScreen() {
  const router = useRouter();
  const locale = useLocaleStore((s) => s.locale);
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  useAutoPromptId("SC-success");
  const query = useQuery({ queryKey: ["complaint", id], queryFn: () => getWorkerComplaintByDraftId(id), enabled: id.length > 0 });
  const rtl = isRTL(locale);
  const family = rtl ? fontFamily.urduUi : fontFamily.ui;
  const headingFamily = rtl ? fontFamily.urduBold : fontFamily.uiBold;
  const align = rtl ? "right" : "left";

  useEffect(() => {
    if (query.isSuccess && !query.data) router.replace(`/grievance/sending?id=${id}`);
  }, [id, query.data, query.isSuccess, router]);

  if (!query.data) {
    return (
      <ScreenShell>
        <ScreenLoadingState variant="detail-hero" />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell footer={<ActionDock><View style={{ gap: 10 }}><PrimaryCta labelKey="grievance.success.track" icon="time" onPress={() => router.replace(id ? `/complaints/${id}` : "/complaints")} /><PrimaryCta labelKey="home.title" tone="secondary" icon="home" onPress={() => router.replace("/home")} /></View></ActionDock>}>
      <View style={{ alignItems: "center", gap: 14, paddingTop: 20 }}>
        <IconBadge icon="checkmark" tone="green" size={88} />
        <StatusPill label={t(locale, "status.worker.received")} tone="success" icon="shield-checkmark" />
      </View>
      <Text style={{ color: semanticColors.textPrimary, fontSize: mobileType.h1.size, lineHeight: mobileType.h1.line, fontFamily: headingFamily, textAlign: align }}>{t(locale, "grievance.success.title")}</Text>
      <Text style={{ color: semanticColors.textSecondary, fontSize: mobileType.body.size, lineHeight: mobileType.body.line, fontFamily: family, textAlign: align }}>{t(locale, "grievance.success.body")}</Text>
      {query.isError ? <ScreenNotice messageKey="common.error" tone="error" /> : null}
      {query.data ? (
        <View
          style={{
            padding: 18,
            gap: 10,
            backgroundColor: semanticColors.surface,
            borderWidth: 1.5,
            borderColor: semanticColors.borderEssential,
            borderRadius: 8,
          }}
        >
          <SectionLabel>{t(locale, "complaints.detail")}</SectionLabel>
          <ComplaintReferenceDisplay reference={query.data.referenceNumber} />
        </View>
      ) : null}
    </ScreenShell>
  );
}
