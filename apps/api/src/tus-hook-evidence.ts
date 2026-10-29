/** Pure helpers for tusd hook evidence transitions (unit-tested). */

export const POST_RECEIVE_MUTABLE_STATUSES = ["declared", "uploading"] as const;

export function postReceiveUpdateWhere(evidenceId: string, offset: bigint) {
  return {
    id: evidenceId,
    uploadedBytes: { lte: offset },
    status: { in: [...POST_RECEIVE_MUTABLE_STATUSES] },
  };
}

export function postFinishLengthMatches(
  uploadOffset: number | undefined,
  totalBytes: bigint,
): boolean {
  return BigInt(uploadOffset ?? 0) === BigInt(totalBytes);
}

export function postReceiveShouldMutateStatus(currentStatus: string): boolean {
  return (POST_RECEIVE_MUTABLE_STATUSES as readonly string[]).includes(currentStatus);
}
