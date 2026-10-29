import { demoPinFromTrackingId, formatComplaintReferenceDisplay, parseReadableComplaintReference } from "@kapas/domain";
import { t } from "@kapas/localization";
import { Text, View } from "react-native";

import { isolateLtr } from "../i18n/rtl";
import { useLocaleStore } from "../stores/localeStore";
import { fontFamily, mobileType, semanticColors } from "../theme/tokens";

export function ComplaintReferenceDisplay({ reference }: { reference: string }) {
  const locale = useLocaleStore((s) => s.locale);
  const parsed = parseReadableComplaintReference(reference);
  const display = formatComplaintReferenceDisplay(reference);
  const pin = demoPinFromTrackingId(reference);

  if (!parsed) {
    return (
      <Text
        accessibilityLabel={reference}
        style={{
          color: semanticColors.textPrimary,
          fontSize: mobileType.reference.size,
          lineHeight: mobileType.reference.line,
          fontFamily: fontFamily.mono,
          fontWeight: "600",
          writingDirection: "ltr",
          textAlign: "left",
        }}
      >
        {isolateLtr(reference)}
      </Text>
    );
  }

  return (
    <View style={{ gap: 6 }}>
      <Text
        accessibilityLabel={display.replace(/-/g, " ")}
        style={{
          color: semanticColors.textPrimary,
          fontSize: mobileType.h1.size,
          lineHeight: mobileType.h1.line,
          fontFamily: fontFamily.mono,
          fontWeight: "700",
          letterSpacing: 1,
          writingDirection: "ltr",
          textAlign: "left",
        }}
      >
        {isolateLtr(display)}
      </Text>
      <Text
        style={{
          color: semanticColors.textSecondary,
          fontSize: mobileType.caption.size,
          lineHeight: mobileType.caption.line,
          fontFamily: locale === "ur" ? fontFamily.urduUi : fontFamily.ui,
          textAlign: locale === "ur" ? "right" : "left",
        }}
      >
        {t(locale, "grievance.success.supportPin")}{" "}
        <Text style={{ fontFamily: fontFamily.mono, writingDirection: "ltr" }}>{pin}</Text>
      </Text>
    </View>
  );
}
