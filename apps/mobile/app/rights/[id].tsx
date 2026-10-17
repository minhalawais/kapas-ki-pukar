import { Ionicons } from "@expo/vector-icons";
import type { RightsTopic } from "@kapas/domain";
import { t, type MessageKey } from "@kapas/localization";
import { rightsContentService } from "@kapas/mock-services";
import { RIGHTS_PROMPT_IDS, rightsPromptIds, type PromptId } from "@kapas/speech";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { KapasBrandLockup } from "../../src/components/kapas-brand-lockup";
import { PrimaryCta } from "../../src/components/primary-cta";
import { ScreenNotice } from "../../src/components/screen-notice";
import { ScreenShell } from "../../src/components/screen-shell";
import { hasFieldStory, RightsFieldStory } from "../../src/features/rights/RightsFieldStory";
import { RightsEssentialFacts, RightsLearningActions } from "../../src/features/rights/RightsLearningPanels";
import { rightsIcon, rightsPalette } from "../../src/features/rights/rightsVisuals";
import { WageRightsStory } from "../../src/features/rights/WageRightsStory";
import { WageRightsActions, WageRightsFacts } from "../../src/features/rights/WageRightsSummary";
import { isRTL } from "../../src/i18n/rtl";
import { imagePreloadService } from "../../src/services/imagePreloadService";
import { promptAudioService } from "../../src/services/promptAudioService";
import { useGrievanceDraftStore } from "../../src/stores/grievanceDraftStore";
import { useLocaleStore } from "../../src/stores/localeStore";
import { useVoiceGuidanceStore } from "../../src/stores/voiceGuidanceStore";
import { fontFamily, mobileType, semanticColors } from "../../src/theme/tokens";
import { urduSafeText } from "../../src/theme/urdu-text";

function RightsTopBar({ speaking, loading, progress, onBack, onListen }: { speaking: boolean; loading: boolean; progress: number; onBack: () => void; onListen: () => void }) {
  const locale = useLocaleStore((state) => state.locale);
  const rtl = isRTL(locale);

  return (
    <View style={{ minHeight: 64, paddingVertical: 6, alignItems: "center", justifyContent: "center", position: "relative", overflow: "visible" }}>
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t(locale, "common.back")} style={({ pressed }) => ({ position: "absolute", right: rtl ? 0 : undefined, left: rtl ? undefined : 0, width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: semanticColors.borderEssential, backgroundColor: semanticColors.surface, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.72 : 1 })}>
        <Ionicons name={rtl ? "arrow-forward" : "arrow-back"} size={25} color={semanticColors.voiceActiveStrong} />
      </Pressable>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 58,
          right: 58,
          top: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <KapasBrandLockup markSize={24} textSize={rtl ? 17 : 18} textWidth={rtl ? 144 : 165} gap={9} />
      </View>
      <Pressable
        onPress={onListen}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={t(locale, "a11y.listen")}
        accessibilityState={{ busy: loading, selected: speaking }}
        style={({ pressed }) => ({ position: "absolute", left: rtl ? 0 : undefined, right: rtl ? undefined : 0, width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: semanticColors.borderEssential, backgroundColor: speaking ? semanticColors.aiSurface : semanticColors.surface, alignItems: "center", justifyContent: "center", opacity: pressed || loading ? 0.68 : 1 })}
      >
        {loading ? <ActivityIndicator size="small" color={semanticColors.voiceActiveStrong} /> : <Ionicons name={speaking ? "stop" : "volume-high"} size={24} color={semanticColors.voiceActiveStrong} />}
      </Pressable>
      {speaking ? (
        <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }} style={{ position: "absolute", left: 4, right: 4, bottom: 0, height: 3, borderRadius: 2, overflow: "hidden", backgroundColor: semanticColors.border }}>
          <View style={{ width: `${Math.max(4, progress * 100)}%`, height: "100%", backgroundColor: semanticColors.voiceActiveStrong }} />
        </View>
      ) : null}
    </View>
  );
}

