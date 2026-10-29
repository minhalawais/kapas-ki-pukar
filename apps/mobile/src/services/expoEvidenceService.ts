import type { Evidence } from "@kapas/domain";
import { randomUUID } from "expo-crypto";
import { File } from "expo-file-system";

import type { SyncMediaReplacement, SyncQueueItem } from "./productionSyncService";

async function pickWithExpo(kind: Evidence["kind"]): Promise<Evidence | null> {
  try {
    if (kind === "photo") {
      const ImagePicker = (await import("expo-image-picker")) as {
        requestMediaLibraryPermissionsAsync: () => Promise<{ granted: boolean }>;
        launchImageLibraryAsync: (options: { mediaTypes: string[] }) => Promise<{
          canceled?: boolean;
          assets?: { uri: string; fileName?: string | null; mimeType?: string | null; fileSize?: number | null }[];
        }>;
      };
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        throw new Error("denied");
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"] });
      const asset = result.canceled ? undefined : result.assets?.[0];
      if (!asset) {
        return null;
      }
      let uri = asset.uri;
      let mimeType = asset.mimeType?.toLowerCase() ?? "image/jpeg";
      let fileName = asset.fileName ?? "photo.jpg";
      if (!["image/jpeg", "image/png"].includes(mimeType)) {
        const ImageManipulator = await import("expo-image-manipulator");
        const converted = await ImageManipulator.manipulateAsync(uri, [], {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
        });
        uri = converted.uri;
        mimeType = "image/jpeg";
        fileName = fileName.replace(/\.[^.]+$/u, "") + ".jpg";
      }
      return {
        id: randomUUID(),
        kind: "photo",
        localUri: uri,
        fileName,
        mimeType,
        byteLength: new File(uri).size,
        capturedAt: new Date().toISOString(),
      };
    }
    // Use the native Expo FileSystem picker for documents. DocumentPicker's
    // copyToCacheDirectory URI is not consistently readable from Expo Go after
    // the picker activity returns (Android providers may revoke its permission),
    // which made an otherwise valid Downloads file fail during durable queueing.
    const picked = await pickWithNativeFilePicker("document");
    if (!picked) return null;
    return {
      id: randomUUID(),
      kind: "document",
      localUri: picked.uri,
      fileName: picked.originalName,
      mimeType: picked.mimeType,
      byteLength: picked.byteLength,
      capturedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof Error && error.message === "denied") throw Object.assign(error, { code: "permission_denied" });
    throw error;
  }
}

async function pickWithNativeFilePicker(
  kind: "voice" | "document",
): Promise<SyncMediaReplacement | null> {
  const FileSystem = await import("expo-file-system");
  const result = await FileSystem.File.pickFileAsync({
    mimeTypes: kind === "document" ? ["application/pdf"] : ["audio/*"],
  });
  if (result.canceled || !result.result) return null;
  const file = result.result;
  return {
    uri: file.uri,
    originalName: file.name || (kind === "document" ? "document.pdf" : "voice-statement.m4a"),
    mimeType: kind === "document" ? "application/pdf" : "audio/mp4",
    byteLength: file.size,
    ...(kind === "voice" ? { recordedAt: new Date().toISOString() } : { capturedAt: new Date().toISOString() }),
  };
}

export const expoEvidenceService = {
  async pickPhoto(): Promise<Evidence | null> {
    return pickWithExpo("photo");
  },
  async pickDocument(): Promise<Evidence | null> {
    return pickWithExpo("document");
  },
  async pickReplacement(kind: SyncQueueItem["media"][number]["kind"]): Promise<SyncMediaReplacement | null> {
    if (kind === "photo" || kind === "document") {
      if (kind === "document") {
        return pickWithNativeFilePicker("document");
      }
      const evidence = await pickWithExpo(kind);
      return evidence
        ? {
            uri: evidence.localUri,
            originalName: evidence.fileName,
            mimeType: evidence.mimeType,
            capturedAt: evidence.capturedAt,
          }
        : null;
    }
    return pickWithNativeFilePicker("voice");
  },
};
