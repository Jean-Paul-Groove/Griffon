<template>
  <section class="admin-panel">
    <h2>Administration</h2>
    <PlayerAdministration />
    <SpecsAdministration />
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import PlayerAdministration from './Player/PlayerAdministration.vue'
import SpecsAdministration from './GameSpecs/SpecsAdministration.vue'
import { useAuthStore, useSocketStore } from '../../stores'
import { UserRole } from 'shared'
import { storeToRefs } from 'pinia'

// Stores
const authStore = useAuthStore()
const { handleDisconnect } = useSocketStore()
const { user } = storeToRefs(authStore)

// Hooks
onMounted(() => {
  if (!user.value || user.value.role !== UserRole.ADMIN) {
    handleDisconnect()
    return
  }
})
</script>

<style lang="scss" scoped>
.admin-panel {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  padding: 0.3rem;
  padding-bottom: 3rem;
}
</style>
