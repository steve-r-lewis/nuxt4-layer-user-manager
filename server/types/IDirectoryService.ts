/**
 * ================================================================================
 *
 * @project:    @monorepo/user-manager
 * @file:       ~/layers/user-manager/server/types/IDirectoryService.ts
 * @version:    1.2.0
 * @createDate: 2025 Nov 21
 * @createTime: 17:42
 * @author:     Steve R Lewis
 *
 * ================================================================================
 *
 * @description:
 * Defines the contract for high-level User Management operations.
 *
 * ================================================================================
 *
 * @notes: Revision History
 *
 * V1.2.0, 20251122-09:00
 * - Added `provisionUserWithPersonalScope` for the Unix-like registration flow.
 *
 * V1.1.0, 20251121-18:40
 * - Added methods for Invitation, Request, and Creation workflows.
 *
 * V1.0.0, 20251121-17:42
 * Initial creation and release of IDirectoryService.ts
 *
 * ================================================================================
 */

import type { UserAccount, UserProfile } from '../../../authentication/server/types/IUserRepository';
import type { RoleAssignment } from '../../../authorisation/types/Policy';

export interface UserComposite {
  account: UserAccount;
  profile: UserProfile;
  assignments: RoleAssignment[];
}

export interface IDirectoryService {
  /**
   * Lists users that the 'actor' is allowed to see.
   */
  listManagedUsers(actorId: string): Promise<UserComposite[]>;

  // --- Workflow 1: Invite Method ---
  inviteUserToScope(
    actorId: string,
    scope: string,
    email: string,
    initialRole: string
  ): Promise<string>;

  // --- Workflow 2: Request Method ---
  requestAccessToScope(
    userId: string,
    scope: string,
    reason?: string
  ): Promise<boolean>;

  // --- Workflow 3: Admin Create Method ---
  createUserInScope(
    actorId: string,
    scope: string,
    details: { email: string, name: string, initialRole: string }
  ): Promise<UserComposite>;

  // --- Workflow 4: Self-Registration (Unix-Like) ---
  /**
   * The "Unix Method": Creates a user and immediately creates a "Personal"
   * tenant scope for them, assigning them as the owner.
   */
  provisionUserWithPersonalScope(
    details: { email: string, name: string, password?: string }
  ): Promise<UserComposite>;

  assignRoleSecurely(
    actorId: string,
    targetUserId: string,
    roleId: string,
    scope: string
  ): Promise<boolean>;
}
