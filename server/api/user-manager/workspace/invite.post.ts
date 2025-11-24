/**
 * ================================================================================
 *
 * @project:    holistic-massage-therapy
 * @file:       ~/layers/user-manager/server/api/user-manager/workspace/invite.post.ts
 * @version:    1.0.0
 * @createDate: 2025 Nov 24
 * @createTime: 20:02
 * @author:     Steve R Lewis
 *
 * ================================================================================
 *
 * @description:
 * API Endpoint to invite a user to a specific tenant scope.
 *
 * ================================================================================
 *
 * @notes: Revision History
 *
 * V1.0.0, 20251124-20:02
 * Initial creation and release of invite.post.ts
 *
 * ================================================================================
 */

import { defineEventHandler, readBody, getCookie, createError } from 'h3'

// Auto-imports: getDirectoryService, getUserRepository

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const userEmail = getCookie(event, 'authentication-token-email');

  if (!userEmail) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  if (!body.email || !body.role || !body.scope) {
    throw createError({ statusCode: 400, statusMessage: 'Missing email, role, or scope' });
  }

  const userRepo = getUserRepository();
  const directoryService = getDirectoryService();

  const actor = await userRepo.findAccountByEmail(userEmail);
  if (!actor) throw createError({ statusCode: 401, statusMessage: 'Identity not found' });

  // Execute Logic
  const token = await directoryService.inviteUserToScope(
    actor.id,
    body.scope,
    body.email,
    body.role
  );

  return { success: true, mockedLink: `http://localhost:3000/auth/join?token=${token}` };
})
