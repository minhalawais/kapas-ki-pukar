import { type ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { layout, semanticColors } from "../theme/tokens";

import { AppAttributionFooter } from "./app-attribution-footer";

export function ActionDock({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingHorizontal: layout.mobilePagePaddingX,
        paddingTop: 12,
        paddingBottom: Math.max(10, insets.bottom),
        borderTopWidth: 1,
        borderTopColor: semanticColors.border,
        backgroundColor: semanticColors.surface,
      }}
    >
      {children}
      <AppAttributionFooter hideDivider marginTop={8} />
    </View>
  );
}
