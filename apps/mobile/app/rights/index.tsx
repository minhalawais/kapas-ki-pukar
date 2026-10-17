import { t } from "@kapas/localization";
import { rightsContentService } from "@kapas/mock-services";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { ScreenNotice } from "../../src/components/screen-notice";
import { ScreenShell } from "../../src/components/screen-shell";
import { RightsExplorerHeader } from "../../src/features/rights/RightsExplorerHeader";
import { RightsTopicCard } from "../../src/features/rights/RightsTopicCard";
import { SafeReportingPanel } from "../../src/features/rights/SafeReportingPanel";
import { isRTL } from "../../src/i18n/rtl";
import { imagePreloadService } from "../../src/services/imagePreloadService";
import { useLocaleStore } from "../../src/stores/localeStore";
import { fontFamily, semanticColors } from "../../src/theme/tokens";

export default function RightsScreen() {
  const router = useRouter();
  const locale = useLocaleStore((state) => state.locale);
  const rtl = isRTL(locale);
  const query = useQuery({ queryKey: ["rights-topics"], queryFn: () => rightsContentService.list() });
  const core = query.data?.filter((topic) => topic.tier === "core") ?? [];
  const more = query.data?.filter((topic) => topic.tier === "more") ?? [];
  const openTopic = (id: string) => router.push(`/rights/${id}`);

  useEffect(() => {
    void imagePreloadService.preloadRights();
  }, []);

  return (
    <ScreenShell scroll contentStyle={{ paddingHorizontal: 0, paddingTop: 8, paddingBottom: 24, gap: 0 }}>
      <RightsExplorerHeader topics={core} loading={query.isLoading} onBack={() => router.back()} onOpen={(topic) => openTopic(topic.id)} />

      <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 2 }}>
        <Text style={{ color: semanticColors.textPrimary, fontSize: 21, lineHeight: rtl ? 39 : 28, fontFamily: rtl ? fontFamily.urduSemibold : fontFamily.uiSemibold, textAlign: rtl ? "right" : "left" }}>
          {t(locale, "rights.choosePrompt")}
        </Text>
      </View>

      {query.isLoading ? <ActivityIndicator style={{ marginTop: 24 }} color={semanticColors.actionPrimary} accessibilityLabel={t(locale, "common.loading")} /> : null}
      {query.isError ? <View style={{ padding: 16 }}><ScreenNotice messageKey="common.error" tone="error" /></View> : null}
      {query.isSuccess && query.data.length === 0 ? <View style={{ padding: 16 }}><ScreenNotice messageKey="rights.empty" /></View> : null}

      {core.length > 0 ? (
        <View style={{ paddingHorizontal: 12, paddingTop: 12, gap: 10 }}>
          {core.slice(0, 3).map((topic) => (
            <RightsTopicCard key={topic.id} topic={topic} variant="featured" onPress={() => openTopic(topic.id)} />
          ))}
        </View>
      ) : null}

      {core.length > 3 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingHorizontal: 12, paddingTop: 12 }}
        >
          {core.slice(3).map((topic) => (
            <RightsTopicCard key={topic.id} topic={topic} variant="tile" onPress={() => openTopic(topic.id)} />
          ))}
        </ScrollView>
      ) : null}

      {more.length > 0 ? (
        <View style={{ paddingHorizontal: 12, paddingTop: 12, gap: 10 }}>
          {more.map((topic) => (
            <RightsTopicCard key={topic.id} topic={topic} variant="row" onPress={() => openTopic(topic.id)} />
          ))}
        </View>
      ) : null}

      <View style={{ paddingHorizontal: 12, paddingTop: 12 }}>
        <SafeReportingPanel onReport={() => router.push("/grievance")} />
      </View>
    </ScreenShell>
  );
}
