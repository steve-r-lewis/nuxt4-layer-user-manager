/**
* ================================================================================
*
* @project:    @monorepo/user-manager
* @file:       ~/layers/user-manager/pages/auth/join.vue
* @version:    1.0.0
* @createDate: 2025 Nov 25
* @createTime: 21:19
* @author:     Steve R Lewis
*
* ================================================================================
*
* @description:
* Public landing page for processing Invitation Tokens.
* URL: /auth/join?token=...
*
* ================================================================================
*
* @notes: Revision History
*
* V1.0.0, 20251125-21:19
* Initial creation and release of join.vue
*
* ================================================================================
*/

<template>
  <div class="min-h-screen flex items-center justify-center bg-fill-floor-default px-4 py-12">
    <div class="w-full max-w-md text-center">

      <div class="bg-fill-base-default p-8 rounded-2xl shadow-xl border border-edge-base-default">

        <!-- Loading State -->
        <div v-if="status === 'processing'">
          <div class="w-12 h-12 bg-fill-tertiary-default rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="lucide:loader-circle" class="w-6 h-6 animate-spin text-pen-primary-default" />
          </div>
          <h1 class="text-xl font-bold text-pen-base-default mb-2">Processing Invitation...</h1>
          <p class="text-pen-muted-default">Please wait while we verify your invitation link.</p>
        </div>

        <!-- Success State -->
        <div v-else-if="status === 'success'">
          <div class="w-12 h-12 bg-fill-success-default rounded-full flex items-center justify-center mx-auto mb-4 text-pen-success-default">
            <Icon name="lucide:check" class="w-6 h-6" />
          </div>
          <h1 class="text-xl font-bold text-pen-base-default mb-2">Welcome Aboard!</h1>
          <p class="text-pen-muted-default mb-6">You have successfully joined the workspace.</p>
          <NuxtLink to="/login" class="btn btn-primary w-full block text-center">
            Continue to Sign In
          </NuxtLink>
        </div>

        <!-- Error State -->
        <div v-else-if="status === 'error'">
          <div class="w-12 h-12 bg-fill-error-default rounded-full flex items-center justify-center mx-auto mb-4 text-pen-error-default">
            <Icon name="lucide:alert-circle" class="w-6 h-6" />
          </div>
          <h1 class="text-xl font-bold text-pen-base-default mb-2">Invitation Failed</h1>
          <p class="text-pen-error-default mb-6">{{ errorMessage }}</p>
          <NuxtLink to="/" class="text-sm text-pen-muted-default hover:underline">
            Return Home
          </NuxtLink>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
  auth: false // Allow guests
});

const route = useRoute();
const status = ref<'processing' | 'success' | 'error'>('processing');
const errorMessage = ref('The invitation link is invalid or expired.');

onMounted(async () => {
  const token = route.query.token;

  if (!token || typeof token !== 'string') {
    status.value = 'error';
    return;
  }

  // Artificial delay for UX
  await new Promise(resolve => setTimeout(resolve, 1500));

  try {
    // Call the API to accept the invite
    // Note: We haven't built this endpoint yet, but this is where it goes.
    // For the mock workflow, we'll simulate success if token exists.

    /* const res = await $fetch('/api/user-manager/workspace/accept-invite', {
      method: 'POST',
      body: { token }
    });
    */

    // MOCK SUCCESS
    console.log(`[Join Page] Processing token: ${token}`);
    status.value = 'success';

  } catch (e: any) {
    status.value = 'error';
    errorMessage.value = e.statusMessage || 'Failed to process invitation.';
  }
});
</script>

<style scoped>
/* TODO: Add component-specific styles for LayoutDevelopment if utility classes are insufficient. */
</style>
