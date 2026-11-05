import type {
  CloseRule,
  Council,
  CouncilInvitation,
  CouncilRequest,
  InvitePreview,
  User,
  Vote,
} from "@/types";

/**
 * These interfaces are the seam between the app and its data source.
 * `supabase.ts` implements them against a real Supabase project (see
 * `supabase/schema.sql` for the tables, functions and access rules). Every
 * screen imports from `repositories/index.ts`, never from `supabase.ts`
 * directly - so moving to a different backend later means writing one
 * new file that satisfies these same interfaces and changing the
 * exports in `repositories/index.ts`. Nothing else should need to change.
 */

export interface UserRepository {
  /** People the signed-in user is allowed to see: themselves, their Circle,
   * and anyone they share a council with. There is no global directory. */
  list(): Promise<User[]>;
  get(id: string): Promise<User | undefined>;
  /** Marks onboarding as complete (or explicitly skipped) for this user. */
  completeOnboarding(userId: string): Promise<void>;
}

export interface CouncilRepository {
  list(): Promise<Council[]>;
  listForUser(userId: string): Promise<Council[]>;
  get(id: string): Promise<Council | undefined>;
  /** Creates a council you own, with you as its first member. Other people
   * join by accepting an invitation (inviteMember) or an invite link. */
  create(input: { name: string; description: string }): Promise<Council>;
  rename(councilId: string, name: string): Promise<Council | undefined>;
  /** Owner invites someone already in their Circle; they accept or decline. */
  inviteMember(councilId: string, userId: string): Promise<void>;
  /** Ids of people the owner has invited who haven't answered yet. */
  listPendingInvitees(councilId: string): Promise<string[]>;
  /** Invitations waiting for the signed-in user to answer. */
  listMyInvitations(): Promise<CouncilInvitation[]>;
  respondToInvitation(invitationId: string, accept: boolean): Promise<void>;
  /** Leave a council you don't own. */
  leave(councilId: string): Promise<void>;
}

export interface CircleRepository {
  /** Everyone in the signed-in user's Circle. */
  listMembers(): Promise<User[]>;
  /** Makes an invite link and returns its secret code. With councilId (a
   * council you own), whoever opens it also joins that council. */
  createInvite(opts?: { councilId?: string }): Promise<string>;
  previewInvite(code: string): Promise<InvitePreview>;
  redeemInvite(code: string): Promise<{ councilId?: string }>;
  /** Severs the connection both ways, including council memberships. */
  remove(userId: string): Promise<void>;
}

export interface RequestRepository {
  listForCouncil(councilId: string): Promise<CouncilRequest[]>;
  listPendingForUser(userId: string): Promise<CouncilRequest[]>;
  get(id: string): Promise<CouncilRequest | undefined>;
  create(input: {
    councilId: string;
    authorId: string;
    title: string;
    context: string;
    closeRule: CloseRule;
    deadline?: string;
  }): Promise<CouncilRequest>;
  /** Only meaningful for closeRule "manual" - other rules close themselves
   * based on computeRequestStatus() and never need this called. */
  close(id: string): Promise<CouncilRequest | undefined>;
}

export interface VoteRepository {
  listForRequest(requestId: string): Promise<Vote[]>;
  listForUser(userId: string): Promise<Vote[]>;
  getForUserAndRequest(
    requestId: string,
    userId: string
  ): Promise<Vote | undefined>;
  cast(input: {
    requestId: string;
    userId: string;
    choice: Vote["choice"];
    comment?: string;
  }): Promise<Vote>;
}