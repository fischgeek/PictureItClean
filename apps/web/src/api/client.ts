export type UserRole = "user" | "admin";
export type ResourceType = "building" | "area" | "space";

export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
}

export interface Building {
  id: string;
  name: string;
  createdBy: string;
  photoPath: string | null;
  thumbnailPath: string | null;
  createdAt: string;
}

export interface Area {
  id: string;
  buildingId: string;
  name: string;
  sortOrder: number;
  photoPath: string | null;
  thumbnailPath: string | null;
  createdAt: string;
}

export interface Photo {
  id: string;
  spaceId: string;
  filePath: string;
  thumbnailPath: string;
  uploadedBy: string;
  createdAt: string;
}

export interface Space {
  id: string;
  areaId: string;
  name: string;
  sortOrder: number;
  currentPhotoId: string | null;
  currentPhoto?: Photo | null;
  frequencyDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface SpaceDetail extends Space {
  checklistItems: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  spaceId: string;
  text: string;
  estimatedMinutes: number;
  sortOrder: number;
  createdAt: string;
}

export interface Invite {
  id: string;
  token: string;
  resourceType: "building" | "area" | "space";
  resourceId: string;
  role: "owner" | "editor" | "viewer";
  resourceName?: string;
  createdAt: string;
}

export interface VerificationEvent {
  id: string;
  spaceId: string;
  userId: string;
  checklistSnapshot: { id: string; text: string; estimatedMinutes: number; checked: boolean }[];
  note: string | null;
  completedAt: string;
  user?: PublicUser;
}

export interface AssignmentOptionSpace extends Space {}
export interface AssignmentOptionArea extends Area {
  spaces: AssignmentOptionSpace[];
}
export interface AssignmentOptionBuilding extends Building {
  areas: AssignmentOptionArea[];
}

export interface AssignmentItem {
  id: string;
  userId: string;
  resourceType: ResourceType;
  resourceId: string;
  resourceName: string | null;
  createdAt: string;
}

export interface MyAssignment {
  id: string;
  space: Space;
  area: Area | null;
  building: Building | null;
  checklistItems: ChecklistItem[];
  currentPhoto: Photo | null;
  lastVerifiedAt: string | null;
  assignedDate: string;
}

export interface DashboardData {
  assignments: MyAssignment[];
  hasAssignmentPool: boolean;
  pendingCount: number;
  pendingTotalMinutes: number;
  overdueSpaces: {
    spaceId: string;
    spaceName: string;
    areaName: string;
    buildingName: string;
    frequencyDays: number;
    daysOverdue: number | null;
  }[];
  complianceByBuilding: { buildingId: string; name: string; percent: number | null }[];
  verificationTrend: { date: string; count: number }[];
  activityByUser: { userId: string; displayName: string; count: number }[];
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : undefined,
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  login: (username: string, password: string) =>
    request<PublicUser>("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  me: () => request<PublicUser>("/auth/me"),

  listBuildings: () => request<Building[]>("/buildings"),
  createBuilding: (name: string) => request<Building>("/buildings", { method: "POST", body: JSON.stringify({ name }) }),
  getBuilding: (id: string) => request<Building>(`/buildings/${id}`),
  updateBuilding: (id: string, name: string) =>
    request<Building>(`/buildings/${id}`, { method: "PATCH", body: JSON.stringify({ name }) }),
  deleteBuilding: (id: string) => request<void>(`/buildings/${id}`, { method: "DELETE" }),
  uploadBuildingPhoto: (id: string, file: File) => {
    const form = new FormData();
    form.append("photo", file);
    return request<Building>(`/buildings/${id}/photo`, { method: "POST", body: form });
  },
  deleteBuildingPhoto: (id: string) => request<Building>(`/buildings/${id}/photo`, { method: "DELETE" }),
  buildingPhotoUrl: (id: string) => `/api/buildings/${id}/photo/file`,
  buildingThumbnailUrl: (id: string) => `/api/buildings/${id}/photo/thumbnail`,

  listAreas: (buildingId: string) => request<Area[]>(`/buildings/${buildingId}/areas`),
  createArea: (buildingId: string, name: string) =>
    request<Area>(`/buildings/${buildingId}/areas`, { method: "POST", body: JSON.stringify({ name }) }),
  getArea: (id: string) => request<Area>(`/areas/${id}`),
  updateArea: (id: string, name: string) => request<Area>(`/areas/${id}`, { method: "PATCH", body: JSON.stringify({ name }) }),
  deleteArea: (id: string) => request<void>(`/areas/${id}`, { method: "DELETE" }),
  uploadAreaPhoto: (id: string, file: File) => {
    const form = new FormData();
    form.append("photo", file);
    return request<Area>(`/areas/${id}/photo`, { method: "POST", body: form });
  },
  deleteAreaPhoto: (id: string) => request<Area>(`/areas/${id}/photo`, { method: "DELETE" }),
  areaPhotoUrl: (id: string) => `/api/areas/${id}/photo/file`,
  areaThumbnailUrl: (id: string) => `/api/areas/${id}/photo/thumbnail`,

  listSpaces: (areaId: string) => request<Space[]>(`/areas/${areaId}/spaces`),
  createSpace: (areaId: string, name: string, frequencyDays?: number) =>
    request<Space>(`/areas/${areaId}/spaces`, { method: "POST", body: JSON.stringify({ name, frequencyDays }) }),
  getSpace: (id: string) => request<SpaceDetail>(`/spaces/${id}`),
  updateSpace: (id: string, input: Partial<{ name: string; frequencyDays: number }>) =>
    request<Space>(`/spaces/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteSpace: (id: string) => request<void>(`/spaces/${id}`, { method: "DELETE" }),
  uploadSpacePhoto: (id: string, file: File) => {
    const form = new FormData();
    form.append("photo", file);
    return request<Photo>(`/spaces/${id}/photo`, { method: "POST", body: form });
  },
  listSpacePhotos: (id: string) => request<Photo[]>(`/spaces/${id}/photos`),
  deleteSpacePhoto: (photoId: string) => request<void>(`/photos/${photoId}`, { method: "DELETE" }),

  listChecklistItems: (spaceId: string) => request<ChecklistItem[]>(`/spaces/${spaceId}/checklist-items`),
  createChecklistItem: (spaceId: string, text: string, estimatedMinutes: number) =>
    request<ChecklistItem>(`/spaces/${spaceId}/checklist-items`, {
      method: "POST",
      body: JSON.stringify({ text, estimatedMinutes }),
    }),
  updateChecklistItem: (id: string, input: Partial<{ text: string; estimatedMinutes: number }>) =>
    request<ChecklistItem>(`/checklist-items/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteChecklistItem: (id: string) => request<void>(`/checklist-items/${id}`, { method: "DELETE" }),

  listVerifications: (spaceId: string) => request<VerificationEvent[]>(`/spaces/${spaceId}/verifications`),
  submitVerification: (spaceId: string, checkedItemIds: string[], note?: string) =>
    request<VerificationEvent>(`/spaces/${spaceId}/verify`, {
      method: "POST",
      body: JSON.stringify({ checkedItemIds, note }),
    }),

  createShare: (resourceType: "building" | "area" | "space", resourceId: string, role: "viewer" | "editor") =>
    request<Invite>(`/${resourceType}/${resourceId}/share`, { method: "POST", body: JSON.stringify({ role }) }),
  getInvite: (token: string) => request<Invite>(`/invite/${token}`),
  acceptInvite: (token: string) => request(`/invite/${token}/accept`, { method: "POST" }),

  photoUrl: (photoId: string) => `/api/photos/${photoId}/file`,
  thumbnailUrl: (photoId: string) => `/api/photos/${photoId}/thumbnail`,

  listUsers: () => request<PublicUser[]>("/admin/users"),
  createUser: (username: string, password: string, displayName: string, role: UserRole) =>
    request<PublicUser>("/admin/users", { method: "POST", body: JSON.stringify({ username, password, displayName, role }) }),
  updateUserRole: (id: string, role: UserRole) =>
    request<PublicUser>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ role }) }),
  resetUserPassword: (id: string, password: string) =>
    request<PublicUser>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ password }) }),
  deleteUser: (id: string) => request<void>(`/admin/users/${id}`, { method: "DELETE" }),

  getDashboard: () => request<DashboardData>("/dashboard"),
  skipAssignment: (id: string) => request(`/assignments/${id}/skip`, { method: "POST" }),

  listAssignmentOptions: () => request<AssignmentOptionBuilding[]>("/admin/assignment-options"),
  getUserAssignments: (userId: string) => request<AssignmentItem[]>(`/admin/assignments/${userId}`),
  setUserAssignments: (userId: string, items: { resourceType: ResourceType; resourceId: string }[]) =>
    request<AssignmentItem[]>(`/admin/assignments/${userId}`, { method: "PUT", body: JSON.stringify({ items }) }),
};

export { ApiError };
