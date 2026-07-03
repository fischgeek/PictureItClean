import {
  Area,
  Assignment,
  Building,
  ChecklistItem,
  DailyAssignment,
  Invite,
  Membership,
  Photo,
  Space,
  User,
  VerificationEvent,
} from "../../domain/types";

export const mapUser = (row: any): User => ({
  id: row.id,
  username: row.username,
  passwordHash: row.password_hash,
  displayName: row.display_name,
  role: row.role,
  createdAt: row.created_at,
});

export const mapBuilding = (row: any): Building => ({
  id: row.id,
  name: row.name,
  createdBy: row.created_by,
  createdAt: row.created_at,
});

export const mapArea = (row: any): Area => ({
  id: row.id,
  buildingId: row.building_id,
  name: row.name,
  sortOrder: row.sort_order,
  createdAt: row.created_at,
});

export const mapSpace = (row: any): Space => ({
  id: row.id,
  areaId: row.area_id,
  name: row.name,
  sortOrder: row.sort_order,
  currentPhotoId: row.current_photo_id,
  frequencyDays: row.frequency_days,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapPhoto = (row: any): Photo => ({
  id: row.id,
  spaceId: row.space_id,
  filePath: row.file_path,
  thumbnailPath: row.thumbnail_path,
  uploadedBy: row.uploaded_by,
  createdAt: row.created_at,
});

export const mapChecklistItem = (row: any): ChecklistItem => ({
  id: row.id,
  spaceId: row.space_id,
  text: row.text,
  estimatedMinutes: row.estimated_minutes,
  sortOrder: row.sort_order,
  createdAt: row.created_at,
});

export const mapMembership = (row: any): Membership => ({
  id: row.id,
  userId: row.user_id,
  resourceType: row.resource_type,
  resourceId: row.resource_id,
  role: row.role,
  createdAt: row.created_at,
});

export const mapInvite = (row: any): Invite => ({
  id: row.id,
  token: row.token,
  resourceType: row.resource_type,
  resourceId: row.resource_id,
  role: row.role,
  createdBy: row.created_by,
  expiresAt: row.expires_at,
  createdAt: row.created_at,
});

export const mapVerificationEvent = (row: any): VerificationEvent => ({
  id: row.id,
  spaceId: row.space_id,
  userId: row.user_id,
  checklistSnapshot: JSON.parse(row.checklist_snapshot_json),
  note: row.note,
  completedAt: row.completed_at,
});

export const mapAssignment = (row: any): Assignment => ({
  id: row.id,
  userId: row.user_id,
  resourceType: row.resource_type,
  resourceId: row.resource_id,
  createdBy: row.created_by,
  createdAt: row.created_at,
});

export const mapDailyAssignment = (row: any): DailyAssignment => ({
  id: row.id,
  userId: row.user_id,
  spaceId: row.space_id,
  assignedDate: row.assigned_date,
  createdAt: row.created_at,
  completedAt: row.completed_at,
});
