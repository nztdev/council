// The database reports failures as short codes (see schema.sql). This turns
// them into sentences a person can act on.
const MESSAGES: Record<string, string> = {
  invite_invalid: "This invite link isn't valid.",
  invite_own: "That's your own invite link. Send it to someone else.",
  invite_revoked: "This invite link was cancelled.",
  invite_expired: "This invite link has expired. Ask for a new one.",
  invite_used: "This invite link has already been used. Ask for a new one.",
  invite_already: "You're already connected with this person.",
  not_council_owner: "Only the person who owns a council can do that.",
  not_in_circle: "That person isn't in your Circle yet.",
  already_member: "They're already in this council.",
  owner_cannot_leave: "You own this council, so you can't leave it.",
  too_many_invites:
    "You have a lot of unused invite links. Use or let some expire first.",
  name_required: "Please give it a name.",
  not_signed_in: "Please sign in again.",
  invitation_not_found: "That invitation is no longer available.",
};

export function friendlyError(error: { message?: string } | null | undefined): string {
  const raw = error?.message ?? "";
  return MESSAGES[raw] ?? (raw || "Something went wrong. Please try again.");
}