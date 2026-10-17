import { Ionicons } from "@expo/vector-icons";
import { type ComponentProps, type ReactNode } from "react";
import { Text, View } from "react-native";

import { isRTL } from "../i18n/rtl";
import { useLocaleStore } from "../stores/localeStore";
import { fontFamily, mobileType, semanticColors } from "../theme/tokens";

type IconName = ComponentProps<typeof Ionicons>["name"];

export function IconBadge({ icon, tone = "green", size = 48 }: { icon: IconName; tone?: "green" | "teal" | "gold" | "red"; size?: number }) {
  const palette = tone === "teal"
    ? { background: semanticColors.aiSurface, foreground: semanticColors.voiceActiveStrong }
    : tone === "gold"
      ? { background: semanticColors.progressSurface, foreground: semanticColors.warningText }
      : tone === "red"
        ? { background: semanticColors.criticalSurface, foreground: semanticColors.critical }
        : { background: semanticColors.surfaceMuted, foreground: semanticColors.actionPrimary };

  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center", backgroundColor: palette.background }}>
      <Ionicons name={icon} size={Math.round(size * 0.48)} color={palette.foreground} />
    </View>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  const locale = useLocaleStore((s) => s.locale);
  return (
    <Text style={{ color: semanticColors.textSecondary, fontSize: mobileType.caption.size, lineHeight: mobileType.caption.line, fontFamily: isRTL(locale) ? fontFamily.urduSemibold : fontFamily.uiSemibold, textAlign: isRTL(locale) ? "right" : "left" }}>
      {children}
    </Text>
  );
}

export function StatusPill({ label, tone = "progress", icon }: { label: string; tone?: "progress" | "success" | "offline" | "critical"; icon?: IconName }) {
  const locale = useLocaleStore((s) => s.locale);
  const rtl = isRTL(locale);
  const palette = tone === "success"
    ? { bg: "#E5F4EB", fg: semanticColors.success }
    : tone === "offline"
      ? { bg: semanticColors.surfaceMuted, fg: semanticColors.textSecondary }
      : tone === "critical"
        ? { bg: semanticColors.criticalSurface, fg: semanticColors.critical }
        : { bg: semanticColors.progressSurface, fg: semanticColors.warningText };
  return (
    <View style={{ alignSelf: rtl ? "flex-end" : "flex-start", minHeight: 32, paddingHorizontal: 12, borderRadius: 16, flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", gap: 6, backgroundColor: palette.bg }}>
      {icon ? <Ionicons name={icon} size={16} color={palette.fg} /> : null}
      <Text style={{ color: palette.fg, fontSize: mobileType.caption.size, lineHeight: mobileType.caption.line, fontFamily: rtl ? fontFamily.urduSemibold : fontFamily.uiSemibold, textAlign: rtl ? "right" : "left" }}>{label}</Text>
    </View>
  );
}
