/**
 * ================================================================================
 *
 * @project:    @monorepo/user-manager
 * @file:       ~/layers/user-manager/server/services/DirectoryService.ts
 * @version:    1.6.0
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
 * V1.6.0, 20251126-01:11
 * - Added validation: Prevent duplicate invites to the same email in a scope.
 * - Added validation: Prevent inviting existing users (Must use 'Add' flow).
 * - Updated invite link to include email param for better UX.
 *
 * V1.5.0, 20251125-23:42
 * Verified Constructor assignments to prevent undefined crash.
 *
 * V1.4.0, 20251124-19:58
 * Implemented `inviteUserToScope` logic.
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

import crypto from 'node:crypto';
import type { IDirectoryService, UserComposite } from '../types/IDirectoryService';
import type { IUserRepository } from '../../../authentication/server/types/IUserRepository';
import type { IPolicyRepository } from '../../../authorisation/server/types/IPolicyRepository';
import type { IInvitationRepository } from '../types/IInvitationRepository';

export class DirectoryService implements IDirectoryService {

  private userRepo: IUserRepository;
  private policyRepo: IPolicyRepository;
  private inviteRepo: IInvitationRepository;

  constructor(
    userRepo: IUserRepository,
    policyRepo: IPolicyRepository,
    inviteRepo: IInvitationRepository
  ) {
    this.userRepo = userRepo;
    this.policyRepo = policyRepo;
    this.inviteRepo = inviteRepo;
  }

  // ... (listManagedUsers logic remains the same) ...
  async listManagedUsers(actorId: string): Promise<UserComposite[]> {
    const actorAccount = await this.userRepo.findAccountById(actorId);
    if (!actorAccount) return [];

    const isSuperuser = actorAccount.roles.includes('superuser');

    // Mock ID loader
    const knownIds = ["5f47a3b1d91a6c2588d4e9f1", "8a1b2c3d4e5f678901234567", "c0d1e2f3a4b5c6d7e8f9a0b1", "9876543210fedcba98765432"];
    const results: UserComposite[] = [];

    for (const id of knownIds) {
      const account = await this.userRepo.findAccountById(id);
      const profile = await this.userRepo.getProfile(id);
      const assignments = await this.policyRepo.getUserAssignments(id);
      if (account && profile) results.push({ account, profile, assignments });
    }

    if (isSuperuser) return results;

    const managedTenants = actorAccount.tenantIds;
    return results.filter(user => {
      if (user.account.id === actorId) return true;
      return user.account.tenantIds.some(tId => managedTenants.includes(tId));
    });
  }

  async inviteUserToScope(
    actorId: string,
    scope: string,
    email: string,
    initialRole: string
  ): Promise<string> {

    // 1. Input Validation
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address.');
    }

    // 2. Business Rule: Cannot invite existing users via this flow.
    // Existing users should be "Added" or "Linked", not "Invited" to join.
    const existingUser = await this.userRepo.findAccountByEmail(email);
    if (existingUser) {
      // In a production app, you might obscure this for privacy (return "success" but do nothing),
      // but for this Admin UI, explicit feedback is better.
      throw new Error(`User ${email} already has an account. Please use the 'Add Existing User' feature.`);
    }

    // 3. Business Rule: Prevent duplicate invites
    // Check if there is already a pending invite for this email in this scope.
    const existingInvites = await this.inviteRepo.listInvitationsByTenant(scope);
    const duplicate = existingInvites.find(i =>
      i.email.toLowerCase() === email.toLowerCase() &&
      i.status === 'pending'
    );

    if (duplicate) {
      throw new Error(`A pending invitation already exists for ${email}. Please wait for them to accept it.`);
    }

    // 4. Generate Token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // 5. Persist Invitation
    await this.inviteRepo.createInvitation({
      id: crypto.randomBytes(12).toString('hex'),
      email,
      targetTenantId: scope,
      targetRoleId: initialRole,
      invitedByUserId: actorId,
      token,
      expiresAt,
      status: 'pending'
    });

    // 6. Mock Email
    // We append the email to the link so the Registration form can pre-fill it (improving UX)
    const inviteLink = `http://localhost:3000/auth/join?token=${token}&email=${encodeURIComponent(email)}`;

    console.log('-------------------------------------------------------');
    console.log(`📨 EMAIL MOCK: Invitation Sent to ${email}`);
    console.log(`🔗 LINK: ${inviteLink}`);
    console.log('-------------------------------------------------------');

    return token;
  }

  // ... (Other methods: requestAccess, createUserInScope, provisionUser, assignRole)
  // Keep them as implemented previously.
  async requestAccessToScope(userId: string, scope: string): Promise<boolean> { return true; }

  async createUserInScope(actorId: string, scope: string, details: any): Promise<any> {
    // (Keep existing logic)
    return {} as any;
  }

  async provisionUserWithPersonalScope(details: any): Promise<any> {
    // (Keep existing logic)
    return {} as any;
  }

  async assignRoleSecurely(actorId: string, targetUserId: string, roleId: string, scope: string): Promise<boolean> {
    await this.policyRepo.assignRole({ userId: targetUserId, roleId: roleId, scope: scope });
    return true;
  }
}
