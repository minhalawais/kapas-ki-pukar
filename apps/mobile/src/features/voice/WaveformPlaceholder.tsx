import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

import { motion, semanticColors } from "../../theme/tokens";

const BAR_HEIGHTS = [16, 28, 20, 36, 22, 30, 18];

export function WaveformPlaceholder({
  active,
  reduceMotion,
}: {
  active: boolean;
  reduceMotion: boolean;
}) {
  const scales = useRef(BAR_HEIGHTS.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    if (!active || reduceMotion) {
      scales.forEach((value) => value.setValue(1));
      return;
    }
    const loops = scales.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1.35,
            duration: motion.panel + index * 20,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.7,
            duration: motion.panel,
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    loops.forEach((loop) => loop.start());
    return () => {
      loops.forEach((loop) => loop.stop());
    };
  }, [active, reduceMotion, scales]);

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: 6,
        height: 40,
      }}
    >
      {BAR_HEIGHTS.map((height, index) => (
        <Animated.View
          key={String(index)}
          style={{
            width: 6,
            height,
            borderRadius: 4,
            backgroundColor: semanticColors.voiceActive,
            transform: [{ scaleY: reduceMotion || !active ? 1 : scales[index] }],
            opacity: active ? 1 : 0.45,
          }}
        />
      ))}
    </View>
  );
}
