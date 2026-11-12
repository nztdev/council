import type { CloseRule, CouncilRequest, Vote } from "@/types";

export interface CloseRuleOption {
  id: CloseRule;
  label: string;
  description: string;
  needsDeadline: boolean;
}

export const CLOSE_RULE_OPTIONS: CloseRuleOption[] = [
  {
    id: "manual",
    label: "I'll close it myself",
    description: "Stays open until you close it from the request page.",
    needsDeadline: false,
  },
  {
    id: "deadline",
    label: "Close by a deadline",
    description: "Automatically closes at the date/time you set.",
    needsDeadline: true,
  },
  {
    id: "all_members",
    label: "Close once everyone's voted",
    description: "Automatically closes as soon as every council member has responded.",
    needsDeadline: false,
  },
  {
    id: "deadline_or_all_members",
    label: "Whichever comes first",
    description: "Closes at the deadline, or once everyone's voted - whichever happens first.",
    needsDeadline: true,
  },
];

export function closeRuleLabel(rule: CloseRule): string {
  return CLOSE_RULE_OPTIONS.find((o) => o.id === rule)?.label ?? rule;
}

export interface RequestStatus {
  status: "open" | "closed";
  reason: string;
}

export function computeRequestStatus(
  request: Pick<CouncilRequest, "closeRule" | "deadline" | "closedAt" | "authorId">,
  memberCount: number,
  votes: Vote[],
  now: Date = new Date()
): RequestStatus {
  // The person who asked doesn't vote on their own question (the database
  // refuses it), so they don't count towards "everyone has voted".
  const eligible = Math.max(memberCount - 1, 0);
  const voteCount = votes.filter((v) => v.userId !== request.authorId).length;
  const remaining = Math.max(eligible - voteCount, 0);
  const allVoted = eligible > 0 && voteCount >= eligible;
  const deadlinePassed = request.deadline ? new Date(request.deadline) <= now : false;
  const people = remaining === 1 ? "person" : "people";

  if (request.closeRule === "manual") {
    return request.closedAt
      ? { status: "closed", reason: "Closed by the person who asked" }
      : { status: "open", reason: "Open until closed by the person who asked" };
  }

  if (request.closeRule === "deadline") {
    return deadlinePassed
      ? { status: "closed", reason: "Deadline passed" }
      : { status: "open", reason: "Open until the deadline" };
  }

  if (request.closeRule === "all_members") {
    if (allVoted) return { status: "closed", reason: "Everyone has voted" };
    if (eligible === 0) {
      return { status: "open", reason: "Waiting for people to join this council" };
    }
    return { status: "open", reason: `Waiting on ${remaining} more ${people}` };
  }

  // deadline_or_all_members
  if (allVoted) return { status: "closed", reason: "Everyone has voted" };
  if (deadlinePassed) return { status: "closed", reason: "Deadline passed" };
  if (eligible === 0) return { status: "open", reason: "Open until the deadline" };
  return {
    status: "open",
    reason: `Open until the deadline or until ${remaining} more ${people} vote${remaining === 1 ? "s" : ""}`,
  };
}