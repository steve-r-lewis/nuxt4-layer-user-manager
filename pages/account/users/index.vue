/**
* ================================================================================
*
* @project:    @monorepo/user-manager
* @file:       ~/layers/user-manager/pages/account/users/index.vue
* @version:    1.2.0
* @createDate: 2025 Nov 21
* @createTime: 23:10
* @author:     Steve R Lewis
*
* ================================================================================
*
* @description:
* The Main User Directory View.
* Lists all users that the current user is authorized to view/manage.
*
* ================================================================================
*
* @notes: Revision History
*
* V1.2.0, 20251125-21:16
* - Added InviteUserModal integration.
*
* V1.1.0, 20251124-00:13
* Now uses Pinia Store for state management.
*
* V1.0.0, 20251121-23:10
* Initial creation and release of index.vue
*
* ================================================================================
*/

<template>
  <div>
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-bold text-pen-base-default">User Directory</h1>
        <p class="text-pen-muted-default mt-1">Manage members, staff, and contacts within your organizations.</p>
      </div>
      <div class="flex gap-3">
        <!-- Updated Button -->
        <button
          @click="showInviteModal = true"
          class="btn bg-fill-tertiary-default text-pen-base-default border border-edge-base-default hover:bg-fill-tertiary-hover"
        >
          <Icon name="lucide:user-plus" class="w-4 h-4 mr-2" />
          Invite User
        </button>
        <button class="btn btn-primary">
          <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
          Create Account
        </button>
      </div>
    </header>

    <!-- ... (Existing Loading/Error/Table sections remain unchanged) ... -->
    <div v-if="loading && users.length === 0" class="py-12 text-center">
      <Icon name="lucide:loader-circle" class="w-8 h-8 animate-spin text-pen-primary-default mx-auto" />
      <p class="mt-3 text-pen-muted-default">Loading directory...</p>
    </div>

    <div v-else-if="error" class="bg-fill-error-default border border-edge-error-default text-pen-error-default p-4 rounded-lg mb-6">
      <strong>Error:</strong> {{ error }}
      <button @click="fetchUsers(true)" class="underline ml-2">Retry</button>
    </div>

    <div v-else-if="users.length === 0" class="card p-12 text-center border border-dashed border-edge-base-default rounded-xl">
      <div class="w-12 h-12 bg-fill-tertiary-default rounded-full flex items-center justify-center mx-auto mb-4 text-pen-muted-default">
        <Icon name="lucide:users" class="w-6 h-6" />
      </div>
      <h3 class="text-lg font-medium text-pen-base-default">No users found</h3>
      <p class="text-pen-muted-default max-w-xs mx-auto mt-1">You haven't added any users to your organization yet.</p>
    </div>

    <div v-else class="card border border-edge-base-default bg-fill-base-default rounded-xl overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-fill-tertiary-default border-b border-edge-base-default">
          <tr>
            <th class="px-6 py-4 font-semibold text-pen-base-default">User</th>
            <th class="px-6 py-4 font-semibold text-pen-base-default">Tenants</th>
            <th class="px-6 py-4 font-semibold text-pen-base-default">Status</th>
            <th class="px-6 py-4 text-right font-semibold text-pen-base-default">Actions</th>
          </tr>
          </thead>
          <tbody class="divide-y divide-edge-base-default">
          <tr v-for="u in users" :key="u.account.id" class="hover:bg-fill-base-hover transition group">
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-fill-tertiary-default flex items-center justify-center text-pen-muted-default shrink-0 border border-edge-base-default">
                  <Icon :name="u.profile?.avatar || 'lucide:user'" class="w-5 h-5" />
                </div>
                <div>
                  <p class="font-medium text-pen-base-default">{{ u.profile?.displayName || 'Unknown User' }}</p>
                  <p class="text-xs text-pen-muted-default">{{ u.account.email }}</p>
                </div>
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="flex flex-wrap gap-2">
                  <span v-for="tenantId in u.account.tenantIds.slice(0, 2)" :key="tenantId" class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-fill-tertiary-default text-pen-base-default border border-edge-base-default">
                    {{ tenantId.substring(0, 4) }}...
                  </span>
                <span v-if="u.account.tenantIds.length > 2" class="text-xs text-pen-muted-default self-center">+{{ u.account.tenantIds.length - 2 }}</span>
              </div>
            </td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" :class="u.account.status === 'active' ? 'bg-fill-success-default text-pen-success-default' : 'bg-fill-tertiary-default text-pen-muted-default'">
                  <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                  {{ u.account.status }}
                </span>
            </td>
            <td class="px-6 py-4 text-right">
              <button class="p-2 text-pen-muted-default hover:text-pen-primary-default hover:bg-fill-tertiary-default rounded-md transition">
                <Icon name="lucide:more-horizontal" class="w-5 h-5" />
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Invite Modal -->
    <InviteUserModal
      v-if="showInviteModal"
      :scope="activeTenantId"
      @close="showInviteModal = false"
      @success="userStore.fetchUsers(true)"
    />

  </div>
</template>

<script setup lang="ts">
import { useUserManagerStore } from '../../../stores/storeUserManager'
import { useAuthentication } from '#imports'
import { storeToRefs } from 'pinia'
// Note: InviteUserModal is auto-imported if in components/ dir

definePageMeta({
  layout: 'account',
  middleware: 'authentication'
});

const userStore = useUserManagerStore();
const { users, loading, error } = storeToRefs(userStore);
const { user: currentUser } = useAuthentication();

// State for Modal
const showInviteModal = ref(false);

// Determine which tenant to invite to.
// Priority: 1. Preference 2. First Tenant 3. Fallback
const activeTenantId = computed(() => {
  if (!currentUser.value) return 'unknown';
  // Use preference if available
  /* if (currentUser.value.preferences?.currentTenantId) return currentUser.value.preferences.currentTenantId; */

  // Fallback to first tenant ID in list
  return currentUser.value.tenantIds?.[0] || 'unknown';
});

// Fetch on mount
onMounted(() => {
  userStore.fetchUsers();
});
</script>

<style scoped>
/* TODO: Add component-specific styles for LayoutDevelopment if utility classes are insufficient. */
</style>
