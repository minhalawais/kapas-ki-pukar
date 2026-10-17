import { t } from "@kapas/localization";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { KapasBrandLockup } from "../src/components/kapas-brand-lockup";
import { PartnerLogoStrip } from "../src/components/partner-logo-strip";
import { useReducedMotion } from "../src/hooks/use-reduced-motion";
import { isRTL } from "../src/i18n/rtl";
import { useLocaleStore } from "../src/stores/localeStore";
import { fontFamily, motion, semanticColors } from "../src/theme/tokens";
import { urduSafeText } from "../src/theme/urdu-text";

function nextRoute(hasChosenLanguage: boolean): "/language" | "/home" {
  if (!hasChosenLanguage) {
    return "/language";
  }
  return "/home";
}

export default function SplashScreen() {
  const router = useRouter();
  const locale = useLocaleStore((s) => s.locale);
  const hasChosenLanguage = useLocaleStore((s) => s.hasChosenLanguage);
  const reducedMotion = useReducedMotion();
  const rtl = isRTL(locale);
  const bodyFamily = rtl ? fontFamily.urduUi : fontFamily.ui;
  const routed = useRef(false);

  useEffect(() => {
    const delay = reducedMotion ? 0 : motion.data + motion.panel + motion.route;
    const timer = setTimeout(() => {
      if (routed.current) {
        return;
      }
      routed.current = true;
      router.replace(nextRoute(hasChosenLanguage));
    }, delay);
    return () => clearTimeout(timer);
  }, [hasChosenLanguage, reducedMotion, router]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: semanticColors.pageWorker, direction: "ltr" }}>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={t(locale, "splash.accessibilityLabel")}
        style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20, direction: "ltr" }}
      >
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 14 }}>
          <KapasBrandLockup
            orientation="vertical"
            markSize={108}
            textSize={rtl ? 27 : 28}
            textWidth={280}
            gap={12}
            color={semanticColors.textPrimary}
          />
          <Text
            style={{
              color: semanticColors.textSecondary,
              fontFamily: bodyFamily,
              textAlign: "center",
              ...(rtl ? urduSafeText(15, "ui") : { fontSize: 15, lineHeight: 22 }),
            }}
          >
            {t(locale, "splash.initiative")}
          </Text>
          <Text
            style={{
              color: semanticColors.textSecondary,
              fontFamily: bodyFamily,
              textAlign: "center",
              ...(rtl ? urduSafeText(14, "ui") : { fontSize: 14, lineHeight: 20 }),
            }}
          >
            {t(locale, "splash.techPartner")}
          </Text>
        </View>

        <View
          style={{
            alignItems: "center",
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: semanticColors.border,
          }}
        >
          <View style={{ width: "100%", maxWidth: 360 }}>
            <PartnerLogoStrip compact />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
