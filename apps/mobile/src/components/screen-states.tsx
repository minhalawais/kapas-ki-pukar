import { Ionicons } from "@expo/vector-icons";
import { t, type MessageKey } from "@kapas/localization";
import { type ReactNode } from "react";
import { Text, View } from "react-native";

import { isRTL } from "../i18n/rtl";
import { useLocaleStore } from "../stores/localeStore";
import { fontFamily, mobileType, semanticColors } from "../theme/tokens";

import { ScreenLoadingSkeleton } from "./loading-skeleton";
import { PrimaryCta } from "./primary-cta";
import { IconBadge } from "./ui-primitives";

export function ScreenLoadingState({
  variant,
  skeletonCount,
}: {
  variant: "list-card" | "detail-hero" | "question";
  skeletonCount?: number;
}) {
  const locale = useLocaleStore((s) => s.locale);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={t(locale, "common.loading")}
      style={{ gap: 12 }}
    >
      <ScreenLoadingSkeleton variant={variant} count={skeletonCount} />
    </View>
  );
}

export function EmptyState({
  icon,
  messageKey,
  helperKey,
  action,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  messageKey: MessageKey;
  helperKey?: MessageKey;
  action?: ReactNode;
}) {
  const locale = useLocaleStore((s) => s.locale);
  const family = isRTL(locale) ? fontFamily.urduUi : fontFamily.ui;
  const align = isRTL(locale) ? "right" : "left";

  return (
    <View style={{ gap: 16, alignItems: "center", paddingTop: 28, paddingBottom: 8 }}>
      <IconBadge icon={icon} tone="teal" size={80} />
      <Text
        style={{
          color: semanticColors.textPrimary,
          fontSize: mobileType.body.size,
          lineHeight: mobileType.body.line,
          fontFamily: family,
          textAlign: "center",
        }}
      >
        {t(locale, messageKey)}
      </Text>
      {helperKey ? (
        <Text
          style={{
            color: semanticColors.textSecondary,
            fontSize: mobileType.helper.size,
            lineHeight: mobileType.helper.line,
            fontFamily: family,
            textAlign: align,
            width: "100%",
          }}
        >
          {t(locale, helperKey)}
        </Text>
      ) : null}
      {action ? <View style={{ width: "100%" }}>{action}</View> : null}
    </View>
  );
}

export function ErrorState({
  messageKey = "common.error",
  onRetry,
}: {
  messageKey?: MessageKey;
  onRetry?: () => void;
}) {
  const locale = useLocaleStore((s) => s.locale);
  const family = isRTL(locale) ? fontFamily.urduUi : fontFamily.ui;

  return (
    <View style={{ gap: 14, alignItems: "center", paddingVertical: 24 }}>
      <Ionicons name="alert-circle-outline" size={48} color={semanticColors.critical} />
      <Text
        style={{
          color: semanticColors.textPrimary,
          fontSize: mobileType.body.size,
          lineHeight: mobileType.body.line,
          fontFamily: family,
          textAlign: "center",
        }}
      >
        {t(locale, messageKey)}
      </Text>
      {onRetry ? (
        <View style={{ width: "100%" }}>
          <PrimaryCta labelKey="common.retry" icon="refresh" tone="secondary" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}
