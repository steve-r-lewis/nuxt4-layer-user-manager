/**
 * ================================================================================
 *
 * @project:    @monorepo/user-manager
 * @file:       ~/layers/user-manager/server/api/user-manager/workspace/users.get.ts
 * @version:    1.2.0
 * @createDate: 2025 Nov 21
 * @createTime: 23:26
 * @author:     Steve R Lewis
 *
 * ================================================================================
 *
 * @description:
 * API Endpoint to list users managed by the current actor.
 * Uses Dependency Injection to wire up the DirectoryService with FileSystem repos.
 *
 * ================================================================================
 *
 * @notes: Revision History
 *
 * V1.2.0, 20251123-22:22
 * REFACTOR: Uses the Service Locator pattern.
 * - No longer imports specific Repository classes.
 * - Asks the container for the `DirectoryService` and `UserRepository`.
 *
 * V1.1.0, 20251122-00:08
 * Now uses the `getDirectoryService()` and `getUserRepository()` wrappers (Service Containers).
 * This file is now 100% implementation agnostic. It doesn't know if we are using
 * FileSystem, SQL, or Firebase. It just asks the container for the tool.
 *
 * V1.0.0, 20251121-23:26
 * Initial creation and release of users.get.ts
 *
 * ================================================================================
 */

import { defineEventHandler, getCookie, createError } from 'h3'

// Nitro Auto-Imports:
// getUserRepository() from authentication/server/utils/authContainer
// getDirectoryService() from user-manager/server/utils/directoryContainer

export default defineEventHandler(async (event) => {
  // 1. Authenticate
  const userEmail = getCookie(event, 'authentication-token-email');
  if (!userEmail) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  // 2. Resolve Dependencies via Service Locator
  // We don't care if these are FileSystem or SQL; the container decides.
  const userRepo = getUserRepository();
  const directoryService = getDirectoryService();

  // 3. Resolve Identity
  const currentUser = await userRepo.findAccountByEmail(userEmail);
  if (!currentUser) {
    throw createError({ statusCode: 401, statusMessage: 'User identity not found' });
  }

  // 4. Execute Business Logic
  const managedUsers = await directoryService.listManagedUsers(currentUser.id);

  return { users: managedUsers };
})
