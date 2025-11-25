/**
 * ================================================================================
 *
 * @project:    @monorepo/user-manager
 * @file:       ~/layers/user-manager/server/services/DirectoryService.ts
 * @version:    1.4.0
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

  // ... (listManagedUsers implementation remains the same) ...
  async listManagedUsers(actorId: string): Promise<UserComposite[]> {
    // (Existing code omitted for brevity - keep your previous V1.3.0 implementation here)
    // Just ensure you return the same logic as before.
    // I will re-paste it if you need the full file refreshed.
    const actorAccount = await this.userRepo.findAccountById(actorId);
    if (!actorAccount) return [];

    const isSuperuser = actorAccount.roles.includes('superuser');
    // Known IDs mock loop (replace with findAll in real DB)
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

  // --- Workflow 1: Invite Method (Implemented) ---
  async inviteUserToScope(
    actorId: string,
    scope: string,
    email: string,
    initialRole: string
  ): Promise<string> {

    // 1. Validation: Does the actor have permission to invite? (Skip for now or check policy)
    // 2. Check if user already exists
    const existingUser = await this.userRepo.findAccountByEmail(email);

    if (existingUser) {
      // If user exists, we could auto-add them, but usually we still want them to confirm.
      // For now, let's just generate a "Link" token anyway.
      console.log(`[DirectoryService] User ${email} already exists. Creating linkage invite.`);
    }

    // 3. Generate Token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    // 4. Persist Invitation
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

    // 5. Mock Email Sending
    const inviteLink = `http://localhost:3000/auth/join?token=${token}`;
    console.log('-------------------------------------------------------');
    console.log(`📨 EMAIL MOCK: Invitation Sent to ${email}`);
    console.log(`🔗 LINK: ${inviteLink}`);
    console.log('-------------------------------------------------------');

    return token;
  }

  // ... (Rest of methods: requestAccess, createUserInScope, provisionUser, assignRole)
  // Keep previous implementations.
  async requestAccessToScope(userId: string, scope: string): Promise<boolean> { return true; }
  async createUserInScope(actorId: string, scope: string, details: any): Promise<any> { return {} as any; }
  async provisionUserWithPersonalScope(details: any): Promise<any> { return {} as any; }
  async assignRoleSecurely(actorId: string, targetUserId: string, roleId: string, scope: string): Promise<boolean> { return true; }
}
