/** tus-js-client `done` must mean EOF only after the last byte is read, not when `end >= size`. */
export function tusSliceDone(start: number, bytesRead: number, fileSize: number): boolean {
  return start + bytesRead >= fileSize;
}

/** tus-js-client reads `value.size`, not `Uint8Array.byteLength`. */
export function tusReadableChunk(bytes: Uint8Array): Uint8Array & { size: number } {
  return Object.defineProperty(bytes, "size", {
    value: bytes.byteLength,
    configurable: true,
  }) as Uint8Array & { size: number };
}
