import { Image, type ImageStyle, type StyleProp } from "react-native";

import MARK from "../../assets/logo-mark-inline.png";

export const KAPAS_MARK_ASPECT_RATIO = 632 / 497;

/** Cotton, worker, and protected-voice brand mark. Do not mirror in RTL. */
export function KapasMark({
  size = 40,
  style,
}: {
  size?: number;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={MARK}
      accessible={false}
      accessibilityIgnoresInvertColors
      importantForAccessibility="no"
      resizeMode="contain"
      style={[{ width: Math.round(size * KAPAS_MARK_ASPECT_RATIO), height: size }, style]}
    />
  );
}
