/**
 * ================================================================================
 *
 * @project:    @monorepo/user-manager
 * @file:       ~/layers/user-manager/server/utils/directoryContainer.ts
 * @version:    1.4.0
 * @createDate: 2025 Nov 21
 * @createTime: 23:58
 * @author:     Steve R Lewis
 *
 * ================================================================================
 *
 * @description:
 * Service Locator for DirectoryService.
 *
 * This factory assembles the DirectoryService.
 * It pulls the dependencies (Repositories) from the other layers' containers
 * and injects them into the business logic.
 *
 * ================================================================================
 *
 * @notes: Revision History
 *
 * V1.4.0, 20251125-23:29
 * Explicitly injects InvitationRepository to fix 500 error.
 *
 * V1.3.0, 20251124-19:54
 * Injects InvitationRepository.
 *
 * V1.2.0, 20251123-23:53
 * Now consumes the GLOBAL `getUserRepository` and `getPolicyRepository`
 * which are auto-imported from the application root `server/utils`.
 *
 * V1.1.0, 20251123-22:24
 * Refactor: Now uses the service locator pattern (User Manager).
 *
 * V1.0.0, 20251121-23:58
 * Initial creation and release of directoryContainer.ts
 *
 * ================================================================================
 */

import { DirectoryService } from '../services/DirectoryService'

// Note: getUserRepository, getPolicyRepository, and getInvitationRepository
// are auto-imported from ~/server/utils/appContainer.ts because they are in server/utils

let _directoryServiceInstance: DirectoryService | null = null;

export const getDirectoryService = (): DirectoryService => {
  if (!_directoryServiceInstance) {
    // 1. Get all 3 dependencies from the Global Container
    const userRepo = getUserRepository();
    const policyRepo = getPolicyRepository();
    const inviteRepo = getInvitationRepository(); // <--- Critical: Must get this

    // 2. Inject all 3 into the service
    _directoryServiceInstance = new DirectoryService(userRepo, policyRepo, inviteRepo);
  }
  return _directoryServiceInstance;
}
