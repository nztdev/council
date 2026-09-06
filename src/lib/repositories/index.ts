// Active data source for the whole app. This currently points at the
// Supabase-backed implementation (./supabase.ts). To move to a different
// backend later, implement UserRepository/CouncilRepository/
// RequestRepository/VoteRepository (see ./types.ts) and change only
// the imports below - no UI code needs to change.
//
// Preview mode (see ../preview.ts) is the one exception: every method
// checks it at call time and routes to ./mock.ts instead, so someone
// can look at the UI with sample data without a real Supabase account.
// This wrapping is the only preview-specific code outside of
// mock.ts/preview.ts - screens never need to know which source they're
// reading from either way.
import { isPreviewMode } from "@/lib/preview";
import * as live from "./supabase";
import * as preview from "./mock";
import type {
  CouncilRepository,
  RequestRepository,
  UserRepository,
  VoteRepository,
} from "./types";

export const userRepository: UserRepository = {
  list: (...args) => (isPreviewMode() ? preview : live).userRepository.list(...args),
  get: (...args) => (isPreviewMode() ? preview : live).userRepository.get(...args),
};

export const councilRepository: CouncilRepository = {
  list: (...args) => (isPreviewMode() ? preview : live).councilRepository.list(...args),
  listForUser: (...args) =>
    (isPreviewMode() ? preview : live).councilRepository.listForUser(...args),
  get: (...args) => (isPreviewMode() ? preview : live).councilRepository.get(...args),
  create: (...args) =>
    (isPreviewMode() ? preview : live).councilRepository.create(...args),
  addMember: (...args) =>
    (isPreviewMode() ? preview : live).councilRepository.addMember(...args),
};

export const requestRepository: RequestRepository = {
  listForCouncil: (...args) =>
    (isPreviewMode() ? preview : live).requestRepository.listForCouncil(...args),
  listPendingForUser: (...args) =>
    (isPreviewMode() ? preview : live).requestRepository.listPendingForUser(...args),
  get: (...args) => (isPreviewMode() ? preview : live).requestRepository.get(...args),
  create: (...args) =>
    (isPreviewMode() ? preview : live).requestRepository.create(...args),
};

export const voteRepository: VoteRepository = {
  listForRequest: (...args) =>
    (isPreviewMode() ? preview : live).voteRepository.listForRequest(...args),
  getForUserAndRequest: (...args) =>
    (isPreviewMode() ? preview : live).voteRepository.getForUserAndRequest(...args),
  cast: (...args) => (isPreviewMode() ? preview : live).voteRepository.cast(...args),
};
