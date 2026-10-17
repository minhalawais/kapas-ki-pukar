import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

import { useReducedMotion } from "../hooks/use-reduced-motion";
import { semanticColors } from "../theme/tokens";

interface Props {
  active: boolean;
  barCount?: number;
  height?: number;
  barWidth?: number;
  gap?: number;
  color?: string;
}

const BAR_TIMINGS = [340, 480, 290, 420, 360];
const BASE_HEIGHTS = [10, 18, 14, 22, 12];

export function AudioWaveVisualizer({
  active,
  barCount = 5,
  height = 24,
  barWidth = 3.5,
  gap = 3.5,
  color = semanticColors.voiceActiveStrong,
}: Props) {
  const reduceMotion = useReducedMotion();
  const animValues = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.4)),
  ).current;

  useEffect(() => {
    if (!active || reduceMotion) {
      animValues.forEach((val) => val.setValue(0.4));
      return;
    }

    const loops = animValues.map((val, i) => {
      const duration = BAR_TIMINGS[i % BAR_TIMINGS.length];
      return Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0.25,
            duration: Math.round(duration * 0.85),
            useNativeDriver: true,
          }),
        ]),
      );
    });

    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [active, animValues, reduceMotion]);

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height,
        gap,
        paddingHorizontal: 4,
      }}
    >
      {animValues.map((anim, index) => (
        <Animated.View
          key={index}
          style={{
            width: barWidth,
            height: BASE_HEIGHTS[index % BASE_HEIGHTS.length],
            borderRadius: barWidth / 2,
            backgroundColor: color,
            transform: [
              {
                scaleY: reduceMotion || !active ? 1 : anim,
              },
            ],
            opacity: active ? 0.95 : 0.4,
          }}
        />
      ))}
    </View>
  );
}
