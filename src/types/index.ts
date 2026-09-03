export type VoteChoice = "yes" | "maybe" | "no";

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
  deadline?: string;
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
