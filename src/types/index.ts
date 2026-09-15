export type VoteChoice = "yes" | "maybe" | "no";

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
}

export interface Council {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  createdAt: string;
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
  author: User;
  votes: Vote[];
}