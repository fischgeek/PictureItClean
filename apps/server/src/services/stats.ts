import { db } from "../db";
import { Building } from "../domain/types";
import { repos } from "../repositories";

const DAY_MS = 24 * 60 * 60 * 1000;

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function tomorrowIso(): string {
  return new Date(Date.now() + DAY_MS).toISOString().slice(0, 10);
}

function daysSince(dateIso: string | undefined | null, now: number): number | null {
  if (!dateIso) return null;
  return (now - new Date(dateIso).getTime()) / DAY_MS;
}

export function isCompliant(frequencyDays: number, lastVerifiedAt: string | undefined | null, now = Date.now()): boolean {
  const d = daysSince(lastVerifiedAt, now);
  return d !== null && d <= frequencyDays;
}

/** Note: this reporting layer queries SQLite directly rather than through the repository
 * interfaces -- it's inherently cross-cutting/SQL-shaped and unlikely to map cleanly onto a
 * future Jira/Trello-backed edition regardless, so there's little value abstracting it. */
export function latestVerifiedMap(spaceIds: string[]): Map<string, string> {
  if (spaceIds.length === 0) return new Map();
  const placeholders = spaceIds.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT space_id as spaceId, MAX(completed_at) as last FROM verification_events
       WHERE space_id IN (${placeholders}) GROUP BY space_id`
    )
    .all(...spaceIds) as { spaceId: string; last: string }[];
  return new Map(rows.map((r) => [r.spaceId, r.last]));
}

export interface SpaceRollup {
  spaceId: string;
  spaceName: string;
  areaId: string;
  areaName: string;
  buildingId: string;
  buildingName: string;
  frequencyDays: number;
  lastVerifiedAt: string | null;
  daysOverdue: number | null;
  compliant: boolean;
}

export interface AreaRollup {
  id: string;
  name: string;
  buildingId: string;
  percent: number | null;
  spaces: SpaceRollup[];
}

export interface BuildingRollup {
  id: string;
  name: string;
  percent: number | null;
  areas: AreaRollup[];
}

/** Space compliance rolled up to area (avg of its spaces) then building (avg of its areas). */
export function buildFullRollup(buildings: Building[]): BuildingRollup[] {
  const now = Date.now();

  const perBuilding = buildings.map((building) => {
    const areas = repos.areas.listByBuilding(building.id);
    const entries = areas.map((area) => ({ area, spaces: repos.spaces.listByArea(area.id) }));
    return { building, entries };
  });

  const allSpaceIds = perBuilding.flatMap(({ entries }) => entries.flatMap(({ spaces }) => spaces.map((s) => s.id)));
  const lastMap = latestVerifiedMap(allSpaceIds);

  return perBuilding.map(({ building, entries }) => {
    const areaRollups: AreaRollup[] = entries.map(({ area, spaces }) => {
      const spaceRollups: SpaceRollup[] = spaces.map((space) => {
        const lastVerifiedAt = lastMap.get(space.id) ?? null;
        const d = daysSince(lastVerifiedAt, now);
        return {
          spaceId: space.id,
          spaceName: space.name,
          areaId: area.id,
          areaName: area.name,
          buildingId: building.id,
          buildingName: building.name,
          frequencyDays: space.frequencyDays,
          lastVerifiedAt,
          daysOverdue: d === null ? null : Math.round(d - space.frequencyDays),
          compliant: isCompliant(space.frequencyDays, lastVerifiedAt, now),
        };
      });
      const percent = spaceRollups.length
        ? Math.round((spaceRollups.filter((s) => s.compliant).length / spaceRollups.length) * 100)
        : null;
      return { id: area.id, name: area.name, buildingId: building.id, percent, spaces: spaceRollups };
    });

    const withPercent = areaRollups.filter((a): a is AreaRollup & { percent: number } => a.percent !== null);
    const percent = withPercent.length
      ? Math.round(withPercent.reduce((sum, a) => sum + a.percent, 0) / withPercent.length)
      : null;

    return { id: building.id, name: building.name, percent, areas: areaRollups };
  });
}

export function flattenSpaces(buildingRollups: BuildingRollup[]): SpaceRollup[] {
  return buildingRollups.flatMap((b) => b.areas.flatMap((a) => a.spaces));
}

export function overdueList(buildingRollups: BuildingRollup[], limit = 10): SpaceRollup[] {
  return flattenSpaces(buildingRollups)
    .filter((s) => !s.compliant)
    .sort((a, b) => {
      if (a.lastVerifiedAt === null && b.lastVerifiedAt !== null) return -1;
      if (b.lastVerifiedAt === null && a.lastVerifiedAt !== null) return 1;
      return (b.daysOverdue ?? 0) - (a.daysOverdue ?? 0);
    })
    .slice(0, limit);
}

export function verificationTrend(spaceIds: string[], days = 14): { date: string; count: number }[] {
  const counts = new Map<string, number>();
  if (spaceIds.length > 0) {
    const since = new Date(Date.now() - days * DAY_MS).toISOString();
    const placeholders = spaceIds.map(() => "?").join(",");
    const rows = db
      .prepare(
        `SELECT substr(completed_at,1,10) as date, COUNT(*) as count FROM verification_events
         WHERE space_id IN (${placeholders}) AND completed_at >= ? GROUP BY date`
      )
      .all(...spaceIds, since) as { date: string; count: number }[];
    for (const r of rows) counts.set(r.date, r.count);
  }
  const result: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10);
    result.push({ date: d, count: counts.get(d) ?? 0 });
  }
  return result;
}

export function activityByUser(spaceIds: string[]): { userId: string; displayName: string; count: number }[] {
  if (spaceIds.length === 0) return [];
  const placeholders = spaceIds.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT u.id as userId, u.display_name as displayName, COUNT(*) as count
       FROM verification_events v JOIN users u ON u.id = v.user_id
       WHERE v.space_id IN (${placeholders})
       GROUP BY u.id ORDER BY count DESC`
    )
    .all(...spaceIds) as { userId: string; displayName: string; count: number }[];
  return rows;
}

