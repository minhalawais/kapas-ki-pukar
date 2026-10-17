import type { Evidence, LocalEvidence } from "@kapas/domain";
import { evidenceService } from "@kapas/mock-services";

function toEvidence(item: LocalEvidence, kind: Evidence["kind"]): Evidence {
  return {
    id: item.id,
    kind,
    localUri: item.localUri,
    fileName: item.fileName,
    mimeType: item.mimeType,
    capturedAt: new Date().toISOString(),
  };
}

async function pickWithExpo(
  kind: Evidence["kind"],
): Promise<Evidence | null> {
  try {
    if (kind === "photo") {
      const ImagePicker = (await import("expo-image-picker")) as {
        requestMediaLibraryPermissionsAsync: () => Promise<{ granted: boolean }>;
        launchImageLibraryAsync: (options: { mediaTypes: string[] }) => Promise<{
          canceled?: boolean;
          assets?: { uri: string; fileName?: string | null; mimeType?: string | null }[];
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
      return {
        id: `photo-${Date.now()}`,
        kind: "photo",
        localUri: asset.uri,
        fileName: asset.fileName ?? "photo.jpg",
        mimeType: asset.mimeType ?? "image/jpeg",
        capturedAt: new Date().toISOString(),
      };
    }
    const DocumentPicker = (await import("expo-document-picker")) as {
      getDocumentAsync: () => Promise<{
        canceled?: boolean;
        assets?: { uri: string; name?: string; mimeType?: string }[];
      }>;
    };
    const result = await DocumentPicker.getDocumentAsync();
    const asset = result.canceled ? undefined : result.assets?.[0];
    if (!asset) {
      return null;
    }
    return {
      id: `doc-${Date.now()}`,
      kind: "document",
      localUri: asset.uri,
      fileName: asset.name ?? "document.pdf",
      mimeType: asset.mimeType ?? "application/pdf",
      capturedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof Error && error.message === "denied") {
      throw error;
    }
    const fallback = kind === "photo" ? await evidenceService.pickPhoto() : await evidenceService.pickDocument();
    return fallback ? toEvidence(fallback, kind) : null;
  }
}

export const expoEvidenceService = {
  async pickPhoto(): Promise<Evidence | null> {
    return pickWithExpo("photo");
  },
  async pickDocument(): Promise<Evidence | null> {
    return pickWithExpo("document");
  },
};
