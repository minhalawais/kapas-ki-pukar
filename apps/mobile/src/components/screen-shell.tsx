import { type ReactNode } from "react";
import { RefreshControl, ScrollView, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { pagePadding } from "../theme/layout";
import { layout, semanticColors } from "../theme/tokens";

import { AppAttributionFooter } from "./app-attribution-footer";
import { OfflineBanner } from "./offline-banner";

export function ScreenShell({
  children,
  header,
  footer,
  scroll = false,
  fullWidthHeader = false,
  contentStyle,
  backgroundColor = semanticColors.pageWorker,
  attributionMarginTop,
  refreshing,
  onRefresh,
}: {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  fullWidthHeader?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  attributionMarginTop?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const content = {
    ...pagePadding(),
    paddingTop: header ? 16 : 0,
    paddingBottom: footer ? 16 : 24,
    gap: layout.mobileSectionGap,
  };
  const stableLayoutDirection: ViewStyle = { direction: "ltr" };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor, direction: "ltr" }} edges={["top", "left", "right"]}>
      {header ? (
        <View style={{ paddingHorizontal: fullWidthHeader ? 0 : layout.mobilePagePaddingX, direction: "ltr" }}>{header}</View>
      ) : null}
      <View style={{ paddingHorizontal: layout.mobilePagePaddingX, direction: "ltr" }}>
        <OfflineBanner />
      </View>
      {scroll ? (
        <ScrollView
          style={{ flex: 1, direction: "ltr" }}
          contentContainerStyle={[content, stableLayoutDirection, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing ?? false}
                onRefresh={onRefresh}
                tintColor={semanticColors.actionPrimary}
                colors={[semanticColors.actionPrimary]}
              />
            ) : undefined
          }
        >
          {children}
          {footer ? null : <AppAttributionFooter marginTop={attributionMarginTop} />}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, content, stableLayoutDirection, contentStyle]}>
          {children}
          {footer ? null : <AppAttributionFooter stickToBottom marginTop={attributionMarginTop} />}
        </View>
      )}
      {footer}
    </SafeAreaView>
  );
}
