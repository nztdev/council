import {
  councilRepository,
  requestRepository,
  userRepository,
  voteRepository,
} from "@/lib/repositories";
import type { CouncilRequest, RequestWithMeta } from "@/types";

export async function hydrateRequest(
  request: CouncilRequest
): Promise<RequestWithMeta | null> {
  const [council, author, votes] = await Promise.all([
    councilRepository.get(request.councilId),
    userRepository.get(request.authorId),
    voteRepository.listForRequest(request.id),
  ]);
  if (!council || !author) return null;
  return { ...request, council, author, votes };
}

export async function hydrateRequests(
  requests: CouncilRequest[]
): Promise<RequestWithMeta[]> {
  const hydrated = await Promise.all(requests.map(hydrateRequest));
  return hydrated.filter((r): r is RequestWithMeta => r !== null);
}

export { requestRepository };
