import { Ionicons } from "@expo/vector-icons";
import type { RightsTopic } from "@kapas/domain";
import { t } from "@kapas/localization";
import { SCREEN_PROMPT_IDS } from "@kapas/speech";
import { useEffect, useState } from "react";
import { ActivityIndicator, ImageBackground, Pressable, Text, View } from "react-native";

import HEADER_IMAGE from "../../../assets/rights/rights-explorer-header.png";
import { useAutoPromptId } from "../../hooks/use-prompt-playback";
import { isRTL } from "../../i18n/rtl";
import { promptAudioService } from "../../services/promptAudioService";
import { useLocaleStore } from "../../stores/localeStore";
import { useVoiceGuidanceStore } from "../../stores/voiceGuidanceStore";
import { fontFamily, semanticColors } from "../../theme/tokens";

export function RightsExplorerHeader({ loading, onBack }: { topics: RightsTopic[]; loading: boolean; onBack: () => void; onOpen: (topic: RightsTopic) => void }) {
  const locale = useLocaleStore((state) => state.locale);
  const rtl = isRTL(locale);
  const [manualSpeaking, setManualSpeaking] = useState(false);
  const autoPlayback = useAutoPromptId(SCREEN_PROMPT_IDS.rights);
  const setVoiceGuidanceEnabled = useVoiceGuidanceStore((state) => state.setEnabled);
  const speaking = manualSpeaking || autoPlayback.state === "loading" || autoPlayback.state === "playing";

  useEffect(() => () => { void promptAudioService.stop(); }, []);

  const toggleSpeech = () => {
    if (speaking) {
      void setVoiceGuidanceEnabled(false);
      void promptAudioService.stop().finally(() => setManualSpeaking(false));
      return;
    }
    if (locale !== "ur") return;
    void setVoiceGuidanceEnabled(true);
    setManualSpeaking(true);
    void promptAudioService.playPrompt(SCREEN_PROMPT_IDS.rights).finally(() => setManualSpeaking(false));
  };

  return (
    <View style={{ height: 236, marginHorizontal: 12, overflow: "hidden", borderRadius: 8, backgroundColor: semanticColors.surfaceMuted }}>
      <ImageBackground source={HEADER_IMAGE} resizeMode="cover" accessible={false} style={{ flex: 1, position: "relative" }}>
        <View style={{ height: 64, flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", paddingHorizontal: 10 }}>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={t(locale, "common.back")}
            style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.88)", alignItems: "center", justifyContent: "center", opacity: pressed ? 0.72 : 1 })}
          >
            <Ionicons name={rtl ? "arrow-forward" : "arrow-back"} size={25} color={semanticColors.textPrimary} />
          </Pressable>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82} style={{ flex: 1, color: semanticColors.textPrimary, fontSize: 25, lineHeight: rtl ? 54 : 31, paddingBottom: rtl ? 4 : 0, fontFamily: rtl ? fontFamily.urduHeading : fontFamily.uiBold, textAlign: "center", textShadowColor: "rgba(255,255,255,0.95)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
            {t(locale, "rights.title")}
          </Text>
          <Pressable
            onPress={toggleSpeech}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={t(locale, "a11y.listen")}
            accessibilityState={{ busy: loading, selected: speaking }}
            style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 8, backgroundColor: semanticColors.actionPrimary, alignItems: "center", justifyContent: "center", opacity: pressed || loading ? 0.72 : 1 })}
          >
            {loading ? <ActivityIndicator size="small" color={semanticColors.onPrimary} /> : <Ionicons name={speaking ? "stop" : "volume-high"} size={23} color={semanticColors.onPrimary} />}
          </Pressable>
        </View>

      </ImageBackground>
    </View>
  );
}
