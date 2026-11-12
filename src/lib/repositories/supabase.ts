import { supabase } from "@/lib/supabase";
import { hueFromId } from "@/lib/hue";
import { friendlyError } from "@/lib/errors";
import type {
  AskPolicy,
  CloseRule,
  Council,
  CouncilInvitation,
  CouncilRequest,
  InvitePreview,
  InviteStatus,
  User,
  Vote,
  VoteChoice,
} from "@/types";
import type {
  CircleRepository,
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
  close_rule: string;
  deadline: string | null;
  closed_at: string | null;
}): CouncilRequest {
  return {
    id: row.id,
    councilId: row.council_id,
    authorId: row.author_id,
    title: row.title,
    context: row.context,
    createdAt: row.created_at,
    closeRule: row.close_rule as CloseRule,
    deadline: row.deadline ?? undefined,
    closedAt: row.closed_at ?? undefined,
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

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
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
      .select("id, name, onboarded_at")
      .eq("id", id)
      .single();
    if (!data) return undefined;
    return {
      id: data.id,
      name: data.name,
      hue: hueFromId(data.id),
      onboardedAt: data.onboarded_at ?? undefined,
    };
  },
  async completeOnboarding(userId) {
    const { error } = await supabase
      .from("profiles")
      .update({ onboarded_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) throw new Error(error.message);
  },
};

async function memberIdsFor(councilId: string): Promise<string[]> {
  const { data } = await supabase
    .from("council_members")
    .select("user_id")
    .eq("council_id", councilId);
  return (data ?? []).map((m) => m.user_id);
}

function mapCouncil(row: {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
  is_supreme: boolean;
  ask_policy: string;
}, memberIds: string[]): Council {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    ownerId: row.owner_id,
    memberIds,
    createdAt: row.created_at,
    isSupreme: row.is_supreme,
    askPolicy: row.ask_policy as AskPolicy,
  };
}

