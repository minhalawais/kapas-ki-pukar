import { t } from "@kapas/localization";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";

import { AudioReplayButton } from "../src/components/audio-replay-button";
import { PrimaryCta } from "../src/components/primary-cta";
import { ScreenNotice } from "../src/components/screen-notice";
import { ScreenShell } from "../src/components/screen-shell";
import { WelcomeIllustration } from "../src/components/welcome-illustration";
import { usePromptPlayback } from "../src/hooks/use-prompt-playback";
import { isRTL } from "../src/i18n/rtl";
import { promptAudioService } from "../src/services/promptAudioService";
import { useLocaleStore } from "../src/stores/localeStore";
import { fontFamily, mobileType, semanticColors } from "../src/theme/tokens";

export default function WelcomeScreen() {
  const router = useRouter();
  const locale = useLocaleStore((s) => s.locale);
  const playback = usePromptPlayback("M-003");
  const family = isRTL(locale) ? fontFamily.urduUi : fontFamily.ui;
  const headingFamily = isRTL(locale) ? fontFamily.urduHeading : fontFamily.ui;
  const align = isRTL(locale) ? "right" : "left";

  return (
    <ScreenShell>
      <View accessibilityRole="image" accessibilityLabel={t(locale, "splash.accessibilityLabel")}>
        <WelcomeIllustration />
      </View>
      <Text
        style={{
          color: semanticColors.textPrimary,
          fontSize: mobileType.question.size,
          lineHeight: mobileType.question.line,
          fontWeight: "700",
          fontFamily: headingFamily,
          textAlign: align,
        }}
      >
        {t(locale, "onboarding.welcomeTitle")}
      </Text>
      <Text
        style={{
          color: semanticColors.textPrimary,
          fontSize: mobileType.body.size,
          lineHeight: mobileType.body.line,
          fontFamily: family,
          textAlign: align,
        }}
      >
        {t(locale, "onboarding.welcomeBody")}
      </Text>
      <AudioReplayButton
        labelKey="welcome.playAudio"
        loading={playback.state === "loading"}
        playing={playback.state === "playing"}
        onPress={() => {
          void promptAudioService.playScreenPrompt("M-003");
        }}
      />
      {playback.state === "error" ? <ScreenNotice messageKey="audio.error" tone="error" /> : null}
      <View style={{ marginTop: "auto" }}>
        <PrimaryCta
          labelKey="common.continue"
          onPress={() => {
            router.replace("/home");
          }}
        />
      </View>
    </ScreenShell>
  );
}
