import { Ionicons } from "@expo/vector-icons";
import { t } from "@kapas/localization";
import { ActivityIndicator, Text, View } from "react-native";

import { isRTL } from "../i18n/rtl";
import { useConnectivityStore } from "../stores/connectivityStore";
import { useLocaleStore } from "../stores/localeStore";
import { fontFamily, mobileType, radiusUsage, semanticColors } from "../theme/tokens";

export function OfflineBanner() {
  const locale = useLocaleStore((s) => s.locale);
  const state = useConnectivityStore((s) => s.state);
  const failedCount = useConnectivityStore((s) => s.failedCount);
  const family = isRTL(locale) ? fontFamily.urduUi : fontFamily.ui;
  const align = isRTL(locale) ? "right" : "left";
  const reconnecting = state === "reconnecting";
  const offline = state === "offline-demo";
  const failed = state === "online" && failedCount > 0;

  if (!offline && !reconnecting && !failed) {
    return null;
  }

  return (
    <View
      accessibilityRole="alert"
      style={{
        backgroundColor: semanticColors.warningSurface,
        borderColor: semanticColors.warning,
        borderWidth: 1,
        borderRadius: radiusUsage.mobileCard,
        padding: 14,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: isRTL(locale) ? "row-reverse" : "row", alignItems: "center", gap: 10 }}>
      <Ionicons name={reconnecting ? "sync" : failed ? "alert-circle" : "cloud-offline"} size={22} color={semanticColors.warningText} />
      <Text
        style={{
          flex: 1,
          color: semanticColors.textPrimary,
          fontSize: mobileType.body.size,
          lineHeight: mobileType.body.line,
          fontFamily: family,
          textAlign: align,
        }}
      >
        {t(
          locale,
          reconnecting ? "offline.banner.reconnecting" : failed ? "offline.banner.failed" : "offline.banner.offline",
        )}
      </Text>
      </View>
      {offline ? (
        <Text
          style={{
            color: semanticColors.textPrimary,
            fontSize: mobileType.helper.size,
            lineHeight: mobileType.helper.line,
            fontFamily: family,
            textAlign: align,
          }}
        >
          {t(locale, "offline.banner.saved")}
        </Text>
      ) : null}
      {reconnecting ? (
        <ActivityIndicator color={semanticColors.actionPrimary} accessibilityLabel={t(locale, "common.loading")} />
      ) : null}
    </View>
  );
}
