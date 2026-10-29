import { StyleSheet, View } from "react-native";

import { SkeletonBlock } from "../../components/loading-skeleton";
import { semanticColors } from "../../theme/tokens";

import { complaintsListGutter } from "./ComplaintsListChrome";

export function ComplaintsListChromeSkeleton() {
  return (
    <View
      style={{
        paddingHorizontal: complaintsListGutter,
        paddingTop: 12,
        paddingBottom: 14,
        gap: 12,
        backgroundColor: semanticColors.pageWorker,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: semanticColors.border,
      }}
    >
      <View style={{ flexDirection: "row", gap: 8 }}>
        <SkeletonBlock style={{ width: 72, height: 36, borderRadius: 8 }} />
        <SkeletonBlock style={{ width: 96, height: 36, borderRadius: 8 }} />
        <SkeletonBlock style={{ width: 112, height: 36, borderRadius: 8 }} />
        <SkeletonBlock style={{ width: 80, height: 36, borderRadius: 8 }} />
      </View>

      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: semanticColors.border }} />

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonBlock style={{ width: "55%", height: 14, borderRadius: 4 }} />
          <SkeletonBlock style={{ width: "38%", height: 12, borderRadius: 4 }} />
        </View>
        <SkeletonBlock style={{ width: 88, height: 40, borderRadius: 8 }} />
      </View>
    </View>
  );
}
