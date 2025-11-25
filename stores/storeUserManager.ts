/**
 * ================================================================================
 *
 * @project:    @monorepo/user-manager
 * @file:       ~/layers/user-manager/stores/storeUserManager.ts
 * @version:    1.1.0
 * @createDate: 2025 Nov 24
 * @createTime: 00:07
 * @author:     Steve R Lewis
 *
 * ================================================================================
 *
 * @description:
 * Pinia Store for User Management.
 * Handles fetching, caching, and modifying the user directory list.
 *
 * ================================================================================
 *
 * @notes: Revision History
 *
 * V1.2.0, 20251125-00:42
 * - Uses $fetch instead of useFetch to fix "Component already mounted" warning.
 *
 * V1.1.0, 20251124-22:08
 * - Switched from `useFetch` to `$fetch` to resolve "Component already mounted" warning.
 *
 * V1.0.0, 20251124-00:07
 * Initial creation and release of storeUserManager.ts
 *
 * ================================================================================
 */

import { defineStore } from 'pinia'
import type { UserComposite } from '../server/types/IDirectoryService'

export const useUserManagerStore = defineStore('userManager', () => {
  const users = ref<UserComposite[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastFetched = ref<number>(0);

  async function fetchUsers(force = false) {
    const isFresh = (Date.now() - lastFetched.value) < 60000;
    if (!force && users.value.length > 0 && isFresh) return;

    loading.value = true;
    error.value = null;

    try {
      // FIX: Use $fetch for actions
      const response = await $fetch<{ users: UserComposite[] }>('/api/user-manager/workspace/users');

      if (response && response.users) {
        users.value = response.users;
        lastFetched.value = Date.now();
      }
    } catch (e: any) {
      error.value = e.statusMessage || e.message || 'Failed to load users';
      console.error(e);
    } finally {
      loading.value = false;
    }
  }

  return {
    users,
    loading,
    error,
    fetchUsers
  }
})
