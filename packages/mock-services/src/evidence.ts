import type { LocalEvidence } from "@kapas/domain";

export const evidenceService = {
  async pickPhoto(): Promise<LocalEvidence | null> {
    return {
      id: `photo-${Date.now()}`,
      localUri: "asset://demo-evidence/field.png",
      fileName: "field-demo.png",
      mimeType: "image/png",
    };
  },
  async pickDocument(): Promise<LocalEvidence | null> {
    return {
      id: `doc-${Date.now()}`,
      localUri: "asset://demo-evidence/note.pdf",
      fileName: "note-demo.pdf",
      mimeType: "application/pdf",
    };
  },
  async removeEvidence(_id: string): Promise<void> {
    return;
  },
};
