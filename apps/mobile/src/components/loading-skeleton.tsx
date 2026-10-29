import { useEffect, useRef } from "react";
import { Animated, View, type ViewStyle } from "react-native";

import { layout, radiusUsage, semanticColors } from "../theme/tokens";

export function SkeletonBlock({ style }: { style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          backgroundColor: semanticColors.surfaceMuted,
          borderRadius: 6,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function ComplaintListCardSkeleton() {
  return (
    <View
      style={{
        backgroundColor: semanticColors.surface,
        borderWidth: 1,
        borderColor: semanticColors.border,
        borderRadius: radiusUsage.mobileCard,
        padding: 16,
        gap: 12,
        shadowColor: "#17231E",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <SkeletonBlock style={{ width: 44, height: 44, borderRadius: 8 }} />
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonBlock style={{ width: "72%", height: 16, borderRadius: 4 }} />
          <SkeletonBlock style={{ width: "48%", height: 12, borderRadius: 4 }} />
        </View>
        <SkeletonBlock style={{ width: 20, height: 20, borderRadius: 4 }} />
      </View>
      <SkeletonBlock style={{ width: "42%", height: 28, borderRadius: 14, alignSelf: "flex-start" }} />
      <SkeletonBlock style={{ width: "100%", height: 6, borderRadius: 3 }} />
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <SkeletonBlock style={{ width: 15, height: 15, borderRadius: 8 }} />
          <SkeletonBlock style={{ width: "46%", height: 12, borderRadius: 4 }} />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <SkeletonBlock style={{ width: 15, height: 15, borderRadius: 8 }} />
          <SkeletonBlock style={{ width: "68%", height: 12, borderRadius: 4 }} />
        </View>
      </View>
    </View>
  );
}

export function ComplaintListCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: layout.mobileSectionGap }}>
      {Array.from({ length: count }, (_, index) => (
        <ComplaintListCardSkeleton key={index} />
      ))}
    </View>
  );
}

export function ComplaintDetailHeroSkeleton() {
  return (
    <View
      style={{
        padding: 17,
        gap: 14,
        backgroundColor: semanticColors.surface,
        borderWidth: 1,
        borderColor: semanticColors.borderEssential,
        borderRadius: 8,
      }}
    >
      <View style={{ flexDirection: "row", gap: 12 }}>
        <SkeletonBlock style={{ width: 48, height: 48, borderRadius: 8 }} />
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonBlock style={{ width: "65%", height: 20 }} />
          <SkeletonBlock style={{ width: "50%", height: 16 }} />
        </View>
      </View>
      <SkeletonBlock style={{ width: "42%", height: 26, borderRadius: 13 }} />
      <SkeletonBlock style={{ width: "100%", height: 10, borderRadius: 5 }} />
    </View>
  );
}

export function GrievanceQuestionSkeleton() {
  return (
    <View style={{ gap: 16 }}>
      <SkeletonBlock style={{ width: "92%", height: 28 }} />
      <SkeletonBlock style={{ width: "78%", height: 28 }} />
      <View style={{ gap: 12, marginTop: 8 }}>
        <SkeletonBlock style={{ width: "100%", height: 56, borderRadius: radiusUsage.mobileAnswerCard }} />
        <SkeletonBlock style={{ width: "100%", height: 56, borderRadius: radiusUsage.mobileAnswerCard }} />
        <SkeletonBlock style={{ width: "100%", height: 56, borderRadius: radiusUsage.mobileAnswerCard }} />
      </View>
    </View>
  );
}

export function ScreenLoadingSkeleton({
  variant,
  count = 3,
}: {
  variant: "list-card" | "detail-hero" | "question";
  count?: number;
}) {
  if (variant === "question") {
    return <GrievanceQuestionSkeleton />;
  }
  if (variant === "detail-hero") {
    return (
      <View style={{ gap: 18 }}>
        <ComplaintDetailHeroSkeleton />
        <SkeletonBlock style={{ width: "100%", height: 72, borderRadius: 8 }} />
        <SkeletonBlock style={{ width: "100%", height: 160, borderRadius: 8 }} />
      </View>
    );
  }
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: count }, (_, index) => (
        <ComplaintListCardSkeleton key={index} />
      ))}
    </View>
  );
}
