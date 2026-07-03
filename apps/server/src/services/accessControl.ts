import { repos } from "../repositories";
import { ResourceType, Role } from "../domain/types";

const ROLE_RANK: Record<Role, number> = { viewer: 1, editor: 2, owner: 3 };

export function roleAtLeast(role: Role, min: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

/** Resolve resource -> ancestor chain, e.g. space -> [space, area, building]. Throws if resource doesn't exist. */
export function resolveChain(resourceType: ResourceType, resourceId: string): { resourceType: ResourceType; resourceId: string }[] {
  if (resourceType === "building") {
    const building = repos.buildings.findById(resourceId);
    if (!building) throw new NotFoundError("building");
    return [{ resourceType: "building", resourceId }];
  }
  if (resourceType === "area") {
    const area = repos.areas.findById(resourceId);
    if (!area) throw new NotFoundError("area");
    return [{ resourceType: "area", resourceId }, ...resolveChain("building", area.buildingId)];
  }
  const space = repos.spaces.findById(resourceId);
  if (!space) throw new NotFoundError("space");
  return [{ resourceType: "space", resourceId }, ...resolveChain("area", space.areaId)];
}

export class NotFoundError extends Error {
  constructor(public resource: string) {
    super(`${resource} not found`);
  }
}

/** Highest role the user holds anywhere in the resource's ancestor chain, or null if no access. */
export function effectiveRole(userId: string, resourceType: ResourceType, resourceId: string): Role | null {
  const chain = resolveChain(resourceType, resourceId);
  const memberships = repos.memberships.listForUserOnChain(userId, chain);
  if (memberships.length === 0) return null;
  return memberships.reduce<Role>((best, m) => (roleAtLeast(m.role, best) ? m.role : best), "viewer");
}

export function hasRole(userId: string, resourceType: ResourceType, resourceId: string, min: Role): boolean {
  const role = effectiveRole(userId, resourceType, resourceId);
  return role !== null && roleAtLeast(role, min);
}
