import { supabase } from "@/lib/supabase";
import { hueFromId } from "@/lib/hue";
import type { Council, CouncilRequest, Vote, VoteChoice } from "@/types";
import type {
  CouncilRepository,
  RequestRepository,
  UserRepository,
  VoteRepository,
} from "./types";

function mapRequest(row: {
  id: string;
  council_id: string;
  author_id: string;
  title: string;
  context: string;
  created_at: string;
}): CouncilRequest {
  return {
    id: row.id,
    councilId: row.council_id,
    authorId: row.author_id,
    title: row.title,
    context: row.context,
    createdAt: row.created_at,
  };
}

function mapVote(row: {
  id: string;
  request_id: string;
  user_id: string;
  choice: string;
  comment: string | null;
  created_at: string;
}): Vote {
  return {
    id: row.id,
    requestId: row.request_id,
    userId: row.user_id,
    choice: row.choice as VoteChoice,
    comment: row.comment ?? undefined,
    createdAt: row.created_at,
  };
}

export const userRepository: UserRepository = {
  async list() {
    const { data, error } = await supabase.from("profiles").select("id, name");
    if (error) throw new Error(error.message);
    return (data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      hue: hueFromId(p.id),
    }));
  },
  async get(id) {
    const { data } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("id", id)
      .single();
    if (!data) return undefined;
    return { id: data.id, name: data.name, hue: hueFromId(data.id) };
  },
};

async function memberIdsFor(councilId: string): Promise<string[]> {
  const { data } = await supabase
    .from("council_members")
    .select("user_id")
    .eq("council_id", councilId);
  return (data ?? []).map((m) => m.user_id);
}

export const councilRepository: CouncilRepository = {
  async list() {
    // RLS already restricts results to councils the caller belongs to,
    // so list() and listForUser() are equivalent against Supabase.
    const { data, error } = await supabase.from("councils").select("*");
    if (error) throw new Error(error.message);
    const councils = data ?? [];
    return Promise.all(
      councils.map(async (c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        ownerId: c.owner_id,
        memberIds: await memberIdsFor(c.id),
        createdAt: c.created_at,
      }))
    );
  },
  async listForUser() {
    return councilRepository.list();
  },
  async get(id) {
    const { data } = await supabase
      .from("councils")
      .select("*")
      .eq("id", id)
      .single();
    if (!data) return undefined;
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      ownerId: data.owner_id,
      memberIds: await memberIdsFor(data.id),
      createdAt: data.created_at,
    };
  },
  async create({ name, description, ownerId, memberIds }) {
    const { data, error } = await supabase
      .from("councils")
      .insert({ name, description, owner_id: ownerId })
      .select()
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to create council");

    const allMemberIds = Array.from(new Set([ownerId, ...memberIds]));
    const { error: memberError } = await supabase
      .from("council_members")
      .insert(allMemberIds.map((userId) => ({ council_id: data.id, user_id: userId })));
    if (memberError) throw new Error(memberError.message);

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      ownerId: data.owner_id,
      memberIds: allMemberIds,
      createdAt: data.created_at,
    } satisfies Council;
  },
  async addMember(councilId, userId) {
    await supabase
      .from("council_members")
      .insert({ council_id: councilId, user_id: userId });
    return councilRepository.get(councilId);
  },
};

export const requestRepository: RequestRepository = {
  async listForCouncil(councilId) {
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .eq("council_id", councilId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapRequest);
  },
  async listPendingForUser(userId) {
    const { data: memberships } = await supabase
      .from("council_members")
      .select("council_id")
      .eq("user_id", userId);
    const councilIds = (memberships ?? []).map((m) => m.council_id);
    if (councilIds.length === 0) return [];

    const { data: allRequests, error } = await supabase
      .from("requests")
      .select("*")
      .in("council_id", councilIds)
      .neq("author_id", userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const { data: myVotes } = await supabase
      .from("votes")
      .select("request_id")
      .eq("user_id", userId);
    const votedIds = new Set((myVotes ?? []).map((v) => v.request_id));

    return (allRequests ?? [])
      .filter((r) => !votedIds.has(r.id))
      .map(mapRequest);
  },
  async get(id) {
    const { data } = await supabase
      .from("requests")
      .select("*")
      .eq("id", id)
      .single();
    return data ? mapRequest(data) : undefined;
  },
  async create({ councilId, authorId, title, context }) {
    const { data, error } = await supabase
      .from("requests")
      .insert({ council_id: councilId, author_id: authorId, title, context })
      .select()
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to create request");
    return mapRequest(data);
  },
};

export const voteRepository: VoteRepository = {
  async listForRequest(requestId) {
    const { data, error } = await supabase
      .from("votes")
      .select("*")
      .eq("request_id", requestId);
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapVote);
  },
  async getForUserAndRequest(requestId, userId) {
    const { data } = await supabase
      .from("votes")
      .select("*")
      .eq("request_id", requestId)
      .eq("user_id", userId)
      .maybeSingle();
    return data ? mapVote(data) : undefined;
  },
  async cast({ requestId, userId, choice, comment }) {
    const { data, error } = await supabase
      .from("votes")
      .upsert(
        { request_id: requestId, user_id: userId, choice, comment: comment ?? null },
        { onConflict: "request_id,user_id" }
      )
      .select()
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to cast vote");
    return mapVote(data);
  },
};
