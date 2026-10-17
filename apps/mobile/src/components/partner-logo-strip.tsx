import { Image, View, type ImageSourcePropType } from "react-native";

import FOS_LOGO from "../../assets/FOS_logo.png";
import ILO_LOGO from "../../assets/ilo_logo.png";
import PUWF_LOGO from "../../assets/puwf_logo.png";
import { isRTL } from "../i18n/rtl";
import { useLocaleStore } from "../stores/localeStore";
import { semanticColors } from "../theme/tokens";

const partnerLogos: { source: ImageSourcePropType; label: string }[] = [
  { source: PUWF_LOGO, label: "Punjab Workers Welfare Fund" },
  { source: ILO_LOGO, label: "International Labour Organization" },
  { source: FOS_LOGO, label: "Fruit of Sustainability" },
];

export function PartnerLogoStrip({ compact = false }: { compact?: boolean }) {
  const locale = useLocaleStore((state) => state.locale);
  const rtl = isRTL(locale);

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="International Labour Organization, Punjab Workers Welfare Fund, and Fruit of Sustainability"
      style={{
        flexDirection: rtl ? "row-reverse" : "row",
        gap: compact ? 7 : 8,
        padding: compact ? 7 : 10,
        borderWidth: 1,
        borderColor: semanticColors.border,
        borderRadius: 8,
        backgroundColor: "rgba(255,255,255,0.72)",
      }}
    >
      {partnerLogos.map((item) => (
        <View
          key={item.label}
          style={{
            flex: 1,
            height: compact ? 56 : 58,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: compact ? 6 : 6,
            paddingVertical: compact ? 4 : 7,
            borderWidth: 1,
            borderColor: semanticColors.border,
            borderRadius: 8,
            backgroundColor: semanticColors.surface,
          }}
        >
          <Image
            source={item.source}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
            style={{ width: "100%", height: "100%" }}
          />
        </View>
      ))}
    </View>
  );
}
