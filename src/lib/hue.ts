/** Deterministically derives a stable hue (0-359) from a user id, so each
 * person's "seal" avatar color is consistent without storing it in the DB. */
export function hueFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}
