import type { Council, CouncilRequest, User, Vote } from "@/types";

/**
 * These interfaces are the seam between the app and its data source.
 * `supabase.ts` implements them against a real Supabase project (see
 * `supabase/schema.sql` for the tables and access rules). Every screen
 * imports from `repositories/index.ts`, never from `supabase.ts`
 * directly - so moving to a different backend later means writing one
 * new file that satisfies these same interfaces and changing the
 * exports in `repositories/index.ts`. Nothing else should need to change.
 */

export interface UserRepository {
  list(): Promise<User[]>;
  get(id: string): Promise<User | undefined>;
}

export interface CouncilRepository {
  list(): Promise<Council[]>;
  listForUser(userId: string): Promise<Council[]>;
  get(id: string): Promise<Council | undefined>;
  create(input: {
    name: string;
    description: string;
    ownerId: string;
    memberIds: string[];
  }): Promise<Council>;
  addMember(councilId: string, userId: string): Promise<Council | undefined>;
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
    deadline?: string;
  }): Promise<CouncilRequest>;
}

export interface VoteRepository {
  listForRequest(requestId: string): Promise<Vote[]>;
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
