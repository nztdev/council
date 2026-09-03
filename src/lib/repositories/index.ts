// Active data source for the whole app. This currently points at the
// Supabase-backed implementation (./supabase.ts). To move to a different
// backend later, implement UserRepository/CouncilRepository/
// RequestRepository/VoteRepository (see ./types.ts) and change only
// these four lines - no UI code needs to change.
export {
  userRepository,
  councilRepository,
  requestRepository,
  voteRepository,
} from "./supabase";
