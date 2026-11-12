import type { Council, User } from "@/types";

// How a council is named and described depending on WHO is looking at it.
// Every Supreme Council is called "Supreme Council" by default, so someone
// else's must say whose it is.

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

/** The council's name as this viewer should see it. */
export function councilLabel(
  council: Council,
  owner: User | undefined,
  meId: string | undefined
): string {
  if (!owner || owner.id === meId) return council.name;
  return council.isSupreme ? `${firstName(owner.name)}'s ${council.name}` : council.name;
}

export type Role = "owner" | "advisor" | "member";

/** Owner, or - in someone else's council - advisor (only the owner asks)
 * or member (anyone may ask). */
export function roleIn(council: Council, meId: string | undefined): Role {
  if (council.ownerId === meId) return "owner";
  return council.askPolicy === "owner" ? "advisor" : "member";
}

export const ROLE_LABEL: Record<Role, string> = {
  owner: "Owner",
  advisor: "Advisor",
  member: "Member",
};

export function canAskIn(council: Council, meId: string | undefined): boolean {
  return council.ownerId === meId || council.askPolicy === "members";
}