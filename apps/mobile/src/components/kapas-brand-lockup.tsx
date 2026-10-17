import { t } from "@kapas/localization";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";

import { isRTL } from "../i18n/rtl";
import { useLocaleStore } from "../stores/localeStore";
import { fontFamily, semanticColors } from "../theme/tokens";
import { urduSafeText } from "../theme/urdu-text";

import { KAPAS_MARK_ASPECT_RATIO, KapasMark } from "./kapas-mark";

interface KapasBrandLockupProps {
  orientation?: "horizontal" | "vertical";
  markSize: number;
  textSize: number;
  textWidth: number;
  gap?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/** Stable brand lockup for Urdu: the mark and text never share or shrink each other's space. */
export function KapasBrandLockup({
  orientation = "horizontal",
  markSize,
  textSize,
  textWidth,
  gap = 9,
  color = semanticColors.actionPrimary,
  style,
}: KapasBrandLockupProps) {
  const locale = useLocaleStore((state) => state.locale);
  const rtl = isRTL(locale);
  const vertical = orientation === "vertical";
  const markWidth = Math.round(markSize * KAPAS_MARK_ASPECT_RATIO);
  const textHeight = rtl ? Math.round(textSize * 2) : Math.round(textSize * 1.4);

  return (
    <View
      style={[
        {
          width: vertical ? textWidth : markWidth + textWidth + gap,
          maxWidth: "100%",
          minHeight: vertical ? markSize + textHeight + gap : Math.max(markSize, textHeight),
          flexDirection: vertical ? "column" : rtl ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap,
          overflow: "visible",
        },
        style,
      ]}
    >
      <View style={{ width: markWidth, height: markSize, flexShrink: 0, alignItems: "center", justifyContent: "center", overflow: "visible" }}>
        <KapasMark size={markSize} />
      </View>
      <View style={{ width: textWidth, maxWidth: vertical ? textWidth : "100%", minHeight: textHeight, flexShrink: vertical ? 0 : 1, minWidth: 0, justifyContent: "center", overflow: "visible" }}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.74}
          style={{
            width: "100%",
            overflow: "visible",
            color,
            fontFamily: rtl ? fontFamily.urduSemibold : fontFamily.uiBold,
            textAlign: vertical ? "center" : rtl ? "right" : "left",
            paddingHorizontal: rtl ? Math.max(8, Math.round(textSize * 0.45)) : 0,
            ...(rtl ? urduSafeText(textSize, "ui") : { fontSize: textSize, lineHeight: Math.round(textSize * 1.35) }),
          }}
        >
          {t(locale, "app.name")}
        </Text>
      </View>
    </View>
  );
}
