import {
  Area,
  Building,
  ChecklistItem,
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
  update(id: string, input: { name: string }): Building;
  delete(id: string): void;
}

export interface AreaRepository {
  create(input: { buildingId: string; name: string; sortOrder: number }): Area;
  findById(id: string): Area | null;
  listByBuilding(buildingId: string): Area[];
  update(id: string, input: Partial<{ name: string; sortOrder: number }>): Area;
  delete(id: string): void;
}

export interface SpaceRepository {
  create(input: { areaId: string; name: string; sortOrder: number }): Space;
  findById(id: string): Space | null;
  listByArea(areaId: string): Space[];
  update(id: string, input: Partial<{ name: string; sortOrder: number; currentPhotoId: string | null }>): Space;
  delete(id: string): void;
}

export interface PhotoRepository {
  create(input: { spaceId: string; filePath: string; thumbnailPath: string; uploadedBy: string }): Photo;
  findById(id: string): Photo | null;
  listBySpace(spaceId: string): Photo[];
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
