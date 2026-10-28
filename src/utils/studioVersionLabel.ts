const versionNames: Record<string, string> = { generation: 'Original thumbnail', edit: 'Edited thumbnail', overlay: 'Text edit', import: 'Imported thumbnail' };

/** The saved label never changes when newer versions arrive or history is paginated. */
export function studioVersionLabel(version: { id: string; kind?: string; createdAt?: string }): string {
  const label = versionNames[version.kind || ''];
  if (label) {
    const date = version.createdAt ? new Date(version.createdAt) : null;
    return date && Number.isFinite(date.getTime())
      ? `${label} · ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
      : label;
  }
  return `Version ${/^[0-9a-f]{8}-/i.test(version.id) ? version.id.slice(0, 8) : version.id}`;
}
