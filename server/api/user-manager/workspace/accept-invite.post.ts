/**
 * ================================================================================
 *
 * @project:    @monorepo/user-manager
 * @file:       ~/layers/user-manager/server/api/user-manager/workspace/accept-invite.post.ts
 * @version:    1.0.0
 * @createDate: 2025 Nov 25
 * @createTime: 21:22
 * @author:     Steve R Lewis
 *
 * ================================================================================
 *
 * @description:
 * Endpoint to accept an invitation via token.
 *
 * ================================================================================
 *
 * @notes: Revision History
 *
 * V1.0.0, 20251125-21:22
 * Initial creation and release of accept-invite.post.ts
 *
 * ================================================================================
 */

import { defineEventHandler, readBody, createError } from 'h3'

// Auto-imports: getDirectoryService, getInvitationRepository

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const token = body.token;

  if (!token) throw createError({ statusCode: 400, statusMessage: 'Token required' });

  // 1. Validate Token
  const inviteRepo = getInvitationRepository();
  const invite = await inviteRepo.getInvitationByToken(token);

  if (!invite) {
    throw createError({ statusCode: 404, statusMessage: 'Invalid or expired invitation' });
  }

  if (invite.status !== 'pending') {
    throw createError({ statusCode: 400, statusMessage: 'Invitation already used' });
  }

  // 2. Execute Acceptance Logic
  // In a real app, this would:
  // - Create the user assignment
  // - Mark invite as accepted
  // - If user didn't exist, trigger registration flow (complex).

  // For this mock, we just mark it accepted.
  await inviteRepo.markAsAccepted(invite.id);

  return { success: true };
})
