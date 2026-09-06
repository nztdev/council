import type { Council, CouncilRequest, User, Vote, VoteChoice } from "@/types";
import type {
  CouncilRepository,
  RequestRepository,
  UserRepository,
  VoteRepository,
} from "./types";
import { hueFromId } from "@/lib/hue";

// Sample data only, for design review - never persisted, resets on
// page reload, never touches Supabase.
export const PREVIEW_USER_ID = "preview-you";

const users: User[] = [
  { id: PREVIEW_USER_ID, name: "You", hue: hueFromId(PREVIEW_USER_ID) },
  { id: "preview-sarah", name: "Sarah", hue: hueFromId("preview-sarah") },
  { id: "preview-alex", name: "Alex", hue: hueFromId("preview-alex") },
  { id: "preview-james", name: "James", hue: hueFromId("preview-james") },
];

const councils: Council[] = [
  {
    id: "preview-council-business",
    name: "Business Council",
    description: "People whose business judgement I trust.",
    ownerId: PREVIEW_USER_ID,
    memberIds: [PREVIEW_USER_ID, "preview-sarah", "preview-alex", "preview-james"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(),
  },
];

const requests: CouncilRequest[] = [
  {
    id: "preview-request-hire",
    councilId: "preview-council-business",
    authorId: "preview-james",
    title: "Should I hire this developer?",
    context:
      "Strong portfolio, slightly over budget, available in two weeks. Team needs help now.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: "preview-request-madrid",
    councilId: "preview-council-business",
    authorId: PREVIEW_USER_ID,
    title: "Should I move the team to Madrid?",
    context:
      "Lower cost of living, better talent pool, but a full relocation for six people.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
  },
];

const votes: Vote[] = [
  {
    id: "preview-vote-1",
    requestId: "preview-request-madrid",
    userId: "preview-sarah",
    choice: "yes",
    comment: "The talent pool argument alone makes this worth it.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
  {
    id: "preview-vote-2",
    requestId: "preview-request-madrid",
    userId: "preview-alex",
    choice: "maybe",
    comment: "Would want to see relocation cost estimates first.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
];

export const userRepository: UserRepository = {
  async list() {
    return users;
  },
  async get(id) {
    return users.find((u) => u.id === id);
  },
};

export const councilRepository: CouncilRepository = {
  async list() {
    return councils;
  },
  async listForUser(userId) {
    return councils.filter((c) => c.memberIds.includes(userId));
  },
  async get(id) {
    return councils.find((c) => c.id === id);
  },
  async create({ name, description, ownerId, memberIds }) {
    const council: Council = {
      id: `preview-council-${Date.now()}`,
      name,
      description,
      ownerId,
      memberIds: Array.from(new Set([ownerId, ...memberIds])),
      createdAt: new Date().toISOString(),
    };
    councils.push(council);
    return council;
  },
  async addMember(councilId, userId) {
    const council = councils.find((c) => c.id === councilId);
    if (council && !council.memberIds.includes(userId)) {
      council.memberIds.push(userId);
    }
    return council;
  },
};

export const requestRepository: RequestRepository = {
  async listForCouncil(councilId) {
    return requests
      .filter((r) => r.councilId === councilId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async listPendingForUser(userId) {
    const myCouncilIds = new Set(
      councils.filter((c) => c.memberIds.includes(userId)).map((c) => c.id)
    );
    const votedIds = new Set(
      votes.filter((v) => v.userId === userId).map((v) => v.requestId)
    );
    return requests
      .filter(
        (r) =>
          myCouncilIds.has(r.councilId) &&
          r.authorId !== userId &&
          !votedIds.has(r.id)
      )
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
  async get(id) {
    return requests.find((r) => r.id === id);
  },
  async create({ councilId, authorId, title, context }) {
    const request: CouncilRequest = {
      id: `preview-request-${Date.now()}`,
      councilId,
      authorId,
      title,
      context,
      createdAt: new Date().toISOString(),
    };
    requests.push(request);
    return request;
  },
};

export const voteRepository: VoteRepository = {
  async listForRequest(requestId) {
    return votes.filter((v) => v.requestId === requestId);
  },
  async getForUserAndRequest(requestId, userId) {
    return votes.find((v) => v.requestId === requestId && v.userId === userId);
  },
  async cast({ requestId, userId, choice, comment }) {
    const existingIdx = votes.findIndex(
      (v) => v.requestId === requestId && v.userId === userId
    );
    const vote: Vote = {
      id: existingIdx >= 0 ? votes[existingIdx].id : `preview-vote-${Date.now()}`,
      requestId,
      userId,
      choice: choice as VoteChoice,
      comment,
      createdAt: new Date().toISOString(),
    };
    if (existingIdx >= 0) votes[existingIdx] = vote;
    else votes.push(vote);
    return vote;
  },
};
