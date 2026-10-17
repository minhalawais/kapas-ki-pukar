import { t } from "@kapas/localization";
import { useRouter } from "expo-router";
import { Text } from "react-native";

import { KapasBrandLockup } from "../src/components/kapas-brand-lockup";
import { LanguageCard } from "../src/components/language-card";
import { ScreenShell } from "../src/components/screen-shell";
import { useAutoPromptId } from "../src/hooks/use-prompt-playback";
import { isRTL } from "../src/i18n/rtl";
import { useLocaleStore } from "../src/stores/localeStore";
import { fontFamily, mobileType, semanticColors } from "../src/theme/tokens";
import { localizedTextMetrics } from "../src/theme/urdu-text";

export default function LanguageScreen() {
  const router = useRouter();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const hasChosenLanguage = useLocaleStore((s) => s.hasChosenLanguage);
  const rtl = isRTL(locale);
  const headingFamily = rtl ? fontFamily.urduHeading : fontFamily.uiBold;
  const bodyFamily = rtl ? fontFamily.urduUi : fontFamily.ui;
  const align = rtl ? "right" : "left";
  const headingMetrics = localizedTextMetrics(locale, mobileType.question.size, mobileType.question.line, "heading");
  const bodyMetrics = localizedTextMetrics(locale, mobileType.body.size, mobileType.body.line);
  useAutoPromptId("SC-welcome");

  const selectLanguage = (nextLocale: "ur" | "en") => {
    void setLocale(nextLocale).finally(() => router.replace("/home"));
  };

  return (
    <ScreenShell>
      <KapasBrandLockup markSize={48} textSize={mobileType.answer.size} textWidth={rtl ? 190 : 210} gap={10} />
      <Text
        style={{
          color: semanticColors.textPrimary,
          fontFamily: headingFamily,
          textAlign: align,
          ...headingMetrics,
        }}
      >
        {t(locale, "onboarding.chooseLanguage")}
      </Text>
      <Text style={{ color: semanticColors.textSecondary, fontFamily: bodyFamily, textAlign: align, ...bodyMetrics }}>
        {t(locale, "onboarding.chooseLanguageHelp")}
      </Text>
      <LanguageCard
        localeValue="ur"
        selected={hasChosenLanguage && locale === "ur"}
        onPress={() => selectLanguage("ur")}
      />
      <LanguageCard
        localeValue="en"
        selected={hasChosenLanguage && locale === "en"}
        onPress={() => selectLanguage("en")}
      />
    </ScreenShell>
  );
}
