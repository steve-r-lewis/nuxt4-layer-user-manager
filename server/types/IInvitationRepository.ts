/**
 * ================================================================================
 *
 * @project:    @monorepo/user-manager
 * @file:       ~/layers/user-manager/server/types/IInvitationRepository.ts
 * @version:    1.0.0
 * @createDate: 2025 Nov 24
 * @createTime: 11:41
 * @author:     Steve R Lewis
 *
 * ================================================================================
 *
 * @description:
 * Contract for managing User Invitations.
 *
 * ================================================================================
 *
 * @notes: Revision History
 *
 * V1.0.0, 20251124-11:41
 * Initial creation and release of IInvitationRepository.ts
 *
 * ================================================================================
 */

export interface Invitation {
  id: string;
  email: string;
  targetTenantId: string;
  targetRoleId: string;
  invitedByUserId: string;
  token: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired';
}

export interface IInvitationRepository {
  createInvitation(invite: Invitation): Promise<Invitation>;
  getInvitationByToken(token: string): Promise<Invitation | null>;
  listInvitationsByTenant(tenantId: string): Promise<Invitation[]>;
  markAsAccepted(id: string): Promise<void>;
}
