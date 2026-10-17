import { Text, type TextStyle } from "react-native";

import { isolateLtr } from "../i18n/rtl";
import { fontFamily, mobileType, semanticColors } from "../theme/tokens";

interface Props {
  value: string;
  style?: TextStyle;
}

export function IsolateLtr({ value, style }: Props) {
  return (
    <Text
      accessibilityLabel={value}
      style={{
        color: semanticColors.textPrimary,
        fontSize: mobileType.reference.size,
        lineHeight: mobileType.reference.line,
        fontWeight: "600",
        fontFamily: fontFamily.mono,
        writingDirection: "ltr",
        textAlign: "left",
        ...style,
      }}
    >
      {isolateLtr(value)}
    </Text>
  );
}
