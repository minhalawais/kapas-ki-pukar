import { Ionicons } from "@expo/vector-icons";
import type { RightsTopic } from "@kapas/domain";
import { t, type MessageKey } from "@kapas/localization";
import * as Haptics from "expo-haptics";
import { Image, Pressable, Text, useWindowDimensions, View, type StyleProp, type ViewStyle } from "react-native";

import { isRTL } from "../../i18n/rtl";
import { useLocaleStore } from "../../stores/localeStore";
import { fontFamily, semanticColors } from "../../theme/tokens";

import { rightsImage } from "./rightsImages";
import { rightsPalette } from "./rightsVisuals";

interface Props {
  topic: RightsTopic;
  onPress: () => void;
  variant?: "featured" | "tile" | "row";
  style?: StyleProp<ViewStyle>;
}

export function RightsTopicCard({ topic, onPress, variant = "row", style }: Props) {
  const locale = useLocaleStore((state) => state.locale);
  const { width: viewportWidth } = useWindowDimensions();
  const rtl = isRTL(locale);
  const palette = rightsPalette(topic.tone);
  const label = t(locale, `rights.short.${topic.id}` as MessageKey);
  const image = rightsImage[topic.id];
  const horizontal = variant !== "tile";
  const narrow = viewportWidth < 360;
  const tileWidth = narrow ? 150 : 164;
  const imageWidth = variant === "featured" ? 128 : 96;

  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={t(locale, topic.titleKey as MessageKey)}
      style={({ pressed }) => [
        {
          minHeight: variant === "featured" ? 128 : variant === "tile" ? 172 : 96,
          width: variant === "tile" ? tileWidth : "100%",
          backgroundColor: semanticColors.surface,
          borderWidth: 1,
          borderColor: palette.border,
          borderRadius: 8,
          overflow: "hidden",
          flexDirection: horizontal ? (rtl ? "row-reverse" : "row") : "column",
          opacity: pressed ? 0.84 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
        style,
      ]}
    >
      <Image
        source={image}
        resizeMode="contain"
        accessible={false}
        style={horizontal
          ? { width: imageWidth, height: "100%", backgroundColor: palette.background }
          : { width: "100%", height: 100, alignSelf: "center", backgroundColor: palette.background }}
      />
      <View style={{ flex: 1, minWidth: 0, flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", gap: 6, paddingHorizontal: variant === "tile" ? 10 : 14, paddingVertical: variant === "tile" ? 8 : 0 }}>
        <Text
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          style={{ flex: 1, minWidth: 0, color: semanticColors.textPrimary, fontSize: variant === "featured" ? 22 : 17, lineHeight: rtl ? (variant === "featured" ? 36 : 30) : variant === "featured" ? 28 : 23, fontFamily: rtl ? fontFamily.urduSemibold : fontFamily.uiSemibold, textAlign: rtl ? "right" : "left" }}
        >
          {label}
        </Text>
        <Ionicons name={rtl ? "chevron-back" : "chevron-forward"} size={21} color={palette.foreground} />
      </View>
    </Pressable>
  );
}
