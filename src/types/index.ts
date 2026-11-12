export type VoteChoice = "yes" | "maybe" | "no";

/** Who may post questions in a council: only its owner (everyone else is an
 * advisor), or any member. A Supreme Council is always "owner". */
export type AskPolicy = "owner" | "members";

/**
 * How a request decides it's "closed" (no more votes accepted). New
 * rules go in this union plus src/lib/close-rules.ts - nothing else in
 * the app needs to change to add one, since every screen reads status
 * through that one file rather than checking rule fields itself.
 */
export type CloseRule = "manual" | "deadline" | "all_members" | "deadline_or_all_members";

export interface User {
  id: string;
  name: string;
  /** hue used to render this user's "seal" avatar consistently */
  hue: number;
  /** unset until onboarding is completed (or skipped) */
  onboardedAt?: string;
}

export interface Council {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  createdAt: string;
    /** every user's permanent first council - renamable, never deletable */
  isSupreme: boolean;
  askPolicy: AskPolicy;
}

export interface CouncilRequest {
  id: string;
  councilId: string;
  authorId: string;
  title: string;
  context: string;
  createdAt: string;
  closeRule: CloseRule;
  /** used by "deadline" and "deadline_or_all_members" */
  deadline?: string;
  /** set only when the author manually closes a "manual"-rule request */
  closedAt?: string;
}

export interface Vote {
  id: string;
  requestId: string;
  userId: string;
  choice: VoteChoice;
  comment?: string;
  createdAt: string;
}

export interface RequestWithMeta extends CouncilRequest {
  council: Council;
  /** the council's owner (needed to say whose council this is) */
  owner: User;
  author: User;
  votes: Vote[];
}

/** A council owner's pending invitation to someone in their Circle. */
export interface CouncilInvitation {
  id: string;
  councilId: string;
  councilName: string;
  inviterId: string;
  inviterName: string;
  isSupreme: boolean;
  /** the role you'd have: advisor ("owner") or member who can ask ("members") */
  askPolicy: AskPolicy;
  createdAt: string;
}

/** What opening an invite link would do (see preview_invite in schema.sql). */
export type InviteStatus =
  | "ok"
  | "already"
  | "invalid"
  | "own"
  | "revoked"
  | "expired"
  | "used";

export interface InvitePreview {
  status: InviteStatus;
  inviterName?: string;
    /** set when the link also adds you to a specific council */
  councilName?: string;
  askPolicy?: AskPolicy;
}