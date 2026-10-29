import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, Text, View } from "react-native";

import { isRTL } from "../../i18n/rtl";
import {
  getWorkerEvidenceLocalUri,
  openWorkerDocument,
  type TrackedComplaint,
} from "../../services/workerApi";
import { useLocaleStore } from "../../stores/localeStore";
import { fontFamily, mobileType, semanticColors } from "../../theme/tokens";

function isPhotoEvidence(evidence: TrackedComplaint["evidence"][number]) {
  return (
    evidence.kind === "photo" ||
    (evidence.kind === "document" && (evidence.mimeType?.toLowerCase().startsWith("image/") ?? false))
  );
}

function PhotoTile({
  draftId,
  evidence,
}: {
  draftId: string;
  evidence: TrackedComplaint["evidence"][number];
}) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const source = useQuery({
    queryKey: ["worker-evidence", draftId, evidence.id],
    queryFn: () =>
      getWorkerEvidenceLocalUri(draftId, evidence.id, {
        mimeType: evidence.mimeType,
        kind: evidence.kind,
      }),
    enabled: isPhotoEvidence(evidence),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={evidence.originalName}
        onPress={() => {
          if (source.data) setViewerOpen(true);
        }}
        style={{
          width: "31.5%",
          aspectRatio: 1,
          borderRadius: 8,
          overflow: "hidden",
          backgroundColor: semanticColors.surfaceMuted,
          borderWidth: 1,
          borderColor: semanticColors.border,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {source.data ? (
          <Image source={{ uri: source.data.uri }} resizeMode="cover" style={{ width: "100%", height: "100%" }} />
        ) : source.isError ? (
          <Ionicons name="image-outline" size={28} color={semanticColors.textSecondary} />
        ) : (
          <ActivityIndicator color={semanticColors.actionPrimary} />
        )}
      </Pressable>
      {source.data ? (
        <Modal visible={viewerOpen} transparent animationType="fade" onRequestClose={() => setViewerOpen(false)}>
          <Pressable
            onPress={() => setViewerOpen(false)}
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.92)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image source={{ uri: source.data.uri }} resizeMode="contain" style={{ width: "100%", height: "90%" }} />
            <Ionicons name="close-circle" size={42} color="#FFFFFF" />
          </Pressable>
        </Modal>
      ) : null}
    </>
  );
}

function DocumentTile({
  draftId,
  evidence,
  rtl,
}: {
  draftId: string;
  evidence: TrackedComplaint["evidence"][number];
  rtl: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        void openWorkerDocument(draftId, evidence.id, evidence.originalName);
      }}
      style={{
        width: "100%",
        flexDirection: rtl ? "row-reverse" : "row",
        alignItems: "center",
        gap: 10,
        padding: 12,
        borderRadius: 8,
        backgroundColor: semanticColors.surface,
        borderWidth: 1,
        borderColor: semanticColors.border,
      }}
    >
      <Ionicons name="document-text-outline" size={22} color={semanticColors.voiceActiveStrong} />
      <Text
        numberOfLines={2}
        style={{
          flex: 1,
          color: semanticColors.textPrimary,
          fontSize: mobileType.caption.size,
          lineHeight: mobileType.caption.line,
          fontFamily: fontFamily.ui,
          textAlign: "left",
          writingDirection: "ltr",
        }}
      >
        {evidence.originalName}
      </Text>
      <Ionicons name="open-outline" size={20} color={semanticColors.actionPrimary} />
    </Pressable>
  );
}

export function EvidenceGrid({
  draftId,
  items,
}: {
  draftId: string;
  items: TrackedComplaint["evidence"];
}) {
  const locale = useLocaleStore((s) => s.locale);
  const rtl = isRTL(locale);
  const photos = items.filter((item) => isPhotoEvidence(item));
  const documents = items.filter((item) => item.kind === "document" && !isPhotoEvidence(item));

  return (
    <View style={{ gap: 10 }}>
      {photos.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {photos.map((item) => (
            <PhotoTile key={item.id} draftId={draftId} evidence={item} />
          ))}
        </View>
      ) : null}
      {documents.map((item) => (
        <DocumentTile key={item.id} draftId={draftId} evidence={item} rtl={rtl} />
      ))}
    </View>
  );
}
