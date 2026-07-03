export type Role = "owner" | "editor" | "viewer";

export type ResourceType = "building" | "area" | "space";

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  displayName: string;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
}

export interface Building {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
}

export interface Area {
  id: string;
  buildingId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
}

export interface Space {
  id: string;
  areaId: string;
  name: string;
  sortOrder: number;
  currentPhotoId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Photo {
  id: string;
  spaceId: string;
  filePath: string;
  thumbnailPath: string;
  uploadedBy: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  spaceId: string;
  text: string;
  estimatedMinutes: number;
  sortOrder: number;
  createdAt: string;
}

export interface Membership {
  id: string;
  userId: string;
  resourceType: ResourceType;
  resourceId: string;
  role: Role;
  createdAt: string;
}

export interface Invite {
  id: string;
  token: string;
  resourceType: ResourceType;
  resourceId: string;
  role: Role;
  createdBy: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface VerificationEvent {
  id: string;
  spaceId: string;
  userId: string;
  checklistSnapshot: { id: string; text: string; estimatedMinutes: number; checked: boolean }[];
  note: string | null;
  completedAt: string;
}