function RightsHero({ topic }: { topic: RightsTopic }) {
  const locale = useLocaleStore((state) => state.locale);
  const rtl = isRTL(locale);
  const palette = rightsPalette(topic.tone);

  return (
    <View style={{ backgroundColor: palette.background, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 26, gap: 16, overflow: "visible" }}>
      <View style={{ width: 72, height: 72, borderRadius: 8, backgroundColor: semanticColors.surface, borderWidth: 1, borderColor: palette.border, alignItems: "center", justifyContent: "center", alignSelf: rtl ? "flex-end" : "flex-start" }}>
        <Ionicons name={rightsIcon[topic.visual]} size={38} color={palette.foreground} />
      </View>
      <View style={{ gap: 10 }}>
        <Text
          style={{
            color: semanticColors.textPrimary,
            fontFamily: rtl ? fontFamily.urduBold : fontFamily.uiBold,
            textAlign: rtl ? "right" : "left",
            ...(rtl ? urduSafeText(28, "heading") : { fontSize: 30, lineHeight: 37 }),
          }}
        >
          {t(locale, topic.titleKey as MessageKey)}
        </Text>
        <Text
          style={{
            color: semanticColors.textSecondary,
            fontFamily: rtl ? fontFamily.urduUi : fontFamily.ui,
            textAlign: rtl ? "right" : "left",
            ...(rtl ? urduSafeText(mobileType.body.size, "ui") : { fontSize: mobileType.body.size, lineHeight: mobileType.body.line }),
          }}
        >
          {t(locale, topic.bodyKey as MessageKey)}
        </Text>
      </View>
    </View>
  );
}

