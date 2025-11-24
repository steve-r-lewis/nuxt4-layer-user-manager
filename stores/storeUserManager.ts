/**
 * ================================================================================
 *
 * @project:    @monorepo/user-manager
 * @file:       ~/layers/user-manager/stores/storeUserManager.ts
 * @version:    1.0.0
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
 * V1.0.0, 20251124-00:07
 * Initial creation and release of storeUserManager.ts
 *
 * ================================================================================
 */

import { defineStore } from 'pinia'
import type { UserComposite } from '../server/types/IDirectoryService'

export const useUserManagerStore = defineStore('userManager', () => {
  // State
  const users = ref<UserComposite[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastFetched = ref<number>(0);

  // Actions
  async function fetchUsers(force = false) {
    // Cache strategy: Don't re-fetch if data is fresh (< 60s) unless forced
    const isFresh = (Date.now() - lastFetched.value) < 60000;
    if (!force && users.value.length > 0 && isFresh) return;

    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await useFetch<{ users: UserComposite[] }>('/api/user-manager/workspace/users');

      if (fetchError.value) throw fetchError.value;

      if (data.value?.users) {
        users.value = data.value.users;
        lastFetched.value = Date.now();
      }
    } catch (e: any) {
      error.value = e.message || 'Failed to load users';
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
});
