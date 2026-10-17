import { Text } from "react-native";

import { isRTL } from "../../i18n/rtl";
import { useLocaleStore } from "../../stores/localeStore";
import { fontFamily, mobileType, semanticColors } from "../../theme/tokens";

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function RecordingTimer({ elapsedMs }: { elapsedMs: number }) {
  const locale = useLocaleStore((s) => s.locale);
  const family = isRTL(locale) ? fontFamily.urduUi : fontFamily.ui;
  return (
    <Text
      accessibilityLiveRegion="polite"
      style={{
        color: semanticColors.voiceActiveStrong,
        fontSize: mobileType.body.size,
        lineHeight: mobileType.body.line,
        fontFamily: family,
        textAlign: "center",
        fontVariant: ["tabular-nums"],
      }}
    >
      {formatElapsed(elapsedMs)}
    </Text>
  );
}
