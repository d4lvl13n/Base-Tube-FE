/** The saved identity never changes when newer versions arrive or history is paginated. */
export function studioVersionLabel(version: { id: string }): string {
  return `Version ${/^[0-9a-f]{8}-/i.test(version.id) ? version.id.slice(0, 8) : version.id}`;
}
