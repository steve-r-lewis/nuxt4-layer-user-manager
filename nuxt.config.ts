/**
 * ================================================================================
 *
 * @project:    @monorepo/user-manager
 * @file:       ~/layers/user-manager/nuxt.config.ts
 * @version:    1.0.0
 * @createDate: 2025 Nov 21
 * @createTime: 17:36
 * @author:     Steve R Lewis
 *
 * ================================================================================
 *
 * @description:
 * The User Management Layer.
 * Orchestrates the creation, editing, and permission assignment of users.
 * It acts as the "Glue" between Authentication (Identity) and Authorisation (Rules).
 *
 * ================================================================================
 *
 * @notes: Revision History
 *
 * V1.0.0, 20251121-17:36
 * Initial creation and release of nuxt.config.ts
 *
 * ================================================================================
 */

export default defineNuxtConfig({
  compatibilityDate: '2025-10-08',
  devtools: {enabled: true},

  extends: [
    '@monorepo/authorisation' // Inherits Auth + Authorisation layers
  ]
})
