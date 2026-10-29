import { File } from "expo-file-system";

import { tusReadableChunk, tusSliceDone } from "./tusSliceLogic";

export const expoTusFileReader = {
  async openFile(input: unknown) {
    const uri = (input as { uri: string }).uri;
    const file = new File(uri);
    const fileSize = file.size;
    return {
      size: fileSize,
      async slice(start: number, end: number) {
        const boundedEnd = Math.min(end, fileSize);
        const length = boundedEnd - start;
        if (length <= 0) {
          return { value: new Uint8Array(0), done: start >= fileSize };
        }
        const handle = file.open();
        try {
          handle.offset = start;
          const value = tusReadableChunk(handle.readBytes(length));
          return { value, done: tusSliceDone(start, value.byteLength, fileSize) };
        } finally {
          handle.close();
        }
      },
      close() {
        /* slices close their own handles */
      },
    };
  },
};