function GuidanceSection({ titleKey, keys, tone, numbered = false, compact = false }: { titleKey: MessageKey; keys: string[]; tone: "green" | "teal" | "red"; numbered?: boolean; compact?: boolean }) {
  const locale = useLocaleStore((state) => state.locale);
  const rtl = isRTL(locale);
  const palette = tone === "red"
    ? { background: semanticColors.criticalSurface, foreground: semanticColors.critical, icon: "warning" as const }
    : tone === "teal"
      ? { background: semanticColors.aiSurface, foreground: semanticColors.voiceActiveStrong, icon: "footsteps" as const }
      : { background: semanticColors.surfaceMuted, foreground: semanticColors.actionPrimary, icon: "shield-checkmark" as const };

  return (
    <View style={{ backgroundColor: palette.background, borderRadius: 8, padding: compact ? 14 : 16, gap: compact ? 9 : 12 }}>
      <View style={{ flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", gap: 9 }}>
        <Ionicons name={palette.icon} size={22} color={palette.foreground} />
        <Text style={{ flex: 1, color: semanticColors.textPrimary, fontSize: mobileType.answer.size, lineHeight: rtl ? 34 : mobileType.answer.line, fontFamily: rtl ? fontFamily.urduSemibold : fontFamily.uiSemibold, textAlign: rtl ? "right" : "left" }}>{t(locale, titleKey)}</Text>
      </View>
      <View style={{ gap: compact ? 7 : 10 }}>
        {keys.map((key, index) => (
          <View key={key} style={{ flexDirection: rtl ? "row-reverse" : "row", alignItems: "flex-start", gap: 10 }}>
            <View style={{ width: 26, height: 26, borderRadius: numbered ? 6 : 13, backgroundColor: palette.foreground, alignItems: "center", justifyContent: "center", marginTop: rtl ? 3 : 0 }}>
              {numbered ? <Text style={{ color: semanticColors.onPrimary, fontSize: 13, lineHeight: 17, fontFamily: fontFamily.uiBold }}>{index + 1}</Text> : <Ionicons name="checkmark" size={17} color={semanticColors.onPrimary} />}
            </View>
            <Text style={{ flex: 1, color: semanticColors.textPrimary, fontSize: mobileType.body.size, lineHeight: rtl ? 31 : mobileType.body.line, fontFamily: rtl ? fontFamily.urduUi : fontFamily.ui, textAlign: rtl ? "right" : "left" }}>{t(locale, key as MessageKey)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function RightsDetailScreen() {
  const router = useRouter();
  const locale = useLocaleStore((state) => state.locale);
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const query = useQuery({ queryKey: ["rights-topic", id], queryFn: () => rightsContentService.getById(id), enabled: id.length > 0 });
  const topic = query.data;
  const [speaking, setSpeaking] = useState(false);
  const [narrationIndex, setNarrationIndex] = useState(0);
  const [narrationTotal, setNarrationTotal] = useState(0);
  const narrationRunRef = useRef(0);
  const setRequestedCategory = useGrievanceDraftStore((state) => state.setRequestedCategory);
  const voiceGuidanceEnabled = useVoiceGuidanceStore((state) => state.enabled);
  const setVoiceGuidanceEnabled = useVoiceGuidanceStore((state) => state.setEnabled);

  const stopNarration = useCallback((persistMute = false) => {
    narrationRunRef.current += 1;
    if (persistMute) {
      void setVoiceGuidanceEnabled(false);
    }
    void promptAudioService.stop();
    setSpeaking(false);
    setNarrationIndex(0);
    setNarrationTotal(0);
  }, [setVoiceGuidanceEnabled]);

  const startNarration = useCallback((promptIds: readonly PromptId[]) => {
    if (promptIds.length === 0 || locale !== "ur") {
      return;
    }
    void setVoiceGuidanceEnabled(true);
    const run = narrationRunRef.current + 1;
    narrationRunRef.current = run;
    void promptAudioService.stop().then(async () => {
      if (narrationRunRef.current !== run) {
        return;
      }
      setSpeaking(true);
      setNarrationTotal(promptIds.length);
      try {
        await promptAudioService.playPrompts(promptIds, (current, total) => {
          if (narrationRunRef.current === run) {
            setNarrationIndex(current);
            setNarrationTotal(total);
          }
        });
      } finally {
        if (narrationRunRef.current === run) {
          setSpeaking(false);
          setNarrationIndex(0);
          setNarrationTotal(0);
        }
      }
    }).catch(() => {
      if (narrationRunRef.current === run) setSpeaking(false);
    });
  }, [locale, setVoiceGuidanceEnabled]);

  useFocusEffect(
    useCallback(() => {
      if (!topic?.id || locale !== "ur" || !voiceGuidanceEnabled) {
        stopNarration();
        return;
      }
      startNarration(rightsPromptIds(topic.id));
      return stopNarration;
    }, [locale, startNarration, stopNarration, topic?.id, voiceGuidanceEnabled]),
  );

  const handleListen = () => {
    if (!topic) {
      return;
    }
    if (speaking) {
      stopNarration(true);
      return;
    }
    startNarration(rightsPromptIds(topic.id));
  };

  const handleReport = () => {
    if (!topic) {
      return;
    }
    stopNarration();
    setRequestedCategory(topic.categoryCode ?? null);
    router.push("/grievance");
  };

  const handleListenCalculation = () => {
    startNarration([RIGHTS_PROMPT_IDS.wages.action]);
  };

  const handleListenActions = () => {
    if (!topic) {
      return;
    }
    const ids = RIGHTS_PROMPT_IDS[topic.id as keyof typeof RIGHTS_PROMPT_IDS];
    if (ids) startNarration([ids.action]);
  };

  const isWage = topic?.id === "wages";
  const hasIllustratedStory = topic ? isWage || hasFieldStory(topic.id) : false;

  useEffect(() => {
    void imagePreloadService.preloadRights();
  }, []);

  return (
    <ScreenShell
      header={<RightsTopBar speaking={speaking} loading={query.isLoading} progress={narrationTotal > 0 ? narrationIndex / narrationTotal : 0} onBack={() => router.back()} onListen={handleListen} />}
      footer={hasIllustratedStory ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, borderTopWidth: 1, borderTopColor: semanticColors.border, backgroundColor: semanticColors.pageWorker }}>
          <PrimaryCta labelKey={isWage ? "rights.wages.reportCta" : "rights.reporting.cta"} icon="mic" onPress={handleReport} />
        </View>
      ) : undefined}
      scroll
      contentStyle={{ paddingHorizontal: 0, paddingTop: 4, paddingBottom: 24, gap: 0 }}
    >
      {query.isLoading ? <ActivityIndicator color={semanticColors.actionPrimary} accessibilityLabel={t(locale, "common.loading")} /> : null}
      {query.isError ? <View style={{ paddingHorizontal: 20 }}><ScreenNotice messageKey="common.error" tone="error" /></View> : null}
      {query.isSuccess && !topic ? <View style={{ paddingHorizontal: 20 }}><ScreenNotice messageKey="rights.empty" /></View> : null}
      {topic ? (
        <>
          {isWage ? <WageRightsStory /> : hasFieldStory(topic.id) ? <RightsFieldStory topic={topic} /> : <RightsHero topic={topic} />}
          <View style={{ paddingHorizontal: 20, paddingTop: 18, gap: 16 }}>
            {isWage ? <WageRightsFacts /> : hasFieldStory(topic.id) ? <RightsEssentialFacts topic={topic} /> : <GuidanceSection titleKey="rights.section.guidance" keys={topic.guidanceKeys} tone="green" />}
            <GuidanceSection titleKey="rights.section.warning" keys={topic.warningKeys} tone="red" compact={hasIllustratedStory} />
            {isWage ? <WageRightsActions onListenCalculation={handleListenCalculation} /> : hasFieldStory(topic.id) ? <RightsLearningActions topic={topic} onListen={handleListenActions} /> : <GuidanceSection titleKey="rights.section.action" keys={topic.actionKeys} tone="teal" numbered />}
            {hasIllustratedStory ? null : (
              <>
                <PrimaryCta labelKey="rights.reporting.cta" icon="mic" onPress={handleReport} />
              </>
            )}
          </View>
        </>
      ) : null}
    </ScreenShell>
  );
}
