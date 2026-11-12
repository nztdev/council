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
  if (!council) return null;
  const owner = (await userRepository.get(council.ownerId)) ?? {
    id: council.ownerId,
    name: "Former member",
    hue: 0,
  };
  // The author may no longer be visible to us (e.g. removed from our
  // Circle). Show their question anyway, under a neutral name.
  const shownAuthor = author ?? {
    id: request.authorId,
    name: "Former member",
    hue: 0,
  };
  return { ...request, council, owner, author: shownAuthor, votes };
}

export async function hydrateRequests(
  requests: CouncilRequest[]
): Promise<RequestWithMeta[]> {
  const hydrated = await Promise.all(requests.map(hydrateRequest));
  return hydrated.filter((r): r is RequestWithMeta => r !== null);
}

export { requestRepository };