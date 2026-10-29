import { formatComplaintReferenceDisplay } from "@kapas/domain";
import { Text, View } from "react-native";

import { fontFamily, mobileType, semanticColors } from "../theme/tokens";

export function ReferenceChip({ reference }: { reference: string }) {
  const display = formatComplaintReferenceDisplay(reference);

  return (
    <View
      style={{
        backgroundColor: semanticColors.referenceSurface,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: "flex-start",
      }}
    >
      <Text
        accessibilityLabel={display.replace(/-/g, " ")}
        style={{
          color: semanticColors.textSecondary,
          fontSize: mobileType.caption.size,
          lineHeight: mobileType.caption.line,
          fontFamily: fontFamily.uiSemibold,
          writingDirection: "ltr",
          textAlign: "left",
        }}
      >
        {display}
      </Text>
    </View>
  );
}
