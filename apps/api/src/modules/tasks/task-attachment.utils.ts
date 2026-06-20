export function isMissingUploadFile(
  file: { buffer?: Buffer } | null | undefined,
): boolean {
  return !file || !file.buffer;
}
