/**
 * ================================================================================
 *
 * @project:    @monorepo/user-manager
 * @file:       ~/layers/user-manager/server/services/DirectoryService.ts
 * @version:    1.3.0
 * @createDate: 2025 Nov 21
 * @createTime: 17:45
 * @author:     Steve R Lewis
 *
 * ================================================================================
 *
 * @description:
 * Implementation of the Directory Service.
 *
 * Aggregates data from Auth and AuthZ repositories.
 * Implements "Scope Logic" to ensure managers only see their own people.
 *
 * ARCHITECTURAL UPDATE:
 * This class is now Backend Agnostic. It no longer hard-imports the FileSystem
 * repositories. Instead, it accepts any implementation of IUserRepository
 * and IPolicyRepository via its constructor (Dependency Injection).
 *
 * ================================================================================
 *
 * @notes: Revision History
 *
 * V1.3.0, 20251122-09:00
 * - Implemented `provisionUserWithPersonalScope` (Unix-like flow).
 *
 * V1.2.0, 20251122-09:00
 * - Added `provisionUserWithPersonalScope` for the Unix-like registration flow.
 *
 * V1.1.0, 20251121-18:00
 * - Refactored to use Dependency Injection.
 * - Removed hardcoded FileSystem imports.
 *
 * V1.0.0, 20251121-17:45
 * Initial creation and release of DirectoryService.ts
 *
 * ================================================================================
 */

import type { IDirectoryService, UserComposite } from '../types/IDirectoryService';
import type { IUserRepository } from '../../../authentication/server/types/IUserRepository';
import type { IPolicyRepository } from '../../../authorisation/server/types/IPolicyRepository';

export class DirectoryService implements IDirectoryService {

  private userRepo: IUserRepository;
  private policyRepo: IPolicyRepository;

  constructor(userRepo: IUserRepository, policyRepo: IPolicyRepository) {
    this.userRepo = userRepo;
    this.policyRepo = policyRepo;
  }

  async listManagedUsers(actorId: string): Promise<UserComposite[]> {
    const actorAccount = await this.userRepo.findAccountById(actorId);

    if (!actorAccount) return [];

    const isSuperuser = actorAccount.roles.includes('superuser');

    // Mock ID loader (Replace with userRepo.findAll() in prod)
    const knownIds = [
      "5f47a3b1d91a6c2588d4e9f1",
      "8a1b2c3d4e5f678901234567",
      "c0d1e2f3a4b5c6d7e8f9a0b1",
      "9876543210fedcba98765432"
    ];

    const results: UserComposite[] = [];

    for (const id of knownIds) {
      const account = await this.userRepo.findAccountById(id);
      const profile = await this.userRepo.getProfile(id);
      const assignments = await this.policyRepo.getUserAssignments(id);

      if (account && profile) {
        results.push({ account, profile, assignments });
      }
    }

    if (isSuperuser) return results;

    const managedTenants = actorAccount.tenantIds;

    return results.filter(user => {
      if (user.account.id === actorId) return true;
      // Allow if the user belongs to any tenant I belong to
      return user.account.tenantIds.some(tId => managedTenants.includes(tId));
    });
  }

  // --- Workflow 1: Invite Method ---
  async inviteUserToScope(
    actorId: string,
    scope: string,
    email: string,
    initialRole: string
  ): Promise<string> {
    console.log(`[DirectoryService] Inviting ${email} to ${scope} with role ${initialRole}`);
    return "mock-invite-token-123";
  }

  // --- Workflow 2: Request Method ---
  async requestAccessToScope(
    userId: string,
    scope: string,
    reason?: string
  ): Promise<boolean> {
    console.log(`[DirectoryService] User ${userId} requesting access to ${scope}`);
    return true;
  }

  // --- Workflow 3: Admin Create Method ---
  async createUserInScope(
    actorId: string,
    scope: string,
    details: { email: string, name: string, initialRole: string }
  ): Promise<UserComposite> {
    const newAccount = await this.userRepo.createAccount({
      email: details.email,
      passwordHash: 'temp-password',
      roles: ['user'],
      tenantIds: [scope],
      capabilities: [],
      isVerified: true,
      is2faEnabled: false,
      status: 'active'
    });

    const newProfile = await this.userRepo.updateProfile(newAccount.id, {
      displayName: details.name,
      associatedTenants: [{ tenantId: scope, name: 'New Tenant', status: 'active' }]
    });

    await this.policyRepo.assignRole({
      userId: newAccount.id,
      roleId: details.initialRole,
      scope: scope
    });

    return {
      account: newAccount,
      profile: newProfile,
      assignments: [{ userId: newAccount.id, roleId: details.initialRole, scope }]
    };
  }

  // --- Workflow 4: Self-Registration (Unix-Like) ---
  async provisionUserWithPersonalScope(
    details: { email: string, name: string, password?: string }
  ): Promise<UserComposite> {

    // 1. Generate the "Personal Scope" ID
    const personalScopeId = `tenant-personal-${Math.random().toString(36).substr(2, 6)}`;
    const personalScopeName = `${details.name}'s Workspace`;

    // 2. Create User Account (linked to this scope)
    const newAccount = await this.userRepo.createAccount({
      email: details.email,
      passwordHash: details.password || 'temp-password',
      roles: ['user'], // System Role is just 'user'
      tenantIds: [personalScopeId], // They belong to their personal tenant
      capabilities: [],
      isVerified: false, // Requires email verification
      is2faEnabled: false,
      status: 'active'
    });

    // 3. Create Profile (linked to this scope for UI)
    const newProfile = await this.userRepo.updateProfile(newAccount.id, {
      displayName: details.name,
      associatedTenants: [
        { tenantId: personalScopeId, name: personalScopeName, status: 'active' }
      ],
      preferences: {
        theme: 'system',
        notifications: true,
        currentTenantId: personalScopeId // Default to their personal view
      }
    });

    // 4. Assign Permissions (Owner of their personal scope)
    await this.policyRepo.assignRole({
      userId: newAccount.id,
      roleId: 'policy_shop_owner_abac',
      scope: personalScopeId
    });

    console.log(`[DirectoryService] Provisioned user ${newAccount.id} with personal scope ${personalScopeId}`);

    return {
      account: newAccount,
      profile: newProfile,
      assignments: [{ userId: newAccount.id, roleId: 'policy_shop_owner_abac', scope: personalScopeId }]
    };
  }

  async assignRoleSecurely(
    actorId: string,
    targetUserId: string,
    roleId: string,
    scope: string
  ): Promise<boolean> {
    await this.policyRepo.assignRole({
      userId: targetUserId,
      roleId: roleId,
      scope: scope
    });
    return true;
  }
}
