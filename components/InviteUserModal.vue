/**
* ================================================================================
*
* @project:    @monorepo/user-manager
* @file:       ~/layers/user-manager/components/InviteUserModal.vue
* @version:    1.0.0
* @createDate: 2025 Nov 25
* @createTime: 21:09
* @author:     Steve R Lewis
*
* ================================================================================
*
* @description:
* Modal form to invite a new user to a specific tenant scope.
*
* ================================================================================
*
* @notes: Revision History
*
* V1.0.0, 20251125-21:09
* Initial creation and release of InviteUserModal.vue
*
* ================================================================================
*/

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
    <div class="bg-fill-base-default rounded-xl w-full max-w-md shadow-2xl flex flex-col">

      <div class="p-6 border-b border-edge-base-default flex justify-between items-center">
        <h2 class="text-xl font-bold text-pen-base-default">Invite User</h2>
        <button @click="$emit('close')" class="text-pen-muted-default hover:text-pen-base-default">
          <Icon name="lucide:x" class="w-6 h-6" />
        </button>
      </div>

      <form @submit.prevent="handleInvite" class="p-6 space-y-4">

        <!-- Email Input -->
        <div>
          <label class="block text-sm font-bold mb-1 text-pen-base-default">Email Address</label>
          <input
            v-model="form.email"
            type="email"
            required
            class="form-input w-full"
            placeholder="colleague@example.com"
          />
        </div>

        <!-- Role Selection -->
        <div>
          <label class="block text-sm font-bold mb-1 text-pen-base-default">Role</label>
          <select v-model="form.role" class="form-input w-full">
            <option value="policy_standard_member">Standard Member</option>
            <option value="policy_group_manager">Group Manager</option>
            <option value="policy_company_manager">Company Admin</option>
          </select>
          <p class="text-xs text-pen-muted-default mt-1">
            Determines their initial permissions in this organization.
          </p>
        </div>

        <!-- Scope (Hidden/Fixed for now, typically current tenant) -->
        <input type="hidden" :value="scope" />

        <!-- Actions -->
        <div class="pt-4 flex justify-end gap-3 border-t border-edge-base-default mt-4">
          <button type="button" @click="$emit('close')" class="btn bg-fill-tertiary-default text-pen-base-default">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            <Icon v-if="loading" name="lucide:loader-circle" class="w-4 h-4 animate-spin mr-2" />
            <span>{{ loading ? 'Sending...' : 'Send Invitation' }}</span>
          </button>
        </div>

      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  scope: string // The tenant ID we are inviting to
}>();

const emit = defineEmits(['close', 'success']);

const form = reactive({
  email: '',
  role: 'policy_standard_member'
});

const loading = ref(false);

async function handleInvite() {
  loading.value = true;
  try {
    const response = await $fetch<{ success: boolean, mockedLink: string }>('/api/user-manager/workspace/invite', {
      method: 'POST',
      body: {
        email: form.email,
        role: form.role,
        scope: props.scope
      }
    });

    if (response.success) {
      // In a real app, email is sent. In mock, we alert the link.
      console.log('Invite Link:', response.mockedLink);
      alert(`Invitation Sent! (Check console for Mock Link)\n\nLink: ${response.mockedLink}`);
      emit('success');
      emit('close');
    }
  } catch (e: any) {
    alert(e.statusMessage || 'Failed to send invitation');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* TODO: Add component-specific styles for LayoutDevelopment if utility classes are insufficient. */
</style>
