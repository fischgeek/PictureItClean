import {
  Area,
  Assignment,
  Building,
  ChecklistItem,
  DailyAssignment,
  Invite,
  Membership,
  Photo,
  ResourceType,
  Role,
  Space,
  User,
  UserRole,
  VerificationEvent,
} from "../domain/types";

export interface UserRepository {
  create(input: { username: string; passwordHash: string; displayName: string; role?: UserRole }): User;
  findByUsername(username: string): User | null;
  findById(id: string): User | null;
  listAll(): User[];
  updateRole(id: string, role: UserRole): User;
  updatePassword(id: string, passwordHash: string): User;
  delete(id: string): void;
  countAdmins(): number;
}

export interface BuildingRepository {
  create(input: { name: string; createdBy: string }): Building;
  findById(id: string): Building | null;
  listForUser(userId: string): Building[];
  listAll(): Building[];
  update(id: string, input: Partial<{ name: string; photoPath: string | null; thumbnailPath: string | null }>): Building;
  delete(id: string): void;
}

export interface AreaRepository {
  create(input: { buildingId: string; name: string; sortOrder: number }): Area;
  findById(id: string): Area | null;
  listByBuilding(buildingId: string): Area[];
  update(
    id: string,
    input: Partial<{ name: string; sortOrder: number; photoPath: string | null; thumbnailPath: string | null }>
  ): Area;
  delete(id: string): void;
}

export interface SpaceRepository {
  create(input: { areaId: string; name: string; sortOrder: number; frequencyDays?: number }): Space;
  findById(id: string): Space | null;
  listByArea(areaId: string): Space[];
  update(
    id: string,
    input: Partial<{ name: string; sortOrder: number; currentPhotoId: string | null; frequencyDays: number }>
  ): Space;
  delete(id: string): void;
}

export interface PhotoRepository {
  create(input: { spaceId: string; filePath: string; thumbnailPath: string; uploadedBy: string }): Photo;
  findById(id: string): Photo | null;
  listBySpace(spaceId: string): Photo[];
  delete(id: string): void;
}

export interface ChecklistItemRepository {
  create(input: { spaceId: string; text: string; estimatedMinutes: number; sortOrder: number }): ChecklistItem;
  findById(id: string): ChecklistItem | null;
  listBySpace(spaceId: string): ChecklistItem[];
  update(id: string, input: Partial<{ text: string; estimatedMinutes: number; sortOrder: number }>): ChecklistItem;
  delete(id: string): void;
}

export interface MembershipRepository {
  create(input: { userId: string; resourceType: ResourceType; resourceId: string; role: Role }): Membership;
  findExact(userId: string, resourceType: ResourceType, resourceId: string): Membership | null;
  listForUserOnChain(userId: string, chain: { resourceType: ResourceType; resourceId: string }[]): Membership[];
  listForResource(resourceType: ResourceType, resourceId: string): Membership[];
}

export interface InviteRepository {
  create(input: {
    resourceType: ResourceType;
    resourceId: string;
    role: Role;
    createdBy: string;
    expiresAt: string | null;
  }): Invite;
  findByToken(token: string): Invite | null;
}

export interface VerificationEventRepository {
  create(input: {
    spaceId: string;
    userId: string;
    checklistSnapshot: VerificationEvent["checklistSnapshot"];
    note: string | null;
  }): VerificationEvent;
  listBySpace(spaceId: string): VerificationEvent[];
}

export interface AssignmentRepository {
  /** Replaces the full assigned-resource set for a user in one transaction. */
  replaceForUser(userId: string, items: { resourceType: ResourceType; resourceId: string }[], createdBy: string): void;
  listForUser(userId: string): Assignment[];
}

export interface DailyAssignmentRepository {
  /** Not-yet-completed assignments due today or earlier (i.e. still owed), oldest first. */
  listActive(userId: string, today: string): DailyAssignment[];
  /** Whether a pick (of any completion status) has already been issued to this user for this date. */
  hasAnyForDate(userId: string, date: string): boolean;
  /** Distinct space ids ever issued to this user (any date, any completion status) -- used to tell
   * a brand-new assignment (never seen before) apart from the ongoing daily rotation. */
  listIssuedSpaceIds(userId: string): string[];
  /** Distinct space ids with a currently-active (not completed) row, regardless of assigned_date --
   * including ones pushed into the future by a skip. Used so the daily picker never issues a second
   * active row for a space that already has one, which would collide on a later reschedule. */
  listActiveSpaceIds(userId: string): string[];
  findById(id: string): DailyAssignment | null;
  create(input: { userId: string; spaceId: string; assignedDate: string }): DailyAssignment;
  /** Completes whatever active assignment exists for this user+space, regardless of its assigned_date. */
  markCompletedForSpace(userId: string, spaceId: string): void;
  /** Reschedules an assignment to a new date (used by "skip for a day"). Returns null if a
   * duplicate assignment for the same user/space/date already existed, in which case this
   * row was dropped instead of colliding with it. */
  reschedule(id: string, newDate: string): DailyAssignment | null;
}
