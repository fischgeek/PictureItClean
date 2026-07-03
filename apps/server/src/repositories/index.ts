import { SqliteAreaRepository } from "./sqlite/SqliteAreaRepository";
import { SqliteAssignmentRepository } from "./sqlite/SqliteAssignmentRepository";
import { SqliteBuildingRepository } from "./sqlite/SqliteBuildingRepository";
import { SqliteChecklistItemRepository } from "./sqlite/SqliteChecklistItemRepository";
import { SqliteDailyAssignmentRepository } from "./sqlite/SqliteDailyAssignmentRepository";
import { SqliteInviteRepository } from "./sqlite/SqliteInviteRepository";
import { SqliteMembershipRepository } from "./sqlite/SqliteMembershipRepository";
import { SqlitePhotoRepository } from "./sqlite/SqlitePhotoRepository";
import { SqliteSpaceRepository } from "./sqlite/SqliteSpaceRepository";
import { SqliteUserRepository } from "./sqlite/SqliteUserRepository";
import { SqliteVerificationEventRepository } from "./sqlite/SqliteVerificationEventRepository";

// Single wiring point: a future Jira-backed edition swaps these implementations
// without touching services/routes, which only depend on the interfaces in ./interfaces.
export const repos = {
  users: new SqliteUserRepository(),
  buildings: new SqliteBuildingRepository(),
  areas: new SqliteAreaRepository(),
  spaces: new SqliteSpaceRepository(),
  photos: new SqlitePhotoRepository(),
  checklistItems: new SqliteChecklistItemRepository(),
  memberships: new SqliteMembershipRepository(),
  invites: new SqliteInviteRepository(),
  verificationEvents: new SqliteVerificationEventRepository(),
  assignments: new SqliteAssignmentRepository(),
  dailyAssignments: new SqliteDailyAssignmentRepository(),
};
