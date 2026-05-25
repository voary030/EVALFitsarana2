<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import CenteredLayout from './layouts/CenteredLayout.vue'
import FrontOfficeLayout from './layouts/frontoffice/FrontOfficeLayout.vue'
import BackOfficeLayout from './layouts/backoffice/BackOfficeLayout.vue'

const route = useRoute()
const authStore = useAuthStore()

onMounted(() => {
  authStore.initializeAuth()
})

const layouts = {
  centered: CenteredLayout,
  frontoffice: FrontOfficeLayout,
  backoffice: BackOfficeLayout
}

const currentLayout = computed(() => {
  const layoutName = (route.meta.layout as string) || 'backoffice'
  return layouts[layoutName as keyof typeof layouts] || BackOfficeLayout
})

</script>

<template>
  <component :is="currentLayout">
    <RouterView />
  </component>
</template>

<style>
/* Reset global styles if needed or let Bootstrap handle it */
body {
  margin: 0;
  padding: 0;
}
</style>
