import type { CloseRule, CouncilRequest, Vote } from "@/types";

export interface CloseRuleOption {
  id: CloseRule;
  label: string;
  description: string;
  needsDeadline: boolean;
}

/**
 * Every close rule the app supports, in one place. To add a new one:
 * add an entry here, add a branch in computeRequestStatus() below, and
 * (if it needs new data) a field on CouncilRequest in src/types. No
 * screen needs to change - the new-request form, the status badge, and
 * the "close this" button all read through this file.
 */
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

/**
 * Pure function: given a request and how many members/votes it has,
 * decide whether it's open or closed and why. Nothing here talks to a
 * database - callers pass in whatever counts they already have.
 */
export function computeRequestStatus(
  request: Pick<CouncilRequest, "closeRule" | "deadline" | "closedAt">,
  memberCount: number,
  votes: Vote[],
  now: Date = new Date()
): RequestStatus {
  const voteCount = votes.length;
  const allVoted = memberCount > 0 && voteCount >= memberCount;
  const deadlinePassed = request.deadline ? new Date(request.deadline) <= now : false;

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
    return allVoted
      ? { status: "closed", reason: "Everyone has voted" }
      : { status: "open", reason: `Waiting on ${memberCount - voteCount} more ${memberCount - voteCount === 1 ? "person" : "people"}` };
  }

  // deadline_or_all_members
  if (allVoted) return { status: "closed", reason: "Everyone has voted" };
  if (deadlinePassed) return { status: "closed", reason: "Deadline passed" };
  return {
    status: "open",
    reason: `Open until the deadline or until ${memberCount - voteCount} more ${memberCount - voteCount === 1 ? "person" : "people"} vote${memberCount - voteCount === 1 ? "s" : ""}`,
  };
}