export const councilRepository: CouncilRepository = {
  async list() {
    // RLS already restricts results to councils the caller belongs to,
    // so list() and listForUser() are equivalent against Supabase.
    // Supreme council sorts first, then newest first.
    const { data, error } = await supabase
      .from("councils")
      .select("*")
      .order("is_supreme", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const councils = data ?? [];
    return Promise.all(
      councils.map(async (c) => mapCouncil(c, await memberIdsFor(c.id)))
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
    return mapCouncil(data, await memberIdsFor(data.id));
  },
  async create({ name, description, askPolicy }) {
    // One atomic database function creates the council and adds you as its
    // first member (see create_council in supabase/schema.sql).
    const { data, error } = await supabase.rpc("create_council", {
      p_name: name,
      p_description: description,
      p_ask_policy: askPolicy,
    });
    if (error || !data) throw new Error(friendlyError(error));
    const created = await councilRepository.get(data as string);
    if (!created) throw new Error("The council was created but couldn't be loaded.");
    return created;
  },
  async inviteMember(councilId, userId) {
    const { error } = await supabase.rpc("invite_to_council", {
      p_council_id: councilId,
      p_user_id: userId,
    });
    if (error) throw new Error(friendlyError(error));
  },
  async listPendingInvitees(councilId) {
    const { data, error } = await supabase
      .from("council_invitations")
      .select("invited_user")
      .eq("council_id", councilId);
    if (error) throw new Error(friendlyError(error));
    return (data ?? []).map((r) => r.invited_user);
  },
    async listMyInvitations() {
    // Read live from the database (see my_council_invitations in schema.sql)
    // so the council's name and the role you'd have are current.
    const { data, error } = await supabase.rpc("my_council_invitations");
    if (error) throw new Error(friendlyError(error));
    return (data ?? []).map(
      (r: {
        id: string;
        council_id: string;
        council_name: string;
        ask_policy: string;
        is_supreme: boolean;
        inviter_id: string;
        inviter_name: string;
        created_at: string;
      }): CouncilInvitation => ({
        id: r.id,
        councilId: r.council_id,
        councilName: r.council_name,
        inviterId: r.inviter_id,
        inviterName: r.inviter_name,
        isSupreme: r.is_supreme,
        askPolicy: r.ask_policy as AskPolicy,
        createdAt: r.created_at,
      })
    );
  },
  async respondToInvitation(invitationId, accept) {
    const { error } = await supabase.rpc("respond_to_council_invitation", {
      p_invitation_id: invitationId,
      p_accept: accept,
    });
    if (error) throw new Error(friendlyError(error));
  },
    async setAskPolicy(councilId, askPolicy) {
    const { error } = await supabase
      .from("councils")
      .update({ ask_policy: askPolicy })
      .eq("id", councilId);
    if (error) throw new Error(friendlyError(error));
  },
  async leave(councilId) {
    const { error } = await supabase.rpc("leave_council", { p_council_id: councilId });
    if (error) throw new Error(friendlyError(error));
  },
  async rename(councilId, name) {
    // is_supreme councils can be renamed - only deletion is blocked (and
    // there is no delete feature yet at all, so nothing to guard here
    // beyond not exposing one in the UI for is_supreme councils).
    const { data, error } = await supabase
      .from("councils")
      .update({ name })
      .eq("id", councilId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    if (!data) return undefined;
    return mapCouncil(data, await memberIdsFor(data.id));
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
  async create({ councilId, authorId, title, context, closeRule, deadline }) {
    const { data, error } = await supabase
      .from("requests")
      .insert({
        council_id: councilId,
        author_id: authorId,
        title,
        context,
        close_rule: closeRule,
        deadline: deadline ?? null,
      })
      .select()
      .single();
    if (error || !data) throw new Error(friendlyError(error));
    return mapRequest(data);
  },
  async close(id) {
    const { data, error } = await supabase
      .from("requests")
      .update({ closed_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data ? mapRequest(data) : undefined;
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
  async listForUser(userId) {
    const { data, error } = await supabase
      .from("votes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
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

export const circleRepository: CircleRepository = {
  async listMembers() {
    const me = await currentUserId();
    if (!me) return [];
    const { data, error } = await supabase.from("circle_links").select("user_a, user_b");
    if (error) throw new Error(friendlyError(error));
    const otherIds = (data ?? []).map((l) => (l.user_a === me ? l.user_b : l.user_a));
    if (otherIds.length === 0) return [];
    const { data: profiles, error: pError } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", otherIds);
    if (pError) throw new Error(friendlyError(pError));
    return (profiles ?? [])
      .map((p): User => ({ id: p.id, name: p.name, hue: hueFromId(p.id) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
  async createInvite(opts) {
    const { data, error } = await supabase.rpc("create_invite", {
      p_council_id: opts?.councilId ?? null,
    });
    if (error || !data) throw new Error(friendlyError(error));
    return data as string;
  },
  async previewInvite(code) {
    const { data, error } = await supabase.rpc("preview_invite", { p_code: code });
    if (error) throw new Error(friendlyError(error));
    const row = (data ?? [])[0] as
      | {
          status: string;
          inviter_name: string | null;
          council_name: string | null;
          ask_policy: string | null;
        }
      | undefined;
    if (!row) return { status: "invalid" };
    return {
      status: row.status as InviteStatus,
      inviterName: row.inviter_name ?? undefined,
      councilName: row.council_name ?? undefined,
      askPolicy: (row.ask_policy as AskPolicy | null) ?? undefined,
    } satisfies InvitePreview;
  },
  async redeemInvite(code) {
    const { data, error } = await supabase.rpc("redeem_invite", { p_code: code });
    if (error) throw new Error(friendlyError(error));
    const result = data as { council_id: string | null } | null;
    return { councilId: result?.council_id ?? undefined };
  },
  async remove(userId) {
    const { error } = await supabase.rpc("remove_from_circle", { p_user_id: userId });
    if (error) throw new Error(friendlyError(error));
  },
};