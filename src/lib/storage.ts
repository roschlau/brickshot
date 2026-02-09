export function displayFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  const kb = bytes / 1024
  if (kb < 1024) {
    return `${kb.toFixed(2)} KiB`
  }
  const mb = kb / 1024
  return `${mb.toFixed(2)} MiB`
}
