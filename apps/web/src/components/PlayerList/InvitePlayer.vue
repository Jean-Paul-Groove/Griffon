<template>
  <div class="invite-player">
    <button @click="copyRoomLink">Lien du salon <FontAwesomeIcon icon="link" /></button>
  </div>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useToast } from '../../composables/useToast'

// Composables
const $toast = useToast()

// Functions
function copyRoomLink(): void {
  window.navigator.clipboard.writeText(window.location.href)
  $toast.success('Lien copié !', { duration: 1000 })
}
</script>

<style scoped lang="scss">
.invite-player {
  color: var(--main-color);
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 1rem;
  align-items: center;
}
</style>
