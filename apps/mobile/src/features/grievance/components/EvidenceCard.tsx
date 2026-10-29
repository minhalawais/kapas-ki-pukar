import { Ionicons } from "@expo/vector-icons";
import type { Evidence } from "@kapas/domain";
import { t } from "@kapas/localization";
import { Pressable, Text, View } from "react-native";

import { isRTL } from "../../../i18n/rtl";
import type { SyncMediaItem } from "../../../services/productionSyncService";
import { useLocaleStore } from "../../../stores/localeStore";
import { fontFamily, mobileType, radiusUsage, semanticColors } from "../../../theme/tokens";

interface Props {
  item: Evidence;
  progress?: SyncMediaItem;
  onRemove: () => void;
}

const formatBytes = (bytes?: number) => {
  if (!bytes) return "";
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
};
const safeFileName = (value: string) => value.split(/[\\/]/u).at(-1)?.split("").filter((character) => {
  const code = character.charCodeAt(0);
  return code >= 32 && code !== 127 && !(code >= 0x202a && code <= 0x202e) && !(code >= 0x2066 && code <= 0x2069);
}).join("").slice(0, 120) || "attachment";

export function EvidenceCard({ item, progress, onRemove }: Props) {
  const locale = useLocaleStore((s) => s.locale);
  const family = isRTL(locale) ? fontFamily.urduUi : fontFamily.ui;
  const align = isRTL(locale) ? "right" : "left";
  const percent = progress?.totalBytes ? Math.min(100, Math.round((progress.uploadedBytes / progress.totalBytes) * 100)) : 0;
  const state = progress?.state ?? "pending";

  return (
    <View
      style={{
        backgroundColor: semanticColors.surface,
        borderWidth: 1,
        borderColor: semanticColors.border,
        borderRadius: radiusUsage.mobileCard,
        padding: 16,
        gap: 8,
        flexDirection: isRTL(locale) ? "row-reverse" : "row",
        alignItems: "center",
      }}
    >
      <Ionicons name={item.kind === "photo" ? "image" : "document-text"} size={28} color={semanticColors.voiceActiveStrong} />
      <View style={{ flex: 1, gap: 6 }} accessibilityLiveRegion="polite">
        <Text style={{ color: semanticColors.textPrimary, fontSize: mobileType.body.size,
          lineHeight: mobileType.body.line, fontFamily: family, textAlign: align }} numberOfLines={1}>
          {safeFileName(item.fileName)}
        </Text>
        <Text style={{ color: semanticColors.textSecondary, fontSize: mobileType.caption.size, fontFamily: family, textAlign: align }}>
          {[formatBytes(progress?.totalBytes ?? item.byteLength), t(locale, `grievance.evidence.state.${state}` as Parameters<typeof t>[1]),
            state === "uploading" ? `${percent}%` : ""].filter(Boolean).join(" · ")}
        </Text>
        {state === "uploading" ? (
          <View style={{ height: 5, borderRadius: 3, overflow: "hidden", backgroundColor: semanticColors.border }}>
            <View style={{ height: 5, width: `${percent}%`, backgroundColor: semanticColors.actionPrimary }} />
          </View>
        ) : null}
      </View>
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={t(locale, "grievance.evidence.remove")}
        style={({ pressed }) => ({
          width: 48,
          height: 48,
          justifyContent: "center",
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Ionicons name="trash-outline" size={22} color={semanticColors.critical} />
      </Pressable>
    </View>
  );
}
