export function getDocumentId(type: string, sourceId: string): string {
  return `${type}-${sourceId}`
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