/** Expands a user's building/area/space assignments into a flat, deduped set of space ids. */
export function resolveAssignedSpaceIds(userId: string): string[] {
  const assignments = repos.assignments.listForUser(userId);
  const spaceIds = new Set<string>();
  for (const a of assignments) {
    if (a.resourceType === "space") {
      spaceIds.add(a.resourceId);
    } else if (a.resourceType === "area") {
      for (const s of repos.spaces.listByArea(a.resourceId)) spaceIds.add(s.id);
    } else {
      for (const area of repos.areas.listByBuilding(a.resourceId)) {
        for (const s of repos.spaces.listByArea(area.id)) spaceIds.add(s.id);
      }
    }
  }
  return Array.from(spaceIds);
}

/** Weighted random pick favoring overdue spaces; never-verified spaces are treated as very overdue.
 * `excludeIds` keeps a space from being picked again while it already has a pending assignment. */
export function pickWeightedRandomSpace(spaceIds: string[], excludeIds: string[] = []): string | null {
  const excluded = new Set(excludeIds);
  const candidateIds = spaceIds.filter((id) => !excluded.has(id));
  const pool = candidateIds.length > 0 ? candidateIds : spaceIds;
  if (pool.length === 0) return null;

  const now = Date.now();
  const lastMap = latestVerifiedMap(pool);
  const spaces = pool.map((id) => repos.spaces.findById(id)).filter((s): s is NonNullable<typeof s> => s !== null);
  if (spaces.length === 0) return null;

  const weights = spaces.map((space) => {
    const d = daysSince(lastMap.get(space.id) ?? null, now);
    const effectiveDaysSince = d === null ? space.frequencyDays + 30 : d;
    const overdueBy = effectiveDaysSince - space.frequencyDays;
    return Math.max(1, overdueBy + 1);
  });

  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < spaces.length; i++) {
    r -= weights[i];
    if (r <= 0) return spaces[i].id;
  }
  return spaces[spaces.length - 1].id;
}
